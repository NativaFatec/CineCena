from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SatisfactionResponse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("month", models.CharField(max_length=7, verbose_name="mês de referência")),
                ("navigation", models.PositiveSmallIntegerField(verbose_name="navegação")),
                ("movies", models.PositiveSmallIntegerField(verbose_name="busca e filmes")),
                ("reviews", models.PositiveSmallIntegerField(verbose_name="reviews")),
                ("profiles", models.PositiveSmallIntegerField(verbose_name="perfis e seguindo")),
                ("overall", models.PositiveSmallIntegerField(verbose_name="satisfação geral")),
                ("suggestions", models.TextField(blank=True, max_length=600, verbose_name="sugestões")),
                ("submitted_at", models.DateTimeField(auto_now=True, verbose_name="último envio")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="satisfaction_responses", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "Resposta de satisfação",
                "verbose_name_plural": "Respostas de satisfação",
                "ordering": ["-submitted_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="satisfactionresponse",
            constraint=models.UniqueConstraint(fields=("user", "month"), name="unique_satisfaction_user_month"),
        ),
    ]
