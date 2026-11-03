from django.conf import settings
from django.db import models


class SatisfactionResponse(models.Model):
    """Uma pesquisa por usuário por mês; pode ser atualizada durante o mês."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="satisfaction_responses",
    )
    month = models.CharField("mês de referência", max_length=7)
    navigation = models.PositiveSmallIntegerField("navegação")
    movies = models.PositiveSmallIntegerField("busca e filmes")
    reviews = models.PositiveSmallIntegerField("reviews")
    profiles = models.PositiveSmallIntegerField("perfis e seguindo")
    overall = models.PositiveSmallIntegerField("satisfação geral")
    suggestions = models.TextField("sugestões", max_length=600, blank=True)
    submitted_at = models.DateTimeField("último envio", auto_now=True)

    class Meta:
        verbose_name = "Resposta de satisfação"
        verbose_name_plural = "Respostas de satisfação"
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "month"], name="unique_satisfaction_user_month"
            )
        ]

    def __str__(self):
        return f"{self.user} — {self.month} — {self.overall}/5"
