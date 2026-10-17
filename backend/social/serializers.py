from django.contrib.auth import get_user_model
from rest_framework import serializers
from accounts.models import Profile, public_avatar_url
from movies.models import Review
from .models import (
    Comment,
    MovieList,
    ListItem,
    Follow,
    Friendship,
    Community,
    CommunityMembership,
)

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = Comment
        fields = ("id", "review", "user", "username", "body", "created_at", "updated_at")
        read_only_fields = ("id", "user", "created_at", "updated_at")

class ListItemSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)
    class Meta:
        model = ListItem
        fields = ("id", "movie", "movie_title", "position", "added_at")
        read_only_fields = ("id", "added_at")

class MovieListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    items = ListItemSerializer(many=True, read_only=True)
    class Meta:
        model = MovieList
        fields = ("id", "user", "username", "title", "description", "is_public", "items", "created_at", "updated_at")
        read_only_fields = ("id", "user", "created_at", "updated_at")

class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.CharField(source="follower.username", read_only=True)
    following_username = serializers.CharField(source="following.username", read_only=True)
    class Meta:
        model = Follow
        fields = ("id", "follower", "follower_username", "following", "following_username", "created_at")
        read_only_fields = ("id", "follower", "created_at", "follower_username", "following_username")

class CommunityMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = CommunityMembership
        fields = ("id", "user", "username", "joined_at", "is_moderator")
        read_only_fields = ("id", "user", "joined_at", "is_moderator")

class CommunitySerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(read_only=True)
    is_member = serializers.SerializerMethodField()
    class Meta:
        model = Community
        fields = ("id", "name", "slug", "description", "image_url", "created_by", "members_count", "is_member", "created_at")
        read_only_fields = ("id", "created_by", "created_at")

    def get_is_member(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.members.filter(pk=request.user.pk).exists())


class FriendshipSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    friend_username = serializers.CharField(
        source="friend.username",
        read_only=True,
    )

    class Meta:
        model = Friendship

        fields = (
            "id",
            "user",
            "user_username",
            "friend",
            "friend_username",
            "created_at",
        )

        read_only_fields = (
            "id",
            "user",
            "user_username",
            "friend",
            "friend_username",
            "created_at",
        )

from .models import Post, PostLike, PostComment, MovieInteraction

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    avatar = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    liked = serializers.SerializerMethodField()
    class Meta:
        model = Post
        fields = ("id", "user", "username", "avatar", "body", "created_at", "likes_count", "comments_count", "liked")
        read_only_fields = ("id", "user", "created_at")
    def get_avatar(self, obj):
        profile = getattr(obj.user, "profile", None)
        request = self.context.get("request")
        return public_avatar_url(profile, request)
    def get_liked(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.likes.filter(user=request.user).exists())

class PostCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = PostComment
        fields = ("id", "post", "user", "username", "body", "created_at")
        read_only_fields = ("id", "post", "user", "created_at")

class MovieInteractionSerializer(serializers.ModelSerializer):
    tmdb_id = serializers.IntegerField(source="movie.tmdb_id", read_only=True)
    movie_title = serializers.CharField(source="movie.title", read_only=True)
    class Meta:
        model = MovieInteraction
        fields = ("id", "movie", "tmdb_id", "movie_title", "watched", "loved", "listed", "watched_at", "loved_at", "listed_at")
        read_only_fields = fields
