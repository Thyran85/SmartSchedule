from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    class TypeNotification(models.TextChoices):
        CONFLIT = 'CONFLIT', 'Conflit détecté'
        MODIFICATION = 'MODIFICATION', 'Modification emploi du temps'
        GENERATION = 'GENERATION', 'Génération terminée'
        REMPLACEMENT = 'REMPLACEMENT', 'Remplacement enseignants'
        INFO = 'INFO', 'Information'

    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    type = models.CharField(max_length=20, choices=TypeNotification.choices)
    message = models.CharField(max_length=500)
    lien = models.CharField(max_length=300, blank=True, help_text="Lien vers la ressource concernée")
    date_creation = models.DateTimeField(auto_now_add=True)
    lue = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-date_creation']

    def __str__(self):
        return f"[{self.get_type_display()}] {self.message[:50]}"
