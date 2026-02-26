from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import random
from .models import Category, PredefinedWord
from .serializers import CategorySerializer, PredefinedWordSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['get'])
    def words(self, request, pk=None):
        """Get words for a category."""
        category = self.get_object()
        words = category.words.all()
        serializer = PredefinedWordSerializer(words, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def random_words(self, request, pk=None):
        """Get random words from a category."""
        category = self.get_object()
        count = int(request.query_params.get('count', 10))
        
        words = list(category.words.all())
        random_words = random.sample(words, min(count, len(words)))
        serializer = PredefinedWordSerializer(random_words, many=True)
        return Response(serializer.data)
