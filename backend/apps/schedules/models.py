from django.db import models
from django.core.exceptions import ValidationError


class ScheduleVersion(models.Model):
    nom = models.CharField(max_length=100)
    date_creation = models.DateTimeField(auto_now_add=True)
    est_active = models.BooleanField(default=False)
    score_qualite = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Version d'emploi du temps"
        verbose_name_plural = "Versions d'emplois du temps"
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.nom} ({self.date_creation.strftime('%d/%m/%Y %H:%M')})"


class Cours(models.Model):
    JOURS = [
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
    ]

    classe = models.ForeignKey('classes.Classe', on_delete=models.CASCADE, related_name='cours')
    matiere = models.ForeignKey('subjects.Matiere', on_delete=models.CASCADE, related_name='cours')
    enseignant = models.ForeignKey('teachers.Enseignant', on_delete=models.SET_NULL, null=True, related_name='cours')
    salle = models.ForeignKey('rooms.Salle', on_delete=models.SET_NULL, null=True, blank=True, related_name='cours')
    version = models.ForeignKey(ScheduleVersion, on_delete=models.CASCADE, related_name='cours')
    jour_semaine = models.IntegerField(choices=JOURS)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    est_verrouille = models.BooleanField(default=False, help_text="Créneau verrouillé manuellement")
    est_demi_groupe = models.BooleanField(default=False)
    salle_secondaire = models.ForeignKey('rooms.Salle', on_delete=models.SET_NULL, null=True, blank=True, related_name='cours_secondaire')

    class Meta:
        verbose_name = "Cours"
        verbose_name_plural = "Cours"
        ordering = ['jour_semaine', 'heure_debut']

    def __str__(self):
        jour = dict(self.JOURS)[self.jour_semaine]
        return f"{self.classe.nom} - {self.matiere.nom} ({jour} {self.heure_debut}-{self.heure_fin})"

    def clean(self):
        if self.salle and self.salle.type == 'INFORMATIQUE' and not self.matiere.necessite_salle_informatique:
            raise ValidationError("La salle informatique ne peut être utilisée que pour les cours d'informatique")


class Remplacement(models.Model):
    cours = models.ForeignKey(Cours, on_delete=models.CASCADE, related_name='remplacements')
    enseignant_remplacant = models.ForeignKey('teachers.Enseignant', on_delete=models.SET_NULL, null=True, related_name='remplacements')
    date_debut = models.DateField()
    date_fin = models.DateField()
    motif = models.CharField(max_length=300)

    class Meta:
        verbose_name = "Remplacement"
        verbose_name_plural = "Remplacements"
        ordering = ['-date_debut']

    def __str__(self):
        return f"Remplacement {self.cours} par {self.enseignant_remplacant}"
