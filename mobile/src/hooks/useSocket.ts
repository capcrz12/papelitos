import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketProps {
  url: string;
  roomCode: string;
  enabled?: boolean;
}

interface GameStateUpdate {
  type: string;
  data: any;
}

export const useSocket = ({ url, roomCode, enabled = true }: UseSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !roomCode) return;

    // Connect to WebSocket
    const newSocket = io(`${url}/game/${roomCode}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
    });

    // Game events
    newSocket.on('game_state', (data: GameStateUpdate) => {
      setGameState(data);
    });

    newSocket.on('player_update', (data: GameStateUpdate) => {
      // Handle player updates
      console.log('Player update:', data);
    });

    newSocket.on('game_started', (data: GameStateUpdate) => {
      // Handle game start
      console.log('Game started:', data);
      setGameState(data);
    });

    newSocket.on('word_update', (data: GameStateUpdate) => {
      // Handle word updates
      console.log('Word update:', data);
      setGameState((prev: any) => ({ ...prev, ...data }));
    });

    newSocket.on('turn_ended', (data: GameStateUpdate) => {
      // Handle turn end
      console.log('Turn ended:', data);
      setGameState((prev: any) => ({ ...prev, ...data }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, roomCode, enabled]);

  const emit = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const wordGuessed = () => {
    emit('word_guessed', {});
  };

  const skipWord = () => {
    emit('skip_word', {});
  };

  const endTurn = () => {
    emit('end_turn', {});
  };

  const startGame = () => {
    emit('start_game', {});
  };

  return {
    socket,
    isConnected,
    gameState,
    wordGuessed,
    skipWord,
    endTurn,
    startGame,
    emit,
  };
};
