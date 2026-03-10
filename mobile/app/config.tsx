import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "../src/components/Button";
import { gameApi } from "../src/services/api";

export default function ConfigScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const playerName = (params.playerName as string) || "Jugador";
  const isEditMode = (params.mode as string) === "edit";
  const roomCode = (params.roomCode as string) || "";
  const playerId = (params.playerId as string) || "";
  const playerTeam = (params.playerTeam as string) || "1";
  const isHost = (params.isHost as string) || "true";

  const parseBool = (value: string | undefined, fallback = false) => {
    if (value === undefined) return fallback;
    return value === "true";
  };

  const parseRounds = (value: string | undefined) => {
    if (!value) return [true, true, true, true];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    } catch {}
    return [true, true, true, true];
  };

  const [config, setConfig] = useState({
    timePerTurn: parseInt((params.timePerTurn as string) || "60", 10),
    wordsPerPlayer: parseInt((params.wordsPerPlayer as string) || "3", 10),
    maxPlayers: parseInt((params.maxPlayers as string) || "8", 10),
    useCategories: false,
    allowPlayerWords: true,
    rounds: parseRounds(params.rounds as string), // 4 rounds: Description, One Word, Mime, Sounds
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const timeOptions = [30, 45, 60, 90, 120];
  const wordsOptions = [2, 3, 4, 5, 6];
  const playerOptions = [4, 6, 8, 10, 12];

  const toggleRound = (index: number) => {
    const newRounds = [...config.rounds];
    newRounds[index] = !newRounds[index];
    setConfig({ ...config, rounds: newRounds });
  };

  const handleSaveConfig = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // Validate at least one round is enabled
      if (!config.rounds.some((r) => r)) {
        Alert.alert("Error", "Debes seleccionar al menos una ronda");
        setLoading(false);
        return;
      }

      if (isEditMode) {
        if (!roomCode) {
          throw new Error("No room code provided for update");
        }

        const response = await gameApi.updateRoomConfig(roomCode, {
          seconds_per_turn: config.timePerTurn,
          words_per_player: config.wordsPerPlayer,
          use_categories: false,
          allow_player_words: true,
          max_players: config.maxPlayers,
          active_rounds: config.rounds,
        });

        // Return to the same room with updated settings
        router.replace({
          pathname: "/lobby",
          params: {
            playerName,
            isHost,
            roomCode: response.room.code,
            playerId,
            playerTeam,
            timePerTurn: response.room.seconds_per_turn.toString(),
            wordsPerPlayer: response.room.words_per_player.toString(),
            maxPlayers: response.room.max_players.toString(),
            useCategories: "false",
            allowPlayerWords: "true",
            rounds: JSON.stringify(response.room.active_rounds),
          },
        });
      } else {
        // Create room with configuration
        const response = await gameApi.createRoom(playerName, {
          seconds_per_turn: config.timePerTurn,
          words_per_player: config.wordsPerPlayer,
          use_categories: false,
          allow_player_words: true,
          max_players: config.maxPlayers,
          active_rounds: config.rounds,
        });

        // Navigate to lobby with room data
        router.push({
          pathname: "/lobby",
          params: {
            playerName,
            isHost: "true",
            roomCode: response.room.code,
            playerId: response.player.id.toString(),
            playerTeam: response.player.team?.toString() || "1",
            timePerTurn: response.room.seconds_per_turn.toString(),
            wordsPerPlayer: response.room.words_per_player.toString(),
            maxPlayers: response.room.max_players.toString(),
            useCategories: "false",
            allowPlayerWords: "true",
            rounds: JSON.stringify(response.room.active_rounds),
          },
        });
      }
    } catch (err: any) {
      console.error("Error creating room:", err);
      setError(
        err.response?.data?.error ||
          "No se pudo crear la sala. Verifica tu conexión.",
      );
      Alert.alert(
        "Error",
        err.response?.data?.error ||
          "No se pudo crear la sala. Verifica tu conexión.",
      );
    } finally {
      setLoading(false);
    }
  };

  const roundNames = [
    "Ronda 1: Descripción",
    "Ronda 2: Una Palabra",
    "Ronda 3: Mímica",
    "Ronda 4: Sonidos",
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            ← {isEditMode ? "Cancelar" : "Volver"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? "Editar Configuración" : "Configuración de Partida"}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Time per turn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Tiempo por turno</Text>
          <View style={styles.optionsContainer}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.optionButton,
                  config.timePerTurn === time && styles.optionButtonActive,
                ]}
                onPress={() => setConfig({ ...config, timePerTurn: time })}
              >
                <Text
                  style={[
                    styles.optionText,
                    config.timePerTurn === time && styles.optionTextActive,
                  ]}
                >
                  {time}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Words per player */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Palabras por jugador</Text>
          <View style={styles.optionsContainer}>
            {wordsOptions.map((words) => (
              <TouchableOpacity
                key={words}
                style={[
                  styles.optionButton,
                  config.wordsPerPlayer === words && styles.optionButtonActive,
                ]}
                onPress={() => setConfig({ ...config, wordsPerPlayer: words })}
              >
                <Text
                  style={[
                    styles.optionText,
                    config.wordsPerPlayer === words && styles.optionTextActive,
                  ]}
                >
                  {words}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Número máximo de jugadores</Text>
          <View style={styles.optionsContainer}>
            {playerOptions.map((players) => (
              <TouchableOpacity
                key={players}
                style={[
                  styles.optionButton,
                  config.maxPlayers === players && styles.optionButtonActive,
                ]}
                onPress={() => setConfig({ ...config, maxPlayers: players })}
              >
                <Text
                  style={[
                    styles.optionText,
                    config.maxPlayers === players && styles.optionTextActive,
                  ]}
                >
                  {players}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rounds selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Rondas activas</Text>
          {roundNames.map((name, index) => (
            <View key={index} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{name}</Text>
              <Switch
                value={config.rounds[index]}
                onValueChange={() => toggleRound(index)}
                trackColor={{ false: "#d1d5db", true: "#4ade80" }}
                thumbColor={config.rounds[index] ? "#22c55e" : "#f3f4f6"}
              />
            </View>
          ))}
        </View>

        {/* Word source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Origen de las palabras</Text>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>
                Los jugadores crean palabras
              </Text>
              <Text style={styles.switchDescription}>
                Opción fija: cada jugador añade sus propias palabras
              </Text>
            </View>
            <Text style={styles.fixedValue}>Siempre</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>📋 Resumen</Text>
          <Text style={styles.summaryText}>
            • Turnos de {config.timePerTurn} segundos{"\n"}•{" "}
            {config.wordsPerPlayer} palabras por jugador{"\n"}• Hasta{" "}
            {config.maxPlayers} jugadores{"\n"}•{" "}
            {config.rounds.filter((r) => r).length} rondas activas
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title={
            loading
              ? isEditMode
                ? "Guardando..."
                : "Creando sala..."
              : isEditMode
                ? "Guardar Cambios"
                : "Crear Partida"
          }
          onPress={handleSaveConfig}
          variant="primary"
          size="large"
          disabled={loading}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>Configurando partida...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3b82f6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
  },
  optionButtonActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  optionText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  switchLabel: {
    fontSize: 16,
    color: "#1f2937",
  },
  switchDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  fixedValue: {
    fontSize: 14,
    color: "#16a34a",
    fontWeight: "700",
  },
  summarySection: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#3b82f6",
  },
});
