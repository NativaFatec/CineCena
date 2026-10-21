from django.urls import path
from .views import LoginView, RegisterView, MeView, PublicProfileView, PublicAvatarView

urlpatterns = [
    path('avatars/<str:username>/', PublicAvatarView.as_view(), name='avatar-image'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/<str:username>/', PublicProfileView.as_view(), name='profile'),
]