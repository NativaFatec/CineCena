# backend/accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser  # <--- Adicionar esta linha
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import Profile, public_avatar_url
from django.db.models import Count, Q
from movies.models import FavoriteMovie, Review
from social.models import Friendship, MovieList, MovieInteraction

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
class MeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        avatar_url = public_avatar_url(profile, request)

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": avatar_url,
            "bio": profile.bio
        })

    def patch(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)

        if 'avatar' in request.FILES:
            upload = request.FILES['avatar']
            if upload.size > 2 * 1024 * 1024:
                return Response({"error": "A imagem deve ter até 2 MB."}, status=400)
            try:
                from PIL import Image
                from io import BytesIO
                image_bytes = upload.read()
                image = Image.open(BytesIO(image_bytes))
                image.verify()
                if image.format not in ("PNG", "JPEG", "WEBP"):
                    return Response({"error": "Use PNG, JPG ou WebP."}, status=400)
            except (ValueError, OSError):
                return Response({"error": "Arquivo de imagem inválido."}, status=400)
            profile.avatar_blob = image_bytes
            profile.avatar_content_type = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}[image.format]
        if 'bio' in request.data:
            profile.bio = str(request.data['bio'])[:280]
        if 'username' in request.data:
            username = str(request.data['username']).strip()
            if not username or len(username) > 150:
                return Response({"error": "Nome de usuário inválido."}, status=400)
            if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
                return Response({"error": "Nome de usuário já utilizado."}, status=400)
            user.username = username
            user.save(update_fields=['username'])
        profile.save()

        avatar_url = public_avatar_url(profile, request)

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": avatar_url,
            "bio": profile.bio
        }, status=status.HTTP_200_OK)

class PublicProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request, username=None):
        user_obj = User.objects.filter(
            username__iexact=username
        ).first()

        if not user_obj:
            return Response(
                {"error": "Perfil não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile = Profile.objects.filter(
            user=user_obj
        ).first()

        avatar_url = public_avatar_url(profile, request)

        # Amizades reais no banco
        friendships = Friendship.objects.filter(
            Q(user=user_obj) | Q(friend=user_obj)
        ).select_related(
            "user", "friend"
        ).order_by("-created_at")

        friends_count = friendships.count()

        # No máximo três amizades para exibir no perfil
        preview = list(friendships[:3])

        friend_users = [
            relation.friend
            if relation.user_id == user_obj.id
            else relation.user
            for relation in preview
        ]

        friend_profiles = {
            item.user_id: item
            for item in Profile.objects.filter(
                user_id__in=[
                    friend.id for friend in friend_users
                ]
            )
        }

        friends_data = []

        for friend in friend_users:
            friend_profile = friend_profiles.get(friend.id)
            friend_avatar = public_avatar_url(friend_profile, request)

            friends_data.append({
                "id": friend.id,
                "username": friend.username,
                "avatar": friend_avatar,
            })

        # Verifica a relação entre o visitante e o perfil
        friendship = None

        if (
            request.user.is_authenticated
            and request.user.id != user_obj.id
        ):
            friendship = Friendship.objects.filter(
                (
                    Q(
                        user=request.user,
                        friend=user_obj,
                    )
                    |
                    Q(
                        user=user_obj,
                        friend=request.user,
                    )
                )
            ).first()

        # Cinco vagas de favoritos salvas no banco
        favorites = list(
            FavoriteMovie.objects.filter(
                user=user_obj
            ).order_by("position").values(
                "id",
                "tmdb_id",
                "title",
                "poster_path",
                "position",
            )
        )

        # Reviews reais da conta
        review_queryset = (
            Review.objects
            .filter(user=user_obj)
            .select_related("movie")
            .order_by("-created_at")
        )

        reviews_count = review_queryset.count()

        reviews_data = [
            {
                "id": review.id,
                "movie_title": review.movie.title,
                "rating": review.rating,
                "title": review.title,
                "body": review.body,
                "is_spoiler": review.is_spoiler,
                "created_at": review.created_at,
            }
            for review in review_queryset[:10]
        ]

        # Listas públicas do usuário
        lists_queryset = (
            MovieList.objects
            .filter(user=user_obj, is_public=True)
            .annotate(
                movies_count=Count(
                    "items",
                    distinct=True,
                )
            )
            .order_by("-updated_at")
        )

        lists_count = lists_queryset.count()

        lists_data = [
            {
                "id": movie_list.id,
                "title": movie_list.title,
                "description": movie_list.description,
                "movies_count": movie_list.movies_count,
                "created_at": movie_list.created_at,
            }
            for movie_list in lists_queryset[:10]
        ]

        return Response({
            "id": user_obj.id,
            "username": user_obj.username,
            "avatar": avatar_url,
            "bio": profile.bio if profile else "",

            "is_self": (
                request.user.is_authenticated
                and request.user.id == user_obj.id
            ),

            "is_friend": friendship is not None,
            "friendship_id": (
                friendship.id if friendship else None
            ),

            "friends_count": friends_count,
            "friends": friends_data,

            "favorites": favorites,

            "reviews_count": reviews_count,
            "reviews": reviews_data,

            "lists_count": lists_count,
            "lists": lists_data,

            "watched_count": MovieInteraction.objects.filter(user=user_obj, watched=True).count(),
        })

class PublicAvatarView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    def get(self, request, username):
        from django.http import HttpResponse, Http404
        profile = Profile.objects.filter(user__username__iexact=username).first()
        if not profile or not profile.avatar_blob:
            raise Http404
        response = HttpResponse(bytes(profile.avatar_blob), content_type=profile.avatar_content_type or 'image/jpeg')
        response['Cache-Control'] = 'no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        return response
