from django.contrib import admin
from .models import Movie, Review

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ("title", "release_date", "country", "tmdb_id")
    search_fields = ("title", "original_title", "director")
    list_filter = ("country",)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("movie", "user", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("movie__title", "user__username", "body")
