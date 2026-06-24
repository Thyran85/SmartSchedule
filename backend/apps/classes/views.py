from rest_framework import viewsets
from .models import Niveau, Filiere, Classe
from .serializers import NiveauSerializer, FiliereSerializer, ClasseSerializer


class NiveauViewSet(viewsets.ModelViewSet):
    queryset = Niveau.objects.all()
    serializer_class = NiveauSerializer


class FiliereViewSet(viewsets.ModelViewSet):
    queryset = Filiere.objects.all()
    serializer_class = FiliereSerializer


class ClasseViewSet(viewsets.ModelViewSet):
    queryset = Classe.objects.select_related('niveau', 'filiere').all()
    serializer_class = ClasseSerializer
    filterset_fields = ['niveau', 'filiere']
