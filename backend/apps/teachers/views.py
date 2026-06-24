from rest_framework import viewsets
from .models import Enseignant, DisponibiliteEnseignant, EnseignantClasse
from .serializers import EnseignantSerializer, DisponibiliteEnseignantSerializer, EnseignantClasseSerializer


class EnseignantViewSet(viewsets.ModelViewSet):
    queryset = Enseignant.objects.all()
    serializer_class = EnseignantSerializer
    search_fields = ['nom', 'prenom', 'email']


class DisponibiliteEnseignantViewSet(viewsets.ModelViewSet):
    queryset = DisponibiliteEnseignant.objects.all()
    serializer_class = DisponibiliteEnseignantSerializer
    filterset_fields = ['enseignant', 'jour_semaine']


class EnseignantClasseViewSet(viewsets.ModelViewSet):
    queryset = EnseignantClasse.objects.all()
    serializer_class = EnseignantClasseSerializer
