from django.db import models


class Category(models.Model):
    """Word categories for the game."""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='📝')
    
    class Meta:
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name


class PredefinedWord(models.Model):
    """Predefined words for categories."""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='words')
    text = models.CharField(max_length=100)
    difficulty = models.IntegerField(choices=[(1, 'Easy'), (2, 'Medium'), (3, 'Hard')], default=2)
    
    class Meta:
        unique_together = ['category', 'text']
    
    def __str__(self):
        return f"{self.text} ({self.category.name})"
