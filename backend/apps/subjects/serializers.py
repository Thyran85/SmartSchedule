from rest_framework import serializers
from .models import Matiere, ClasseMatiere


class MatiereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Matiere
        fields = '__all__'


class ClasseMatiereSerializer(serializers.ModelSerializer):
    matiere_nom = serializers.CharField(source='matiere.nom', read_only=True)
    classe_nom = serializers.CharField(source='classe.nom', read_only=True)
    enseignant_nom = serializers.CharField(source='enseignant.nom', read_only=True)

    class Meta:
        model = ClasseMatiere
        fields = '__all__'
