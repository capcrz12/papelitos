from rest_framework import serializers
from .models import Category, PredefinedWord


class PredefinedWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredefinedWord
        fields = ['id', 'text', 'difficulty']


class CategorySerializer(serializers.ModelSerializer):
    word_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'word_count']
    
    def get_word_count(self, obj):
        return obj.words.count()
