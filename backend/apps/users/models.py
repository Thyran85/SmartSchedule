from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    enseignant = models.OneToOneField('teachers.Enseignant', on_delete=models.SET_NULL, null=True, blank=True, related_name='profile')
    telephone = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"

    def __str__(self):
        return f"Profil de {self.user.username}"
