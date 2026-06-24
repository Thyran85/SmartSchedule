import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.classes.models import Niveau, Filiere, Classe
from apps.subjects.models import Matiere, ClasseMatiere
from apps.teachers.models import Enseignant, DisponibiliteEnseignant, EnseignantClasse
from apps.rooms.models import Salle, DisponibiliteSalle
from apps.constraints.models import ContrainteSpecifique
from apps.schedules.models import ScheduleVersion
from datetime import time


class Command(BaseCommand):
    help = 'Seed the database with example data'

    def handle(self, *args, **options):
        self._create_niveaux()
        self._create_filieres()
        self._create_classes()
        self._create_matieres()
        self._create_salles()
        self._create_enseignants()
        self._assign_teachers_to_classes()
        self._create_constraints()
        self._create_schedule_version()
        self.stdout.write(self.style.SUCCESS('Seed data created successfully!'))

    def _create_niveaux(self):
        for i, nom in enumerate(['Seconde', 'Première', 'Terminale'], 1):
            Niveau.objects.get_or_create(nom=nom, defaults={'ordre': i})
        self.stdout.write('  ✓ Niveaux created')

    def _create_filieres(self):
        for nom in ['Générale', 'Technique']:
            Filiere.objects.get_or_create(nom=nom)
        self.stdout.write('  ✓ Filières created')

    def _create_classes(self):
        data = [
            ('Seconde A', 'Seconde', 'Générale', 35),
            ('Seconde B', 'Seconde', 'Générale', 33),
            ('Seconde C', 'Seconde', 'Générale', 34),
            ('Première D', 'Première', 'Générale', 30),
            ('Première Technique Électrique', 'Première', 'Technique', 24),
            ('Terminale Informatique', 'Terminale', 'Technique', 20),
        ]
        for nom, niveau_nom, filiere_nom, effectif in data:
            niveau = Niveau.objects.get(nom=niveau_nom)
            filiere = Filiere.objects.get(nom=filiere_nom)
            Classe.objects.get_or_create(
                nom=nom,
                defaults={
                    'niveau': niveau,
                    'filiere': filiere,
                    'effectif': effectif,
                }
            )
        self.stdout.write('  ✓ Classes created')

    def _create_matieres(self):
        data = [
            ('Mathématiques', 'MATH', 5, 4, 'GENERAL'),
            ('Français', 'FR', 4, 3, 'GENERAL'),
            ('Anglais', 'ANG', 3, 2, 'GENERAL'),
            ('Histoire-Géographie', 'HG', 3, 2, 'GENERAL'),
            ('Physique-Chimie', 'PC', 4, 3, 'GENERAL'),
            ('SVT', 'SVT', 2, 2, 'GENERAL'),
            ('EPS', 'EPS', 2, 1, 'GENERAL'),
            ('Informatique', 'INFO', 4, 4, 'TECHNIQUE'),
            ('Électricité', 'ELEC', 5, 4, 'TECHNIQUE'),
            ('Atelier Électrique', 'ATEL', 4, 3, 'ATELIER'),
            ('TP Informatique', 'TPINFO', 3, 3, 'LABORATOIRE'),
        ]
        matieres = {}
        for nom, code, heures, coeff, mtype in data:
            mat, _ = Matiere.objects.get_or_create(
                code=code,
                defaults={
                    'nom': nom,
                    'heures_par_semaine': heures,
                    'coefficient': coeff,
                    'type': mtype,
                    'necessite_salle_informatique': code in ('INFO', 'TPINFO'),
                    'necessite_laboratoire': code in ('PC', 'SVT'),
                    'necessite_atelier': code == 'ATEL',
                }
            )
            matieres[code] = mat
        self.stdout.write('  ✓ Matières created')

        # Assign subjects to classes (without teacher, done in _assign_teachers_to_classes)
        classes = list(Classe.objects.all())
        for cls in classes:
            for code, mat in matieres.items():
                if cls.niveau.nom == 'Terminale' and code in ('PC', 'SVT'):
                    continue
                ClasseMatiere.objects.get_or_create(
                    classe=cls,
                    matiere=mat,
                    defaults={'heures_par_semaine': mat.heures_par_semaine}
                )
        self.stdout.write('  ✓ Matières assigned to classes')

    def _create_salles(self):
        data = [
            ('Salle 101', 30, 'NORMALE'),
            ('Salle 102', 30, 'NORMALE'),
            ('Salle 103', 25, 'NORMALE'),
            ('Salle 201', 20, 'NORMALE'),
            ('Laboratoire Physique', 20, 'LABORATOIRE'),
            ('Laboratoire SVT', 20, 'LABORATOIRE'),
            ('Salle Informatique', 20, 'INFORMATIQUE'),
            ('Atelier Électrique', 16, 'ATELIER'),
        ]
        for nom, capacite, stype in data:
            Salle.objects.get_or_create(
                nom=nom,
                defaults={
                    'capacite': capacite,
                    'type': stype,
                    'est_salle_unique': stype == 'INFORMATIQUE',
                }
            )
        self.stdout.write('  ✓ Salles created')

    def _create_enseignants(self):
        matieres = {m.code: m for m in Matiere.objects.all()}
        data = [
            ('Dupont', 'Jean', 'MATH', 20),
            ('Martin', 'Sophie', 'FR', 18),
            ('Bernard', 'Pierre', 'ANG', 20),
            ('Petit', 'Marie', 'HG', 20),
            ('Durand', 'Paul', 'PC', 18, True),
            ('Leroy', 'Anne', 'INFO', 15, False, True),
            ('Moreau', 'Luc', 'ELEC', 20),
            ('Roux', 'Julie', 'SVT', 20),
            ('Fournier', 'Marc', 'EPS', 20),
            ('Garcia', 'Léa', 'INFO', 20),
            ('Naud', 'Hubert', 'ATEL', 18),
        ]
        enseignants = []
        for d in data:
            nom, prenom, mat_code, vol_max = d[:4]
            temps_partiel = d[4] if len(d) > 4 else False
            evite_16h = d[5] if len(d) > 5 else False
            mat = matieres.get(mat_code)
            ens, _ = Enseignant.objects.get_or_create(
                nom=nom,
                prenom=prenom,
                defaults={
                    'email': f"{prenom.lower()}.{nom.lower()}@lycee.fr",
                    'matiere': mat,
                    'volume_horaire_max': vol_max,
                    'temps_partiel': temps_partiel,
                    'prefere_eviter_apres_16h': evite_16h,
                }
            )
            enseignants.append(ens)
        self.stdout.write('  ✓ Enseignants created')

        # Add some availabilities
        for ens in enseignants:
            for day in range(5):
                DisponibiliteEnseignant.objects.get_or_create(
                    enseignant=ens,
                    jour_semaine=day,
                    heure_debut=time(7, 0),
                    heure_fin=time(18, 0),
                    defaults={'est_disponible': True}
                )
        self.stdout.write('  ✓ Teacher availabilities created')

    def _assign_teachers_to_classes(self):
        from apps.subjects.models import ClasseMatiere
        from apps.teachers.models import EnseignantClasse

        # Assign teachers to ClasseMatiere records based on subject
        for ens in Enseignant.objects.all():
            if ens.matiere:
                ClasseMatiere.objects.filter(matiere=ens.matiere, enseignant__isnull=True).update(enseignant=ens)

        # Assign teachers to classes (EnseignantClasse)
        classes = list(Classe.objects.all())
        for ens in Enseignant.objects.all():
            for cls in classes:
                if random.random() > 0.3:
                    EnseignantClasse.objects.get_or_create(enseignant=ens, classe=cls)

        remaining = ClasseMatiere.objects.filter(enseignant__isnull=True).count()
        if remaining:
            self.stdout.write(self.style.WARNING(f'  ⚠ {remaining} matières sans enseignant'))
        self.stdout.write('  ✓ Teachers assigned to classes')

    def _create_constraints(self):
        # Secondes don't work Wednesday afternoon
        seconde = Niveau.objects.get(nom='Seconde')
        ContrainteSpecifique.objects.get_or_create(
            niveau=seconde,
            type_contrainte='INDISP_NIVEAU',
            jour_semaine=2,
            heure_limite=time(12, 0),
            description="Les Secondes ne travaillent pas le mercredi après-midi",
        )
        # Premières finish at 15:00 on Friday
        premiere = Niveau.objects.get(nom='Première')
        ContrainteSpecifique.objects.get_or_create(
            niveau=premiere,
            type_contrainte='PAS_COURS_APRES',
            jour_semaine=4,
            heure_limite=time(15, 0),
            description="Les Premières arrêtent le vendredi à 15h",
        )
        # Computer room maintenance Thursday afternoon
        salle_info = Salle.objects.get(type='INFORMATIQUE')
        DisponibiliteSalle.objects.get_or_create(
            salle=salle_info,
            jour_semaine=3,
            heure_debut=time(14, 0),
            heure_fin=time(18, 0),
            defaults={
                'est_disponible': False,
                'motif': 'Maintenance',
            }
        )
        self.stdout.write('  ✓ Constraints created')

    def _create_schedule_version(self):
        ScheduleVersion.objects.get_or_create(
            nom="Version initiale",
            defaults={'est_active': True}
        )
        self.stdout.write('  ✓ Schedule version created')


