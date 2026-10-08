# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer

User = get_user_model()

# --- VIEW DE LOGIN ---
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        login_input = data.get('login') or data.get('username')
        password = data.get('password')

        if not login_input or not password:
            return Response(
                {"error": "Informe o e-mail/usuário e a senha."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Busca por e-mail ou nome de usuário
        if '@' in login_input:
            user = User.objects.filter(email__iexact=login_input).first()
        else:
            user = User.objects.filter(username__iexact=login_input).first()

        # Valida existência do usuário e verifica a senha
        if not user or not user.check_password(password):
            return Response(
                {"error": "Usuário/e-mail ou senha incorretos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Recupera ou gera o Token de acesso
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }, status=status.HTTP_200_OK)


# --- VIEW DE CADASTRO ---
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "message": "Conta criada com sucesso!",
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            }, status=status.HTTP_201_CREATED)
        
        errors = serializer.errors
        first_error = next(iter(errors.values()))[0] if errors else "Erro no cadastro."
        return Response({"error": first_error}, status=status.HTTP_400_BAD_REQUEST)


# --- VIEW DO USUÁRIO AUTENTICADO ---
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email
        })


# --- VIEW DE PERFIL PÚBLICO ---
class PublicProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, username=None):
        user_obj = User.objects.filter(username__iexact=username).first()
        if not user_obj:
            return Response({"error": "Perfil não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "id": user_obj.id,
            "username": user_obj.username,
        })