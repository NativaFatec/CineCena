from django.db import migrations, models


def populate_reactions(apps, schema_editor):
    Review = apps.get_model("movies", "Review")
    Review.objects.filter(rating__lte=2).update(reaction="nao_gostei")
    Review.objects.filter(rating__in=[3]).update(reaction="gostei")
    Review.objects.filter(rating__gte=4).update(reaction="amei")


def reverse_reactions(apps, schema_editor):
    Review = apps.get_model("movies", "Review")
    Review.objects.all().update(reaction="gostei")


class Migration(migrations.Migration):
    dependencies = [("movies", "0002_alter_favoritemovie_unique_together_and_more")]

    operations = [
        migrations.AddField(
            model_name="review",
            name="reaction",
            field=models.CharField(
                choices=[("nao_gostei", "Não gostei"), ("gostei", "Gostei"), ("amei", "Amei")],
                default="gostei",
                max_length=12,
                verbose_name="reação",
            ),
        ),
        migrations.RunPython(populate_reactions, reverse_reactions),
    ]
