from rest_framework import viewsets
from .models import Matiere, ClasseMatiere
from .serializers import MatiereSerializer, ClasseMatiereSerializer


class MatiereViewSet(viewsets.ModelViewSet):
    queryset = Matiere.objects.all()
    serializer_class = MatiereSerializer


class ClasseMatiereViewSet(viewsets.ModelViewSet):
    queryset = ClasseMatiere.objects.select_related('classe', 'matiere', 'enseignant').all()
    serializer_class = ClasseMatiereSerializer
    filterset_fields = ['classe', 'matiere', 'enseignant']
