from django.db import models


class ContrainteSpecifique(models.Model):
    class TypeContrainte(models.TextChoices):
        INDISPONIBILITE_CLASSE = 'INDISP_CLASSE', 'Indisponibilité classe'
        INDISPONIBILITE_NIVEAU = 'INDISP_NIVEAU', 'Indisponibilité niveau'
        INTERDICTION_DERNIERE_HEURE = 'INTERDICT_DERN_HEURE', 'Matière interdite en dernière heure'
        MATIERE_APRES_MIDI_ONLY = 'MAT_APMIDI_ONLY', 'Matière uniquement l\'après-midi'
        MATIERE_MATIN_ONLY = 'MAT_MATIN_ONLY', 'Matière uniquement le matin'
        MAX_HEURES_CONSECUTIVES = 'MAX_HEURES_CONSEC', 'Max heures consécutives par matière'
        SPORT_APRES_MIDI = 'SPORT_APMIDI', 'Sport uniquement l\'après-midi'
        PAS_COURS_APRES = 'PAS_COURS_APRES', 'Pas de cours après une heure donnée'
        FIN_AVANCEE = 'FIN_AVANCEE', 'Fin des cours avancée (ex: vendredi 17h)'
        HEURES_MIN_PAR_JOUR = 'HEURES_MIN_JOUR', 'Heures minimum par jour'

    classe = models.ForeignKey('classes.Classe', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    niveau = models.ForeignKey('classes.Niveau', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    matiere = models.ForeignKey('subjects.Matiere', on_delete=models.CASCADE, null=True, blank=True, related_name='contraintes')
    type_contrainte = models.CharField(max_length=30, choices=TypeContrainte.choices)
    jour_semaine = models.IntegerField(null=True, blank=True, choices=[
        (0, 'Lundi'), (1, 'Mardi'), (2, 'Mercredi'), (3, 'Jeudi'), (4, 'Vendredi')
    ])
    heure_limite = models.TimeField(null=True, blank=True, help_text="Heure limite pour PAS_COURS_APRES")
    valeur = models.FloatField(null=True, blank=True, help_text="Valeur numérique (ex: max heures consécutives)")
    description = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = "Contrainte spécifique"
        verbose_name_plural = "Contraintes spécifiques"

    def __str__(self):
        target = self.classe or self.niveau
        if target:
            return f"{self.get_type_contrainte_display()} - {target}"
        return self.get_type_contrainte_display()
