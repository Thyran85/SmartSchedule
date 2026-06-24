from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContrainteSpecifiqueViewSet

router = DefaultRouter()
router.register(r'contraintes', ContrainteSpecifiqueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
