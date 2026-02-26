from rest_framework import serializers
from .models import Room, Player, GameState, Word, TurnHistory


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'team', 'is_connected', 'joined_at']


class RoomSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    player_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = ['id', 'code', 'is_active', 'game_started', 'seconds_per_turn',
                  'words_per_player', 'use_categories', 'players', 'player_count', 'created_at']
    
    def get_player_count(self, obj):
        return obj.players.count()


class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ['id', 'text', 'category', 'used_in_current_round']


class GameStateSerializer(serializers.ModelSerializer):
    current_player = PlayerSerializer(read_only=True)
    current_word = WordSerializer(read_only=True)
    
    class Meta:
        model = GameState
        fields = ['current_round', 'current_player', 'current_word', 
                  'team1_score', 'team2_score', 'team1_round_wins', 'team2_round_wins',
                  'turn_started_at', 'turn_ends_at']


class TurnHistorySerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)
    
    class Meta:
        model = TurnHistory
        fields = ['player', 'round_number', 'words_guessed', 'started_at', 'ended_at']
