import { useState, useEffect, useRef, useCallback } from "react";

interface UseSocketProps {
  url: string;
  roomCode: string;
  enabled?: boolean;
}

interface GameStateUpdate {
  type: string;
  data?: any;
  players?: any[];
  player_id?: string;
  team?: number;
}

export const useSocket = ({
  url,
  roomCode,
  enabled = true,
}: UseSocketProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());

  const connect = useCallback(() => {
    if (!enabled || !roomCode) {
      console.log("WebSocket connect skipped:", { enabled, roomCode });
      return;
    }

    // Convert http/https to ws/wss
    const wsUrl = url.replace("http://", "ws://").replace("https://", "wss://");
    const fullUrl = `${wsUrl}/ws/game/${roomCode}/`;

    console.log("Connecting to WebSocket:", fullUrl);
    console.log("Room code:", roomCode);

    const ws = new WebSocket(fullUrl);
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      setIsConnected(false);

      // Don't reconnect if room doesn't exist (custom code 4004)
      if (event.code === 4004) {
        console.error("Room does not exist - not reconnecting");
        triggerEventHandlers("room_not_found", {});
        return;
      }

      // Attempt to reconnect after 2 seconds for other errors
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const message: GameStateUpdate = JSON.parse(event.data);
        console.log("WebSocket message received:", message);

        // Handle different message types
        switch (message.type) {
          case "game_state":
            setGameState(message.data);
            triggerEventHandlers("game_state", message.data);
            break;
          case "player_update":
            triggerEventHandlers("player_update", message);
            break;
          case "player_joined":
            triggerEventHandlers("player_joined", message);
            break;
          case "player_left":
            triggerEventHandlers("player_left", message);
            break;
          case "team_changed":
            triggerEventHandlers("team_changed", message);
            break;
          case "game_started":
            setGameState(message.data);
            triggerEventHandlers("game_started", message.data);
            break;
          case "word_update":
            setGameState((prev: any) => ({ ...prev, ...message.data }));
            triggerEventHandlers("word_update", message.data);
            break;
          case "turn_ended":
            setGameState((prev: any) => ({ ...prev, ...message.data }));
            triggerEventHandlers("turn_ended", message.data);
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return ws;
  }, [url, roomCode, enabled]);

  const triggerEventHandlers = (event: string, data: any) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  };

  useEffect(() => {
    const ws = connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const on = (event: string, handler: Function) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)?.add(handler);
  };

  const off = (event: string, handler?: Function) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler);
    } else {
      eventHandlersRef.current.delete(event);
    }
  };

  const emit = (type: string, data: any = {}) => {
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, ...data });
      socket.send(message);
      console.log("Sent WebSocket message:", message);
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  };

  const wordGuessed = () => {
    emit("word_guessed", {});
  };

  const skipWord = () => {
    emit("skip_word", {});
  };

  const endTurn = () => {
    emit("end_turn", {});
  };

  const startGame = () => {
    emit("start_game", {});
  };

  return {
    socket,
    isConnected,
    gameState,
    on,
    off,
    emit,
    wordGuessed,
    skipWord,
    endTurn,
    startGame,
  };
};
