from django.db import models


class Enseignant(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    matiere = models.ForeignKey('subjects.Matiere', on_delete=models.SET_NULL, null=True, related_name='enseignants')
    volume_horaire_max = models.FloatField(default=20.0, help_text="Volume horaire max par semaine")
    temps_partiel = models.BooleanField(default=False)
    prefere_eviter_apres_16h = models.BooleanField(default=False)
    classes = models.ManyToManyField('classes.Classe', through='EnseignantClasse', related_name='enseignants')

    class Meta:
        verbose_name = "Enseignant"
        verbose_name_plural = "Enseignants"
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class EnseignantClasse(models.Model):
    enseignant = models.ForeignKey(Enseignant, on_delete=models.CASCADE)
    classe = models.ForeignKey('classes.Classe', on_delete=models.CASCADE)

    class Meta:
        verbose_name = "Affectation enseignant-classe"
        verbose_name_plural = "Affectations enseignants-classes"
        unique_together = [('enseignant', 'classe')]


class DisponibiliteEnseignant(models.Model):
    JOURS = [
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
    ]

    enseignant = models.ForeignKey(Enseignant, on_delete=models.CASCADE, related_name='disponibilites')
    jour_semaine = models.IntegerField(choices=JOURS)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    est_disponible = models.BooleanField(default=True, help_text="True = disponible, False = indisponible")

    class Meta:
        verbose_name = "Disponibilité enseignant"
        verbose_name_plural = "Disponibilités enseignants"
        ordering = ['enseignant', 'jour_semaine', 'heure_debut']

    def __str__(self):
        status = "Disponible" if self.est_disponible else "Indisponible"
        jour = dict(self.JOURS)[self.jour_semaine]
        return f"{self.enseignant} - {jour} {self.heure_debut}-{self.heure_fin} ({status})"
