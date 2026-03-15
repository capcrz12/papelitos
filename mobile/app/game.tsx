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
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import { Button } from "../src/components/Button";

interface PlayerConfig {
  id: string;
  name: string;
  team: number;
}

interface GameSetup {
  timePerTurn: number;
  wordsPerPlayer: number;
  skipsPerTurn: number | null;
  rounds: boolean[];
  players: PlayerConfig[];
  teamOrder: number[];
  teamNames: Record<string, string>;
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

const TEAM_COLOR_NAMES: Record<number, string> = {
  1: "Azul",
  2: "Rojo",
  3: "Verde",
  4: "Morado",
  5: "Naranja",
};

const getDefaultTeamName = (teamId: number) =>
  TEAM_COLOR_NAMES[teamId] || "Equipo";

const fallbackSetup: GameSetup = {
  timePerTurn: 30,
  wordsPerPlayer: 3,
  skipsPerTurn: 1,
  rounds: [true, true, true, true],
  players: [],
  teamOrder: [1, 2],
  teamNames: {
    "1": getDefaultTeamName(1),
    "2": getDefaultTeamName(2),
  },
};

const SOUND_ASSETS = {
  start: require("../assets/sounds/start.mp3"),
  success: require("../assets/sounds/success.mp3"),
  clock: require("../assets/sounds/clock.mp3"),
  skip: require("../assets/sounds/skip.mp3"),
  ends: require("../assets/sounds/ends.mp3"),
} satisfies Record<
  "start" | "success" | "clock" | "skip" | "ends",
  AudioSource
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
        teamOrder:
          Array.isArray(parsed.teamOrder) && parsed.teamOrder.length >= 2
            ? parsed.teamOrder
                .map((value: unknown) => Number(value))
                .filter(
                  (value: number, index: number, all: number[]) =>
                    Number.isInteger(value) &&
                    value > 0 &&
                    all.indexOf(value) === index,
                )
                .sort((a: number, b: number) => a - b)
            : [1, 2],
        teamNames:
          parsed.teamNames && typeof parsed.teamNames === "object"
            ? Object.entries(
                parsed.teamNames as Record<string, unknown>,
              ).reduce<Record<string, string>>((acc, [key, value]) => {
                const numeric = Number(key);
                if (
                  Number.isInteger(numeric) &&
                  numeric > 0 &&
                  typeof value === "string"
                ) {
                  acc[String(numeric)] =
                    value.trim() || getDefaultTeamName(numeric);
                  return acc;
                }

                const match = key.match(/^team(\d+)$/i);
                if (match && typeof value === "string") {
                  const teamId = Number(match[1]);
                  acc[String(teamId)] =
                    value.trim() || getDefaultTeamName(teamId);
                }

                return acc;
              }, {})
            : { "1": getDefaultTeamName(1), "2": getDefaultTeamName(2) },
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

  const teamIds = useMemo<number[]>(() => {
    const idsFromOrder = setup.teamOrder
      .map((value) => Number(value))
      .filter(
        (value, index, all) =>
          Number.isInteger(value) && value > 0 && all.indexOf(value) === index,
      );

    const idsFromPlayers = setup.players
      .map((player) => Number(player.team))
      .filter(
        (value, index, all) =>
          Number.isInteger(value) && value > 0 && all.indexOf(value) === index,
      );

    const merged = Array.from(
      new Set([...idsFromOrder, ...idsFromPlayers]),
    ).sort((a, b) => a - b);

    return merged.length > 0 ? merged : [1, 2];
  }, [setup.players, setup.teamOrder]);

  const zeroScores = useMemo(
    () =>
      teamIds.reduce<Record<number, number>>((acc, teamId) => {
        acc[teamId] = 0;
        return acc;
      }, {}),
    [teamIds],
  );

  const playersByTeam = useMemo(() => {
    return setup.players.reduce<Record<number, PlayerConfig[]>>(
      (acc, player) => {
        if (!acc[player.team]) {
          acc[player.team] = [];
        }
        acc[player.team].push(player);
        return acc;
      },
      {},
    );
  }, [setup.players]);

  const playableTeamIds = useMemo(
    () => teamIds.filter((teamId) => (playersByTeam[teamId] || []).length > 0),
    [playersByTeam, teamIds],
  );

  const [roundPosition, setRoundPosition] = useState(0);
  const [currentTurnTeam, setCurrentTurnTeam] = useState<number>(
    playableTeamIds[0] || teamIds[0] || 1,
  );
  const [teamPlayerTurnIndices, setTeamPlayerTurnIndices] =
    useState<Record<number, number>>(zeroScores);
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

  const [teamScores, setTeamScores] =
    useState<Record<number, number>>(zeroScores);
  const [roundScores, setRoundScores] =
    useState<Record<number, number>>(zeroScores);
  const [roundWins, setRoundWins] =
    useState<Record<number, number>>(zeroScores);
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
  const turnDeadlineRef = useRef<number | null>(null);
  const timeoutTriggeredRef = useRef(false);
  const endTurnRef = useRef<(reason?: "timeout" | "manual") => void>(() => {});
  const soundEffectsRef = useRef<
    Partial<Record<keyof typeof SOUND_ASSETS, AudioPlayer>>
  >({});

  const currentTeamPlayers = playersByTeam[currentTurnTeam] || [];
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
  const currentTeamRoundScore = currentPlayer
    ? roundScores[currentPlayer.team] || 0
    : 0;
  const isUrgentTime = timeLeft <= 10;
  const getTeamName = (teamId: number) =>
    setup.teamNames[String(teamId)] || getDefaultTeamName(teamId);
  const scoreTableRows = teamIds.map((teamId) => ({
    teamId,
    name: getTeamName(teamId),
    score: teamScores[teamId] || 0,
    wins: roundWins[teamId] || 0,
  }));

  const goToFinalResults = (finalRoundWins: Record<number, number>) => {
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
      const deadline = turnDeadlineRef.current;
      if (!deadline) {
        return;
      }

      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft(0);
        clearInterval(timer);

        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          endTurnRef.current("timeout");
        }
        return;
      }

      setTimeLeft(Math.ceil(remainingMs / 1000));
    }, 100);

    return () => clearInterval(timer);
  }, [turnActive]);

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
          timeoutTriggeredRef.current = false;
          turnDeadlineRef.current = Date.now() + setup.timePerTurn * 1000;
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
    void setAudioModeAsync({ playsInSilentMode: true });

    soundEffectsRef.current = Object.fromEntries(
      Object.entries(SOUND_ASSETS).map(([key, asset]) => [
        key,
        createAudioPlayer(asset),
      ]),
    );

    return () => {
      const sounds = Object.values(soundEffectsRef.current).filter(Boolean);
      soundEffectsRef.current = {};
      sounds.forEach((sound) => sound?.remove());
    };
  }, []);

  const playSoundEffect = async (key: keyof typeof SOUND_ASSETS) => {
    const sound = soundEffectsRef.current[key];
    if (!sound) {
      return;
    }

    try {
      await sound.seekTo(0);
      sound.play();
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
    if (playableTeamIds.length === 0) return;

    setTeamPlayerTurnIndices((previous) => ({
      ...previous,
      [currentTurnTeam]: (previous[currentTurnTeam] || 0) + 1,
    }));

    const currentIndex = playableTeamIds.indexOf(currentTurnTeam);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextTeam = playableTeamIds[(safeIndex + 1) % playableTeamIds.length];
    setCurrentTurnTeam(nextTeam);
  };

  const completeRound = () => {
    let message = `Fin de ronda ${currentRoundNumber}. `;
    let nextRoundWins = { ...roundWins };

    const contenderTeams =
      playableTeamIds.length > 0 ? playableTeamIds : teamIds;
    const maxScore = Math.max(
      ...contenderTeams.map((teamId) => roundScores[teamId] || 0),
      0,
    );
    const roundWinners = contenderTeams.filter(
      (teamId) => (roundScores[teamId] || 0) === maxScore,
    );

    if (maxScore === 0 || roundWinners.length > 1) {
      message += "Empate.";
    } else {
      const winnerTeamId = roundWinners[0];
      nextRoundWins = {
        ...roundWins,
        [winnerTeamId]: (roundWins[winnerTeamId] || 0) + 1,
      };
      setRoundWins(nextRoundWins);
      message += `Gana ${getTeamName(winnerTeamId)}.`;
    }

    const isLastRound = roundPosition >= enabledRounds.length - 1;

    setTurnSummary(message);
    setPreTurnCountdown(null);
    setTurnActive(false);
    turnDeadlineRef.current = null;
    timeoutTriggeredRef.current = false;
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
    setRoundScores({ ...zeroScores });
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
    turnDeadlineRef.current = null;
    timeoutTriggeredRef.current = false;
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

  endTurnRef.current = endTurn;

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
    turnDeadlineRef.current = null;
    timeoutTriggeredRef.current = false;
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

    setTeamScores((previous) => ({
      ...previous,
      [currentPlayer.team]: (previous[currentPlayer.team] || 0) + 1,
    }));

    setRoundScores((previous) => ({
      ...previous,
      [currentPlayer.team]: (previous[currentPlayer.team] || 0) + 1,
    }));

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
      colors={["#fff4d9", "#ffe4d6", "#f7f7ff"]}
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
            <View style={styles.scoreTableHeaderRow}>
              <Text
                style={[
                  styles.scoreTableHeaderText,
                  styles.scoreTableTeamColumn,
                ]}
              >
                Equipo
              </Text>
              <Text style={styles.scoreTableHeaderText}>Aciertos</Text>
              <Text style={styles.scoreTableHeaderText}>Rondas</Text>
            </View>
            {scoreTableRows.map((row) => (
              <View key={`score-${row.teamId}`} style={styles.scoreTableRow}>
                <Text
                  style={[
                    styles.scoreTableTeamText,
                    styles.scoreTableTeamColumn,
                  ]}
                >
                  {row.name}
                </Text>
                <Text style={styles.scoreTableValueText}>{row.score}</Text>
                <Text style={styles.scoreTableValueText}>{row.wins}</Text>
              </View>
            ))}
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
              {currentPlayer ? getTeamName(currentPlayer.team) : "-"}
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
                    {player.name} ({getTeamName(player.team)})
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
    backgroundColor: "#fff4d9",
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
    color: "#9a3412",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: 12,
  },
  roundText: {
    color: "#111827",
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
    backgroundColor: "rgba(255, 255, 255, 0.76)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  timerBadgeLabel: {
    color: "#9a3412",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  timerText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 24,
    textAlign: "center",
  },
  scoreboardCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  scoreTableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(154, 52, 18, 0.18)",
  },
  scoreTableHeaderText: {
    color: "#9a3412",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 0.8,
    textAlign: "center",
  },
  scoreTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(154, 52, 18, 0.1)",
  },
  scoreTableTeamColumn: {
    flex: 1.8,
    textAlign: "left",
  },
  scoreTableTeamText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
    paddingRight: 8,
  },
  scoreTableValueText: {
    color: "#111827",
    flex: 0.8,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  turnCard: {
    marginTop: 18,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  turnLabel: {
    color: "#9a3412",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  playerName: {
    color: "#111827",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
  },
  teamLabel: {
    color: "#374151",
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
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    shadowColor: "#7c2d12",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  roundIntroKicker: {
    color: "#c2410c",
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
    color: "#374151",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  roundIntroHint: {
    marginTop: 14,
    color: "#4b5563",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 25,
  },
  roundIntroButton: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#7c2d12",
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
    color: "#9a3412",
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
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    shadowColor: "#7c2d12",
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
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  activeScoreLabel: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  activeScoreValue: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "800",
  },
  activeTimerPill: {
    minWidth: 118,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  activeTimerPillUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    borderColor: "rgba(254, 202, 202, 0.42)",
  },
  activeTimerLabel: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  activeTimerValue: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "900",
  },
  activeTimerValueUrgent: {
    color: "#991b1b",
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
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    shadowColor: "#7c2d12",
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
    color: "#374151",
    textAlign: "center",
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  playerScoresContainer: {
    marginTop: 16,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  playerScoresTitle: {
    color: "#111827",
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
    borderBottomColor: "rgba(154, 52, 18, 0.14)",
  },
  playerScoreLine: {
    color: "#1f2937",
    fontWeight: "600",
  },
  playerScoreValue: {
    color: "#111827",
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
    color: "#9a3412",
    fontWeight: "700",
  },
});
