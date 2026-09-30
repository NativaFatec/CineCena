from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CineCenaUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Perfil CineCena", {"fields": ("bio", "avatar_url", "favorite_genres")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("Perfil CineCena", {"fields": ("bio", "avatar_url", "favorite_genres")}),)
