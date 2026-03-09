import React, { useState, useEffect, useRef } from "react";
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

const { height } = Dimensions.get("window");

const ROUNDS = [
  {
    id: 1,
    name: "Descripción",
    icon: "💬",
    description: "Describe sin decir la palabra",
  },
  { id: 2, name: "Una Palabra", icon: "🎯", description: "Solo una palabra" },
  { id: 3, name: "Mímica", icon: "🤸", description: "Solo gestos" },
  { id: 4, name: "Sonidos", icon: "🔊", description: "Solo sonidos" },
];

export default function GameScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const params = useLocalSearchParams();
  const allowNavigationRef = useRef(false);

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

  const [currentRound, setCurrentRound] = useState(1);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [currentWord, setCurrentWord] = useState("Elefante");
  const [timeLeft, setTimeLeft] = useState(configuredTimePerTurn);
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordsGuessed, setWordsGuessed] = useState(0);
  const [gesturesEnabled, setGesturesEnabled] = useState(false);

  const cardAnimation = new Animated.Value(0);

  const wordGuessed = () => {
    // Animate card away
    Animated.timing(cardAnimation, {
      toValue: -height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setWordsGuessed(wordsGuessed + 1);
      setScore({ ...score, team1: score.team1 + 1 });
      setCurrentWord("Siguiente palabra"); // TODO: Get next word
      cardAnimation.setValue(0);
    });
  };

  const wordSkipped = () => {
    // Animate card away
    Animated.timing(cardAnimation, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentWord("Siguiente palabra"); // TODO: Get next word
      cardAnimation.setValue(0);
    });
  };

  // Alias for button press
  const wordCorrect = wordGuessed;

  // Enable gesture detection when playing
  useGestureDetector({
    onSwipeUp: wordGuessed,
    enabled: gesturesEnabled && isPlaying,
    threshold: 1.2,
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      endTurn();
      setGesturesEnabled(true);
      Alert.alert(
        "¡Listos!",
        "Mueve el móvil hacia arriba cuando acierten una palabra",
        [{ text: "OK" }],
      );
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (allowNavigationRef.current) {
        return;
      }

      e.preventDefault();
      Alert.alert(
        "Salir de la partida",
        "Si sales ahora perderas el progreso de esta partida. ¿Seguro que quieres salir?",
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

  const startTurn = () => {
    setIsPlaying(true);
    setGesturesEnabled(false);
    setTimeLeft(configuredTimePerTurn);
    setWordsGuessed(0);
  };

  const endTurn = () => {
    setIsPlaying(false);
    // TODO: Send results to server
    setIsMyTurn(false);
  };

  if (!isMyTurn && !isPlaying) {
    return (
      <View style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>No es tu turno</Text>
          <Text style={styles.waitingSubtitle}>
            Ayuda a tu compañero a adivinar las palabras
          </Text>
          <View style={styles.scoreBoard}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>🔵 Equipo 1</Text>
              <Text style={styles.scoreValue}>{score.team1}</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>🔴 Equipo 2</Text>
              <Text style={styles.scoreValue}>{score.team2}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.roundText}>
          {(activeRounds[currentRound - 1] || ROUNDS[0]).icon} Ronda{" "}
          {currentRound}: {(activeRounds[currentRound - 1] || ROUNDS[0]).name}
        </Text>
        <Text style={styles.timerText}>{timeLeft}s</Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.miniScore}>🔵 {score.team1}</Text>
        <Text style={styles.miniScore}>🔴 {score.team2}</Text>
      </View>

      {!isPlaying ? (
        <View style={styles.startContainer}>
          <Text style={styles.roundDescription}>
            {(activeRounds[currentRound - 1] || ROUNDS[0]).description}
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={startTurn}>
            <Text style={styles.startButtonText}>Comenzar mi turno</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Animated.View
            style={[
              styles.wordCard,
              {
                transform: [{ translateY: cardAnimation }],
              },
            ]}
          >
            <Text style={styles.wordText}>{currentWord}</Text>
            <Text style={styles.wordsGuessedText}>
              Palabras acertadas: {wordsGuessed}
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
              onPress={wordCorrect}
            >
              <Text style={styles.actionButtonText}>✅ ¡Correcto!</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.instructionText}>
            🔼 Mueve el móvil hacia arriba cuando acierten o toca "¡Correcto!"
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3498db",
    padding: 20,
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
  },
  timerText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
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
  wordCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wordText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
  },
  wordsGuessedText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
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
  instructionText: {
    color: "white",
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    opacity: 0.8,
  },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  roundDescription: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: "white",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
  },
  startButtonText: {
    color: "#3498db",
    fontSize: 20,
    fontWeight: "bold",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  waitingSubtitle: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 40,
  },
  scoreBoard: {
    flexDirection: "row",
    gap: 30,
  },
  scoreItem: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  scoreLabel: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  scoreValue: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
});
