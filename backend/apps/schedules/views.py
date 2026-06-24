from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cours, ScheduleVersion, Remplacement
from .serializers import CoursSerializer, ScheduleVersionSerializer, RemplacementSerializer
from .generator import ScheduleGenerator


class ScheduleVersionViewSet(viewsets.ModelViewSet):
    queryset = ScheduleVersion.objects.all()
    serializer_class = ScheduleVersionSerializer

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        version = self.get_object()
        generator = ScheduleGenerator()
        try:
            result = generator.generate(version)
            return Response({
                'status': 'success',
                'cours_crees': result['cours_crees'],
                'conflits': result['conflits'],
                'score': result['score'],
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        version = self.get_object()
        ScheduleVersion.objects.filter(est_active=True).update(est_active=False)
        version.est_active = True
        version.save()
        return Response({'status': 'success', 'message': 'Version activée'})

    @action(detail=False, methods=['get'])
    def active(self, request):
        version = ScheduleVersion.objects.filter(est_active=True).first()
        if version:
            serializer = self.get_serializer(version)
            return Response(serializer.data)
        return Response({'detail': 'Aucune version active'}, status=404)


class CoursViewSet(viewsets.ModelViewSet):
    queryset = Cours.objects.select_related('classe', 'matiere', 'enseignant', 'salle').all()
    serializer_class = CoursSerializer
    filterset_fields = ['classe', 'enseignant', 'salle', 'matiere', 'jour_semaine', 'version']

    @action(detail=True, methods=['post'])
    def toggle_lock(self, request, pk=None):
        cours = self.get_object()
        cours.est_verrouille = not cours.est_verrouille
        cours.save()
        return Response({'est_verrouille': cours.est_verrouille})

    @action(detail=False, methods=['get'])
    def by_class(self, request):
        classe_id = request.query_params.get('classe')
        if not classe_id:
            return Response({'error': 'classe parameter required'}, status=400)
        cours = self.queryset.filter(classe_id=classe_id)
        serializer = self.get_serializer(cours, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_teacher(self, request):
        enseignant_id = request.query_params.get('enseignant')
        if not enseignant_id:
            return Response({'error': 'enseignant parameter required'}, status=400)
        cours = self.queryset.filter(enseignant_id=enseignant_id)
        serializer = self.get_serializer(cours, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_room(self, request):
        salle_id = request.query_params.get('salle')
        if not salle_id:
            return Response({'error': 'salle parameter required'}, status=400)
        cours = self.queryset.filter(salle_id=salle_id)
        serializer = self.get_serializer(cours, many=True)
        return Response(serializer.data)


class RemplacementViewSet(viewsets.ModelViewSet):
    queryset = Remplacement.objects.all()
    serializer_class = RemplacementSerializer


from django.http import HttpResponse
from .exports import export_schedule_excel, export_schedule_pdf


def export_view(request, format, entity_type, entity_id):
    version_id = request.GET.get('version')
    if format == 'excel':
        return export_schedule_excel(request, entity_type, entity_id, version_id)
    elif format == 'pdf':
        return export_schedule_pdf(request, entity_type, entity_id, version_id)
    return HttpResponse('Invalid format', status=400)
