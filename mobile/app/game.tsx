import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Audio, type AVPlaybackSource } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import { Button } from "../src/components/Button";

interface PlayerConfig {
  id: string;
  name: string;
  team: 1 | 2;
}

interface GameSetup {
  timePerTurn: number;
  wordsPerPlayer: number;
  skipsPerTurn: number | null;
  rounds: boolean[];
  players: PlayerConfig[];
}

const ROUND_META = [
  { id: 1, name: "Descripcion" },
  { id: 2, name: "Una palabra" },
  { id: 3, name: "Mimica" },
  { id: 4, name: "Sonidos" },
];

const ROUND_INSTRUCTIONS: Record<number, string> = {
  1: "Describe la palabra sin decir ninguna parte de ella.",
  2: "Solo puedes decir una palabra como pista.",
  3: "Sin hablar: solo mimos y gestos.",
  4: "Sin hablar: usa solo sonidos.",
};

const fallbackSetup: GameSetup = {
  timePerTurn: 30,
  wordsPerPlayer: 3,
  skipsPerTurn: 1,
  rounds: [true, true, true, true],
  players: [],
};

const SOUND_ASSETS = {
  start: require("../assets/sounds/start.mp3"),
  success: require("../assets/sounds/success.mp3"),
  clock: require("../assets/sounds/clock.mp3"),
  skip: require("../assets/sounds/skip.mp3"),
  ends: require("../assets/sounds/ends.mp3"),
} satisfies Record<
  "start" | "success" | "clock" | "skip" | "ends",
  AVPlaybackSource
>;

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
  const navigation = useNavigation();

  const setup = useMemo<GameSetup>(() => {
    const raw = params.setup as string | undefined;
    if (!raw) return fallbackSetup;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) return fallbackSetup;
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

  const team1Players = useMemo(
    () => setup.players.filter((player) => player.team === 1),
    [setup.players],
  );
  const team2Players = useMemo(
    () => setup.players.filter((player) => player.team === 2),
    [setup.players],
  );

  const [roundPosition, setRoundPosition] = useState(0);
  const [currentTurnTeam, setCurrentTurnTeam] = useState<1 | 2>(
    team1Players.length > 0 ? 1 : 2,
  );
  const [teamPlayerTurnIndices, setTeamPlayerTurnIndices] = useState<{
    1: number;
    2: number;
  }>({
    1: 0,
    2: 0,
  });
  const [queue, setQueue] = useState<string[]>(() => shuffle(allWords));
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [turnActive, setTurnActive] = useState(false);
  const [showRoundIntro, setShowRoundIntro] = useState(true);
  const [introRoundNumber, setIntroRoundNumber] = useState(
    enabledRounds[0] || 1,
  );
  const [preTurnCountdown, setPreTurnCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(setup.timePerTurn);
  const [skipsLeft, setSkipsLeft] = useState<number | null>(setup.skipsPerTurn);

  const [teamScores, setTeamScores] = useState({ team1: 0, team2: 0 });
  const [roundScores, setRoundScores] = useState({ team1: 0, team2: 0 });
  const [roundWins, setRoundWins] = useState({ team1: 0, team2: 0 });
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [roundPlayerScores, setRoundPlayerScores] = useState<
    Record<number, Record<string, number>>
  >({});
  const [turnSummary, setTurnSummary] = useState("");
  const [gameFinished, setGameFinished] = useState(false);

  const guessedThisTurnRef = useRef(0);
  const clockAlertPlayedRef = useRef(false);
  const allowExitRef = useRef(false);
  const finalNavigationDoneRef = useRef(false);
  const soundEffectsRef = useRef<
    Partial<Record<keyof typeof SOUND_ASSETS, Audio.Sound>>
  >({});

  const currentTeamPlayers =
    currentTurnTeam === 1 ? team1Players : team2Players;
  const currentTeamIndex = teamPlayerTurnIndices[currentTurnTeam];
  const currentPlayer =
    currentTeamPlayers.length > 0
      ? currentTeamPlayers[currentTeamIndex % currentTeamPlayers.length]
      : null;
  const currentRoundNumber = enabledRounds[roundPosition] || 1;
  const currentRoundName =
    ROUND_META.find((round) => round.id === currentRoundNumber)?.name ||
    ROUND_META[0].name;
  const introRoundName =
    ROUND_META.find((round) => round.id === introRoundNumber)?.name ||
    ROUND_META[0].name;
  const introRoundInstruction =
    ROUND_INSTRUCTIONS[introRoundNumber] ||
    "Adivina la mayor cantidad de palabras posible.";
  const currentTeamRoundScore =
    currentPlayer?.team === 2 ? roundScores.team2 : roundScores.team1;
  const isUrgentTime = timeLeft <= 10;

  const goToFinalResults = (finalRoundWins: {
    team1: number;
    team2: number;
  }) => {
    if (finalNavigationDoneRef.current) {
      return;
    }

    finalNavigationDoneRef.current = true;
    allowExitRef.current = true;

    router.replace({
      pathname: "/final-results",
      params: {
        setup: JSON.stringify(setup),
        stats: JSON.stringify({
          teamScores,
          roundWins: finalRoundWins,
          playerScores,
          roundPlayerScores,
          enabledRounds,
        }),
      },
    });
  };

  useEffect(() => {
    if (!turnActive) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          endTurn("timeout");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  useEffect(() => {
    if (!turnActive || clockAlertPlayedRef.current) {
      return;
    }

    if (timeLeft !== 10) {
      return;
    }

    clockAlertPlayedRef.current = true;
    void playSoundEffect("clock");
  }, [timeLeft, turnActive]);

  useEffect(() => {
    if (preTurnCountdown === null) return;

    const countdownTimer = setInterval(() => {
      setPreTurnCountdown((previous) => {
        if (previous === null) return null;
        if (previous <= 1) {
          clearInterval(countdownTimer);
          setTurnActive(true);
          setTimeLeft(setup.timePerTurn);
          setSkipsLeft(setup.skipsPerTurn);
          setCurrentWord(queue[0]);
          clockAlertPlayedRef.current = false;
          return null;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [preTurnCountdown, queue, setup.skipsPerTurn, setup.timePerTurn]);

  useEffect(() => {
    let mounted = true;

    const loadSounds = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const entries = await Promise.all(
        Object.entries(SOUND_ASSETS).map(async ([key, asset]) => {
          const { sound } = await Audio.Sound.createAsync(asset, {
            shouldPlay: false,
            volume: 1,
          });
          return [key, sound] as const;
        }),
      );

      if (!mounted) {
        await Promise.all(entries.map(([, sound]) => sound.unloadAsync()));
        return;
      }

      soundEffectsRef.current = Object.fromEntries(entries);
    };

    void loadSounds();

    return () => {
      mounted = false;
      const sounds = Object.values(soundEffectsRef.current).filter(Boolean);
      soundEffectsRef.current = {};
      void Promise.all(sounds.map((sound) => sound?.unloadAsync()));
    };
  }, []);

  const playSoundEffect = async (key: keyof typeof SOUND_ASSETS) => {
    const sound = soundEffectsRef.current[key];
    if (!sound) {
      return;
    }

    try {
      await sound.setPositionAsync(0);
      await sound.replayAsync();
    } catch {
      // Ignore audio playback errors to avoid interrupting the turn.
    }
  };

  const leaveMatch = (action?: {
    type: string;
    payload?: object;
    source?: string;
    target?: string;
  }) => {
    allowExitRef.current = true;

    if (action) {
      navigation.dispatch(action);
      return;
    }

    router.replace("/");
  };

  const confirmExit = (action?: {
    type: string;
    payload?: object;
    source?: string;
    target?: string;
  }) => {
    Alert.alert(
      "Salir de la partida",
      "La partida actual se perdera. Quieres salir de todos modos?",
      [
        { text: "Seguir jugando", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => leaveMatch(action),
        },
      ],
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (gameFinished || allowExitRef.current) {
        return;
      }

      event.preventDefault();
      confirmExit(
        event.data.action as {
          type: string;
          payload?: object;
          source?: string;
          target?: string;
        },
      );
    });

    return unsubscribe;
  }, [gameFinished, navigation]);

  const advancePlayer = () => {
    if (team1Players.length === 0 || team2Players.length === 0) return;

    setTeamPlayerTurnIndices((previous) => ({
      ...previous,
      [currentTurnTeam]: previous[currentTurnTeam] + 1,
    }));
    setCurrentTurnTeam((previous) => (previous === 1 ? 2 : 1));
  };

  const completeRound = () => {
    let message = `Fin de ronda ${currentRoundNumber}. `;
    let nextRoundWins = { ...roundWins };

    if (roundScores.team1 > roundScores.team2) {
      nextRoundWins = { ...roundWins, team1: roundWins.team1 + 1 };
      setRoundWins(nextRoundWins);
      message += "Gana Equipo 1.";
    } else if (roundScores.team2 > roundScores.team1) {
      nextRoundWins = { ...roundWins, team2: roundWins.team2 + 1 };
      setRoundWins(nextRoundWins);
      message += "Gana Equipo 2.";
    } else {
      message += "Empate.";
    }

    const isLastRound = roundPosition >= enabledRounds.length - 1;

    setTurnSummary(message);
    setPreTurnCountdown(null);
    setTurnActive(false);
    setCurrentWord(null);
    guessedThisTurnRef.current = 0;
    setSkipsLeft(setup.skipsPerTurn);

    if (isLastRound) {
      setGameFinished(true);
      goToFinalResults(nextRoundWins);
      return;
    }

    const nextRoundPosition = roundPosition + 1;
    const nextRoundNumber = enabledRounds[nextRoundPosition] || 1;
    setRoundPosition(nextRoundPosition);
    setIntroRoundNumber(nextRoundNumber);
    setShowRoundIntro(true);
    setRoundScores({ team1: 0, team2: 0 });
    setQueue(shuffle(allWords));
    setTimeLeft(setup.timePerTurn);
    advancePlayer();
  };

  const endTurn = (reason: "timeout" | "manual" = "manual") => {
    if (!turnActive && !gameFinished) {
      return;
    }

    if (reason === "timeout") {
      void playSoundEffect("ends");
    }

    const guessed = guessedThisTurnRef.current;
    guessedThisTurnRef.current = 0;

    setTurnActive(false);
    setCurrentWord(null);
    setTimeLeft(setup.timePerTurn);
    setPreTurnCountdown(null);
    setSkipsLeft(setup.skipsPerTurn);

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

  const handleRoundIntroComplete = () => {
    setShowRoundIntro(false);
  };

  const startTurn = () => {
    if (!currentPlayer || gameFinished) return;

    if (queue.length === 0) {
      completeRound();
      return;
    }

    guessedThisTurnRef.current = 0;
    setTurnSummary("");
    setPreTurnCountdown(3);
    setTurnActive(false);
    setCurrentWord(null);
    setTimeLeft(setup.timePerTurn);
    setSkipsLeft(setup.skipsPerTurn);
    clockAlertPlayedRef.current = false;
    void playSoundEffect("start");
  };

  const wordGuessed = () => {
    if (!turnActive || !currentPlayer || !currentWord) return;

    void playSoundEffect("success");

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

    setRoundPlayerScores((previous) => ({
      ...previous,
      [currentRoundNumber]: {
        ...(previous[currentRoundNumber] || {}),
        [currentPlayer.id]:
          ((previous[currentRoundNumber] || {})[currentPlayer.id] || 0) + 1,
      },
    }));

    const nextQueue = queue.slice(1);
    setQueue(nextQueue);

    if (nextQueue.length === 0) {
      setCurrentWord(null);
      completeRound();
      return;
    }

    setCurrentWord(nextQueue[0]);
  };

  const skipWord = () => {
    if (!turnActive || queue.length === 0) return;
    if (skipsLeft !== null && skipsLeft <= 0) {
      return;
    }

    void playSoundEffect("skip");

    if (skipsLeft !== null) {
      setSkipsLeft((previous) => (previous === null ? null : previous - 1));
    }

    if (queue.length === 1) {
      setCurrentWord(queue[0]);
      return;
    }

    const nextQueue = [...queue.slice(1), queue[0]];
    setQueue(nextQueue);
    setCurrentWord(nextQueue[0]);
  };

  const skipButtonDisabled =
    !turnActive || (skipsLeft !== null && skipsLeft <= 0);

  const returnToStart = () => {
    if (gameFinished) {
      leaveMatch();
      return;
    }

    confirmExit();
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
    <LinearGradient
      colors={["#0f172a", "#1d4ed8", "#1e3a8a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {showRoundIntro && !gameFinished ? (
        <View style={styles.roundIntroScreen}>
          <MotiView
            key={`round-intro-${introRoundNumber}`}
            from={{ opacity: 0, translateY: 18, scale: 0.94 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: "timing", duration: 360 }}
            style={styles.roundIntroCard}
          >
            <Text style={styles.roundIntroKicker}>Comienza</Text>
            <Text style={styles.roundIntroTitle}>Ronda {introRoundNumber}</Text>
            <Text style={styles.roundIntroSubtitle}>{introRoundName}</Text>
            <Text style={styles.roundIntroHint}>{introRoundInstruction}</Text>
            <TouchableOpacity
              style={styles.roundIntroButton}
              onPress={handleRoundIntroComplete}
            >
              <Text style={styles.roundIntroButtonText}>Listo</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      ) : preTurnCountdown !== null ? (
        <View style={styles.countdownScreen}>
          <Text style={styles.countdownLabel}>Empieza en</Text>
          <MotiView
            key={preTurnCountdown}
            from={{ opacity: 0.15, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 280 }}
            style={styles.countdownBadge}
          >
            <Text style={styles.countdownValue}>{preTurnCountdown}</Text>
          </MotiView>
        </View>
      ) : turnActive ? (
        <View style={styles.activeTurnScreen}>
          <View style={styles.activeHudRow}>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 260 }}
              style={styles.activeScorePill}
            >
              <Text style={styles.activeScoreLabel}>
                Aciertos en esta ronda
              </Text>
              <Text style={styles.activeScoreValue}>
                {currentTeamRoundScore}
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: isUrgentTime ? 1.04 : 1 }}
              transition={{ type: "timing", duration: 220 }}
              style={[
                styles.activeTimerPill,
                isUrgentTime && styles.activeTimerPillUrgent,
              ]}
            >
              <Text style={styles.activeTimerLabel}>Tiempo</Text>
              <Text
                style={[
                  styles.activeTimerValue,
                  isUrgentTime && styles.activeTimerValueUrgent,
                ]}
              >
                {timeLeft}s
              </Text>
            </MotiView>
          </View>

          <View style={styles.activeWordStage}>
            <AnimatePresence>
              <MotiView
                key={currentWord || "empty-word"}
                from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, translateY: -18 }}
                transition={{ type: "timing", duration: 240 }}
                style={styles.wordContent}
              >
                <Text style={styles.wordText}>
                  {currentWord || "Preparando palabra..."}
                </Text>
              </MotiView>
            </AnimatePresence>
          </View>

          <View style={styles.activeActionsDock}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.skipButton,
                skipButtonDisabled && styles.actionButtonDisabled,
              ]}
              onPress={skipWord}
              disabled={skipButtonDisabled}
            >
              <Text style={styles.actionButtonText}>
                {skipsLeft === null ? "Pasar" : `Pasar (${skipsLeft})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.correctButton]}
              onPress={wordGuessed}
            >
              <Text style={styles.actionButtonText}>Correcto</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Partida en curso</Text>
              <Text style={styles.roundText}>
                Ronda {currentRoundNumber}: {currentRoundName}
              </Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeLabel}>Tiempo</Text>
              <Text style={styles.timerText}>{setup.timePerTurn}s</Text>
            </View>
          </View>

          <View style={styles.scoreboardCard}>
            <View style={styles.teamScoreCard}>
              <Text style={styles.teamScoreName}>Equipo 1</Text>
              <Text style={styles.teamScoreValue}>{teamScores.team1}</Text>
              <Text style={styles.teamScoreMeta}>
                {roundWins.team1} rondas ganadas
              </Text>
            </View>
            <View style={styles.teamScoreDivider} />
            <View style={styles.teamScoreCard}>
              <Text style={styles.teamScoreName}>Equipo 2</Text>
              <Text style={styles.teamScoreValue}>{teamScores.team2}</Text>
              <Text style={styles.teamScoreMeta}>
                {roundWins.team2} rondas ganadas
              </Text>
            </View>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 320 }}
            style={styles.turnCard}
          >
            <Text style={styles.turnLabel}>Siguiente turno</Text>
            <Text style={styles.playerName}>{currentPlayer?.name || "-"}</Text>
            <Text style={styles.teamLabel}>
              Equipo {currentPlayer?.team || "-"}
            </Text>

            {!gameFinished && (
              <Button
                title="Iniciar turno"
                onPress={startTurn}
                variant="primary"
                size="large"
              />
            )}
          </MotiView>

          {!!turnSummary && (
            <Text style={styles.turnSummary}>{turnSummary}</Text>
          )}

          <ScrollView style={styles.playerScoresContainer}>
            <Text style={styles.playerScoresTitle}>Puntuacion individual</Text>
            {setup.players
              .slice()
              .sort(
                (a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0),
              )
              .map((player) => (
                <View key={player.id} style={styles.playerScoreRow}>
                  <Text style={styles.playerScoreLine}>
                    {player.name} (E{player.team})
                  </Text>
                  <Text style={styles.playerScoreValue}>
                    {playerScores[player.id] || 0}
                  </Text>
                </View>
              ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={returnToStart}>
              <Text style={styles.exitText}>Salir de la partida</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 18,
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
    gap: 12,
  },
  kicker: {
    color: "#bfdbfe",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: 12,
  },
  roundText: {
    color: "white",
    fontWeight: "800",
    fontSize: 24,
    flex: 1,
    paddingRight: 10,
  },
  timerBadge: {
    minWidth: 86,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  timerBadgeLabel: {
    color: "#bfdbfe",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  timerText: {
    color: "white",
    fontWeight: "800",
    fontSize: 24,
    textAlign: "center",
  },
  scoreboardCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  teamScoreCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  teamScoreDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    marginHorizontal: 12,
  },
  teamScoreName: {
    color: "#bfdbfe",
    fontWeight: "700",
    fontSize: 14,
  },
  teamScoreValue: {
    color: "white",
    fontWeight: "800",
    fontSize: 34,
  },
  teamScoreMeta: {
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: "700",
  },
  turnCard: {
    marginTop: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  turnLabel: {
    color: "#bfdbfe",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  playerName: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
  },
  teamLabel: {
    color: "#dbeafe",
    marginBottom: 12,
    fontWeight: "700",
  },
  activeTurnScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  roundIntroScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  roundIntroCard: {
    width: "100%",
    borderRadius: 30,
    paddingVertical: 34,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    alignItems: "center",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  roundIntroKicker: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  roundIntroTitle: {
    color: "#0f172a",
    fontSize: 56,
    lineHeight: 62,
    fontWeight: "900",
    textAlign: "center",
  },
  roundIntroSubtitle: {
    marginTop: 8,
    color: "#1e3a8a",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  roundIntroHint: {
    marginTop: 14,
    color: "#334155",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 25,
  },
  roundIntroButton: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  roundIntroButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  countdownScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  countdownLabel: {
    color: "#bfdbfe",
    fontWeight: "800",
    letterSpacing: 0.8,
    fontSize: 16,
    textTransform: "uppercase",
  },
  countdownBadge: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 12,
  },
  countdownValue: {
    color: "#0f172a",
    fontSize: 120,
    lineHeight: 126,
    fontWeight: "900",
  },
  activeHudRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  activeScorePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  activeScoreLabel: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  activeScoreValue: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
  },
  activeTimerPill: {
    minWidth: 118,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  activeTimerPillUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    borderColor: "rgba(254, 202, 202, 0.42)",
  },
  activeTimerLabel: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  activeTimerValue: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
  },
  activeTimerValueUrgent: {
    color: "#fee2e2",
  },
  activeWordStage: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  wordContent: {
    width: "100%",
    minHeight: 280,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  wordText: {
    fontSize: 42,
    color: "#1f2937",
    fontWeight: "800",
    textAlign: "center",
  },
  activeActionsDock: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  skipButton: {
    backgroundColor: "#ef4444",
  },
  correctButton: {
    backgroundColor: "#22c55e",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 20,
  },
  turnSummary: {
    marginTop: 14,
    color: "#e2e8f0",
    textAlign: "center",
    fontWeight: "700",
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  playerScoresContainer: {
    marginTop: 16,
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  playerScoresTitle: {
    color: "#dbeafe",
    fontWeight: "800",
    marginBottom: 10,
    fontSize: 16,
  },
  playerScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  playerScoreLine: {
    color: "white",
    fontWeight: "600",
  },
  playerScoreValue: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 18,
  },
  finishedCard: {
    marginTop: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 24,
    padding: 18,
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
  winnerWrap: {
    marginTop: 10,
    gap: 12,
  },
  winnerBadge: {
    backgroundColor: "#fde68a",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#f59e0b",
    alignItems: "center",
  },
  winnerBadgeText: {
    color: "#78350f",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  winnerNamesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  winnerNameChip: {
    backgroundColor: "rgba(251, 191, 36, 0.24)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.35)",
  },
  winnerNameText: {
    color: "#78350f",
    fontWeight: "700",
  },
  roundStatsWrap: {
    marginTop: 10,
    gap: 10,
  },
  roundStatsTitle: {
    color: "#78350f",
    fontSize: 16,
    fontWeight: "800",
  },
  roundStatsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  roundStatsCardTitle: {
    color: "#92400e",
    fontWeight: "800",
    fontSize: 14,
  },
  roundStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  roundStatsPlayer: {
    color: "#78350f",
    fontWeight: "600",
    flexShrink: 1,
    paddingRight: 8,
  },
  roundStatsValue: {
    color: "#451a03",
    fontWeight: "800",
    fontSize: 16,
  },
  footer: {
    marginTop: 14,
    alignItems: "center",
  },
  exitText: {
    color: "#dbeafe",
    fontWeight: "700",
  },
});
