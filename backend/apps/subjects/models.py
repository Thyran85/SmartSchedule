from django.db import models


class Matiere(models.Model):
    class TypeMatiere(models.TextChoices):
        GENERAL = 'GENERAL', 'Général'
        TECHNIQUE = 'TECHNIQUE', 'Technique'
        LABORATOIRE = 'LABORATOIRE', 'Laboratoire'
        ATELIER_PRATIQUE = 'ATELIER', 'Atelier pratique'

    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    heures_par_semaine = models.FloatField()
    coefficient = models.FloatField(default=1.0)
    type = models.CharField(max_length=20, choices=TypeMatiere.choices, default=TypeMatiere.GENERAL)
    necessite_salle_informatique = models.BooleanField(default=False)
    necessite_laboratoire = models.BooleanField(default=False)
    necessite_atelier = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Matière"
        verbose_name_plural = "Matières"
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()})"


class ClasseMatiere(models.Model):
    classe = models.ForeignKey('classes.Classe', on_delete=models.CASCADE, related_name='matieres')
    matiere = models.ForeignKey(Matiere, on_delete=models.CASCADE, related_name='classes_associees')
    enseignant = models.ForeignKey('teachers.Enseignant', on_delete=models.SET_NULL, null=True, related_name='matieres_enseignees')
    heures_par_semaine = models.FloatField()
    est_demi_groupe = models.BooleanField(default=False, help_text="TP en demi-groupe")
    est_commun = models.BooleanField(default=False, help_text="Cours commun avec la classe technique associée")

    class Meta:
        verbose_name = "Matière de classe"
        verbose_name_plural = "Matières de classes"
        unique_together = [('classe', 'matiere')]

    def __str__(self):
        return f"{self.classe.nom} - {self.matiere.nom}"
