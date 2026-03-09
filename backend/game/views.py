from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Room, Player, GameState, Word
from .serializers import RoomSerializer, PlayerSerializer, GameStateSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]  # TODO: Change to IsAuthenticated
    lookup_field = 'code'
    
    @action(detail=False, methods=['post'])
    def create_room(self, request):
        """Create a new game room."""
        # TODO: Use real user authentication
        user, _ = User.objects.get_or_create(username=f"user_{request.data.get('player_name', 'anonymous')}")
        
        # Get configuration from request
        room_config = {
            'host': user,
            'seconds_per_turn': request.data.get('seconds_per_turn', 60),
            'words_per_player': request.data.get('words_per_player', 3),
            'use_categories': request.data.get('use_categories', False),
        }
        
        room = Room.objects.create(**room_config)
        player = Player.objects.create(
            user=user,
            room=room,
            name=request.data.get('player_name', 'Anonymous'),
            team=1
        )
        
        return Response({
            'room': RoomSerializer(room).data,
            'player': PlayerSerializer(player).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def join_room(self, request, code=None):
        """Join an existing room."""
        room = self.get_object()
        
        if room.game_started:
            return Response({'error': 'Game already started'}, status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Use real user authentication
        user, _ = User.objects.get_or_create(username=f"user_{request.data.get('player_name', 'anonymous')}")
        
        # Assign to team with fewer players
        team1_count = room.players.filter(team=1).count()
        team2_count = room.players.filter(team=2).count()
        team = 1 if team1_count <= team2_count else 2
        
        player, created = Player.objects.get_or_create(
            user=user,
            room=room,
            defaults={
                'name': request.data.get('player_name', 'Anonymous'),
                'team': team
            }
        )
        
        return Response({
            'room': RoomSerializer(room).data,
            'player': PlayerSerializer(player).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def start_game(self, request, code=None):
        """Start the game."""
        room = self.get_object()
        
        if room.players.count() < 4:
            return Response({'error': 'Need at least 4 players'}, status=status.HTTP_400_BAD_REQUEST)
        
        room.game_started = True
        room.save()
        
        # Create game state
        first_player = room.players.filter(team=1).first()
        game_state = GameState.objects.create(
            room=room,
            current_player=first_player,
            current_round=1
        )
        
        return Response({
            'message': 'Game started',
            'game_state': GameStateSerializer(game_state).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'])
    def update_config(self, request, code=None):
        """Update room configuration without changing room code."""
        room = self.get_object()

        if room.game_started:
            return Response({'error': 'Cannot update config after game started'}, status=status.HTTP_400_BAD_REQUEST)

        # Allow partial updates for current config fields
        if 'seconds_per_turn' in request.data:
            room.seconds_per_turn = request.data.get('seconds_per_turn')
        if 'words_per_player' in request.data:
            room.words_per_player = request.data.get('words_per_player')
        if 'use_categories' in request.data:
            room.use_categories = request.data.get('use_categories')

        room.save()

        # Notify all clients in room so their lobby config updates in real time
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'game_{room.code}',
            {
                'type': 'room_config_updated',
                'room': RoomSerializer(room).data,
            }
        )

        return Response({
            'room': RoomSerializer(room).data
        }, status=status.HTTP_200_OK)


class GameStateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['post'])
    def word_guessed(self, request, pk=None):
        """Mark a word as guessed and get next word."""
        game_state = self.get_object()
        
        # Update score
        if game_state.current_player.team == 1:
            game_state.team1_score += 1
        else:
            game_state.team2_score += 1
        
        # Mark word as used
        if game_state.current_word:
            game_state.current_word.used_in_current_round = True
            game_state.current_word.guessed_by_team = game_state.current_player.team
            game_state.current_word.save()
        
        # Get next word
        next_word = game_state.room.words.filter(used_in_current_round=False).first()
        game_state.current_word = next_word
        game_state.save()
        
        return Response(GameStateSerializer(game_state).data)
    
    @action(detail=True, methods=['post'])
    def skip_word(self, request, pk=None):
        """Skip current word and get next."""
        game_state = self.get_object()
        
        # Get next word
        next_word = game_state.room.words.filter(used_in_current_round=False).first()
        game_state.current_word = next_word
        game_state.save()
        
        return Response(GameStateSerializer(game_state).data)
