from rest_framework import serializers

from .models import Movie, Review, FavoriteMovie


class MovieSerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Movie
        fields = (
            "id",
            "title",
            "original_title",
            "synopsis",
            "release_date",
            "poster_url",
            "backdrop_url",
            "director",
            "cast",
            "genres",
            "country",
            "tmdb_id",
            "average_rating",
            "reviews_count",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
        )


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )
    movie_title = serializers.CharField(
        source="movie.title",
        read_only=True
    )
    likes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "username",
            "movie",
            "movie_title",
            "rating",
            "title",
            "body",
            "is_spoiler",
            "likes_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "created_at",
            "updated_at",
        )


class FavoriteMovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteMovie
        fields = (
            "id",
            "tmdb_id",
            "title",
            "poster_path",
            "position",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def validate_position(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError(
                "A posição deve estar entre 1 e 5."
            )
        return value