import random
from datetime import time, datetime
from collections import defaultdict
from django.db import transaction
from ..classes.models import Classe
from ..subjects.models import ClasseMatiere
from ..teachers.models import Enseignant, DisponibiliteEnseignant
from ..rooms.models import Salle, DisponibiliteSalle
from ..constraints.models import ContrainteSpecifique
from .models import Cours, ScheduleVersion

# ── Time slots (1h granularity) ─────────────────────────────────────────
# Morning  : 07-08, 08-09, 09-10
# Break    10:00-10:15 (no courses)
# Morning  : 10:15-11, 11-12
# Lunch    12:00-14:00
# Afternoon: 14-15, 15-16
# Break    16:00-16:15 (no courses)
# Afternoon: 16:15-17, 17-18

SUB_SLOTS = [
    (7, 0, 8, 0),     # 0
    (8, 0, 9, 0),     # 1
    (9, 0, 10, 0),    # 2
    (10, 15, 11, 0),  # 3
    (11, 0, 12, 0),   # 4
    (14, 0, 15, 0),   # 5
    (15, 0, 16, 0),   # 6
    (16, 15, 17, 0),  # 7
    (17, 0, 18, 0),   # 8
]

BREAKS = [
    (time(10, 0), time(10, 15)),
    (time(16, 0), time(16, 15)),
]

DAYS = list(range(5))  # 0=Monday → 4=Friday


def mk_time(h, m):
    return time(h, m)


def hours_between(t1, t2):
    dt1 = datetime.combine(datetime.today(), t1)
    dt2 = datetime.combine(datetime.today(), t2)
    return abs((dt2 - dt1).total_seconds()) / 3600


def slots_per_week(early_finish_days=None):
    """
    Return list of (day, start, end) 1h sub-slots.
    early_finish_days: dict {day: last_slot_index} to cut the day short.
    """
    if early_finish_days is None:
        early_finish_days = {}
    result = []
    for day in DAYS:
        max_slot = early_finish_days.get(day, len(SUB_SLOTS) - 1)
        for idx, (h1, m1, h2, m2) in enumerate(SUB_SLOTS):
            if idx > max_slot:
                break
            result.append((day, mk_time(h1, m1), mk_time(h2, m2)))
    return result


def is_break(start, end):
    for bs, be in BREAKS:
        if start < be and end > bs:
            return True
    return False


def slot_to_tuple(t):
    """Convenience: (day, start, end) → hashable key."""
    return (t[0], t[1], t[2])


# ── Constraint Checker ──────────────────────────────────────────────────

class ConstraintChecker:

    def __init__(self):
        self.cache = {}

    def load_constraints(self):
        self.all_constraints = list(ContrainteSpecifique.objects.all())
        self.niveau_constraints = defaultdict(list)
        self.classe_constraints = defaultdict(list)
        self.matiere_constraints = defaultdict(list)
        self.global_constraints = []
        for c in self.all_constraints:
            if c.niveau_id:
                self.niveau_constraints[c.niveau_id].append(c)
            if c.classe_id:
                self.classe_constraints[c.classe_id].append(c)
            if c.matiere_id:
                self.matiere_constraints[c.matiere_id].append(c)
            if not c.niveau_id and not c.classe_id and not c.matiere_id:
                self.global_constraints.append(c)

    def get_early_finish_days(self, niveau_id, classe_id):
        """Return dict of {day: last_allowed_slot_index} from FIN_AVANCEE constraints."""
        result = {}
        for c in self.global_constraints:
            self._apply_early_finish(result, c)
        for c in self.niveau_constraints.get(niveau_id, []):
            self._apply_early_finish(result, c)
        for c in self.classe_constraints.get(classe_id, []):
            self._apply_early_finish(result, c)
        return result

    def _apply_early_finish(self, result, c):
        if c.type_contrainte != 'FIN_AVANCEE' or c.jour_semaine is None:
            return
        if c.heure_limite:
            h, m = c.heure_limite.hour, c.heure_limite.minute
            # Find the last sub-slot that ends <= limit
            for idx, (h1, m1, h2, m2) in enumerate(SUB_SLOTS):
                if mk_time(h2, m2) > c.heure_limite:
                    result[c.jour_semaine] = idx - 1 if idx > 0 else -1
                    return
            result[c.jour_semaine] = len(SUB_SLOTS) - 1

    def get_min_hours_per_day(self, niveau_id, classe_id):
        """Return max of min hours per day from constraints."""
        min_h = 0
        for c in self.global_constraints:
            if c.type_contrainte == 'HEURES_MIN_JOUR' and c.valeur:
                min_h = max(min_h, int(c.valeur))
        for c in self.niveau_constraints.get(niveau_id, []):
            if c.type_contrainte == 'HEURES_MIN_JOUR' and c.valeur:
                min_h = max(min_h, int(c.valeur))
        for c in self.classe_constraints.get(classe_id, []):
            if c.type_contrainte == 'HEURES_MIN_JOUR' and c.valeur:
                min_h = max(min_h, int(c.valeur))
        if min_h == 0:
            min_h = 4  # default minimum hours per day
        return min_h

    def check_teacher_available(self, enseignant_id, day, start, end):
        dispos = DisponibiliteEnseignant.objects.filter(
            enseignant_id=enseignant_id, jour_semaine=day)
        indispos = dispos.filter(est_disponible=False)
        for ind in indispos:
            if self._overlap(start, end, ind.heure_debut, ind.heure_fin):
                return False
        dispos_positives = dispos.filter(est_disponible=True)
        if dispos_positives.exists():
            return any(
                self._within(start, end, d.heure_debut, d.heure_fin)
                for d in dispos_positives
            )
        return True

    def check_room_available(self, salle_id, day, start, end):
        if not salle_id:
            return True
        dispos = DisponibiliteSalle.objects.filter(
            salle_id=salle_id, jour_semaine=day)
        for ind in dispos.filter(est_disponible=False):
            if self._overlap(start, end, ind.heure_debut, ind.heure_fin):
                return False
        conflicting = Cours.objects.filter(
            salle_id=salle_id, jour_semaine=day,
            heure_debut__lt=end, heure_fin__gt=start,
        )
        return not conflicting.exists()

    def check_class_available(self, classe_id, day, start, end, version_id):
        conflicting = Cours.objects.filter(
            classe_id=classe_id, jour_semaine=day, version_id=version_id,
            heure_debut__lt=end, heure_fin__gt=start,
        )
        return not conflicting.exists()

    def check_level_constraints(self, classe_id, niveau_id, day, start, end):
        for c in self.global_constraints:
            if not self._check_single(c, classe_id, niveau_id, day, start, end):
                return False
        for c in self.niveau_constraints.get(niveau_id, []):
            if not self._check_single(c, classe_id, niveau_id, day, start, end):
                return False
        for c in self.classe_constraints.get(classe_id, []):
            if not self._check_single(c, classe_id, niveau_id, day, start, end):
                return False
        return True

    def _check_single(self, c, classe_id, niveau_id, day, start, end):
        if c.jour_semaine is not None and c.jour_semaine != day:
            return True
        t = c.type_contrainte
        if t == 'INDISP_NIVEAU':
            if c.heure_limite:
                # heure_limite = début de l'indisponibilité (jusqu'à 18h)
                if self._overlap(start, end, c.heure_limite, time(18, 0)):
                    return False
            else:
                return False  # indisponible toute la journée
        elif t == 'MAT_PERIODE':
            if c.valeur == 0 and start >= time(14, 0):
                return False  # matin only
            if c.valeur == 1 and start < time(14, 0):
                return False  # après-midi only
        elif t == 'FIN_AVANCEE':
            # Already handled via slot filtering; still block if slot violates
            if c.heure_limite and end > c.heure_limite:
                return False
        return True

    def check_computer_room_unique(self, salle_id, day, start, end):
        if not salle_id:
            return True
        try:
            salle = Salle.objects.get(id=salle_id)
            if salle.type != 'INFORMATIQUE':
                return True
        except Salle.DoesNotExist:
            return True
        return self.check_room_available(salle_id, day, start, end)

    def check_teacher_preferences(self, enseignant_id, start):
        try:
            ens = Enseignant.objects.get(id=enseignant_id)
            if ens.prefere_eviter_apres_16h and start >= time(16, 0):
                return False
        except Enseignant.DoesNotExist:
            pass
        return True

    def check_spread_constraint(self, classe_id, matiere_id, day, version_id):
        """Allow same subject to repeat across days, but max 2h consecutive per day."""
        existing = Cours.objects.filter(
            classe_id=classe_id, matiere_id=matiere_id,
            jour_semaine=day, version_id=version_id,
        )
        total = sum(hours_between(c.heure_debut, c.heure_fin) for c in existing)
        return total < 2  # max 2h of same subject per day

    def _overlap(self, s1, e1, s2, e2):
        return s1 < e2 and s2 < e1

    def _within(self, s, e, slot_s, slot_e):
        return s >= slot_s and e <= slot_e


# ── Schedule Generator ──────────────────────────────────────────────────

class ScheduleGenerator:

    def __init__(self):
        self.checker = ConstraintChecker()

    @transaction.atomic
    def generate(self, version):
        self.checker.load_constraints()
        self.version = version

        Cours.objects.filter(version=version, est_verrouille=False).delete()

        # Pre-compute early-finish days per assignment
        assignments = self._get_assignments()
        self._enrich_assignments(assignments)
        assignments = self._sort_by_difficulty(assignments)

        created = 0
        conflicts = []

        for assignment in assignments:
            success = self._assign_course(assignment, version)
            if success:
                created += 1
            else:
                conflicts.append(f"{assignment['classe'].nom} - {assignment['matiere'].nom}")

        score = self._calculate_score(version)
        version.score_qualite = score
        version.save()

        return {'cours_crees': created, 'conflits': conflicts, 'score': score}

    # ── Assignment helpers ────────────────────────────────────────────

    def _get_assignments(self):
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

    def _enrich_assignments(self, assignments):
        """Attach early-finish map per assignment."""
        for a in assignments:
            a['early_finish'] = self.checker.get_early_finish_days(
                a['classe'].niveau_id, a['classe'].id)
            a['min_hours_per_day'] = self.checker.get_min_hours_per_day(
                a['classe'].niveau_id, a['classe'].id)
            a['required_room'] = self._find_required_room(a['matiere'])


    def _sort_by_difficulty(self, assignments):
        def difficulty(a):
            score = 0
            teacher_dispos = DisponibiliteEnseignant.objects.filter(
                enseignant=a['enseignant'])
            if teacher_dispos.filter(est_disponible=True).exists():
                score -= teacher_dispos.count() * 10
            if a['matiere'].necessite_salle_informatique:
                score -= 50
            score -= a['heures'] * 5
            return score
        return sorted(assignments, key=difficulty)

    # ── Core assignment ────────────────────────────────────────────────

    def _assign_course(self, assignment, version):
        heures_needed = assignment['heures']
        heures_assigned = 0
        slots_used = set()
        days_used = defaultdict(float)  # hours already assigned per day

        classe = assignment['classe']
        matiere = assignment['matiere']
        enseignant = assignment['enseignant']
        early_finish = assignment['early_finish']
        required_room = assignment['required_room']

        # Generate available 1h slots (respecting early-finish)
        all_slots = slots_per_week(early_finish)
        random.shuffle(all_slots)

        for day, start, end in all_slots:
            if heures_assigned >= heures_needed:
                break

            slot_key = slot_to_tuple((day, start, end))
            if slot_key in slots_used:
                continue

            if is_break(start, end):
                continue

            if not self.checker.check_class_available(classe.id, day, start, end, version.id):
                continue

            if not self.checker.check_teacher_available(enseignant.id, day, start, end):
                continue

            if not self.checker.check_teacher_preferences(enseignant.id, start):
                if random.random() > 0.3:
                    continue

            if not self.checker.check_level_constraints(classe.id, classe.niveau_id, day, start, end):
                continue

            # Check room
            salle = self._find_available_room(matiere, required_room, day, start, end, classe.effectif)
            if required_room and not salle:
                continue
            if salle and not self.checker.check_computer_room_unique(salle.id, day, start, end):
                continue

            # ── Try to assign this 1h block + consecutive blocks ──────
            # Determine how many consecutive 1h blocks we can take
            blocks_needed = min(int(heures_needed - heures_assigned), 5)
            blocks = self._find_consecutive_blocks(
                day, start, end, blocks_needed, all_slots, slots_used, version,
                classe, enseignant, matiere, salle, early_finish,
            )
            if not blocks:
                continue

            # Assign all blocks as a single course session
            block_start = blocks[0][1]
            block_end = blocks[-1][2]

            # Check spread: allow max 2h same subject per day
            if not self.checker.check_spread_constraint(classe.id, matiere.id, day, version.id):
                continue

            # Check min hours: don't let this assignment exceed reasonable daily load
            existing_day_h = days_used[day]
            total_block_h = len(blocks)
            if existing_day_h + total_block_h > 6:  # cap at 6h/day
                continue

            Cours.objects.create(
                classe=classe, matiere=matiere, enseignant=enseignant,
                salle=salle, version=version, jour_semaine=day,
                heure_debut=block_start, heure_fin=block_end,
                est_demi_groupe=assignment.get('est_demi_groupe', False),
            )

            heures_assigned += total_block_h
            days_used[day] += total_block_h
            for b in blocks:
                slots_used.add(slot_to_tuple(b))

        return heures_assigned > 0

    def _find_consecutive_blocks(self, day, start, end, max_blocks, all_slots, slots_used,
                                  version, classe, enseignant, matiere, salle, early_finish):
        """Find consecutive 1h blocks starting from (day, start, end)."""
        # Find the index of the starting slot
        start_idx = None
        for i, (d, s, e) in enumerate(all_slots):
            if d == day and s == start and e == end:
                start_idx = i
                break
        if start_idx is None:
            return []

        blocks = [(day, start, end)]
        for i in range(start_idx + 1, min(start_idx + max_blocks, len(all_slots))):
            d, s, e = all_slots[i]
            if d != day:
                break
            if is_break(s, e):
                break
            if slot_to_tuple((d, s, e)) in slots_used:
                break
            # Check early finish
            ef = early_finish.get(day, len(SUB_SLOTS) - 1)
            for idx, (h1, m1, h2, m2) in enumerate(SUB_SLOTS):
                if mk_time(h1, m1) == s and idx > ef:
                    return blocks
            # Check constraints for the cumulative block
            cum_start = blocks[0][1]
            cum_end = e
            if not self.checker.check_class_available(classe.id, day, cum_start, cum_end, version.id):
                break
            if not self.checker.check_teacher_available(enseignant.id, day, cum_start, cum_end):
                break
            if not self.checker.check_level_constraints(classe.id, classe.niveau_id, day, cum_start, cum_end):
                break
            if salle and not self.checker.check_computer_room_unique(salle.id, day, cum_start, cum_end):
                break
            blocks.append((d, s, e))

        return blocks

    # ── Room helpers ───────────────────────────────────────────────────

    def _find_required_room(self, matiere):
        if matiere.necessite_salle_informatique:
            return 'INFORMATIQUE'
        if matiere.necessite_laboratoire:
            return 'LABORATOIRE'
        if matiere.necessite_atelier:
            return 'ATELIER'
        return None

    def _find_available_room(self, matiere, room_type, day, start, end, effectif):
        if room_type:
            rooms = Salle.objects.filter(type=room_type, capacite__gte=effectif)
        else:
            rooms = Salle.objects.filter(type='NORMALE', capacite__gte=effectif)
        for room in rooms:
            if self.checker.check_room_available(room.id, day, start, end):
                return room
        return None

    # ── Quality score ──────────────────────────────────────────────────

    def _calculate_score(self, version):
        courses = Cours.objects.filter(version=version)
        if not courses.exists():
            return 0

        score = 100.0
        deductions = []

        # 1. Teacher preferences
        for c in courses:
            if c.enseignant_id:
                try:
                    t = Enseignant.objects.get(id=c.enseignant_id)
                    if t.prefere_eviter_apres_16h and c.heure_debut >= time(16, 0):
                        deductions.append(2)
                except Enseignant.DoesNotExist:
                    pass

        # 2. Gaps (trous)
        for classe_id in set(c.classe_id for c in courses):
            cc = courses.filter(classe_id=classe_id)
            for day in DAYS:
                day_c = sorted([c for c in cc if c.jour_semaine == day], key=lambda x: x.heure_debut)
                for i in range(len(day_c) - 1):
                    gap = hours_between(day_c[i].heure_fin, day_c[i+1].heure_debut)
                    if 0.25 < gap < 2:
                        deductions.append(1.5)

        # 3. Balance + min hours per day
        for classe_id in set(c.classe_id for c in courses):
            cc = courses.filter(classe_id=classe_id)
            hours_per_day = defaultdict(float)
            for day in DAYS:
                for c in cc.filter(jour_semaine=day):
                    hours_per_day[day] += hours_between(c.heure_debut, c.heure_fin)
            if hours_per_day:
                avg = sum(hours_per_day.values()) / max(len(hours_per_day), 1)
                for h in hours_per_day.values():
                    if abs(h - avg) > 2.5:
                        deductions.append(2)
            # Minimum hours per day penalty
            min_h = self.checker.get_min_hours_per_day(
                cc.first().classe.niveau_id if cc.exists() else None,
                classe_id,
            )
            if min_h > 0:
                for day in DAYS:
                    if hours_per_day.get(day, 0) < min_h and hours_per_day.get(day, 0) > 0:
                        penalties = (min_h - hours_per_day[day]) * 1.5
                        deductions.append(penalties)

        # 4. Consecutive same subject
        for classe_id in set(c.classe_id for c in courses):
            cc = list(courses.filter(classe_id=classe_id))
            for day in DAYS:
                day_c = sorted([c for c in cc if c.jour_semaine == day], key=lambda x: x.heure_debut)
                for i in range(len(day_c) - 1):
                    if (day_c[i].matiere_id == day_c[i+1].matiere_id and
                            day_c[i].heure_fin == day_c[i+1].heure_debut):
                        deductions.append(1)

        # 5. Lab usage: encourage at least 1h lab per class that has lab subjects
        for classe_id in set(c.classe_id for c in courses):
            cc = courses.filter(classe_id=classe_id)
            classe = Classe.objects.get(id=classe_id)
            has_lab_subjects = any(
                cm.matiere.necessite_laboratoire
                for cm in ClasseMatiere.objects.filter(classe=classe).select_related('matiere')
            )
            if not has_lab_subjects:
                continue
            lab_hours = sum(
                hours_between(c.heure_debut, c.heure_fin)
                for c in cc if c.salle and c.salle.type == 'LABORATOIRE'
            )
            if lab_hours < 1:
                deductions.append(5)

        total_deduction = min(sum(deductions), 100)
        score = max(0, 100 - total_deduction)
        return round(score, 1)

    # ── Optimizer ──────────────────────────────────────────────────────

    def optimize(self, version, iterations=100):
        current_score = version.score_qualite or self._calculate_score(version)
        for _ in range(iterations):
            courses = list(Cours.objects.filter(version=version, est_verrouille=False))
            if not courses:
                break
            course = random.choice(courses)
            old_day = course.jour_semaine
            old_start = course.heure_debut

            # Determine early finish for this course
            ef = self.checker.get_early_finish_days(
                course.classe.niveau_id, course.classe.id)
            slots = slots_per_week(ef)
            random.shuffle(slots)

            for day, start, end in slots:
                if day == old_day and start == old_start:
                    continue
                if is_break(start, end):
                    continue
                if not self.checker.check_class_available(
                    course.classe_id, day, start, end, version.id,
                ):
                    continue
                if not self.checker.check_teacher_available(
                    course.enseignant_id, day, start, end,
                ):
                    continue

                course.jour_semaine = day
                course.heure_debut = start
                course.heure_fin = end

                new_score = self._calculate_score(version)
                if new_score > current_score:
                    course.save()
                    current_score = new_score
                    break
                else:
                    course.jour_semaine = old_day
                    course.heure_debut = old_start
                    break

        version.score_qualite = current_score
        version.save()
        return current_score
