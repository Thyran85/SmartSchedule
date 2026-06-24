import random
from datetime import time, timedelta, datetime
from collections import defaultdict
from django.db import transaction
from ..classes.models import Classe, Niveau
from ..subjects.models import Matiere, ClasseMatiere
from ..teachers.models import Enseignant, DisponibiliteEnseignant
from ..rooms.models import Salle, DisponibiliteSalle
from ..constraints.models import ContrainteSpecifique
from .models import Cours, ScheduleVersion

# Official school hours
TIME_SLOTS = [
    # Morning
    ('07:00', '10:00'),
    # Break 10:00-10:15 (no courses)
    ('10:15', '12:00'),
    # Afternoon
    ('14:00', '16:00'),
    # Break 16:00-16:15 (no courses)
    ('16:15', '18:00'),
]

BREAKS = [
    (time(10, 0), time(10, 15)),
    (time(16, 0), time(16, 15)),
]

DAYS = list(range(5))  # 0=Monday to 4=Friday


def time_slots_generator():
    """Generate all available (day, start, end) slots excluding breaks."""
    for day in DAYS:
        for slot_start, slot_end in TIME_SLOTS:
            start_h, start_m = map(int, slot_start.split(':'))
            end_h, end_m = map(int, slot_end.split(':'))
            start_t = time(start_h, start_m)
            end_t = time(end_h, end_m)
            yield day, start_t, end_t


def slots_per_week():
    return list(time_slots_generator())


def hours_between(t1, t2):
    """Calculate hours between two time objects."""
    dt1 = datetime.combine(datetime.today(), t1)
    dt2 = datetime.combine(datetime.today(), t2)
    return abs((dt2 - dt1).total_seconds()) / 3600


class ConstraintChecker:
    """Central constraint checking for schedule generation."""

    def __init__(self):
        self.cache = {}

    def load_constraints(self):
        self.all_constraints = list(ContrainteSpecifique.objects.all())
        self.niveau_constraints = defaultdict(list)
        self.classe_constraints = defaultdict(list)
        self.matiere_constraints = defaultdict(list)
        for c in self.all_constraints:
            if c.niveau_id:
                self.niveau_constraints[c.niveau_id].append(c)
            if c.classe_id:
                self.classe_constraints[c.classe_id].append(c)
            if c.matiere_id:
                self.matiere_constraints[c.matiere_id].append(c)

    def check_teacher_available(self, enseignant_id, day, start, end):
        """Check if teacher is available at given time slot."""
        dispos = DisponibiliteEnseignant.objects.filter(
            enseignant_id=enseignant_id,
            jour_semaine=day,
        )
        # Default: teacher is available unless marked unavailable
        indispos = dispos.filter(est_disponible=False)
        for ind in indispos:
            if self._times_overlap(start, end, ind.heure_debut, ind.heure_fin):
                return False
        # If disponibilities exist, teacher is only available during those times
        dispos_positives = dispos.filter(est_disponible=True)
        if dispos_positives.exists():
            return any(
                self._time_within(start, end, d.heure_debut, d.heure_fin)
                for d in dispos_positives
            )
        return True

    def check_room_available(self, salle_id, day, start, end):
        """Check if room is available."""
        if not salle_id:
            return True
        dispos = DisponibiliteSalle.objects.filter(
            salle_id=salle_id,
            jour_semaine=day,
        )
        indispos = dispos.filter(est_disponible=False)
        for ind in indispos:
            if self._times_overlap(start, end, ind.heure_debut, ind.heure_fin):
                return False
        # Check no other course uses this room at this time
        conflicting = Cours.objects.filter(
            salle_id=salle_id,
            jour_semaine=day,
            heure_debut__lt=end,
            heure_fin__gt=start,
        )
        return not conflicting.exists()

    def check_computer_room_unique(self, salle_id, day, start, end):
        """Specific check for the unique computer room."""
        if not salle_id:
            return True
        try:
            salle = Salle.objects.get(id=salle_id)
            if salle.type != 'INFORMATIQUE':
                return True
        except Salle.DoesNotExist:
            return True
        return self.check_room_available(salle_id, day, start, end)

    def check_class_available(self, classe_id, day, start, end, version_id):
        """Check class has no other course at this time."""
        conflicting = Cours.objects.filter(
            classe_id=classe_id,
            jour_semaine=day,
            version_id=version_id,
            heure_debut__lt=end,
            heure_fin__gt=start,
        )
        return not conflicting.exists()

    def check_level_constraints(self, classe_id, niveau_id, day, start, end):
        """Check level-specific constraints."""
        for c in self.niveau_constraints.get(niveau_id, []):
            if not self._check_single_constraint(c, classe_id, niveau_id, day, start, end):
                return False
        for c in self.classe_constraints.get(classe_id, []):
            if not self._check_single_constraint(c, classe_id, niveau_id, day, start, end):
                return False
        return True

    def _check_single_constraint(self, c, classe_id, niveau_id, day, start, end):
        if c.jour_semaine is not None and c.jour_semaine != day:
            return True
        if c.type_contrainte == 'INDISP_CLASSE' or c.type_contrainte == 'INDISP_NIVEAU':
            # Whole day or time range unavailability
            if c.heure_limite:
                if self._times_overlap(start, end, time(7, 0), c.heure_limite):
                    return False
            else:
                return False
        elif c.type_contrainte == 'INTERDICT_DERN_HEURE':
            if end == time(18, 0):
                return False
        elif c.type_contrainte == 'MAT_APMIDI_ONLY':
            if start < time(14, 0):
                return False
        elif c.type_contrainte == 'MAT_MATIN_ONLY':
            if start >= time(14, 0):
                return False
        elif c.type_contrainte == 'PAS_COURS_APRES':
            if c.heure_limite and start >= c.heure_limite:
                return False
        return True

    def check_teacher_preferences(self, enseignant_id, start):
        """Check teacher preferences (soft constraint)."""
        try:
            enseignant = Enseignant.objects.get(id=enseignant_id)
            if enseignant.prefere_eviter_apres_16h and start >= time(16, 0):
                return False
        except Enseignant.DoesNotExist:
            pass
        return True

    def check_spread_constraint(self, classe_id, matiere_id, day, start, end, version_id):
        """Avoid too many consecutive hours of same subject for a class."""
        # Check if same subject already has a course on same day
        existing = Cours.objects.filter(
            classe_id=classe_id,
            matiere_id=matiere_id,
            jour_semaine=day,
            version_id=version_id,
        )
        if existing.exists():
            # If already 2+ hours of same subject on same day, prefer not to add more
            total_hours = sum(hours_between(c.heure_debut, c.heure_fin) for c in existing)
            if total_hours >= 3:
                return False
        return True

    def _times_overlap(self, start1, end1, start2, end2):
        return start1 < end2 and start2 < end1

    def _time_within(self, start, end, slot_start, slot_end):
        return start >= slot_start and end <= slot_end


class ScheduleGenerator:
    """Main schedule generator using CSP with backtracking and heuristics."""

    def __init__(self):
        self.checker = ConstraintChecker()

    @transaction.atomic
    def generate(self, version):
        self.checker.load_constraints()
        self.version = version

        # Clear existing courses for this version (except locked ones)
        Cours.objects.filter(version=version, est_verrouille=False).delete()

        # Gather all teaching assignments
        assignments = self._get_assignments()

        # Sort by difficulty (most constrained first)
        assignments = self._sort_by_difficulty(assignments)

        slots = slots_per_week()
        random.shuffle(slots)

        created = 0
        conflicts = []

        for assignment in assignments:
            success = self._assign_course(assignment, slots, version)
            if success:
                created += 1
            else:
                conflicts.append(f"{assignment['classe'].nom} - {assignment['matiere'].nom}")

        # Calculate quality score
        score = self._calculate_score(version)

        # Update version
        version.score_qualite = score
        version.save()

        return {
            'cours_crees': created,
            'conflits': conflicts,
            'score': score,
        }

    def _get_assignments(self):
        """Get all teaching assignments that need scheduling."""
        assignments = []
        for cm in ClasseMatiere.objects.select_related('classe', 'matiere', 'enseignant').all():
            if not cm.enseignant:
                continue
            assignments.append({
                'classe': cm.classe,
                'matiere': cm.matiere,
                'enseignant': cm.enseignant,
                'heures': cm.heures_par_semaine,
                'est_demi_groupe': cm.est_demi_groupe,
            })
        return assignments

    def _sort_by_difficulty(self, assignments):
        """Sort assignments by difficulty (most constrained first)."""
        def difficulty(a):
            score = 0
            # Fewer available slots = higher difficulty
            teacher_dispos = DisponibiliteEnseignant.objects.filter(
                enseignant=a['enseignant']
            )
            if teacher_dispos.filter(est_disponible=True).exists():
                score -= teacher_dispos.count() * 10
            # Computer room subjects are harder
            if a['matiere'].necessite_salle_informatique:
                score -= 50
            # More hours = harder
            score -= a['heures'] * 5
            return score

        return sorted(assignments, key=difficulty)

    def _assign_course(self, assignment, slots, version):
        """Try to assign a course to available slots."""
        heures_needed = assignment['heures']
        heures_assigned = 0
        slots_used = []

        classe = assignment['classe']
        matiere = assignment['matiere']
        enseignant = assignment['enseignant']

        # Determine required room type
        required_room = self._find_required_room(matiere)

        for day, start, end in slots:
            if heures_assigned >= heures_needed:
                break

            slot_key = (day, start, end)
            if slot_key in slots_used:
                continue

            # Check breaks
            if self._is_break(start, end):
                continue

            # Check class availability
            if not self.checker.check_class_available(classe.id, day, start, end, version.id):
                continue

            # Check teacher availability
            if not self.checker.check_teacher_available(enseignant.id, day, start, end):
                continue

            # Check teacher preferences (soft - skip if violated but prefer others)
            if not self.checker.check_teacher_preferences(enseignant.id, start):
                # Try other slots first, but use this as fallback
                if random.random() > 0.3:
                    continue

            # Check constraints
            if not self.checker.check_level_constraints(classe.id, classe.niveau_id, day, start, end):
                continue

            if not self.checker.check_spread_constraint(classe.id, matiere.id, day, start, end, version.id):
                continue

            # Find suitable room
            salle = self._find_available_room(matiere, required_room, day, start, end, classe.effectif)
            if required_room and not salle:
                continue
            if salle and not self.checker.check_computer_room_unique(salle.id, day, start, end):
                continue

            # Assign the course
            slot_hours = hours_between(start, end)
            if heures_assigned + slot_hours > heures_needed:
                continue

            Cours.objects.create(
                classe=classe,
                matiere=matiere,
                enseignant=enseignant,
                salle=salle,
                version=version,
                jour_semaine=day,
                heure_debut=start,
                heure_fin=end,
                est_demi_groupe=assignment.get('est_demi_groupe', False),
            )

            heures_assigned += slot_hours
            slots_used.append(slot_key)

        return heures_assigned > 0

    def _find_required_room(self, matiere):
        """Determine the required room type for a subject."""
        if matiere.necessite_salle_informatique:
            return 'INFORMATIQUE'
        if matiere.necessite_laboratoire:
            return 'LABORATOIRE'
        if matiere.necessite_atelier:
            return 'ATELIER'
        return None

    def _find_available_room(self, matiere, room_type, day, start, end, effectif):
        """Find an available room that fits the requirements."""
        if room_type:
            rooms = Salle.objects.filter(type=room_type, capacite__gte=effectif)
        else:
            rooms = Salle.objects.filter(capacite__gte=effectif)

        for room in rooms:
            if self.checker.check_room_available(room.id, day, start, end):
                return room
        return None

    def _is_break(self, start, end):
        """Check if a time slot overlaps with break times."""
        for break_start, break_end in BREAKS:
            if start < break_end and end > break_start:
                return True
        return False

    def _calculate_score(self, version):
        """Calculate quality score (0-100) for the generated schedule."""
        courses = Cours.objects.filter(version=version)
        if not courses.exists():
            return 0

        score = 100.0
        deductions = []

        # 1. Check teacher preferences
        for c in courses:
            if c.enseignant_id:
                try:
                    t = Enseignant.objects.get(id=c.enseignant_id)
                    if t.prefere_eviter_apres_16h and c.heure_debut >= time(16, 0):
                        deductions.append(2)
                except Enseignant.DoesNotExist:
                    pass

        # 2. Check gaps (trous)
        for classe_id in set(c.classe_id for c in courses):
            class_courses = courses.filter(classe_id=classe_id)
            for day in DAYS:
                day_courses = sorted(
                    [c for c in class_courses if c.jour_semaine == day],
                    key=lambda x: x.heure_debut
                )
                for i in range(len(day_courses) - 1):
                    gap = hours_between(day_courses[i].heure_fin, day_courses[i+1].heure_debut)
                    if 0.25 < gap < 2:  # Gap > 15min and < 2h
                        deductions.append(1.5)

        # 3. Check balance
        for classe_id in set(c.classe_id for c in courses):
            class_courses = courses.filter(classe_id=classe_id)
            hours_per_day = defaultdict(float)
            for day in DAYS:
                for c in class_courses.filter(jour_semaine=day):
                    hours_per_day[day] += hours_between(c.heure_debut, c.heure_fin)
            if hours_per_day:
                avg = sum(hours_per_day.values()) / max(len(hours_per_day), 1)
                for h in hours_per_day.values():
                    if abs(h - avg) > 3:
                        deductions.append(2)

        # 4. Check consecutive same subject
        for classe_id in set(c.classe_id for c in courses):
            class_courses = list(courses.filter(classe_id=classe_id))
            for day in DAYS:
                day_courses = sorted(
                    [c for c in class_courses if c.jour_semaine == day],
                    key=lambda x: x.heure_debut
                )
                for i in range(len(day_courses) - 1):
                    if (day_courses[i].matiere_id == day_courses[i+1].matiere_id and
                            day_courses[i].heure_fin == day_courses[i+1].heure_debut):
                        deductions.append(1)

        # 5. Room optimization
        for c in courses:
            if c.salle and c.salle.capacite > c.classe.effectif * 2:
                deductions.append(1)  # Room too large for class

        total_deduction = min(sum(deductions), 100)
        score = max(0, 100 - total_deduction)
        return round(score, 1)

    def optimize(self, version, iterations=100):
        """Simple optimization pass using simulated annealing."""
        current_score = version.score_qualite or self._calculate_score(version)

        for i in range(iterations):
            # Pick a random course and try to move it
            courses = list(Cours.objects.filter(version=version, est_verrouille=False))
            if not courses:
                break
            course = random.choice(courses)
            old_day = course.jour_semaine
            old_start = course.heure_debut
            old_end = course.heure_fin

            # Try new random slot
            slots = slots_per_week()
            random.shuffle(slots)
            for day, start, end in slots:
                if day == old_day and start == old_start:
                    continue
                if self._is_break(start, end):
                    continue
                if not self.checker.check_class_available(
                    course.classe_id, day, start, end, version.id
                ):
                    continue
                if not self.checker.check_teacher_available(
                    course.enseignant_id, day, start, end
                ):
                    continue

                # Apply the move
                course.jour_semaine = day
                course.heure_debut = start
                course.heure_fin = end

                new_score = self._calculate_score(version)
                if new_score > current_score:
                    course.save()
                    current_score = new_score
                    break
                else:
                    # Revert
                    course.jour_semaine = old_day
                    course.heure_debut = old_start
                    course.heure_fin = old_end
                    break

        version.score_qualite = current_score
        version.save()
        return current_score
