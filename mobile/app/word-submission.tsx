import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { LoadingOverlay } from "../src/components/LoadingOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const TEAM_COLOR_NAMES: Record<number, string> = {
  1: "Azul",
  2: "Rojo",
  3: "Verde",
  4: "Morado",
  5: "Naranja",
};

const TEAM_TEXT_COLORS: Record<number, string> = {
  1: "#1d4ed8",
  2: "#dc2626",
  3: "#15803d",
  4: "#7c3aed",
  5: "#ea580c",
};

const getDefaultTeamName = (teamId: number) =>
  TEAM_COLOR_NAMES[teamId] || "Equipo";

const getTeamTextColor = (teamId: number) =>
  TEAM_TEXT_COLORS[teamId] || "#111827";

const defaultSetup: GameSetup = {
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

export default function WordSubmissionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const setup = useMemo<GameSetup>(() => {
    const raw = params.setup as string | undefined;
    if (!raw) return defaultSetup;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) {
        return defaultSetup;
      }
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
                .filter((value: number) => Number.isInteger(value) && value > 0)
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
      return defaultSetup;
    }
  }, [params.setup]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealInput, setRevealInput] = useState(false);
  const [currentWords, setCurrentWords] = useState<string[]>(
    Array.from({ length: Math.max(1, setup.wordsPerPlayer) }, () => ""),
  );
  const [allWords, setAllWords] = useState<string[]>([]);
  const [isPreparingGame, setIsPreparingGame] = useState(false);

  const totalPlayers = setup.players.length;
  const currentPlayer = setup.players[currentPlayerIndex];

  const submitCurrentPlayerWords = () => {
    const cleaned = currentWords.map((word) => word.trim()).filter(Boolean);

    if (cleaned.length !== setup.wordsPerPlayer) {
      Alert.alert(
        "Faltan palabras",
        `Debes escribir exactamente ${setup.wordsPerPlayer} palabras.`,
      );
      return;
    }

    const nextAllWords = [...allWords, ...cleaned];

    if (currentPlayerIndex >= totalPlayers - 1) {
      setIsPreparingGame(true);
      setTimeout(() => {
        router.replace({
          pathname: "/game",
          params: {
            setup: JSON.stringify(setup),
            words: JSON.stringify(nextAllWords),
          },
        });
        setIsPreparingGame(false);
      }, 700);
      return;
    }

    setAllWords(nextAllWords);
    setCurrentPlayerIndex((prev) => prev + 1);
    setCurrentWords(Array.from({ length: setup.wordsPerPlayer }, () => ""));
    setRevealInput(false);
  };

  const updateWord = (index: number, value: string) => {
    setCurrentWords((prev) =>
      prev.map((word, i) => (i === index ? value : word)),
    );
  };

  if (!currentPlayer) {
    return (
      <LinearGradient
        colors={["#fff4d9", "#ffe4d6", "#f7f7ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerContainer}
      >
        <Text style={styles.errorText}>No hay jugadores configurados.</Text>
        <Button
          title="Volver a configurar"
          onPress={() => router.replace("/teams")}
          variant="primary"
          size="large"
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#fff4d9", "#ffe4d6", "#f7f7ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Carga de palabras</Text>
        <Text style={styles.subtitle}>
          Jugador {currentPlayerIndex + 1} de {totalPlayers}
        </Text>
      </View>

      <AnimatePresence>
        {!revealInput ? (
          <MotiView
            key="handoff"
            from={{ opacity: 0, scale: 0.96, translateY: 16 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.96, translateY: -16 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.handoffCard}
          >
            <Text style={styles.handoffTitle}>Pasa el dispositivo a:</Text>
            <Text
              style={[
                styles.playerName,
                { color: getTeamTextColor(currentPlayer.team) },
              ]}
            >
              {currentPlayer.name}
            </Text>
            <Text style={styles.playerTeam}>
              {setup.teamNames[String(currentPlayer.team)] ||
                getDefaultTeamName(currentPlayer.team)}
            </Text>
            <Button
              title="Ya lo tiene"
              onPress={() => setRevealInput(true)}
              variant="primary"
              size="large"
            />
          </MotiView>
        ) : (
          <MotiView
            key="form"
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -16 }}
            transition={{ type: "timing", duration: 260 }}
            style={styles.revealArea}
          >
            <ScrollView
              style={styles.form}
              contentContainerStyle={styles.formContent}
            >
              {currentWords.map((word, index) => (
                <MotiView
                  key={`${currentPlayer.id}_${index}`}
                  from={{ opacity: 0, translateX: -14 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: "timing",
                    duration: 260,
                    delay: index * 55,
                  }}
                  style={styles.wordCard}
                >
                  <Text style={styles.wordLabel}>Palabra {index + 1}</Text>
                  <Input
                    value={word}
                    onChangeText={(value) => updateWord(index, value)}
                    placeholder={`Escribe palabra ${index + 1}`}
                    autoCorrect={false}
                  />
                </MotiView>
              ))}
            </ScrollView>

            <View
              style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
            >
              <TouchableOpacity onPress={() => setRevealInput(false)}>
                <Text style={styles.backLink}>Ocultar y volver</Text>
              </TouchableOpacity>
              <Button
                title={
                  currentPlayerIndex === totalPlayers - 1
                    ? "Empezar partida"
                    : "Guardar y siguiente jugador"
                }
                onPress={submitCurrentPlayerWords}
                variant="primary"
                size="large"
              />
            </View>
          </MotiView>
        )}
      </AnimatePresence>
      <LoadingOverlay visible={isPreparingGame} title="Mezclando palabras..." />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "#b91c1c",
    fontWeight: "700",
  },
  header: {
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    color: "#4b5563",
  },
  handoffCard: {
    margin: 20,
    padding: 20,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: 12,
  },
  handoffTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  playerName: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: "#1d4ed8",
  },
  playerTeam: {
    textAlign: "center",
    color: "#374151",
    marginBottom: 8,
    fontWeight: "600",
  },
  form: {
    flex: 1,
  },
  revealArea: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 12,
  },
  wordCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  wordLabel: {
    marginBottom: 8,
    color: "#374151",
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#fed7aa",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    gap: 12,
  },
  backLink: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "700",
  },
});
