from django.db import models


class Salle(models.Model):
    class TypeSalle(models.TextChoices):
        NORMALE = 'NORMALE', 'Salle normale'
        LABORATOIRE = 'LABORATOIRE', 'Laboratoire'
        ATELIER = 'ATELIER', 'Atelier'
        INFORMATIQUE = 'INFORMATIQUE', 'Salle informatique'

    nom = models.CharField(max_length=50, unique=True)
    capacite = models.IntegerField()
    type = models.CharField(max_length=20, choices=TypeSalle.choices, default=TypeSalle.NORMALE)
    est_salle_unique = models.BooleanField(default=False, help_text="True si c'est une salle unique (ex: seule salle informatique)")

    class Meta:
        verbose_name = "Salle"
        verbose_name_plural = "Salles"
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()}, {self.capacite} places)"


class DisponibiliteSalle(models.Model):
    JOURS = [
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
    ]

    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='disponibilites')
    jour_semaine = models.IntegerField(choices=JOURS)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    est_disponible = models.BooleanField(default=True, help_text="True = disponible, False = indisponible")
    motif = models.CharField(max_length=200, blank=True, help_text="Motif d'indisponibilité (maintenance, etc.)")

    class Meta:
        verbose_name = "Disponibilité salle"
        verbose_name_plural = "Disponibilités salles"
        ordering = ['salle', 'jour_semaine', 'heure_debut']

    def __str__(self):
        status = "Disponible" if self.est_disponible else f"Indisponible ({self.motif})"
        jour = dict(self.JOURS)[self.jour_semaine]
        return f"{self.salle.nom} - {jour} {self.heure_debut}-{self.heure_fin} ({status})"
