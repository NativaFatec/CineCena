from django.db.models import Avg, Count
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Movie, Review
from .serializers import MovieSerializer, ReviewSerializer
from .permissions import IsOwnerOrReadOnly, IsAdminOrReadOnly
from social.models import ReviewLike

class MovieViewSet(viewsets.ModelViewSet):
    serializer_class = MovieSerializer
    queryset = Movie.objects.annotate(
        average_rating=Avg("reviews__rating"),
        reviews_count=Count("reviews", distinct=True),
    ).prefetch_related("reviews")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        genre = self.request.query_params.get("genre")
        if search:
            qs = qs.filter(title__icontains=search)
        if genre:
            # PostgreSQL JSONB lookup; genres is stored as a JSON array.
            qs = qs.filter(genres__contains=[genre])
        return qs

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    queryset = Review.objects.select_related("user", "movie").annotate(likes_count=Count("likes", distinct=True))

    def perform_create(self, serializer):
        if Review.objects.filter(user=self.request.user, movie=serializer.validated_data["movie"]).exists():
            raise ValidationError({"movie": "Você já publicou uma avaliação para este filme. Edite a avaliação existente."})
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        review = self.get_object()
        like, created = ReviewLike.objects.get_or_create(review=review, user=request.user)
        if not created:
            like.delete()
            return Response({"liked": False})
        return Response({"liked": True}, status=201)
