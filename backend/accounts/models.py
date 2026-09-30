from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bio = models.CharField("biografia", max_length=280, blank=True)
    avatar_url = models.URLField("URL do avatar", blank=True)
    favorite_genres = models.JSONField("gêneros favoritos", default=list, blank=True)

    def __str__(self):
        return self.username
