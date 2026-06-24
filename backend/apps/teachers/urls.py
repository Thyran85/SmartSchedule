from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnseignantViewSet, DisponibiliteEnseignantViewSet, EnseignantClasseViewSet

router = DefaultRouter()
router.register(r'enseignants', EnseignantViewSet)
router.register(r'disponibilites', DisponibiliteEnseignantViewSet)
router.register(r'affectations', EnseignantClasseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
