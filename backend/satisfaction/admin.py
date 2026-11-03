from django.contrib import admin

from .models import SatisfactionResponse


@admin.register(SatisfactionResponse)
class SatisfactionResponseAdmin(admin.ModelAdmin):
    list_display = (
        "user", "month", "navigation", "movies", "reviews",
        "profiles", "overall", "submitted_at",
    )
    list_filter = ("month", "overall", "submitted_at")
    search_fields = ("user__username", "suggestions")
    readonly_fields = (
        "user", "month", "navigation", "movies", "reviews",
        "profiles", "overall", "suggestions", "submitted_at",
    )
    ordering = ("-submitted_at",)
