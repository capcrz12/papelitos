from django.contrib import admin
from .models import Category, PredefinedWord


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'word_count']
    search_fields = ['name']
    
    def word_count(self, obj):
        return obj.words.count()
    word_count.short_description = 'Words'


@admin.register(PredefinedWord)
class PredefinedWordAdmin(admin.ModelAdmin):
    list_display = ['text', 'category', 'difficulty']
    list_filter = ['category', 'difficulty']
    search_fields = ['text']
