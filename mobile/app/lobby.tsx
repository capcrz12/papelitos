import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { useSocket } from "../src/hooks/useSocket";
import { gameApi } from "../src/services/api";

interface Player {
  id: string;
  name: string;
  team: number | null;
  isMe?: boolean;
}

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export default function LobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get parameters from navigation
  const playerName = (params.playerName as string) || "Jugador";
  const isHostParam = params.isHost === "true";
  const roomCodeParam = params.roomCode as string;
  const playerId = (params.playerId as string) || "1";
  const playerTeam = parseInt((params.playerTeam as string) || "1", 10);

  // Log received parameters for debugging
  console.log("Lobby params:", {
    playerName,
    isHostParam,
    roomCodeParam,
    playerId,
    playerTeam,
  });

  // If no room code provided, something went wrong - go back
  if (!roomCodeParam) {
    console.error("No room code provided to lobby!");
    Alert.alert("Error", "No se proporcionó código de sala");
    router.back();
    return null;
  }

  const [roomCode, setRoomCode] = useState(roomCodeParam);
  // Initialize with only the current player using real data from backend
  const [players, setPlayers] = useState<Player[]>([
    { id: playerId, name: playerName, team: playerTeam, isMe: true },
  ]);
  const [isHost, setIsHost] = useState(isHostParam);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(playerName);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({
    timePerTurn: parseInt(params.timePerTurn as string) || 60,
    wordsPerPlayer: parseInt(params.wordsPerPlayer as string) || 3,
    maxPlayers: parseInt(params.maxPlayers as string) || 8,
    rounds: 4,
  });

  // WebSocket connection
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "http://localhost:8000";
  const { socket, isConnected, emit, on, off } = useSocket({
    url: wsUrl,
    roomCode: roomCode,
    enabled: true,
  });

  // Listen to WebSocket for new players joining
  useEffect(() => {
    if (!on || !off) return;

    const normalizePlayers = (serverPlayers: any[]): Player[] =>
      serverPlayers.map((p) => ({
        id: String(p.id),
        name: p.name,
        team: p.team ?? null,
        isMe: String(p.id) === playerId,
      }));

    // Listen for room not found error
    const handleRoomNotFound = () => {
      Alert.alert("Sala no encontrada", "La sala no existe o ha expirado", [
        { text: "OK", onPress: () => router.back() },
      ]);
    };

    // Listen for player joined events
    const handlePlayerJoined = (data: any) => {
      console.log("Player joined:", data);
      if (data?.players) {
        setPlayers(normalizePlayers(data.players));
        return;
      }
      const newPlayer: Player = {
        id: data.player?.id?.toString(),
        name: data.player?.name,
        team: data.player?.team || null,
        isMe: data.player?.id?.toString() === playerId,
      };
      if (!newPlayer.id || !newPlayer.name) return;
      setPlayers((prev) =>
        prev.some((p) => p.id === newPlayer.id) ? prev : [...prev, newPlayer],
      );
    };

    // Main sync event from backend with full player list
    const handlePlayerUpdate = (data: any) => {
      if (!data?.players) return;
      setPlayers(normalizePlayers(data.players));
    };

    // Listen for player left events
    const handlePlayerLeft = (data: any) => {
      console.log("Player left:", data);
      setPlayers((prev) =>
        prev.filter((p) => p.id !== data.player_id.toString()),
      );
    };

    // Listen for team changes
    const handleTeamChanged = (data: any) => {
      console.log("Team changed:", data);
      if (data?.players) {
        setPlayers(normalizePlayers(data.players));
        return;
      }
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === data.player_id.toString() ? { ...p, team: data.team } : p,
        ),
      );
    };

    on("room_not_found", handleRoomNotFound);
    on("player_update", handlePlayerUpdate);
    on("player_joined", handlePlayerJoined);
    on("player_left", handlePlayerLeft);
    on("team_changed", handleTeamChanged);

    return () => {
      off("room_not_found", handleRoomNotFound);
      off("player_update", handlePlayerUpdate);
      off("player_joined", handlePlayerJoined);
      off("player_left", handlePlayerLeft);
      off("team_changed", handleTeamChanged);
    };
  }, [on, off, playerId, router]);

  const myPlayer = players.find((p) => p.isMe);

  const startGame = () => {
    if (players.length < 4) {
      Alert.alert(
        "Jugadores insuficientes",
        `Se necesitan al menos 4 jugadores para comenzar. Actualmente hay ${players.length}.`,
      );
      return;
    }
    const team1 = players.filter((p) => p.team === 1).length;
    const team2 = players.filter((p) => p.team === 2).length;
    if (team1 === 0 || team2 === 0) {
      Alert.alert("Error", "Ambos equipos deben tener al menos 1 jugador");
      return;
    }

    // Call backend to start game
    gameApi
      .startGame(roomCode)
      .then(() => {
        router.push("/game");
      })
      .catch((err) => {
        console.error("Error starting game:", err);
        Alert.alert("Error", "No se pudo iniciar la partida");
      });
  };

  const changeTeam = (playerId: string, newTeam: number) => {
    // Update locally first
    setPlayers(
      players.map((p) => (p.id === playerId ? { ...p, team: newTeam } : p)),
    );

    // Emit to server if connected
    if (isConnected && emit) {
      emit("change_team", { player_id: playerId, team: newTeam });
    }
  };

  const autoAssignTeams = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const updated = shuffled.map((p, index) => ({
      ...p,
      team: (index % 2) + 1,
    }));
    setPlayers(updated);
    Alert.alert(
      "Equipos asignados",
      "Los jugadores se han distribuido aleatoriamente",
    );
  };

  const saveName = () => {
    if (newName.trim()) {
      setPlayers(
        players.map((p) => (p.isMe ? { ...p, name: newName.trim() } : p)),
      );
      setEditingName(false);
    }
  };

  // TEMPORARY: Simulate a player joining (for testing until WebSocket is implemented)
  const simulatePlayerJoin = () => {
    const names = [
      "Ana",
      "Luis",
      "María",
      "Pedro",
      "Laura",
      "Diego",
      "Sofia",
      "Miguel",
    ];
    const availableNames = names.filter(
      (name) => !players.some((p) => p.name === name),
    );

    if (availableNames.length === 0 || players.length >= config.maxPlayers) {
      Alert.alert(
        "No se pueden agregar más jugadores",
        "Se ha alcanzado el máximo de jugadores",
      );
      return;
    }

    const randomName =
      availableNames[Math.floor(Math.random() * availableNames.length)];
    const newPlayer: Player = {
      id: `${players.length + 1}`,
      name: randomName,
      team: players.length % 2 === 0 ? 1 : 2,
      isMe: false,
    };

    setPlayers([...players, newPlayer]);
  };

  return (
    <View style={styles.container}>
      {/* Header with room code */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Salir</Text>
        </TouchableOpacity>
        <Text style={styles.roomCodeLabel}>Código de sala</Text>
        <Text style={styles.code}>{roomCode}</Text>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              isConnected ? styles.connectedDot : styles.disconnectedDot,
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? "Conectado" : "Conectando..."}
          </Text>
        </View>
        <Text style={styles.instruction}>
          Comparte este código con tus amigos
        </Text>
      </View>

      {/* Your profile card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Text style={styles.profileLabel}>Tu perfil</Text>
          {!editingName ? (
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text style={styles.editButton}>Editar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={saveName}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          )}
        </View>
        {!editingName ? (
          <Text style={styles.yourName}>{myPlayer?.name}</Text>
        ) : (
          <Input
            value={newName}
            onChangeText={setNewName}
            placeholder="Tu nombre"
            autoFocus
          />
        )}
      </View>

      <ScrollView style={styles.playersContainer}>
        {/* Waiting for players message */}
        {players.length < 4 && (
          <View style={styles.waitingForPlayersCard}>
            <Text style={styles.waitingForPlayersTitle}>
              ⏳ Esperando jugadores...
            </Text>
            <Text style={styles.waitingForPlayersText}>
              Faltan {4 - players.length} jugadores para comenzar (mínimo 4)
            </Text>
          </View>
        )}

        {/* Team actions */}
        {isHost && (
          <View style={styles.actionsContainer}>
            {/* TEMPORARY: Button to simulate player joining */}
            <Button
              title="➕ Simular jugador uniéndose (TEST)"
              onPress={simulatePlayerJoin}
              variant="secondary"
              size="medium"
            />
            <View style={{ height: 10 }} />
            <Button
              title="🔀 Asignar equipos automáticamente"
              onPress={autoAssignTeams}
              variant="secondary"
              size="medium"
            />
          </View>
        )}

        {/* Teams */}
        <View style={styles.teamContainer}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamTitle}>🔵 Equipo 1</Text>
            <Text style={styles.teamCount}>
              ({players.filter((p) => p.team === 1).length} jugadores)
            </Text>
          </View>
          {players
            .filter((p) => p.team === 1)
            .map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <Text style={styles.playerName}>
                  {player.name} {player.isMe && "(Tú)"}
                </Text>
                {player.isMe && (
                  <TouchableOpacity
                    onPress={() => changeTeam(player.id, 2)}
                    style={styles.changeTeamButton}
                  >
                    <Text style={styles.changeTeamText}>→ Equipo 2</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          {players.filter((p) => p.team === 1).length === 0 && (
            <Text style={styles.emptyTeamText}>No hay jugadores aún</Text>
          )}
        </View>

        <View style={styles.teamContainer}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamTitle}>🔴 Equipo 2</Text>
            <Text style={styles.teamCount}>
              ({players.filter((p) => p.team === 2).length} jugadores)
            </Text>
          </View>
          {players
            .filter((p) => p.team === 2)
            .map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <Text style={styles.playerName}>
                  {player.name} {player.isMe && "(Tú)"}
                </Text>
                {player.isMe && (
                  <TouchableOpacity
                    onPress={() => changeTeam(player.id, 1)}
                    style={styles.changeTeamButton}
                  >
                    <Text style={styles.changeTeamText}>← Equipo 1</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          {players.filter((p) => p.team === 2).length === 0 && (
            <Text style={styles.emptyTeamText}>No hay jugadores aún</Text>
          )}
        </View>

        {/* Configuration */}
        <View style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
            {isHost && (
              <TouchableOpacity onPress={() => router.push("/config")}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Tiempo por turno:</Text>
            <Text style={styles.settingValue}>{config.timePerTurn}s</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Palabras por jugador:</Text>
            <Text style={styles.settingValue}>{config.wordsPerPlayer}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Jugadores máximos:</Text>
            <Text style={styles.settingValue}>{config.maxPlayers}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rondas:</Text>
            <Text style={styles.settingValue}>{config.rounds}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer buttons */}
      {isHost && (
        <View style={styles.footer}>
          <Text style={styles.playerCountInfo}>
            {players.length} / {config.maxPlayers} jugadores
          </Text>
          <Button
            title="🎮 Comenzar Juego"
            onPress={startGame}
            variant="primary"
            size="large"
          />
        </View>
      )}

      {!isHost && (
        <View style={styles.footer}>
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>⏳ Esperando al anfitrión...</Text>
          </View>
        </View>
      )}
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
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3b82f6",
  },
  roomCodeLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 5,
  },
  code: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1f2937",
    letterSpacing: 4,
  },
  instruction: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 5,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedDot: {
    backgroundColor: "#22c55e",
  },
  disconnectedDot: {
    backgroundColor: "#ef4444",
  },
  connectionText: {
    fontSize: 12,
    color: "#6b7280",
  },
  profileCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  yourName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  editButton: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  saveButton: {
    fontSize: 14,
    color: "#22c55e",
    fontWeight: "600",
  },
  playersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  waitingForPlayersCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  waitingForPlayersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 4,
  },
  waitingForPlayersText: {
    fontSize: 14,
    color: "#92400e",
  },
  actionsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  teamContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  teamCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  playerCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  changeTeamButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  changeTeamText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
  },
  emptyTeamText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  settingsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  settingValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  playerCountInfo: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
  },
  waitingContainer: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  waitingText: {
    color: "#92400e",
    fontSize: 16,
    fontWeight: "500",
  },
});
