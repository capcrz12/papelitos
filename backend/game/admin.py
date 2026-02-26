from django.contrib import admin
from .models import Room, Player, GameState, Word, TurnHistory

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['code', 'host', 'is_active', 'game_started', 'created_at']
    list_filter = ['is_active', 'game_started', 'created_at']
    search_fields = ['code']

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'room', 'team', 'is_connected', 'joined_at']
    list_filter = ['team', 'is_connected', 'room']
    search_fields = ['name', 'room__code']

@admin.register(GameState)
class GameStateAdmin(admin.ModelAdmin):
    list_display = ['room', 'current_round', 'current_player', 'team1_score', 'team2_score']
    list_filter = ['current_round']

@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = ['text', 'room', 'category', 'used_in_current_round']
    list_filter = ['category', 'used_in_current_round']
    search_fields = ['text', 'room__code']

@admin.register(TurnHistory)
class TurnHistoryAdmin(admin.ModelAdmin):
    list_display = ['player', 'room', 'round_number', 'words_guessed', 'started_at']
    list_filter = ['round_number', 'room']
