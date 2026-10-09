from django.db.models import Count, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Comment, MovieList, Follow, Friendship, Community, CommunityMembership
from .serializers import CommentSerializer, MovieListSerializer, FollowSerializer, CommunitySerializer, FriendshipSerializer
from .permissions import IsOwnerOrReadOnly
from django.contrib.auth import get_user_model
from accounts.models import Profile


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    queryset = Comment.objects.select_related("user", "review")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MovieListViewSet(viewsets.ModelViewSet):
    serializer_class = MovieListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    queryset = MovieList.objects.select_related("user").prefetch_related("items__movie")

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated:
            return qs.filter(is_public=True) | qs.filter(user=self.request.user)
        return qs.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated], url_path="items")
    def add_item(self, request, pk=None):
        movie_list = self.get_object()
        if movie_list.user_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Somente o proprietário pode alterar esta lista.")
        movie_id = request.data.get("movie")
        if not movie_id:
            raise ValidationError({"movie": "Informe o ID do filme."})
        from movies.models import Movie
        movie = Movie.objects.filter(pk=movie_id).first()
        if not movie:
            raise ValidationError({"movie": "Filme não encontrado."})
        item, created = movie_list.items.get_or_create(movie=movie, defaults={"position": movie_list.items.count()})
        return Response({"id": item.id, "movie": movie.id, "created": created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["delete"], permission_classes=[permissions.IsAuthenticated], url_path=r"items/(?P<item_id>[^/.]+)")
    def remove_item(self, request, pk=None, item_id=None):
        movie_list = self.get_object()
        if movie_list.user_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Somente o proprietário pode alterar esta lista.")
        deleted, _ = movie_list.items.filter(pk=item_id).delete()
        if not deleted:
            from rest_framework.exceptions import NotFound
            raise NotFound("Filme não encontrado nesta lista.")
        return Response(status=status.HTTP_204_NO_CONTENT)

class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Follow.objects.select_related("follower", "following")

    def get_queryset(self):
        qs = super().get_queryset()
        username = self.request.query_params.get("username")
        if username:
            qs = qs.filter(following__username=username) | qs.filter(follower__username=username)
        return qs

    def perform_create(self, serializer):
        target = serializer.validated_data["following"]
        if target == self.request.user:
            raise ValidationError({"following": "Você não pode seguir a si mesmo."})
        serializer.save(follower=self.request.user)

    def create(self, request, *args, **kwargs):
        target_id = request.data.get("following")
        if not target_id:
            raise ValidationError({"following": "Informe o ID do usuário que deseja seguir."})
        from django.contrib.auth import get_user_model
        target = get_user_model().objects.filter(pk=target_id).first()
        if not target:
            raise ValidationError({"following": "Usuário não encontrado."})
        if target == request.user:
            raise ValidationError({"following": "Você não pode seguir a si mesmo."})
        follow, created = Follow.objects.get_or_create(follower=request.user, following=target)
        return Response(FollowSerializer(follow).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        follow = self.get_object()
        if follow.follower_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Você só pode remover seus próprios relacionamentos.")
        return super().destroy(request, *args, **kwargs)

class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Community.objects.annotate(members_count=Count("members", distinct=True)).prefetch_related("members")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated])
    def membership(self, request, pk=None):
        community = self.get_object()
        if request.method == "POST":
            membership, created = CommunityMembership.objects.get_or_create(community=community, user=request.user)
            return Response({"is_member": True, "created": created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        CommunityMembership.objects.filter(community=community, user=request.user).delete()
        return Response({"is_member": False}, status=status.HTTP_200_OK)


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
        Retorna apenas amizades das quais
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
        Sem termo de pesquisa, sugere até seis contas.
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

        # Busca relações existentes entre o usuário logado
        # e as contas encontradas.
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

        # Recupera os perfis e seus avatares em uma consulta.
        profiles = {
            profile.user_id: profile
            for profile in Profile.objects.filter(
                user_id__in=[user.pk for user in users]
            )
        }

        results = []

        for user in users:
            profile = profiles.get(user.pk)
            avatar_url = None

            if profile and profile.avatar:
                try:
                    avatar_url = request.build_absolute_uri(
                        profile.avatar.url
                    )
                except (ValueError, AttributeError):
                    avatar_url = None

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

        if not target:
            raise ValidationError({
                "friend": "Usuário não encontrado."
            })

        if target.pk == request.user.pk:
            raise ValidationError({
                "friend": "Você não pode adicionar a si mesmo."
            })

        # Verifica a relação nos dois sentidos para não
        # duplicar amizades que já existem.
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
            serializer = self.get_serializer(existing)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        # Guarda os IDs numa ordem consistente.
        first_id, second_id = sorted(
            [request.user.pk, target.pk],
            key=str,
        )

        friendship, created = (
            Friendship.objects.get_or_create(
                user_id=first_id,
                friend_id=second_id,
            )
        )

        serializer = self.get_serializer(friendship)

        return Response(
            serializer.data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )