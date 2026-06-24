from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
    path('api/classes/', include('apps.classes.urls')),
    path('api/teachers/', include('apps.teachers.urls')),
    path('api/subjects/', include('apps.subjects.urls')),
    path('api/rooms/', include('apps.rooms.urls')),
    path('api/schedules/', include('apps.schedules.urls')),
    path('api/constraints/', include('apps.constraints.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]
