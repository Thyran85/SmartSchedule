from rest_framework import serializers
from .models import Enseignant, DisponibiliteEnseignant, EnseignantClasse
from ..classes.models import Classe


class EnseignantSerializer(serializers.ModelSerializer):
    matiere_nom = serializers.CharField(source='matiere.nom', read_only=True)

    class Meta:
        model = Enseignant
        fields = '__all__'


class DisponibiliteEnseignantSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisponibiliteEnseignant
        fields = '__all__'


class EnseignantClasseSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnseignantClasse
        fields = '__all__'
