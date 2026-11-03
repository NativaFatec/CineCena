from rest_framework import serializers

from .models import SatisfactionResponse


class SatisfactionResponseSerializer(serializers.ModelSerializer):
    navigation = serializers.IntegerField(min_value=1, max_value=5)
    movies = serializers.IntegerField(min_value=1, max_value=5)
    reviews = serializers.IntegerField(min_value=1, max_value=5)
    profiles = serializers.IntegerField(min_value=1, max_value=5)
    overall = serializers.IntegerField(min_value=1, max_value=5)
    suggestions = serializers.CharField(
        max_length=600, allow_blank=True, required=False, default="", trim_whitespace=True
    )

    class Meta:
        model = SatisfactionResponse
        fields = (
            "navigation", "movies", "reviews", "profiles", "overall", "suggestions"
        )
