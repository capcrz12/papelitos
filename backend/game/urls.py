from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, GameStateViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'game-state', GameStateViewSet, basename='gamestate')

urlpatterns = [
    path('', include(router.urls)),
]
