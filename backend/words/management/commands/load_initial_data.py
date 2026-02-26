from django.core.management.base import BaseCommand
from words.models import Category, PredefinedWord


class Command(BaseCommand):
    help = 'Load initial categories and words'

    def handle(self, *args, **kwargs):
        # Create categories
        categories_data = [
            {'name': 'Animales', 'icon': '🐾', 'description': 'Todo tipo de animales'},
            {'name': 'Películas', 'icon': '🎬', 'description': 'Películas famosas'},
            {'name': 'Comida', 'icon': '🍕', 'description': 'Alimentos y bebidas'},
            {'name': 'Profesiones', 'icon': '👔', 'description': 'Oficios y profesiones'},
            {'name': 'Países', 'icon': '🌍', 'description': 'Países del mundo'},
            {'name': 'Deportes', 'icon': '⚽', 'description': 'Deportes y actividades'},
            {'name': 'Música', 'icon': '🎵', 'description': 'Artistas y canciones'},
            {'name': 'Objetos', 'icon': '🔧', 'description': 'Objetos cotidianos'},
        ]
        
        # Words for each category
        words_data = {
            'Animales': [
                'Elefante', 'Jirafa', 'Pingüino', 'Koala', 'Canguro', 'Delfín',
                'Tiburón', 'Águila', 'Serpiente', 'Tortuga', 'Mariposa', 'Hormiga',
                'León', 'Tigre', 'Oso', 'Lobo', 'Zorro', 'Conejo', 'Ardilla',
                'Búho', 'Pato', 'Gallina', 'Vaca', 'Caballo', 'Cerdo'
            ],
            'Películas': [
                'Titanic', 'Avatar', 'Matrix', 'Inception', 'Gladiador',
                'El Padrino', 'Pulp Fiction', 'Forrest Gump', 'Star Wars',
                'Harry Potter', 'El Señor de los Anillos', 'Toy Story',
                'Buscando a Nemo', 'Shrek', 'Frozen', 'Coco', 'Up'
            ],
            'Comida': [
                'Pizza', 'Hamburguesa', 'Sushi', 'Tacos', 'Paella', 'Pasta',
                'Ensalada', 'Sandwich', 'Helado', 'Chocolate', 'Café', 'Té',
                'Arroz', 'Pan', 'Queso', 'Jamón', 'Huevos', 'Pollo', 'Pescado'
            ],
            'Profesiones': [
                'Médico', 'Profesor', 'Ingeniero', 'Abogado', 'Chef', 'Policía',
                'Bombero', 'Piloto', 'Arquitecto', 'Dentista', 'Enfermero',
                'Programador', 'Diseñador', 'Fotógrafo', 'Músico', 'Actor'
            ],
            'Países': [
                'España', 'Francia', 'Italia', 'Alemania', 'Inglaterra', 'Portugal',
                'México', 'Argentina', 'Brasil', 'Chile', 'Colombia', 'Perú',
                'Estados Unidos', 'Canadá', 'Japón', 'China', 'India', 'Australia'
            ],
            'Deportes': [
                'Fútbol', 'Baloncesto', 'Tenis', 'Natación', 'Atletismo', 'Ciclismo',
                'Golf', 'Béisbol', 'Voleibol', 'Rugby', 'Hockey', 'Boxeo',
                'Karate', 'Yoga', 'Escalada', 'Surf', 'Esquí'
            ],
            'Música': [
                'Beatles', 'Michael Jackson', 'Madonna', 'Queen', 'Shakira',
                'Coldplay', 'U2', 'AC/DC', 'Nirvana', 'Pink Floyd', 'ABBA',
                'Bob Marley', 'Elvis Presley', 'Frank Sinatra'
            ],
            'Objetos': [
                'Mesa', 'Silla', 'Teléfono', 'Computadora', 'Television', 'Reloj',
                'Lámpara', 'Libro', 'Lápiz', 'Gafas', 'Zapatos', 'Bolígrafo',
                'Botella', 'Taza', 'Plato', 'Cuchillo', 'Tenedor', 'Cuchara'
            ]
        }
        
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'icon': cat_data['icon'],
                    'description': cat_data['description']
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))
            
            # Add words to category
            if cat_data['name'] in words_data:
                for word_text in words_data[cat_data['name']]:
                    word, word_created = PredefinedWord.objects.get_or_create(
                        category=category,
                        text=word_text,
                        defaults={'difficulty': 2}
                    )
                    if word_created:
                        self.stdout.write(f'  Added word: {word_text}')
        
        self.stdout.write(self.style.SUCCESS('\nSuccessfully loaded initial data!'))
