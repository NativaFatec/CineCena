from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SatisfactionResponse
from .serializers import SatisfactionResponseSerializer


class SatisfactionView(APIView):
    """Consulta e registra a pesquisa privada do usuário no mês corrente."""

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def current_month():
        return timezone.localdate().strftime("%Y-%m")

    def get(self, request):
        response = SatisfactionResponse.objects.filter(
            user=request.user, month=self.current_month()
        ).first()
        if response is None:
            return Response({"answered": False})
        return Response({
            "answered": True,
            "data": SatisfactionResponseSerializer(response).data,
        })

    def post(self, request):
        serializer = SatisfactionResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response, created = SatisfactionResponse.objects.update_or_create(
            user=request.user,
            month=self.current_month(),
            defaults=serializer.validated_data,
        )
        return Response(
            {
                "message": "Pesquisa enviada com sucesso!" if created
                else "Sua pesquisa foi atualizada com sucesso!",
                "answered": True,
                "data": SatisfactionResponseSerializer(response).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
