import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";

type Team = 1 | 2;

interface PlayerConfig {
  id: string;
  name: string;
  team: Team;
}

interface GameSetup {
  timePerTurn: number;
  wordsPerPlayer: number;
  rounds: boolean[];
  players: PlayerConfig[];
}

const roundNames = [
  "Ronda 1: Descripcion",
  "Ronda 2: Una palabra",
  "Ronda 3: Mimica",
  "Ronda 4: Sonidos",
];

export default function ConfigScreen() {
  const router = useRouter();

  const [timePerTurn, setTimePerTurn] = useState(60);
  const [wordsPerPlayer, setWordsPerPlayer] = useState(3);
  const [rounds, setRounds] = useState<boolean[]>([true, true, true, true]);

  const [players, setPlayers] = useState<PlayerConfig[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState<Team>(1);

  const timeOptions = [30, 45, 60, 90, 120];
  const wordsOptions = [2, 3, 4, 5, 6];

  const teamOneCount = players.filter((player) => player.team === 1).length;
  const teamTwoCount = players.filter((player) => player.team === 2).length;

  const toggleRound = (index: number) => {
    setRounds((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) {
      Alert.alert("Nombre requerido", "Escribe el nombre del jugador.");
      return;
    }

    setPlayers((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        name,
        team: newPlayerTeam,
      },
    ]);

    setNewPlayerName("");
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  const startWordSubmission = () => {
    if (!rounds.some(Boolean)) {
      Alert.alert("Configuracion incompleta", "Activa al menos una ronda.");
      return;
    }

    if (players.length < 2) {
      Alert.alert(
        "Jugadores insuficientes",
        "Necesitas al menos 2 jugadores para empezar.",
      );
      return;
    }

    if (teamOneCount === 0 || teamTwoCount === 0) {
      Alert.alert(
        "Equipos incompletos",
        "Debe haber al menos un jugador en cada equipo.",
      );
      return;
    }

    const setup: GameSetup = {
      timePerTurn,
      wordsPerPlayer,
      rounds,
      players,
    };

    router.push({
      pathname: "/word-submission",
      params: {
        setup: JSON.stringify(setup),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurar partida</Text>
        <Text style={styles.subtitle}>Todo se juega en este dispositivo</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tiempo por turno</Text>
          <View style={styles.optionsRow}>
            {timeOptions.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  value === timePerTurn && styles.optionButtonActive,
                ]}
                onPress={() => setTimePerTurn(value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    value === timePerTurn && styles.optionButtonTextActive,
                  ]}
                >
                  {value}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Palabras por jugador</Text>
          <View style={styles.optionsRow}>
            {wordsOptions.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  value === wordsPerPlayer && styles.optionButtonActive,
                ]}
                onPress={() => setWordsPerPlayer(value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    value === wordsPerPlayer && styles.optionButtonTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rondas activas</Text>
          {roundNames.map((name, index) => (
            <View key={name} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{name}</Text>
              <Switch
                value={rounds[index]}
                onValueChange={() => toggleRound(index)}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Jugadores y equipos</Text>

          <Input
            placeholder="Nombre del jugador"
            value={newPlayerName}
            onChangeText={setNewPlayerName}
          />

          <View style={styles.teamSelectRow}>
            <TouchableOpacity
              style={[
                styles.teamButton,
                newPlayerTeam === 1 && styles.teamButtonBlue,
              ]}
              onPress={() => setNewPlayerTeam(1)}
            >
              <Text style={styles.teamButtonText}>Equipo 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.teamButton,
                newPlayerTeam === 2 && styles.teamButtonRed,
              ]}
              onPress={() => setNewPlayerTeam(2)}
            >
              <Text style={styles.teamButtonText}>Equipo 2</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Agregar jugador"
            onPress={addPlayer}
            variant="secondary"
            size="medium"
          />

          <View style={styles.playersList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerRow}>
                <Text style={styles.playerText}>
                  {player.name} - Equipo {player.team}
                </Text>
                <TouchableOpacity onPress={() => removePlayer(player.id)}>
                  <Text style={styles.removeText}>Quitar</Text>
                </TouchableOpacity>
              </View>
            ))}
            {players.length === 0 && (
              <Text style={styles.emptyText}>Todavia no hay jugadores.</Text>
            )}
          </View>

          <Text style={styles.summaryText}>
            Equipo 1: {teamOneCount} | Equipo 2: {teamTwoCount}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continuar a palabras"
          onPress={startWordSubmission}
          variant="primary"
          size="large"
        />
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
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  optionButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  optionButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: "#1d4ed8",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    color: "#374151",
    fontWeight: "600",
  },
  teamSelectRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  teamButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  teamButtonBlue: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  teamButtonRed: {
    borderColor: "#dc2626",
    backgroundColor: "#fee2e2",
  },
  teamButtonText: {
    fontWeight: "700",
    color: "#1f2937",
  },
  playersList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    gap: 8,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerText: {
    color: "#111827",
  },
  removeText: {
    color: "#dc2626",
    fontWeight: "700",
  },
  emptyText: {
    color: "#6b7280",
  },
  summaryText: {
    marginTop: 12,
    color: "#374151",
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
  },
});
