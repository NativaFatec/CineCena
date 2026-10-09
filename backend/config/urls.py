
from django.conf.urls.static import static
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from accounts.views import (
    RegisterView,
    MeView,
    PublicProfileView,
)

from movies.views import (
    MovieViewSet,
    ReviewViewSet,
    FavoriteMovieViewSet,
)

from social.views import (
    CommentViewSet,
    MovieListViewSet,
    FollowViewSet,
    CommunityViewSet,
)


router = DefaultRouter()

router.register("movies", MovieViewSet, basename="movie")
router.register("reviews", ReviewViewSet, basename="review")
router.register("comments", CommentViewSet, basename="comment")
router.register("lists", MovieListViewSet, basename="movie-list")
router.register("follows", FollowViewSet, basename="follow")
router.register("communities", CommunityViewSet, basename="community")


urlpatterns = [
    path("admin/", admin.site.urls),

    # Contas e autenticação
    path("api/accounts/", include("accounts.urls")),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/auth/me/", MeView.as_view(), name="me"),

    # Perfis públicos
    path(
        "api/users/<str:username>/",
        PublicProfileView.as_view(),
        name="public-profile",
    ),

    # ======================================================
    # FAVORITOS: precisam vir ANTES do router genérico
    # ======================================================

    path(
        "api/movies/favorites/",
        FavoriteMovieViewSet.as_view({
            "get": "list",
            "post": "create",
        }),
        name="favorite-movie-list",
    ),

    path(
        "api/movies/favorites/<int:pk>/",
        FavoriteMovieViewSet.as_view({
            "get": "retrieve",
            "patch": "partial_update",
            "delete": "destroy",
        }),
        name="favorite-movie-detail",
    ),

    # Router genérico: fica depois das rotas específicas
    path("api/", include(router.urls)),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )