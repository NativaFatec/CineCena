from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import RegisterView, MeView, PublicProfileView
from movies.views import MovieViewSet, ReviewViewSet
from social.views import CommentViewSet, MovieListViewSet, FollowViewSet, CommunityViewSet

router = DefaultRouter()
router.register("movies", MovieViewSet, basename="movie")
router.register("reviews", ReviewViewSet, basename="review")
router.register("comments", CommentViewSet, basename="comment")
router.register("lists", MovieListViewSet, basename="movie-list")
router.register("follows", FollowViewSet, basename="follow")
router.register("communities", CommunityViewSet, basename="community")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/users/<str:username>/", PublicProfileView.as_view(), name="public-profile"),
    path("api/", include(router.urls)),
]
