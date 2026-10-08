from django.db.models import Avg, Count
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Movie, Review, FavoriteMovie
from .serializers import (
    MovieSerializer,
    ReviewSerializer,
    FavoriteMovieSerializer,
)
from .permissions import IsOwnerOrReadOnly
from social.models import ReviewLike


class MovieViewSet(viewsets.ModelViewSet):
    serializer_class = MovieSerializer

    queryset = Movie.objects.annotate(
        average_rating=Avg("reviews__rating"),
        reviews_count=Count("reviews", distinct=True),
    ).prefetch_related("reviews")

    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly
    ]

    def get_queryset(self):
        qs = super().get_queryset()

        search = self.request.query_params.get("search")
        genre = self.request.query_params.get("genre")

        if search:
            qs = qs.filter(
                title__icontains=search
            )

        if genre:
            qs = qs.filter(
                genres__contains=[genre]
            )

        return qs


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly,
    ]

    queryset = (
        Review.objects
        .select_related("user", "movie")
        .annotate(
            likes_count=Count(
                "likes",
                distinct=True
            )
        )
    )

    def perform_create(self, serializer):
        if Review.objects.filter(
            user=self.request.user,
            movie=serializer.validated_data["movie"]
        ).exists():
            raise ValidationError({
                "movie": (
                    "Você já publicou uma avaliação para "
                    "este filme. Edite a avaliação existente."
                )
            })

        serializer.save(
            user=self.request.user
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[
            permissions.IsAuthenticated
        ]
    )
    def like(self, request, pk=None):
        review = self.get_object()

        like, created = ReviewLike.objects.get_or_create(
            review=review,
            user=request.user
        )

        if not created:
            like.delete()

            return Response({
                "liked": False
            })

        return Response({
            "liked": True
        }, status=201)


class FavoriteMovieViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteMovieSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        """
        IMPORTANTÍSSIMO:
        cada usuário só enxerga seus próprios favoritos.
        """
        return FavoriteMovie.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        """
        O usuário NUNCA vem do frontend.
        O Django pega o usuário autenticado.
        """

        user = self.request.user

        # Limite de 5 favoritos
        if FavoriteMovie.objects.filter(
            user=user
        ).count() >= 5:
            raise ValidationError({
                "detail": (
                    "Você já possui cinco filmes favoritos."
                )
            })

        tmdb_id = serializer.validated_data[
            "tmdb_id"
        ]

        # Não permite o mesmo filme duas vezes
        if FavoriteMovie.objects.filter(
            user=user,
            tmdb_id=tmdb_id
        ).exists():
            raise ValidationError({
                "tmdb_id": (
                    "Este filme já está nos seus favoritos."
                )
            })

        position = serializer.validated_data[
            "position"
        ]

        # Não permite ocupar uma posição já usada
        if FavoriteMovie.objects.filter(
            user=user,
            position=position
        ).exists():
            raise ValidationError({
                "position": (
                    "Esta vaga já está ocupada."
                )
            })

        serializer.save(
            user=user
        )

    def perform_update(self, serializer):
        """
        O queryset já limita o registro ao usuário atual.
        Ainda assim mantemos a validação de posição.
        """

        favorite = self.get_object()

        new_position = serializer.validated_data.get(
            "position",
            favorite.position
        )

        if FavoriteMovie.objects.filter(
            user=self.request.user,
            position=new_position
        ).exclude(
            pk=favorite.pk
        ).exists():
            raise ValidationError({
                "position": (
                    "Esta vaga já está ocupada."
                )
            })

        serializer.save(
            user=self.request.user
        )