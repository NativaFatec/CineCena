from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_profile")]
    operations = [
        migrations.AddField(model_name="profile", name="avatar_blob", field=models.BinaryField(blank=True, editable=False, null=True)),
        migrations.AddField(model_name="profile", name="avatar_content_type", field=models.CharField(blank=True, default="", max_length=40)),
    ]
