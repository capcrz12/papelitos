import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  UIManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";

type Team = 1 | 2;

interface PlayerConfig {
  id: string;
  name: string;
  team: Team;
}

interface MatchSettings {
  timePerTurn: number;
  wordsPerPlayer: number;
  rounds: boolean[];
}

export default function TeamsScreen() {
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const router = useRouter();
  const params = useLocalSearchParams();

  const initialPlayers = useMemo<PlayerConfig[]>(() => {
    const raw = params.players as string | undefined;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.players]);

  const initialSettings = useMemo<MatchSettings>(() => {
    const raw = params.settings as string | undefined;
    if (!raw) {
      return {
        timePerTurn: 30,
        wordsPerPlayer: 3,
        rounds: [true, true, true, true],
      };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        timePerTurn: Number(parsed.timePerTurn) || 30,
        wordsPerPlayer: Number(parsed.wordsPerPlayer) || 3,
        rounds:
          Array.isArray(parsed.rounds) && parsed.rounds.length === 4
            ? parsed.rounds
            : [true, true, true, true],
      };
    } catch {
      return {
        timePerTurn: 30,
        wordsPerPlayer: 3,
        rounds: [true, true, true, true],
      };
    }
  }, [params.settings]);

  const [players, setPlayers] = useState<PlayerConfig[]>(initialPlayers);
  const [newName, setNewName] = useState("");
  const [activeTeam, setActiveTeam] = useState<Team>(1);
  const [settings] = useState<MatchSettings>(initialSettings);
  const gearSpin = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;

  const team1Players = useMemo(
    () => players.filter((player) => player.team === 1),
    [players],
  );
  const team2Players = useMemo(
    () => players.filter((player) => player.team === 2),
    [players],
  );

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert("Nombre requerido", "Escribe un nombre para continuar.");
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlayers((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        name,
        team: activeTeam,
      },
    ]);
    setNewName("");
  };

  const removePlayer = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(gearSpin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [gearSpin]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1.03,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [ctaPulse]);

  const startMatch = () => {
    if (players.length < 2) {
      Alert.alert(
        "Jugadores insuficientes",
        "Necesitas al menos 2 jugadores para empezar.",
      );
      return;
    }

    if (team1Players.length === 0 || team2Players.length === 0) {
      Alert.alert(
        "Equipos incompletos",
        "Debe haber al menos un jugador en cada equipo.",
      );
      return;
    }

    router.push({
      pathname: "/word-submission",
      params: {
        setup: JSON.stringify({
          players,
          timePerTurn: settings.timePerTurn,
          wordsPerPlayer: settings.wordsPerPlayer,
          rounds: settings.rounds,
        }),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipos</Text>
        <Text style={styles.subtitle}>Agrega jugadores rapido y empieza</Text>
        <Animated.View style={styles.settingsIconButton}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/config",
                params: {
                  players: JSON.stringify(players),
                  settings: JSON.stringify(settings),
                },
              })
            }
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: gearSpin.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="options-outline" size={20} color="#0f172a" />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.addCard}>
        <Text style={styles.addCardTitle}>Quien se suma?</Text>
        <Input
          placeholder="Escribe nombre y pulsa +"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={addPlayer}
        />

        <View style={styles.teamSwitchRow}>
          <Pressable
            style={[
              styles.teamSwitchButton,
              activeTeam === 1 && styles.teamSwitchBlue,
            ]}
            onPress={() => setActiveTeam(1)}
          >
            <Text style={styles.teamSwitchText}>Azul</Text>
          </Pressable>
          <Pressable
            style={[
              styles.teamSwitchButton,
              activeTeam === 2 && styles.teamSwitchRed,
            ]}
            onPress={() => setActiveTeam(2)}
          >
            <Text style={styles.teamSwitchText}>Rojo</Text>
          </Pressable>
          <Pressable style={styles.plusButton} onPress={addPlayer}>
            <Text style={styles.plusButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.teamsArea}
        contentContainerStyle={styles.teamsContent}
      >
        <Pressable
          style={[styles.teamCard, styles.teamCardBlue]}
          onPress={() => setActiveTeam(1)}
        >
          <Text style={styles.teamTitle}>Equipo Azul</Text>
          <Text style={styles.teamCounter}>
            {team1Players.length} jugadores
          </Text>
          <View style={styles.chipsWrap}>
            {team1Players.map((player) => (
              <Pressable
                key={player.id}
                style={styles.playerChip}
                onPress={() => removePlayer(player.id)}
              >
                <Text style={styles.playerChipText}>{player.name}</Text>
                <Text style={styles.playerChipClose}>×</Text>
              </Pressable>
            ))}
          </View>
          {team1Players.length === 0 && (
            <Text style={styles.emptyText}>Sin jugadores por ahora</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.teamCard, styles.teamCardRed]}
          onPress={() => setActiveTeam(2)}
        >
          <Text style={styles.teamTitle}>Equipo Rojo</Text>
          <Text style={styles.teamCounter}>
            {team2Players.length} jugadores
          </Text>
          <View style={styles.chipsWrap}>
            {team2Players.map((player) => (
              <Pressable
                key={player.id}
                style={styles.playerChip}
                onPress={() => removePlayer(player.id)}
              >
                <Text style={styles.playerChipText}>{player.name}</Text>
                <Text style={styles.playerChipClose}>×</Text>
              </Pressable>
            ))}
          </View>
          {team2Players.length === 0 && (
            <Text style={styles.emptyText}>Sin jugadores por ahora</Text>
          )}
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>Total: {players.length} jugadores</Text>
        <Text style={styles.footerConfigText}>
          {settings.timePerTurn}s por turno · {settings.wordsPerPlayer} palabras
          · {settings.rounds.filter(Boolean).length} rondas
        </Text>
        <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
          <Button
            title="Comenzar partida"
            onPress={startMatch}
            variant="primary"
            size="large"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7ff",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: "relative",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    color: "#475569",
    fontWeight: "600",
  },
  settingsIconButton: {
    position: "absolute",
    right: 20,
    top: 50,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  addCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
    shadowColor: "#2563eb",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addCardTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 18,
  },
  teamSwitchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  teamSwitchButton: {
    flex: 0.44,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  teamSwitchBlue: {
    backgroundColor: "#dbeafe",
  },
  teamSwitchRed: {
    backgroundColor: "#fee2e2",
  },
  teamSwitchText: {
    fontWeight: "700",
    color: "#0f172a",
  },
  plusButton: {
    flex: 0.12,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  plusButtonText: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 29,
    fontWeight: "700",
  },
  teamsArea: {
    flex: 1,
    marginTop: 10,
  },
  teamsContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  teamCard: {
    borderRadius: 16,
    padding: 14,
  },
  teamCardBlue: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  teamCardRed: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  teamTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  teamCounter: {
    marginTop: 2,
    marginBottom: 8,
    color: "#475569",
    fontWeight: "600",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  playerChip: {
    backgroundColor: "white",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 9,
    gap: 8,
  },
  playerChipText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  playerChipClose: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
  },
  footer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 16,
  },
  footerHint: {
    textAlign: "center",
    color: "#475569",
    marginBottom: 4,
    fontWeight: "600",
  },
  footerConfigText: {
    textAlign: "center",
    color: "#334155",
    marginBottom: 10,
    fontWeight: "600",
  },
});
