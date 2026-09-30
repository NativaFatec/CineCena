from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserPublicSerializer(serializers.ModelSerializer):
    review_count = serializers.IntegerField(read_only=True, required=False)
    followers_count = serializers.IntegerField(read_only=True, required=False)
    following_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "bio", "avatar_url",
                  "favorite_genres", "date_joined", "review_count", "followers_count",
                  "following_count")
        read_only_fields = ("id", "username", "date_joined")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")
        read_only_fields = ("id",)

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "bio",
                  "avatar_url", "favorite_genres", "date_joined")
        read_only_fields = ("id", "username", "email", "date_joined")
