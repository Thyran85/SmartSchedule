from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Classe


@receiver(post_save, sender=Classe)
def ensure_class_room(sender, instance, **kwargs):
    """Each class automatically gets its own room (type NORMALE)."""
    from apps.rooms.models import Salle

    expected = f"Salle {instance.nom}"
    room = getattr(instance, 'salle_attachee', None)
    if room is None:
        room = Salle.objects.filter(nom=expected).first()

    if room is None:
        Salle.objects.create(
            nom=expected,
            capacite=instance.effectif,
            type=Salle.TypeSalle.NORMALE,
            est_salle_unique=False,
            classe=instance,
        )
        return

    changed = False
    if room.nom != expected:
        room.nom = expected
        changed = True
    if room.capacite != instance.effectif:
        room.capacite = instance.effectif
        changed = True
    if room.classe_id != instance.id:
        room.classe = instance
        changed = True
    if changed:
        room.save()
