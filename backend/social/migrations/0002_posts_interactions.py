from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ("social", "0001_initial"),
        ("movies", "0003_review_reaction"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(name="Post", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("body", models.TextField(max_length=600)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="posts", to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ["-created_at"]}),
        migrations.CreateModel(name="PostLike", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="likes", to="social.post")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="post_likes", to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.CreateModel(name="PostComment", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("body", models.TextField(max_length=2000)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="social.post")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="post_comments", to=settings.AUTH_USER_MODEL)),
        ], options={"ordering": ["created_at"]}),
        migrations.CreateModel(name="MovieInteraction", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("watched", models.BooleanField(default=False)),
            ("loved", models.BooleanField(default=False)),
            ("listed", models.BooleanField(default=False)),
            ("watched_at", models.DateTimeField(blank=True, null=True)),
            ("loved_at", models.DateTimeField(blank=True, null=True)),
            ("listed_at", models.DateTimeField(blank=True, null=True)),
            ("movie", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="interactions", to="movies.movie")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="movie_interactions", to=settings.AUTH_USER_MODEL)),
        ]),
        migrations.AddConstraint(model_name="postlike", constraint=models.UniqueConstraint(fields=("post", "user"), name="unique_post_like")),
        migrations.AddConstraint(model_name="movieinteraction", constraint=models.UniqueConstraint(fields=("user", "movie"), name="unique_movie_interaction")),
    ]
