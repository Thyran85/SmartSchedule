from rest_framework import viewsets
from .models import Salle, DisponibiliteSalle
from .serializers import SalleSerializer, DisponibiliteSalleSerializer


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    filterset_fields = ['type']


class DisponibiliteSalleViewSet(viewsets.ModelViewSet):
    queryset = DisponibiliteSalle.objects.all()
    serializer_class = DisponibiliteSalleSerializer
    filterset_fields = ['salle', 'jour_semaine']
