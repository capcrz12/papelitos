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
import { useRouter } from "expo-router";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";

interface Player {
  id: string;
  name: string;
  team: number | null;
  isMe?: boolean;
}

// Mock data for now
const mockPlayers: Player[] = [
  { id: "1", name: "Carlos", team: 1, isMe: true },
  { id: "2", name: "Ana", team: 1 },
  { id: "3", name: "Luis", team: 2 },
  { id: "4", name: "María", team: 2 },
];

export default function LobbyScreen() {
  const [roomCode, setRoomCode] = useState("ABCD");
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [isHost, setIsHost] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("Carlos");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({
    timePerTurn: 60,
    wordsPerPlayer: 3,
    maxPlayers: 8,
    rounds: 4,
  });
  const router = useRouter();

  const myPlayer = players.find((p) => p.isMe);

  const startGame = () => {
    if (players.length < 4) {
      Alert.alert("Error", "Se necesitan al menos 4 jugadores para comenzar");
      return;
    }
    const team1 = players.filter((p) => p.team === 1).length;
    const team2 = players.filter((p) => p.team === 2).length;
    if (team1 === 0 || team2 === 0) {
      Alert.alert("Error", "Ambos equipos deben tener al menos 1 jugador");
      return;
    }
    router.push("/game");
  };

  const changeTeam = (playerId: string, newTeam: number) => {
    setPlayers(
      players.map((p) => (p.id === playerId ? { ...p, team: newTeam } : p))
    );
  };

  const autoAssignTeams = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const updated = shuffled.map((p, index) => ({
      ...p,
      team: (index % 2) + 1,
    }));
    setPlayers(updated);
    Alert.alert("Equipos asignados", "Los jugadores se han distribuido aleatoriamente");
  };

  const saveName = () => {
    if (newName.trim()) {
      setPlayers(
        players.map((p) => (p.isMe ? { ...p, name: newName.trim() } : p))
      );
      setEditingName(false);
    }
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
        {/* Team actions */}
        {isHost && (
          <View style={styles.actionsContainer}>
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
