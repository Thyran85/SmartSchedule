from django.db import models


class Niveau(models.Model):
    nom = models.CharField(max_length=50, unique=True)
    ordre = models.IntegerField(unique=True, help_text="Ordre d'affichage (1=Seconde, 2=Première, etc.)")

    class Meta:
        verbose_name = "Niveau"
        verbose_name_plural = "Niveaux"
        ordering = ['ordre']

    def __str__(self):
        return self.nom


class Filiere(models.Model):
    nom = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name = "Filière"
        verbose_name_plural = "Filières"

    def __str__(self):
        return self.nom


class Classe(models.Model):
    nom = models.CharField(max_length=50, unique=True)
    niveau = models.ForeignKey(Niveau, on_delete=models.CASCADE, related_name='classes')
    filiere = models.ForeignKey(Filiere, on_delete=models.SET_NULL, null=True, related_name='classes')
    effectif = models.IntegerField()

    class Meta:
        verbose_name = "Classe"
        verbose_name_plural = "Classes"
        ordering = ['niveau__ordre', 'nom']

    def __str__(self):
        return f"{self.nom} ({self.niveau.nom})"
