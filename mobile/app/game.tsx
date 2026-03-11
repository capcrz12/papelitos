import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../src/components/Button";

interface PlayerConfig {
  id: string;
  name: string;
  team: 1 | 2;
}

interface GameSetup {
  timePerTurn: number;
  wordsPerPlayer: number;
  rounds: boolean[];
  players: PlayerConfig[];
}

const ROUND_META = [
  { id: 1, name: "Descripcion" },
  { id: 2, name: "Una palabra" },
  { id: 3, name: "Mimica" },
  { id: 4, name: "Sonidos" },
];

const fallbackSetup: GameSetup = {
  timePerTurn: 30,
  wordsPerPlayer: 3,
  rounds: [true, true, true, true],
  players: [],
};

const shuffle = (values: string[]) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function GameScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const setup = useMemo<GameSetup>(() => {
    const raw = params.setup as string | undefined;
    if (!raw) return fallbackSetup;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) return fallbackSetup;
      return {
        timePerTurn: Number(parsed.timePerTurn) || 30,
        wordsPerPlayer: Number(parsed.wordsPerPlayer) || 3,
        rounds:
          Array.isArray(parsed.rounds) && parsed.rounds.length === 4
            ? parsed.rounds
            : [true, true, true, true],
        players: parsed.players,
      };
    } catch {
      return fallbackSetup;
    }
  }, [params.setup]);

  const allWords = useMemo<string[]>(() => {
    const raw = params.words as string | undefined;
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((word) => String(word)).filter(Boolean);
    } catch {
      return [];
    }
  }, [params.words]);

  const enabledRounds = useMemo<number[]>(() => {
    const indices = setup.rounds
      .map((enabled, index) => (enabled ? index + 1 : null))
      .filter((value): value is number => value !== null);
    return indices.length > 0 ? indices : [1];
  }, [setup.rounds]);

  const [roundPosition, setRoundPosition] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [queue, setQueue] = useState<string[]>(() => shuffle(allWords));
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [turnActive, setTurnActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(setup.timePerTurn);

  const [teamScores, setTeamScores] = useState({ team1: 0, team2: 0 });
  const [roundScores, setRoundScores] = useState({ team1: 0, team2: 0 });
  const [roundWins, setRoundWins] = useState({ team1: 0, team2: 0 });
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [turnSummary, setTurnSummary] = useState("");
  const [gameFinished, setGameFinished] = useState(false);

  const guessedThisTurnRef = useRef(0);

  const currentPlayer = setup.players[currentPlayerIndex];
  const currentRoundNumber = enabledRounds[roundPosition] || 1;
  const currentRoundName =
    ROUND_META.find((round) => round.id === currentRoundNumber)?.name ||
    ROUND_META[0].name;

  useEffect(() => {
    if (!turnActive) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          endTurn();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const advancePlayer = () => {
    if (setup.players.length === 0) return;
    setCurrentPlayerIndex((previous) => (previous + 1) % setup.players.length);
  };

  const completeRound = () => {
    let message = `Fin de ronda ${currentRoundNumber}. `;

    if (roundScores.team1 > roundScores.team2) {
      setRoundWins((previous) => ({ ...previous, team1: previous.team1 + 1 }));
      message += "Gana Equipo 1.";
    } else if (roundScores.team2 > roundScores.team1) {
      setRoundWins((previous) => ({ ...previous, team2: previous.team2 + 1 }));
      message += "Gana Equipo 2.";
    } else {
      message += "Empate.";
    }

    const isLastRound = roundPosition >= enabledRounds.length - 1;

    setTurnSummary(message);
    setTurnActive(false);
    setCurrentWord(null);
    guessedThisTurnRef.current = 0;

    if (isLastRound) {
      setGameFinished(true);
      return;
    }

    setRoundPosition((previous) => previous + 1);
    setRoundScores({ team1: 0, team2: 0 });
    setQueue(shuffle(allWords));
    setTimeLeft(setup.timePerTurn);
    advancePlayer();
  };

  const endTurn = () => {
    if (!turnActive && !gameFinished) {
      return;
    }

    const guessed = guessedThisTurnRef.current;
    guessedThisTurnRef.current = 0;

    setTurnActive(false);
    setCurrentWord(null);
    setTimeLeft(setup.timePerTurn);

    if (currentPlayer) {
      setTurnSummary(
        `${currentPlayer.name} acerto ${guessed} palabra${guessed === 1 ? "" : "s"} en su turno.`,
      );
    }

    if (queue.length === 0) {
      completeRound();
      return;
    }

    advancePlayer();
  };

  const startTurn = () => {
    if (!currentPlayer || gameFinished) return;

    if (queue.length === 0) {
      completeRound();
      return;
    }

    guessedThisTurnRef.current = 0;
    setTurnSummary("");
    setTurnActive(true);
    setTimeLeft(setup.timePerTurn);
    setCurrentWord(queue[0]);
  };

  const wordGuessed = () => {
    if (!turnActive || !currentPlayer || !currentWord) return;

    guessedThisTurnRef.current += 1;

    setTeamScores((previous) =>
      currentPlayer.team === 1
        ? { ...previous, team1: previous.team1 + 1 }
        : { ...previous, team2: previous.team2 + 1 },
    );

    setRoundScores((previous) =>
      currentPlayer.team === 1
        ? { ...previous, team1: previous.team1 + 1 }
        : { ...previous, team2: previous.team2 + 1 },
    );

    setPlayerScores((previous) => ({
      ...previous,
      [currentPlayer.id]: (previous[currentPlayer.id] || 0) + 1,
    }));

    const nextQueue = queue.slice(1);
    setQueue(nextQueue);

    if (nextQueue.length === 0) {
      setCurrentWord(null);
      endTurn();
      return;
    }

    setCurrentWord(nextQueue[0]);
  };

  const skipWord = () => {
    if (!turnActive || queue.length === 0) return;
    if (queue.length === 1) {
      setCurrentWord(queue[0]);
      return;
    }

    const nextQueue = [...queue.slice(1), queue[0]];
    setQueue(nextQueue);
    setCurrentWord(nextQueue[0]);
  };

  const returnToStart = () => {
    Alert.alert("Salir", "Volveras al inicio y se perdera la partida.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Volver",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  };

  if (setup.players.length === 0 || allWords.length === 0) {
    return (
      <View style={styles.centerFallback}>
        <Text style={styles.fallbackText}>
          Faltan datos para iniciar el juego.
        </Text>
        <Button
          title="Volver a configurar"
          onPress={() => router.replace("/config")}
          variant="primary"
          size="large"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundText}>
          Ronda {currentRoundNumber}: {currentRoundName}
        </Text>
        <Text style={styles.timerText}>
          {turnActive ? `${timeLeft}s` : "--"}
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>Equipo 1: {teamScores.team1}</Text>
        <Text style={styles.scoreText}>Equipo 2: {teamScores.team2}</Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.smallScoreText}>
          Rondas ganadas E1: {roundWins.team1}
        </Text>
        <Text style={styles.smallScoreText}>
          Rondas ganadas E2: {roundWins.team2}
        </Text>
      </View>

      <View style={styles.turnCard}>
        <Text style={styles.turnLabel}>Turno de</Text>
        <Text style={styles.playerName}>{currentPlayer?.name || "-"}</Text>
        <Text style={styles.teamLabel}>
          Equipo {currentPlayer?.team || "-"}
        </Text>

        {!turnActive && !gameFinished && (
          <Button
            title="Iniciar turno"
            onPress={startTurn}
            variant="primary"
            size="large"
          />
        )}
      </View>

      {turnActive && (
        <>
          <View style={styles.wordCard}>
            <Text style={styles.wordText}>
              {currentWord || "Preparando palabra..."}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={skipWord}
            >
              <Text style={styles.actionButtonText}>Pasar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.correctButton]}
              onPress={wordGuessed}
            >
              <Text style={styles.actionButtonText}>Correcto</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.endTurnContainer}>
            <TouchableOpacity onPress={endTurn}>
              <Text style={styles.endTurnText}>Terminar turno ahora</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!!turnSummary && <Text style={styles.turnSummary}>{turnSummary}</Text>}

      <ScrollView style={styles.playerScoresContainer}>
        <Text style={styles.playerScoresTitle}>Puntuacion individual</Text>
        {setup.players
          .slice()
          .sort((a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0))
          .map((player) => (
            <Text key={player.id} style={styles.playerScoreLine}>
              {player.name} (E{player.team}): {playerScores[player.id] || 0}
            </Text>
          ))}
      </ScrollView>

      {gameFinished && (
        <View style={styles.finishedCard}>
          <Text style={styles.finishedTitle}>Partida terminada</Text>
          <Text style={styles.finishedSubtitle}>
            {roundWins.team1 === roundWins.team2
              ? "Empate final"
              : roundWins.team1 > roundWins.team2
                ? "Gana Equipo 1"
                : "Gana Equipo 2"}
          </Text>
          <Button
            title="Nueva partida"
            onPress={() => router.replace("/")}
            variant="primary"
            size="large"
          />
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={returnToStart}>
          <Text style={styles.exitText}>Salir de la partida</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 16,
    paddingTop: 44,
  },
  centerFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
    gap: 14,
  },
  fallbackText: {
    fontSize: 18,
    color: "#991b1b",
    fontWeight: "700",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundText: {
    color: "white",
    fontWeight: "700",
    fontSize: 20,
    flex: 1,
    paddingRight: 10,
  },
  timerText: {
    color: "white",
    fontWeight: "800",
    fontSize: 34,
    minWidth: 80,
    textAlign: "right",
  },
  scoreRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreText: {
    color: "#dbeafe",
    fontSize: 16,
    fontWeight: "700",
  },
  smallScoreText: {
    color: "#bfdbfe",
    fontSize: 13,
    fontWeight: "600",
  },
  turnCard: {
    marginTop: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  turnLabel: {
    color: "#bfdbfe",
    fontSize: 14,
  },
  playerName: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
  },
  teamLabel: {
    color: "#dbeafe",
    marginBottom: 8,
    fontWeight: "700",
  },
  wordCard: {
    marginTop: 14,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 22,
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  wordText: {
    fontSize: 40,
    color: "#1f2937",
    fontWeight: "800",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#dc2626",
  },
  correctButton: {
    backgroundColor: "#16a34a",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
  },
  endTurnContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  endTurnText: {
    color: "#dbeafe",
    textDecorationLine: "underline",
  },
  turnSummary: {
    marginTop: 12,
    color: "#fef3c7",
    textAlign: "center",
    fontWeight: "700",
  },
  playerScoresContainer: {
    marginTop: 12,
    maxHeight: 140,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  playerScoresTitle: {
    color: "#dbeafe",
    fontWeight: "800",
    marginBottom: 6,
  },
  playerScoreLine: {
    color: "white",
    marginBottom: 4,
  },
  finishedCard: {
    marginTop: 14,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  finishedTitle: {
    color: "#92400e",
    fontWeight: "800",
    fontSize: 20,
    textAlign: "center",
  },
  finishedSubtitle: {
    color: "#78350f",
    textAlign: "center",
    fontWeight: "700",
  },
  footer: {
    marginTop: 10,
    paddingBottom: 18,
    alignItems: "center",
  },
  exitText: {
    color: "#dbeafe",
  },
});
