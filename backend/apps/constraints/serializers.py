from rest_framework import serializers
from .models import ContrainteSpecifique


class ContrainteSpecifiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContrainteSpecifique
        fields = '__all__'
