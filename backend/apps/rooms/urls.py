from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalleViewSet, DisponibiliteSalleViewSet

router = DefaultRouter()
router.register(r'salles', SalleViewSet)
router.register(r'disponibilites', DisponibiliteSalleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
