from django.contrib import admin
from .models import Enseignant, DisponibiliteEnseignant, EnseignantClasse

admin.site.register(Enseignant)
admin.site.register(DisponibiliteEnseignant)
admin.site.register(EnseignantClasse)
