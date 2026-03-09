import axios from "axios";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

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
  player_count: number;
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
