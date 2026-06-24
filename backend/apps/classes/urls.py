from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NiveauViewSet, FiliereViewSet, ClasseViewSet

router = DefaultRouter()
router.register(r'niveaux', NiveauViewSet)
router.register(r'filieres', FiliereViewSet)
router.register(r'classes', ClasseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
