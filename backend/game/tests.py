from django.test import TestCase
from django.contrib.auth.models import User
from .models import Room, Player, GameState, Word


class RoomModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
    
    def test_room_creation(self):
        """Test that a room is created with a unique code."""
        room = Room.objects.create(host=self.user)
        self.assertEqual(len(room.code), 4)
        self.assertTrue(room.is_active)
        self.assertFalse(room.game_started)
    
    def test_room_code_uniqueness(self):
        """Test that room codes are unique."""
        room1 = Room.objects.create(host=self.user)
        room2 = Room.objects.create(host=self.user)
        self.assertNotEqual(room1.code, room2.code)


class PlayerModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.room = Room.objects.create(host=self.user)
    
    def test_player_creation(self):
        """Test player creation in a room."""
        player = Player.objects.create(
            user=self.user,
            room=self.room,
            name='Test Player',
            team=1
        )
        self.assertEqual(player.name, 'Test Player')
        self.assertEqual(player.team, 1)
        self.assertTrue(player.is_connected)
    
    def test_player_uniqueness_in_room(self):
        """Test that a user can only join a room once."""
        Player.objects.create(user=self.user, room=self.room, name='Player 1')
        with self.assertRaises(Exception):
            Player.objects.create(user=self.user, room=self.room, name='Player 2')


class GameStateModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.room = Room.objects.create(host=self.user)
        self.player = Player.objects.create(user=self.user, room=self.room, name='Player', team=1)
    
    def test_game_state_creation(self):
        """Test game state initialization."""
        game_state = GameState.objects.create(
            room=self.room,
            current_player=self.player,
            current_round=1
        )
        self.assertEqual(game_state.current_round, 1)
        self.assertEqual(game_state.team1_score, 0)
        self.assertEqual(game_state.team2_score, 0)
    
    def test_game_state_scoring(self):
        """Test updating game state scores."""
        game_state = GameState.objects.create(room=self.room, current_player=self.player)
        game_state.team1_score = 5
        game_state.save()
        
        refreshed_state = GameState.objects.get(room=self.room)
        self.assertEqual(refreshed_state.team1_score, 5)


class WordModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.room = Room.objects.create(host=self.user)
        self.player = Player.objects.create(user=self.user, room=self.room, name='Player', team=1)
    
    def test_word_creation(self):
        """Test word creation for a room."""
        word = Word.objects.create(
            room=self.room,
            text='Elefante',
            created_by=self.player,
            category='Animales'
        )
        self.assertEqual(word.text, 'Elefante')
        self.assertFalse(word.used_in_current_round)
        self.assertIsNone(word.guessed_by_team)
