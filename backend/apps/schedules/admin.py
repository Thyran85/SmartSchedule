from django.contrib import admin
from .models import Cours, ScheduleVersion, Remplacement

admin.site.register(ScheduleVersion)
admin.site.register(Cours)
admin.site.register(Remplacement)
