
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile, public_avatar_url
from movies.models import Movie

from .models import (
    Comment,
    MovieList,
    Follow,
    Friendship,
    Community,
    CommunityMembership,
)
from .serializers import (
    CommentSerializer,
    MovieListSerializer,
    FollowSerializer,
    FriendshipSerializer,
    CommunitySerializer,
)
from .permissions import IsOwnerOrReadOnly


# =========================================================
# PERMISSÃO PARA COMUNIDADES
# Apenas o criador pode editar ou excluir a comunidade.
# As consultas GET continuam públicas.
# =========================================================

class IsCommunityCreatorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.created_by_id == request.user.id


# =========================================================
# COMENTÁRIOS
# =========================================================

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer

    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly,
    ]

    queryset = Comment.objects.select_related(
        "user",
        "review",
    )

    def get_queryset(self):
        qs = super().get_queryset()
        review_id = self.request.query_params.get("review")
        return qs.filter(review_id=review_id) if review_id else qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# =========================================================
# LISTAS DE FILMES
# =========================================================

class MovieListViewSet(viewsets.ModelViewSet):
    serializer_class = MovieListSerializer

    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly,
    ]

    queryset = (
        MovieList.objects
        .select_related("user")
        .prefetch_related("items__movie")
    )

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.request.user.is_authenticated:
            return queryset.filter(
                Q(is_public=True)
                | Q(user=self.request.user)
            ).distinct()

        return queryset.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="items",
    )
    def add_item(self, request, pk=None):
        movie_list = self.get_object()

        if movie_list.user_id != request.user.id:
            raise PermissionDenied(
                "Somente o proprietário pode alterar esta lista."
            )

        movie_id = request.data.get("movie")

        if not movie_id:
            raise ValidationError({
                "movie": "Informe o ID do filme."
            })

        try:
            movie = Movie.objects.filter(pk=movie_id).first()
        except (ValueError, TypeError):
            movie = None

        if movie is None:
            raise ValidationError({
                "movie": "Filme não encontrado."
            })

        item, created = movie_list.items.get_or_create(
            movie=movie,
            defaults={
                "position": movie_list.items.count()
            },
        )

        return Response(
            {
                "id": item.id,
                "movie": movie.id,
                "created": created,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )

    @action(
        detail=True,
        methods=["delete"],
        permission_classes=[permissions.IsAuthenticated],
        url_path=r"items/(?P<item_id>[^/.]+)",
    )
    def remove_item(self, request, pk=None, item_id=None):
        movie_list = self.get_object()

        if movie_list.user_id != request.user.id:
            raise PermissionDenied(
                "Somente o proprietário pode alterar esta lista."
            )

        deleted, _ = movie_list.items.filter(
            pk=item_id
        ).delete()

        if not deleted:
            raise NotFound(
                "Filme não encontrado nesta lista."
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================
# SEGUIDORES
# =========================================================

class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    http_method_names = [
        "get",
        "post",
        "delete",
        "head",
        "options",
    ]

    queryset = Follow.objects.select_related(
        "follower",
        "following",
        "following__profile",
    )

    def get_queryset(self):
        queryset = super().get_queryset()

        # O filtro é opt-in para não modificar consultas antigas à API.
        if self.request.query_params.get("follower") == "me":
            queryset = queryset.filter(follower=self.request.user)

        username = self.request.query_params.get("username")

        if username:
            queryset = queryset.filter(
                Q(following__username=username)
                | Q(follower__username=username)
            )

        return queryset

    @action(detail=False, methods=["get"], url_path="search-users")
    def search_users(self, request):
        """Busca perfis e indica se o usuário autenticado já os segue."""
        User = get_user_model()
        term = request.query_params.get("search", "").strip()
        if term and len(term) < 2:
            return Response([])

        queryset = User.objects.filter(is_active=True).exclude(pk=request.user.pk)
        if term:
            queryset = queryset.filter(username__icontains=term).order_by("username")
            limit = 30
        else:
            queryset = queryset.order_by("-id")
            limit = 6

        users = list(queryset[:limit])
        follows = {
            follow.following_id: follow.id
            for follow in Follow.objects.filter(
                follower=request.user, following__in=users
            )
        }
        profiles = {
            profile.user_id: profile
            for profile in Profile.objects.filter(user__in=users)
        }
        return Response([
            {
                "id": user.pk,
                "username": user.username,
                "avatar": public_avatar_url(profiles.get(user.pk), request),
                "is_following": user.pk in follows,
                "follow_id": follows.get(user.pk),
            }
            for user in users
        ])

    def perform_create(self, serializer):
        target = serializer.validated_data["following"]

        if target == self.request.user:
            raise ValidationError({
                "following": "Você não pode seguir a si mesmo."
            })

        serializer.save(follower=self.request.user)

    def create(self, request, *args, **kwargs):
        target_id = request.data.get("following")

        if not target_id:
            raise ValidationError({
                "following": (
                    "Informe o ID do usuário que deseja seguir."
                )
            })

        User = get_user_model()

        try:
            target = User.objects.filter(
                pk=target_id,
                is_active=True,
            ).first()
        except (ValueError, TypeError):
            target = None

        if target is None:
            raise ValidationError({
                "following": "Usuário não encontrado."
            })

        if target == request.user:
            raise ValidationError({
                "following": "Você não pode seguir a si mesmo."
            })

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=target,
        )

        return Response(
            FollowSerializer(follow).data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )

    def destroy(self, request, *args, **kwargs):
        follow = self.get_object()

        if follow.follower_id != request.user.id:
            raise PermissionDenied(
                "Você só pode deixar de seguir por meio "
                "dos seus próprios relacionamentos."
            )

        return super().destroy(request, *args, **kwargs)


# =========================================================
# COMUNIDADES
# =========================================================

class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer

    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsCommunityCreatorOrReadOnly,
    ]

    queryset = (
        Community.objects
        .annotate(
            members_count=Count("members", distinct=True)
        )
        .prefetch_related("members")
    )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(
        detail=True,
        methods=["post", "delete"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="membership",
    )
    def membership(self, request, pk=None):
        community = self.get_object()

        if request.method == "POST":
            membership, created = (
                CommunityMembership.objects.get_or_create(
                    community=community,
                    user=request.user,
                )
            )

            return Response(
                {
                    "is_member": True,
                    "created": created,
                },
                status=(
                    status.HTTP_201_CREATED
                    if created
                    else status.HTTP_200_OK
                ),
            )

        CommunityMembership.objects.filter(
            community=community,
            user=request.user,
        ).delete()

        return Response(
            {"is_member": False},
            status=status.HTTP_200_OK,
        )


# =========================================================
# AMIZADES
# =========================================================

class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    http_method_names = [
        "get",
        "post",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        """
        Retorna somente as amizades das quais
        o usuário autenticado participa.
        """

        return (
            Friendship.objects
            .filter(
                Q(user=self.request.user)
                | Q(friend=self.request.user)
            )
            .select_related("user", "friend")
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="search-users",
    )
    def search_users(self, request):
        """
        Pesquisa usuários cadastrados.
        Sem termo, retorna até seis sugestões.
        """

        User = get_user_model()

        term = request.query_params.get(
            "search", ""
        ).strip()

        if term and len(term) < 2:
            return Response([])

        users_queryset = User.objects.filter(
            is_active=True
        ).exclude(
            pk=request.user.pk
        )

        if term:
            users_queryset = users_queryset.filter(
                username__icontains=term
            ).order_by("username")

            limit = 30
        else:
            users_queryset = users_queryset.order_by("-id")
            limit = 6

        users = list(users_queryset[:limit])

        if not users:
            return Response([])

        # Busca amizades existentes nas duas direções.
        friendships = Friendship.objects.filter(
            (
                Q(
                    user=request.user,
                    friend__in=users,
                )
                |
                Q(
                    friend=request.user,
                    user__in=users,
                )
            )
        )

        friendship_by_user = {}

        for friendship in friendships:
            if friendship.user_id == request.user.pk:
                other_user_id = friendship.friend_id
            else:
                other_user_id = friendship.user_id

            friendship_by_user[other_user_id] = friendship.id

        # Carrega os perfis em uma consulta.
        profiles = {
            profile.user_id: profile
            for profile in Profile.objects.filter(
                user_id__in=[
                    user.pk for user in users
                ]
            )
        }

        results = []

        for user in users:
            profile = profiles.get(user.pk)
            avatar_url = public_avatar_url(profile, request)

            friendship_id = friendship_by_user.get(user.pk)

            results.append({
                "id": user.pk,
                "username": user.username,
                "avatar": avatar_url,
                "is_friend": friendship_id is not None,
                "friendship_id": friendship_id,
            })

        return Response(results)

    def create(self, request, *args, **kwargs):
        """
        Cria uma amizade entre o usuário autenticado
        e o usuário informado pelo frontend.
        """

        target_id = (
            request.data.get("friend")
            or request.data.get("user_id")
        )

        if not target_id:
            raise ValidationError({
                "friend": "Informe o ID do usuário."
            })

        User = get_user_model()

        try:
            target = User.objects.filter(
                pk=target_id,
                is_active=True,
            ).first()
        except (ValueError, TypeError):
            target = None

        if target is None:
            raise ValidationError({
                "friend": "Usuário não encontrado."
            })

        if target.pk == request.user.pk:
            raise ValidationError({
                "friend": "Você não pode adicionar a si mesmo."
            })

        # Verifica se a amizade já existe em qualquer direção.
        existing = Friendship.objects.filter(
            (
                Q(
                    user=request.user,
                    friend=target,
                )
                |
                Q(
                    user=target,
                    friend=request.user,
                )
            )
        ).first()

        if existing:
            return Response(
                self.get_serializer(existing).data,
                status=status.HTTP_200_OK,
            )

        # Usa uma ordem consistente para os dois usuários.
        first_id, second_id = sorted(
            [request.user.pk, target.pk],
            key=str,
        )

        friendship, created = Friendship.objects.get_or_create(
            user_id=first_id,
            friend_id=second_id,
        )

        return Response(
            self.get_serializer(friendship).data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


# =========================================================
# REMOÇÃO DE FILMES DOS FAVORITOS
# =========================================================

class FavoriteMovieDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, movie_id):
        """
        Remove um filme dos favoritos do usuário autenticado.
        O movie_id recebido é o ID do filme no banco Django.
        """

        profile = Profile.objects.filter(
            user=request.user
        ).first()

        if profile is None:
            return Response(
                {"error": "Perfil não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            movie = profile.favorite_movies.get(
                pk=movie_id
            )

            profile.favorite_movies.remove(movie)

            return Response(
                {
                    "message": "Filme removido com sucesso."
                },
                status=status.HTTP_200_OK,
            )

        except Movie.DoesNotExist:
            return Response(
                {
                    "error": (
                        "Filme não encontrado nos favoritos."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )


# Interações persistidas por usuário. Endpoints separados preservam as rotas atuais.
from django.utils import timezone
from django.db import transaction
from .models import Post, PostLike, PostComment, MovieInteraction, ListItem
from .serializers import PostSerializer, PostCommentSerializer, MovieInteractionSerializer

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    queryset = Post.objects.select_related("user", "user__profile").annotate(
        likes_count=Count("likes", distinct=True), comments_count=Count("comments", distinct=True)
    )
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        obj, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            obj.delete()
        return Response({"liked": created})

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def post_comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            return Response(PostCommentSerializer(post.comments.select_related("user"), many=True).data)
        if not request.user.is_authenticated:
            raise PermissionDenied("Entre para comentar.")
        serializer = PostCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(post=post, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MovieInteractionViewSet(viewsets.GenericViewSet):
    serializer_class = MovieInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    def get_queryset(self):
        return MovieInteraction.objects.filter(user=self.request.user).select_related("movie")

    def list(self, request):
        return Response(self.get_serializer(self.get_queryset(), many=True).data)

    @transaction.atomic
    def create(self, request):
        movie_id = request.data.get("movie")
        action_name = request.data.get("action")
        if action_name not in ("watched", "loved", "listed"):
            raise ValidationError({"action": "Ação inválida."})
        movie = Movie.objects.filter(pk=movie_id).first() if str(movie_id).isdigit() else None
        if not movie:
            raise ValidationError({"movie": "Filme não encontrado."})
        interaction, _ = MovieInteraction.objects.select_for_update().get_or_create(user=request.user, movie=movie)
        is_active = not getattr(interaction, action_name)
        setattr(interaction, action_name, is_active)
        setattr(interaction, f"{action_name}_at", timezone.now() if is_active else None)
        interaction.save()
        if action_name == "listed":
            movie_list, _ = MovieList.objects.get_or_create(
                user=request.user, title="Minha lista", defaults={"description": "Minha seleção de filmes."}
            )
            if is_active:
                ListItem.objects.get_or_create(movie_list=movie_list, movie=movie)
            else:
                ListItem.objects.filter(movie_list=movie_list, movie=movie).delete()
        return Response(self.get_serializer(interaction).data)
