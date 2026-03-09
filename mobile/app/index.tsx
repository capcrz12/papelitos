import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { API_BASE_URL, gameApi } from "../src/services/api";

export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createRoom = () => {
    if (!playerName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    setError("");
    // Pass player name to config screen
    router.push({
      pathname: "/config",
      params: { playerName: playerName.trim() },
    });
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    if (!roomCode.trim()) {
      setError("Por favor ingresa el código de sala");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call API to verify room exists and join
      const response = await gameApi.joinRoom(
        roomCode.trim().toUpperCase(),
        playerName.trim(),
      );

      // Navigate to lobby with room data
      router.push({
        pathname: "/lobby",
        params: {
          playerName: playerName.trim(),
          roomCode: response.room.code,
          playerId: response.player.id.toString(),
          playerTeam: response.player.team?.toString() || "1",
          isHost: "false",
          timePerTurn: response.room.seconds_per_turn.toString(),
          wordsPerPlayer: response.room.words_per_player.toString(),
          maxPlayers: response.room.max_players.toString(),
          useCategories: response.room.use_categories.toString(),
          allowPlayerWords: response.room.allow_player_words.toString(),
          rounds: JSON.stringify(response.room.active_rounds),
        },
      });
    } catch (err: any) {
      console.error("Error joining room:", err);
      if (err.response?.status === 404) {
        setError("No existe una sala con ese código");
      } else if (err.response?.status === 400) {
        setError(err.response.data.error || "Error al unirse a la sala");
      } else {
        console.error("Join failed against API:", API_BASE_URL);
        setError(
          `Error de conexión con ${API_BASE_URL}. Si te unes desde otro dispositivo, usa la IP local en EXPO_PUBLIC_API_URL.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌊 WordWave</Text>
        <Text style={styles.subtitle}>Juego de palabras multijugador</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="Tu nombre"
          value={playerName}
          onChangeText={(text) => {
            setPlayerName(text);
            setError("");
          }}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title="Crear Partida"
          onPress={createRoom}
          variant="primary"
          size="large"
          disabled={loading}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input
          placeholder="Código de sala (ej: ABCD)"
          value={roomCode}
          onChangeText={(text) => {
            setRoomCode(text.toUpperCase());
            setError("");
          }}
          autoCapitalize="characters"
          maxLength={4}
        />

        <Button
          title={loading ? "Conectando..." : "Unirse a Partida"}
          onPress={joinRoom}
          variant="secondary"
          size="large"
          disabled={loading}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Verificando sala...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Reúne a tus amigos y empieza a jugar
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  form: {
    flex: 1,
    justifyContent: "center",
    marginTop: -100,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  primaryButton: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  secondaryButtonText: {
    color: "#3498db",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 16,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    color: "#7f8c8d",
    fontSize: 14,
    textAlign: "center",
  },
});
