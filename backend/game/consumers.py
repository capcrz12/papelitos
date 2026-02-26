import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Player, GameState


class GameConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time game updates."""
    
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'game_{self.room_code}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current game state
        game_state = await self.get_game_state()
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'data': game_state
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket."""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'player_joined':
            await self.player_joined(data)
        elif message_type == 'start_game':
            await self.start_game(data)
        elif message_type == 'word_guessed':
            await self.word_guessed(data)
        elif message_type == 'skip_word':
            await self.skip_word(data)
        elif message_type == 'end_turn':
            await self.end_turn(data)
    
    async def player_joined(self, data):
        """Handle player joining."""
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_update',
                'players': await self.get_players()
            }
        )
    
    async def start_game(self, data):
        """Handle game start."""
        game_state = await self.initialize_game()
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_started',
                'game_state': game_state
            }
        )
    
    async def word_guessed(self, data):
        """Handle word guessed."""
        game_state = await self.update_word_guessed()
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'word_update',
                'game_state': game_state
            }
        )
    
    async def skip_word(self, data):
        """Handle word skipped."""
        game_state = await self.update_word_skipped()
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'word_update',
                'game_state': game_state
            }
        )
    
    async def end_turn(self, data):
        """Handle turn end."""
        game_state = await self.update_turn_end()
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'turn_ended',
                'game_state': game_state
            }
        )
    
    # Receive from room group
    async def player_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_update',
            'players': event['players']
        }))
    
    async def game_started(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_started',
            'game_state': event['game_state']
        }))
    
    async def word_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'word_update',
            'game_state': event['game_state']
        }))
    
    async def turn_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'turn_ended',
            'game_state': event['game_state']
        }))
    
    # Database queries
    @database_sync_to_async
    def get_game_state(self):
        try:
            room = Room.objects.get(code=self.room_code)
            game_state = room.game_state
            return {
                'current_round': game_state.current_round,
                'current_player': game_state.current_player.name if game_state.current_player else None,
                'current_word': game_state.current_word.text if game_state.current_word else None,
                'team1_score': game_state.team1_score,
                'team2_score': game_state.team2_score,
            }
        except (Room.DoesNotExist, GameState.DoesNotExist):
            return None
    
    @database_sync_to_async
    def get_players(self):
        room = Room.objects.get(code=self.room_code)
        return list(room.players.values('id', 'name', 'team', 'is_connected'))
    
    @database_sync_to_async
    def initialize_game(self):
        room = Room.objects.get(code=self.room_code)
        room.game_started = True
        room.save()
        
        first_player = room.players.filter(team=1).first()
        game_state, _ = GameState.objects.get_or_create(
            room=room,
            defaults={
                'current_player': first_player,
                'current_round': 1
            }
        )
        
        return {
            'current_round': game_state.current_round,
            'current_player': game_state.current_player.name,
            'team1_score': game_state.team1_score,
            'team2_score': game_state.team2_score,
        }
    
    @database_sync_to_async
    def update_word_guessed(self):
        room = Room.objects.get(code=self.room_code)
        game_state = room.game_state
        
        if game_state.current_player.team == 1:
            game_state.team1_score += 1
        else:
            game_state.team2_score += 1
        
        if game_state.current_word:
            game_state.current_word.used_in_current_round = True
            game_state.current_word.save()
            
            next_word = room.words.filter(used_in_current_round=False).first()
            game_state.current_word = next_word
        
        game_state.save()
        
        return {
            'current_word': game_state.current_word.text if game_state.current_word else None,
            'team1_score': game_state.team1_score,
            'team2_score': game_state.team2_score,
        }
    
    @database_sync_to_async
    def update_word_skipped(self):
        room = Room.objects.get(code=self.room_code)
        game_state = room.game_state
        
        next_word = room.words.filter(used_in_current_round=False).first()
        game_state.current_word = next_word
        game_state.save()
        
        return {
            'current_word': game_state.current_word.text if game_state.current_word else None,
        }
    
    @database_sync_to_async
    def update_turn_end(self):
        room = Room.objects.get(code=self.room_code)
        game_state = room.game_state
        
        # Get next player
        current_team = game_state.current_player.team
        next_team = 1 if current_team == 2 else 2
        
        next_player = room.players.filter(team=next_team).first()
        game_state.current_player = next_player
        game_state.save()
        
        return {
            'current_player': game_state.current_player.name,
            'current_player_team': game_state.current_player.team,
        }
