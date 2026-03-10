import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useGestureDetector } from "../src/hooks/useGestureDetector";
import { useSocket } from "../src/hooks/useSocket";
import { gameApi, WS_BASE_URL } from "../src/services/api";

const { height } = Dimensions.get("window");

const ROUNDS = [
  {
    id: 1,
    name: "Descripcion",
    icon: "💬",
    description: "Describe sin decir la palabra. Tu equipo debe adivinar.",
  },
  {
    id: 2,
    name: "Una Palabra",
    icon: "🎯",
    description: "Solo puedes usar una palabra para dar la pista.",
  },
  {
    id: 3,
    name: "Mimica",
    icon: "🤸",
    description: "Nada de hablar: solo gestos y actuacion.",
  },
  {
    id: 4,
    name: "Sonidos",
    icon: "🔊",
    description: "Usa sonidos, pero sin palabras completas.",
  },
];

const INTRO_DURATION_MS = 2000;

export default function GameScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const params = useLocalSearchParams();

  const roomCode = (params.roomCode as string) || "";
  const playerId = (params.playerId as string) || "";
  const playerName = (params.playerName as string) || "Jugador";

  const parseRounds = (value: string | undefined) => {
    if (!value) return [true, true, true, true];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    } catch {}
    return [true, true, true, true];
  };

  const configuredTimePerTurn = parseInt(
    (params.timePerTurn as string) || "60",
    10,
  );
  const enabledRoundsFlags = parseRounds(params.rounds as string);
  const activeRounds = ROUNDS.filter((_, index) => enabledRoundsFlags[index]);

  const allowNavigationRef = useRef(false);
  const endTurnSentRef = useRef(false);
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.95)).current;
  const cardAnimation = useRef(new Animated.Value(0)).current;

  const wsUrl = WS_BASE_URL;
  const { on, off, emit } = useSocket({
    url: wsUrl,
    roomCode,
    enabled: true,
    clientName: playerName,
  });

  const [introVisible, setIntroVisible] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(configuredTimePerTurn);
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [turnStarted, setTurnStarted] = useState(false);
  const [isStartingTurn, setIsStartingTurn] = useState(false);

  const isMyTurn = String(currentPlayer?.id || "") === playerId;

  const currentRoundInfo =
    activeRounds.find((r) => r.id === currentRound) ||
    activeRounds[0] ||
    ROUNDS[0];

  const showIntro = () => {
    setIntroVisible(true);
    introOpacity.setValue(0);
    introScale.setValue(0.95);

    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(introScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(introOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => setIntroVisible(false));
      }, INTRO_DURATION_MS);
    });
  };

  useEffect(() => {
    showIntro();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (allowNavigationRef.current) {
        return;
      }

      e.preventDefault();
      Alert.alert(
        "Salir de la partida",
        "Si sales ahora perderas el progreso de esta partida. Seguro que quieres salir?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => {
              allowNavigationRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const applyState = (state: any) => {
      if (!state) return;
      if (state.current_round) setCurrentRound(state.current_round);
      if (state.current_player) setCurrentPlayer(state.current_player);
      if (
        typeof state.team1_score === "number" &&
        typeof state.team2_score === "number"
      ) {
        setScore({ team1: state.team1_score, team2: state.team2_score });
      }

      const endsAt = state.turn_ends_at
        ? new Date(state.turn_ends_at).getTime()
        : 0;
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setTurnStarted(secondsLeft > 0);
      setTimeLeft(secondsLeft > 0 ? secondsLeft : configuredTimePerTurn);

      if (state.current_word?.text) {
        setCurrentWord(state.current_word.text);
      }
    };

    const handleGameState = (data: any) => applyState(data);
    const handleTurnStarted = (data: any) => {
      applyState(data);
      setIsStartingTurn(false);
    };
    const handleWordUpdate = (data: any) => {
      applyState(data);
      if (data?.current_word?.text) {
        setCurrentWord(data.current_word.text);
      }
    };
    const handleTurnEnded = (data: any) => {
      applyState(data);
      setCurrentWord(null);
      setIsStartingTurn(false);
      endTurnSentRef.current = false;
    };

    on("game_state", handleGameState);
    on("turn_started", handleTurnStarted);
    on("word_update", handleWordUpdate);
    on("turn_ended", handleTurnEnded);

    return () => {
      off("game_state", handleGameState);
      off("turn_started", handleTurnStarted);
      off("word_update", handleWordUpdate);
      off("turn_ended", handleTurnEnded);
    };
  }, [configuredTimePerTurn, off, on]);

  useEffect(() => {
    if (!turnStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setTurnStarted(false);
          if (isMyTurn && !endTurnSentRef.current) {
            endTurnSentRef.current = true;
            emit("end_turn", {});
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emit, isMyTurn, turnStarted]);

  const startTurn = async () => {
    if (!isMyTurn || isStartingTurn) return;

    setIsStartingTurn(true);
    try {
      await gameApi.startTurn(roomCode, playerId);
      endTurnSentRef.current = false;
    } catch (err: any) {
      setIsStartingTurn(false);
      Alert.alert(
        "No se pudo iniciar turno",
        err?.response?.data?.error || "Error al comenzar el turno",
      );
    }
  };

  const wordGuessed = () => {
    if (!isMyTurn || !turnStarted) return;

    Animated.timing(cardAnimation, {
      toValue: -height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      emit("word_guessed", {});
      cardAnimation.setValue(0);
    });
  };

  const wordSkipped = () => {
    if (!isMyTurn || !turnStarted) return;

    Animated.timing(cardAnimation, {
      toValue: height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      emit("skip_word", {});
      cardAnimation.setValue(0);
    });
  };

  useGestureDetector({
    onSwipeUp: wordGuessed,
    enabled: isMyTurn && turnStarted,
    threshold: 1.2,
  });

  return (
    <View style={styles.container}>
      {introVisible && (
        <Animated.View
          style={[
            styles.introOverlay,
            { opacity: introOpacity, transform: [{ scale: introScale }] },
          ]}
        >
          <Text style={styles.introTitle}>Ronda {currentRound}</Text>
          <Text style={styles.introMode}>{currentRoundInfo.name}</Text>
          <Text style={styles.introDescription}>
            {currentRoundInfo.description}
          </Text>
        </Animated.View>
      )}

      <View style={styles.topBar}>
        <Text style={styles.roundText}>
          {currentRoundInfo.icon} Ronda {currentRound}: {currentRoundInfo.name}
        </Text>
        <Text style={styles.timerText}>
          {turnStarted ? `${timeLeft}s` : "--"}
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.miniScore}>🔵 {score.team1}</Text>
        <Text style={styles.miniScore}>🔴 {score.team2}</Text>
      </View>

      <View style={styles.centerCard}>
        <Text style={styles.currentPlayerLabel}>Le toca a:</Text>
        <Text style={styles.currentPlayerName}>
          {currentPlayer?.name || "..."}
        </Text>

        {!turnStarted && isMyTurn && (
          <TouchableOpacity style={styles.startButton} onPress={startTurn}>
            <Text style={styles.startButtonText}>
              {isStartingTurn ? "Iniciando..." : "Comenzar a jugar"}
            </Text>
          </TouchableOpacity>
        )}

        {!turnStarted && !isMyTurn && (
          <Text style={styles.waitingText}>
            Esperando a que inicie su turno...
          </Text>
        )}
      </View>

      {turnStarted && isMyTurn ? (
        <>
          <Animated.View
            style={[
              styles.wordCard,
              {
                transform: [{ translateY: cardAnimation }],
              },
            ]}
          >
            <Text style={styles.wordText}>
              {currentWord || "Preparando palabra..."}
            </Text>
          </Animated.View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={wordSkipped}
            >
              <Text style={styles.actionButtonText}>⏭️ Pasar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.correctButton]}
              onPress={wordGuessed}
            >
              <Text style={styles.actionButtonText}>✅ Correcto</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : turnStarted ? (
        <View style={styles.observerBox}>
          <Text style={styles.waitingText}>
            Turno en curso. Ayuda a {currentPlayer?.name || "tu companero"} a
            adivinar.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3498db",
    padding: 20,
  },
  introOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17, 24, 39, 0.92)",
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  introTitle: {
    color: "#93c5fd",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  introMode: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  introDescription: {
    color: "#dbeafe",
    fontSize: 17,
    textAlign: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  roundText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    paddingRight: 8,
  },
  timerText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    minWidth: 72,
    textAlign: "right",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  miniScore: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  centerCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
  },
  currentPlayerLabel: {
    color: "#dbeafe",
    fontSize: 14,
    marginBottom: 6,
  },
  currentPlayerName: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 14,
  },
  startButton: {
    backgroundColor: "white",
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonText: {
    color: "#1d4ed8",
    fontSize: 18,
    fontWeight: "700",
  },
  waitingText: {
    color: "#e5e7eb",
    fontSize: 16,
    textAlign: "center",
  },
  wordCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 34,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  wordText: {
    fontSize: 46,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 4,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#e74c3c",
  },
  correctButton: {
    backgroundColor: "#27ae60",
  },
  actionButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  observerBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
});
