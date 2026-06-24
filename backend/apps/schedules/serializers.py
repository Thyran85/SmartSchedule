from rest_framework import serializers
from .models import Cours, ScheduleVersion, Remplacement


class ScheduleVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleVersion
        fields = '__all__'


class CoursSerializer(serializers.ModelSerializer):
    classe_nom = serializers.CharField(source='classe.nom', read_only=True)
    matiere_nom = serializers.CharField(source='matiere.nom', read_only=True)
    enseignant_nom = serializers.CharField(source='enseignant.nom', read_only=True)
    salle_nom = serializers.CharField(source='salle.nom', read_only=True)
    jour = serializers.SerializerMethodField()

    class Meta:
        model = Cours
        fields = '__all__'

    def get_jour(self, obj):
        return dict(Cours.JOURS).get(obj.jour_semaine, '')


class RemplacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Remplacement
        fields = '__all__'
