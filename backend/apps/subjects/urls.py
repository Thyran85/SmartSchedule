from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatiereViewSet, ClasseMatiereViewSet

router = DefaultRouter()
router.register(r'matieres', MatiereViewSet)
router.register(r'classe-matieres', ClasseMatiereViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
