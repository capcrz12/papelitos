import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  type LayoutChangeEvent,
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MotiView } from "moti";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { LoadingOverlay } from "../src/components/LoadingOverlay";

type Team = 1 | 2;

interface PlayerConfig {
  id: string;
  name: string;
  team: Team;
}

interface MatchSettings {
  timePerTurn: number;
  wordsPerPlayer: number;
  skipsPerTurn: number | null;
  rounds: boolean[];
}

const formatSkipsPerTurn = (value: number | null) =>
  value === null
    ? "pases ilimitados"
    : `${value} pase${value === 1 ? "" : "s"}`;

interface DropZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggablePlayerChipProps {
  player: PlayerConfig;
  onDrop: (playerId: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}

function DraggablePlayerChip({
  player,
  onDrop,
  onRemove,
}: DraggablePlayerChipProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.08);

  const panGesture = Gesture.Pan()
    .minDistance(2)
    .onBegin(() => {
      scale.value = withSpring(1.06);
      shadowOpacity.value = withTiming(0.22, { duration: 160 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onFinalize((event) => {
      scale.value = withSpring(1);
      shadowOpacity.value = withTiming(0.08, { duration: 160 });
      translateX.value = withSpring(0, { damping: 12, stiffness: 190 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 190 });
      runOnJS(onDrop)(player.id, event.absoluteX, event.absoluteY);
    });

  const animatedChipStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    shadowOpacity: shadowOpacity.value,
    zIndex: scale.value > 1 ? 20 : 1,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={[styles.playerChip, animatedChipStyle]}>
        <Text style={styles.playerChipText}>{player.name}</Text>
        <TouchableOpacity
          onPress={() => onRemove(player.id)}
          style={styles.playerChipRemoveButton}
        >
          <Text style={styles.playerChipClose}>×</Text>
        </TouchableOpacity>
      </Reanimated.View>
    </GestureDetector>
  );
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
        skipsPerTurn: 1,
        rounds: [true, true, true, true],
      };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        timePerTurn: Number(parsed.timePerTurn) || 30,
        wordsPerPlayer: Number(parsed.wordsPerPlayer) || 3,
        skipsPerTurn:
          parsed.skipsPerTurn === null
            ? null
            : Number(parsed.skipsPerTurn) > 0
              ? Number(parsed.skipsPerTurn)
              : 1,
        rounds:
          Array.isArray(parsed.rounds) && parsed.rounds.length === 4
            ? parsed.rounds
            : [true, true, true, true],
      };
    } catch {
      return {
        timePerTurn: 30,
        wordsPerPlayer: 3,
        skipsPerTurn: 1,
        rounds: [true, true, true, true],
      };
    }
  }, [params.settings]);

  const [players, setPlayers] = useState<PlayerConfig[]>(initialPlayers);
  const [newName, setNewName] = useState("");
  const [activeTeam, setActiveTeam] = useState<Team>(1);
  const [settings] = useState<MatchSettings>(initialSettings);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  const [dropZones, setDropZones] = useState<Partial<Record<Team, DropZone>>>(
    {},
  );

  const teamOneRef = useRef<View>(null);
  const teamTwoRef = useRef<View>(null);
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

  const updateDropZone = (team: Team) => {
    const ref = team === 1 ? teamOneRef.current : teamTwoRef.current;
    if (!ref) return;

    ref.measureInWindow((x, y, width, height) => {
      setDropZones((prev) => ({
        ...prev,
        [team]: { x, y, width, height },
      }));
    });
  };

  const updateDropZones = () => {
    requestAnimationFrame(() => {
      updateDropZone(1);
      updateDropZone(2);
    });
  };

  const handleTeamCardLayout = (_: LayoutChangeEvent) => {
    updateDropZones();
  };

  const pointInsideZone = (
    zone: DropZone | undefined,
    x: number,
    y: number,
  ) => {
    if (!zone) return false;
    return (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    );
  };

  const movePlayerToTeam = (playerId: string, team: Team) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, team } : player,
      ),
    );
  };

  const handleDropPlayer = (playerId: string, x: number, y: number) => {
    if (pointInsideZone(dropZones[1], x, y)) {
      movePlayerToTeam(playerId, 1);
      return;
    }

    if (pointInsideZone(dropZones[2], x, y)) {
      movePlayerToTeam(playerId, 2);
    }
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

  useEffect(() => {
    updateDropZones();
  }, [players.length]);

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

    setIsStartingMatch(true);
    setTimeout(() => {
      router.push({
        pathname: "/word-submission",
        params: {
          setup: JSON.stringify({
            players,
            timePerTurn: settings.timePerTurn,
            wordsPerPlayer: settings.wordsPerPlayer,
            skipsPerTurn: settings.skipsPerTurn,
            rounds: settings.rounds,
          }),
        },
      });
      setIsStartingMatch(false);
    }, 700);
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
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          <Pressable
            ref={teamOneRef}
            style={[styles.teamCard, styles.teamCardBlue]}
            onPress={() => setActiveTeam(1)}
            onLayout={handleTeamCardLayout}
          >
            <Text style={styles.teamTitle}>Equipo Azul</Text>
            <Text style={styles.teamCounter}>
              {team1Players.length} jugadores
            </Text>
            <View style={styles.chipsWrap}>
              {team1Players.map((player) => (
                <DraggablePlayerChip
                  key={player.id}
                  player={player}
                  onDrop={handleDropPlayer}
                  onRemove={removePlayer}
                />
              ))}
            </View>
            {team1Players.length === 0 && (
              <Text style={styles.emptyText}>Sin jugadores por ahora</Text>
            )}
          </Pressable>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 460, delay: 60 }}
        >
          <Pressable
            ref={teamTwoRef}
            style={[styles.teamCard, styles.teamCardRed]}
            onPress={() => setActiveTeam(2)}
            onLayout={handleTeamCardLayout}
          >
            <Text style={styles.teamTitle}>Equipo Rojo</Text>
            <Text style={styles.teamCounter}>
              {team2Players.length} jugadores
            </Text>
            <View style={styles.chipsWrap}>
              {team2Players.map((player) => (
                <DraggablePlayerChip
                  key={player.id}
                  player={player}
                  onDrop={handleDropPlayer}
                  onRemove={removePlayer}
                />
              ))}
            </View>
            {team2Players.length === 0 && (
              <Text style={styles.emptyText}>Sin jugadores por ahora</Text>
            )}
          </Pressable>
        </MotiView>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>Total: {players.length} jugadores</Text>
        <Text style={styles.footerConfigText}>
          {settings.timePerTurn}s por turno · {settings.wordsPerPlayer} palabras
          · {formatSkipsPerTurn(settings.skipsPerTurn)} ·{" "}
          {settings.rounds.filter(Boolean).length} rondas
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
      <LoadingOverlay
        visible={isStartingMatch}
        title="Preparando ronda inicial..."
      />
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
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 9,
    shadowOpacity: 0.08,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 9,
    gap: 8,
  },
  playerChipRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
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
