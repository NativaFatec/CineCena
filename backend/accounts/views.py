from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, MeSerializer, UserPublicSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class PublicProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = User.objects.annotate(
            review_count=Count("reviews", distinct=True),
            followers_count=Count("followers", distinct=True),
            following_count=Count("following", distinct=True),
        ).filter(username=username).first()
        if not user:
            from rest_framework.exceptions import NotFound
            raise NotFound("Usuário não encontrado.")
        return Response(UserPublicSerializer(user).data)
