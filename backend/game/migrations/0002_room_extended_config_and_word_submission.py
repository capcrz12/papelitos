from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="player",
            name="words_submitted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="room",
            name="active_rounds",
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name="room",
            name="allow_player_words",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="room",
            name="game_phase",
            field=models.CharField(default="lobby", max_length=32),
        ),
        migrations.AddField(
            model_name="room",
            name="max_players",
            field=models.IntegerField(default=8),
        ),
    ]
