from django.db import models
from django.contrib.auth.models import User
import random
import string


def generate_room_code():
    """Generate a unique 4-letter room code."""
    return ''.join(random.choices(string.ascii_uppercase, k=4))


class Room(models.Model):
    """Game room where players join to play."""
    code = models.CharField(max_length=4, unique=True, default=generate_room_code)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    game_started = models.BooleanField(default=False)
    
    # Game settings
    seconds_per_turn = models.IntegerField(default=60)
    words_per_player = models.IntegerField(default=3)
    use_categories = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Room {self.code}"


class Player(models.Model):
    """Player in a game room."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_players')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='players')
    name = models.CharField(max_length=50)
    team = models.IntegerField(choices=[(1, 'Team 1'), (2, 'Team 2')], null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_connected = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'room']
    
    def __str__(self):
        return f"{self.name} in {self.room.code}"


class GameState(models.Model):
    """Current state of the game."""
    ROUNDS = [
        (1, 'Description'),
        (2, 'One Word'),
        (3, 'Mime'),
        (4, 'Sounds'),
    ]
    
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='game_state')
    current_round = models.IntegerField(choices=ROUNDS, default=1)
    current_player = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, related_name='current_turns')
    current_word = models.ForeignKey('Word', on_delete=models.SET_NULL, null=True, related_name='current_in_game')
    
    # Scores
    team1_score = models.IntegerField(default=0)
    team2_score = models.IntegerField(default=0)
    
    # Round scores
    team1_round_wins = models.IntegerField(default=0)
    team2_round_wins = models.IntegerField(default=0)
    
    # Timer
    turn_started_at = models.DateTimeField(null=True, blank=True)
    turn_ends_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Game in {self.room.code} - Round {self.current_round}"


class Word(models.Model):
    """Words used in the game."""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='words')
    text = models.CharField(max_length=100)
    created_by = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='created_words')
    category = models.CharField(max_length=50, null=True, blank=True)
    
    # Game state
    used_in_current_round = models.BooleanField(default=False)
    guessed_by_team = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return self.text


class TurnHistory(models.Model):
    """History of turns played."""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='turn_history')
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    round_number = models.IntegerField()
    words_guessed = models.IntegerField(default=0)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    
    def __str__(self):
        return f"{self.player.name} - Round {self.round_number}: {self.words_guessed} words"
