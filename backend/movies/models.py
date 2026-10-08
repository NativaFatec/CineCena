from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Movie(models.Model):
    title = models.CharField(
        "título",
        max_length=220,
        db_index=True
    )

    original_title = models.CharField(
        "título original",
        max_length=220,
        blank=True
    )

    synopsis = models.TextField(
        "sinopse",
        blank=True
    )

    release_date = models.DateField(
        "data de lançamento",
        null=True,
        blank=True
    )

    poster_url = models.URLField(
        "URL do pôster",
        blank=True
    )

    backdrop_url = models.URLField(
        "URL da imagem de fundo",
        blank=True
    )

    director = models.CharField(
        "direção",
        max_length=220,
        blank=True
    )

    cast = models.JSONField(
        "elenco",
        default=list,
        blank=True
    )

    genres = models.JSONField(
        "gêneros",
        default=list,
        blank=True
    )

    country = models.CharField(
        "país de produção",
        max_length=100,
        default="Brasil"
    )

    tmdb_id = models.PositiveBigIntegerField(
        "ID TMDB",
        null=True,
        blank=True,
        unique=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    title = models.CharField(
        max_length=160,
        blank=True
    )

    body = models.TextField(
        "resenha",
        blank=True
    )

    is_spoiler = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "movie"],
                name="unique_review_per_user_movie"
            )
        ]

    def __str__(self):
        return f"{self.user} — {self.movie} ({self.rating}/5)"

class FavoriteMovie(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorite_movies"
    )

    tmdb_id = models.PositiveBigIntegerField(
        "ID TMDB"
    )

    title = models.CharField(
        max_length=255
    )

    poster_path = models.CharField(
        max_length=500,
        null=True,
        blank=True
    )

    position = models.PositiveSmallIntegerField(
        "posição",
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    class Meta:
        ordering = ["position"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "position"],
                name="unique_favorite_position_per_user"
            ),
            models.UniqueConstraint(
                fields=["user", "tmdb_id"],
                name="unique_favorite_movie_per_user"
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"Vaga {self.position}: "
            f"{self.title}"
        )