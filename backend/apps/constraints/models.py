from django.db import models


class ContrainteSpecifique(models.Model):
    class TypeContrainte(models.TextChoices):
        INDISPONIBILITE_NIVEAU = 'INDISP_NIVEAU', 'Indisponibilité niveau'
        INDISPONIBILITE_SALLE = 'INDISP_SALLE', 'Indisponibilité salle'
        MATIERE_PERIODE = 'MAT_PERIODE', 'Matière en période spécifique (0=matin, 1=après-midi)'
        MAX_HEURES_CONSECUTIVES = 'MAX_HEURES_CONSEC', 'Max heures consécutives par matière'
        FIN_AVANCEE = 'FIN_AVANCEE', 'Fin des cours avancée (ex: vendredi 17h)'
        HEURES_MIN_PAR_JOUR = 'HEURES_MIN_JOUR', 'Heures minimum par jour'

    classe = models.ForeignKey('classes.Classe', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    niveau = models.ForeignKey('classes.Niveau', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    matiere = models.ForeignKey('subjects.Matiere', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    salle = models.ForeignKey('rooms.Salle', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    type_contrainte = models.CharField(max_length=30, choices=TypeContrainte.choices)
    jour_semaine = models.IntegerField(null=True, blank=True, choices=[
        (0, 'Lundi'), (1, 'Mardi'), (2, 'Mercredi'), (3, 'Jeudi'), (4, 'Vendredi')
    ])
    heure_limite = models.TimeField(null=True, blank=True, help_text="Heure limite pour les indisponibilités")
    valeur = models.FloatField(null=True, blank=True, help_text="Valeur numérique (ex: max heures consécutives)")
    description = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Contrainte spécifique"
        verbose_name_plural = "Contraintes spécifiques"

    def __str__(self):
        target = self.salle or self.classe or self.niveau
        if target:
            return f"{self.get_type_contrainte_display()} - {target}"
        return self.get_type_contrainte_display()
