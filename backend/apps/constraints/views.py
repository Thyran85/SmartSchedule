from rest_framework import viewsets
from .models import ContrainteSpecifique
from .serializers import ContrainteSpecifiqueSerializer


class ContrainteSpecifiqueViewSet(viewsets.ModelViewSet):
    queryset = ContrainteSpecifique.objects.all()
    serializer_class = ContrainteSpecifiqueSerializer
    filterset_fields = ['classe', 'niveau', 'type_contrainte']
