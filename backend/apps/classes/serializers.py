from rest_framework import serializers
from .models import Niveau, Filiere, Classe


class NiveauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Niveau
        fields = '__all__'


class FiliereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filiere
        fields = '__all__'


class ClasseSerializer(serializers.ModelSerializer):
    niveau_nom = serializers.CharField(source='niveau.nom', read_only=True)
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True)

    class Meta:
        model = Classe
        fields = '__all__'
