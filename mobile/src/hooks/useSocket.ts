import { useState, useEffect, useRef, useCallback } from "react";

interface UseSocketProps {
  url: string;
  roomCode: string;
  enabled?: boolean;
  clientName?: string;
}

interface GameStateUpdate {
  type: string;
  data?: any;
  players?: any[];
  room?: any;
  reason?: string;
  code?: number;
  player_id?: string;
  team?: number;
}

export const useSocket = ({
  url,
  roomCode,
  enabled = true,
  clientName = "unknown",
}: UseSocketProps) => {
  const MAX_RECONNECT_ATTEMPTS = 4;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const stopReconnectRef = useRef(false);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const wsLogPrefix = `[WS][${clientName}]`;

  const connect = useCallback(() => {
    if (!enabled || !roomCode || stopReconnectRef.current) {
      console.log(`${wsLogPrefix} connect skipped:`, { enabled, roomCode });
      return;
    }

    // Convert http/https to ws/wss
    const wsUrl = url.replace("http://", "ws://").replace("https://", "wss://");
    const fullUrl = `${wsUrl}/ws/game/${roomCode}/`;

    console.log(`${wsLogPrefix} connecting to:`, fullUrl);
    console.log(`${wsLogPrefix} room code:`, roomCode);

    const ws = new WebSocket(fullUrl);
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      console.log(`${wsLogPrefix} connected`);
      setIsConnected(true);
    };

    ws.onclose = (event) => {
      console.log(`${wsLogPrefix} disconnected`, event.code, event.reason);
      setIsConnected(false);
      triggerEventHandlers("socket_closed", {
        code: event.code,
        reason: event.reason,
      });

      if (!enabled || !shouldReconnectRef.current) {
        return;
      }

      // Don't reconnect if room doesn't exist (custom code 4004)
      if (event.code === 4004) {
        console.error(`${wsLogPrefix} room does not exist - not reconnecting`);
        stopReconnectRef.current = true;
        triggerEventHandlers("room_not_found", {});
        return;
      }

      reconnectAttemptsRef.current += 1;
      if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        console.error(
          `${wsLogPrefix} max reconnect attempts reached - stopping retries`,
        );
        stopReconnectRef.current = true;
        triggerEventHandlers("room_not_found", {});
        return;
      }

      // Attempt to reconnect after 2 seconds for other errors
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(
          `${wsLogPrefix} attempting reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`,
        );
        connect();
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error(`${wsLogPrefix} error:`, error);
    };

    ws.onmessage = (event) => {
      try {
        // A valid message means the connection is healthy; allow future retries if needed.
        reconnectAttemptsRef.current = 0;
        const message: GameStateUpdate = JSON.parse(event.data);
        console.log(`${wsLogPrefix} message received:`, message);

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
          case "room_config_updated":
            triggerEventHandlers("room_config_updated", message);
            break;
          case "room_closed":
            stopReconnectRef.current = true;
            triggerEventHandlers("room_closed", message);
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
            console.log(`${wsLogPrefix} unknown message type:`, message.type);
        }
      } catch (error) {
        console.error(`${wsLogPrefix} error parsing message:`, error);
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
    shouldReconnectRef.current = enabled;
    if (!enabled) {
      stopReconnectRef.current = false;
    }
    const ws = connect();

    return () => {
      shouldReconnectRef.current = false;
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
      console.log(`${wsLogPrefix} sent message:`, message);
    } else {
      console.warn(`${wsLogPrefix} cannot send: WebSocket not connected`);
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
