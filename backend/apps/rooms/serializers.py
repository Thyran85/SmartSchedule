from rest_framework import serializers
from .models import Salle, DisponibiliteSalle


class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salle
        fields = '__all__'


class DisponibiliteSalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisponibiliteSalle
        fields = '__all__'
