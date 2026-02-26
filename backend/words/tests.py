from django.test import TestCase
from .models import Category, PredefinedWord


class CategoryModelTest(TestCase):
    def test_category_creation(self):
        """Test category creation."""
        category = Category.objects.create(
            name='Animales',
            description='Todo tipo de animales',
            icon='🐾'
        )
        self.assertEqual(category.name, 'Animales')
        self.assertEqual(category.icon, '🐾')


class PredefinedWordModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Animales', icon='🐾')
    
    def test_word_creation(self):
        """Test predefined word creation."""
        word = PredefinedWord.objects.create(
            category=self.category,
            text='Elefante',
            difficulty=2
        )
        self.assertEqual(word.text, 'Elefante')
        self.assertEqual(word.difficulty, 2)
    
    def test_word_uniqueness_in_category(self):
        """Test that words are unique within a category."""
        PredefinedWord.objects.create(category=self.category, text='Elefante')
        with self.assertRaises(Exception):
            PredefinedWord.objects.create(category=self.category, text='Elefante')
