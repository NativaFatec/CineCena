from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    bio = models.CharField("biografia", max_length=280, blank=True)
    avatar_url = models.URLField("URL do avatar", blank=True)
    favorite_genres = models.JSONField("gêneros favoritos", default=list, blank=True)

    def __str__(self):
        return self.username

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_blob = models.BinaryField(null=True, blank=True, editable=False)
    avatar_content_type = models.CharField(max_length=40, blank=True, default='')
    bio = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Perfil de {self.user.username}"

# Cria automaticamente o Profile quando um novo User for cadastrado
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

def public_avatar_url(profile, request):
    """Avatar no Postgres para persistir uploads em hospedagens sem disco permanente."""
    if not profile or not request:
        return None
    if profile.avatar_blob:
        from django.urls import reverse
        return request.build_absolute_uri(reverse('avatar-image', kwargs={'username': profile.user.username}))
    if profile.avatar:
        try:
            return request.build_absolute_uri(profile.avatar.url)
        except (ValueError, AttributeError):
            return None
    return None
