from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScheduleVersionViewSet, CoursViewSet, RemplacementViewSet, export_view

router = DefaultRouter()
router.register(r'versions', ScheduleVersionViewSet)
router.register(r'cours', CoursViewSet)
router.register(r'remplacements', RemplacementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('export/<str:format>/<str:entity_type>/<int:entity_id>/', export_view, name='export-schedule'),
]
