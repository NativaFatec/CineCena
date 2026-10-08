from django.urls import path
from .views import LoginView, RegisterView, MeView, PublicProfileView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/<str:username>/', PublicProfileView.as_view(), name='profile'),
]