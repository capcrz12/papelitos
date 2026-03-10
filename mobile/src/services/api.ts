import axios from "axios";
import { resolveApiBaseUrl, resolveWsBaseUrl } from "./network";

export const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
export const WS_BASE_URL = resolveWsBaseUrl(
  process.env.EXPO_PUBLIC_WS_URL,
  API_BASE_URL,
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Room {
  id: number;
  code: string;
  is_active: boolean;
  game_started: boolean;
  seconds_per_turn: number;
  words_per_player: number;
  use_categories: boolean;
  allow_player_words: boolean;
  max_players: number;
  active_rounds: boolean[];
  game_phase: string;
  player_count: number;
  players?: Array<{
    id: number;
    name: string;
    team: number | null;
    is_connected: boolean;
    words_submitted?: boolean;
    joined_at?: string;
  }>;
}

export interface Player {
  id: number;
  name: string;
  team: number;
  is_connected: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  word_count: number;
}

export interface RoomConfig {
  seconds_per_turn?: number;
  words_per_player?: number;
  use_categories?: boolean;
  allow_player_words?: boolean;
  max_players?: number;
  active_rounds?: boolean[];
}

export const gameApi = {
  // Room management
  createRoom: async (
    playerName: string,
    config?: RoomConfig,
  ): Promise<{ room: Room; player: Player }> => {
    const response = await api.post("/game/rooms/create_room/", {
      player_name: playerName,
      ...config,
    });
    return response.data;
  },

  joinRoom: async (
    roomCode: string,
    playerName: string,
  ): Promise<{ room: Room; player: Player }> => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.post(`/game/rooms/${safeCode}/join_room/`, {
      player_name: playerName,
    });
    return response.data;
  },

  getRoom: async (roomCode: string): Promise<Room> => {
    const response = await api.get(`/game/rooms/${roomCode}/`);
    return response.data;
  },

  startGame: async (roomCode: string) => {
    const response = await api.post(`/game/rooms/${roomCode}/start_game/`);
    return response.data;
  },

  startGameAsHost: async (roomCode: string, playerId: string) => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.post(`/game/rooms/${safeCode}/start_game/`, {
      player_id: playerId,
    });
    return response.data;
  },

  startTurn: async (roomCode: string, playerId: string) => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.post(`/game/rooms/${safeCode}/start_turn/`, {
      player_id: playerId,
    });
    return response.data;
  },

  updateRoomConfig: async (
    roomCode: string,
    config: RoomConfig,
  ): Promise<{ room: Room }> => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.patch(
      `/game/rooms/${safeCode}/update_config/`,
      config,
    );
    return response.data;
  },

  leaveRoom: async (roomCode: string, playerId: string, playerName: string) => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.post(`/game/rooms/${safeCode}/leave_room/`, {
      player_id: playerId,
      player_name: playerName,
    });
    return response.data;
  },

  submitPlayerWords: async (
    roomCode: string,
    playerId: string,
    words: string[],
  ) => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.post(
      `/game/rooms/${safeCode}/submit_player_words/`,
      {
        player_id: playerId,
        words,
      },
    );
    return response.data;
  },

  getWordsSubmissionStatus: async (roomCode: string) => {
    const safeCode = encodeURIComponent(roomCode.trim().toUpperCase());
    const response = await api.get(
      `/game/rooms/${safeCode}/words_submission_status/`,
    );
    return response.data;
  },

  // Categories and words
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get("/words/categories/");
    return response.data;
  },

  getCategoryWords: async (categoryId: number) => {
    const response = await api.get(`/words/categories/${categoryId}/words/`);
    return response.data;
  },

  getRandomWords: async (categoryId: number, count: number) => {
    const response = await api.get(
      `/words/categories/${categoryId}/random_words/?count=${count}`,
    );
    return response.data;
  },
};

export default api;
