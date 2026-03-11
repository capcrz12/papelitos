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
import { Input } from "../src/components/Input";
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

const defaultSetup: GameSetup = {
  timePerTurn: 30,
  wordsPerPlayer: 3,
  rounds: [true, true, true, true],
  players: [],
};

export default function WordSubmissionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

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
        rounds:
          Array.isArray(parsed.rounds) && parsed.rounds.length === 4
            ? parsed.rounds
            : [true, true, true, true],
        players: parsed.players,
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
      router.replace({
        pathname: "/game",
        params: {
          setup: JSON.stringify(setup),
          words: JSON.stringify(nextAllWords),
        },
      });
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
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No hay jugadores configurados.</Text>
        <Button
          title="Volver a configurar"
          onPress={() => router.replace("/teams")}
          variant="primary"
          size="large"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carga de palabras</Text>
        <Text style={styles.subtitle}>
          Jugador {currentPlayerIndex + 1} de {totalPlayers}
        </Text>
      </View>

      {!revealInput ? (
        <View style={styles.handoffCard}>
          <Text style={styles.handoffTitle}>Pasa el dispositivo a:</Text>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.playerTeam}>Equipo {currentPlayer.team}</Text>
          <Button
            title="Ya lo tiene"
            onPress={() => setRevealInput(true)}
            variant="primary"
            size="large"
          />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
          >
            {currentWords.map((word, index) => (
              <View
                key={`${currentPlayer.id}_${index}`}
                style={styles.wordCard}
              >
                <Text style={styles.wordLabel}>Palabra {index + 1}</Text>
                <Input
                  value={word}
                  onChangeText={(value) => updateWord(index, value)}
                  placeholder={`Escribe palabra ${index + 1}`}
                  autoCorrect={false}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "white",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    backgroundColor: "white",
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
  formContent: {
    padding: 16,
    gap: 12,
  },
  wordCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
  },
  wordLabel: {
    marginBottom: 8,
    color: "#374151",
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
    backgroundColor: "white",
    gap: 12,
  },
  backLink: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "700",
  },
});
