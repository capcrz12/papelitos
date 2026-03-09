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
            'allow_player_words': request.data.get('allow_player_words', True),
            'max_players': request.data.get('max_players', 8),
            'active_rounds': request.data.get('active_rounds', [True, True, True, True]),
            'game_phase': 'lobby',
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

        if room.players.count() >= room.max_players:
            return Response({'error': 'Room is full'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        player_id = request.data.get('player_id')

        if player_id:
            host_player = room.players.filter(id=player_id).first()
            if not host_player or host_player.user_id != room.host_id:
                return Response({'error': 'Only the host can start the game'}, status=status.HTTP_403_FORBIDDEN)
        
        if room.players.count() < 4:
            return Response({'error': 'Need at least 4 players'}, status=status.HTTP_400_BAD_REQUEST)

        room.game_started = True
        room.game_phase = 'word_submission' if room.allow_player_words else 'playing'
        room.save()

        room.players.update(words_submitted=False)
        
        # Create game state
        first_player = room.players.filter(team=1).first()
        game_state, _ = GameState.objects.get_or_create(
            room=room,
            defaults={
                'current_player': first_player,
                'current_round': 1,
            }
        )

        game_state.current_player = first_player
        game_state.current_round = 1
        game_state.save()

        room_data = RoomSerializer(room).data
        game_data = GameStateSerializer(game_state).data

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'game_{room.code}',
            {
                'type': 'game_started',
                'data': {
                    'room': room_data,
                    'game_state': game_data,
                    'phase': room.game_phase,
                }
            }
        )
        async_to_sync(channel_layer.group_send)(
            f'game_{room.code}',
            {
                'type': 'room_config_updated',
                'room': room_data,
            }
        )
        
        return Response({
            'message': 'Game started',
            'room': room_data,
            'game_state': game_data,
            'phase': room.game_phase,
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
        if 'allow_player_words' in request.data:
            room.allow_player_words = request.data.get('allow_player_words')
        if 'max_players' in request.data:
            room.max_players = request.data.get('max_players')
        if 'active_rounds' in request.data:
            room.active_rounds = request.data.get('active_rounds')

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

    @action(detail=True, methods=['post'])
    def leave_room(self, request, code=None):
        """Leave room. If host leaves, close room for everyone."""
        room = self.get_object()
        player_id = request.data.get('player_id')
        player_name = request.data.get('player_name')

        player = None
        if player_id:
            player = room.players.filter(id=player_id).first()
        if not player and player_name:
            player = room.players.filter(name=player_name).first()

        if not player:
            return Response({'error': 'Player not found in room'}, status=status.HTTP_404_NOT_FOUND)

        channel_layer = get_channel_layer()

        # If host leaves, close room for all users
        if player.user_id == room.host_id:
            async_to_sync(channel_layer.group_send)(
                f'game_{room.code}',
                {
                    'type': 'room_closed',
                    'reason': 'host_left',
                    'room_code': room.code,
                    'force_exit': True,
                }
            )
            room.delete()
            return Response({'message': 'Host left. Room closed.'}, status=status.HTTP_200_OK)

        # Normal player leaves room
        left_player_id = player.id
        player.delete()

        # If room is empty after leaving, delete it.
        if room.players.count() == 0:
            room.delete()
            return Response({'message': 'Player left. Empty room deleted.'}, status=status.HTTP_200_OK)

        remaining_players = list(room.players.values('id', 'name', 'team', 'is_connected'))
        async_to_sync(channel_layer.group_send)(
            f'game_{room.code}',
            {
                'type': 'player_left',
                'player_id': left_player_id,
            }
        )
        async_to_sync(channel_layer.group_send)(
            f'game_{room.code}',
            {
                'type': 'player_update',
                'players': remaining_players,
            }
        )

        return Response({'message': 'Player left room'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def submit_player_words(self, request, code=None):
        """Allow each player to submit their own words before the game starts."""
        room = self.get_object()
        player_id = request.data.get('player_id')
        words = request.data.get('words', [])

        if room.game_phase != 'word_submission':
            return Response({'error': 'Word submission phase is not active'}, status=status.HTTP_400_BAD_REQUEST)

        player = room.players.filter(id=player_id).first()
        if not player:
            return Response({'error': 'Player not found in room'}, status=status.HTTP_404_NOT_FOUND)

        if player.words_submitted:
            return Response({'error': 'Player already submitted words'}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(words, list) or len(words) == 0:
            return Response({'error': 'Provide at least one word'}, status=status.HTTP_400_BAD_REQUEST)

        cleaned_words = []
        for raw_word in words:
            value = (raw_word or '').strip()
            if value:
                cleaned_words.append(value)

        if len(cleaned_words) != room.words_per_player:
            return Response(
                {'error': f'You must submit exactly {room.words_per_player} words'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for text in cleaned_words:
            Word.objects.create(room=room, text=text, created_by=player)

        player.words_submitted = True
        player.save()

        submitted_count = room.players.filter(words_submitted=True).count()
        total_players = room.players.count()
        all_submitted = submitted_count == total_players

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'game_{room.code}',
            {
                'type': 'word_submission_progress',
                'submitted_count': submitted_count,
                'total_players': total_players,
                'player_id': player.id,
            }
        )

        if all_submitted:
            room.game_phase = 'playing'
            room.save()
            async_to_sync(channel_layer.group_send)(
                f'game_{room.code}',
                {
                    'type': 'words_phase_completed',
                    'room': RoomSerializer(room).data,
                }
            )

        return Response(
            {
                'submitted_count': submitted_count,
                'total_players': total_players,
                'all_submitted': all_submitted,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def words_submission_status(self, request, code=None):
        """Get word submission progress for the current room."""
        room = self.get_object()
        submitted_count = room.players.filter(words_submitted=True).count()
        total_players = room.players.count()

        return Response(
            {
                'submitted_count': submitted_count,
                'total_players': total_players,
                'all_submitted': submitted_count == total_players,
                'phase': room.game_phase,
                'words_per_player': room.words_per_player,
            },
            status=status.HTTP_200_OK,
        )


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
