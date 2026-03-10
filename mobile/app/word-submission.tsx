import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { gameApi, WS_BASE_URL } from "../src/services/api";
import { useSocket } from "../src/hooks/useSocket";

export default function WordSubmissionScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const params = useLocalSearchParams();
  const allowNavigationRef = useRef(false);
  const phaseNavigationDoneRef = useRef(false);

  const roomCode = (params.roomCode as string) || "";
  const playerId = (params.playerId as string) || "";
  const playerName = (params.playerName as string) || "Jugador";
  const isHost = (params.isHost as string) === "true";
  const wordsPerPlayer = parseInt((params.wordsPerPlayer as string) || "3", 10);
  const timePerTurn = parseInt((params.timePerTurn as string) || "60", 10);
  const roundsParam = (params.rounds as string) || "[true,true,true,true]";

  const wsUrl = WS_BASE_URL;
  const { on, off } = useSocket({
    url: wsUrl,
    roomCode,
    enabled: true,
    clientName: playerName,
  });

  const [words, setWords] = useState<string[]>(
    Array.from({ length: Math.max(1, wordsPerPlayer) }, () => ""),
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [statusText, setStatusText] = useState("Esperando envios...");

  const navigateToGame = () => {
    if (phaseNavigationDoneRef.current) return;
    phaseNavigationDoneRef.current = true;
    allowNavigationRef.current = true;

    router.replace({
      pathname: "/game",
      params: {
        roomCode,
        playerId,
        playerName,
        isHost: isHost ? "true" : "false",
        timePerTurn: String(timePerTurn),
        wordsPerPlayer: String(wordsPerPlayer),
        rounds: roundsParam,
      },
    });
  };

  const cleanWords = useMemo(
    () => words.map((w) => w.trim()).filter(Boolean),
    [words],
  );

  useEffect(() => {
    if (!roomCode) {
      Alert.alert("Error", "No se encontro el codigo de sala", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
      return;
    }

    let mounted = true;

    const refreshStatus = async () => {
      try {
        const status = await gameApi.getWordsSubmissionStatus(roomCode);
        if (!mounted) return;

        setStatusText(
          `${status.submitted_count}/${status.total_players} jugadores completaron sus palabras`,
        );

        if (status.phase === "playing" || status.all_submitted) {
          navigateToGame();
        }
      } catch (err: any) {
        const backendError =
          err?.response?.data?.error || "No se pudo cargar el estado";
        setStatusText(backendError);
      }
    };

    refreshStatus();
    const timer = setInterval(refreshStatus, 3000);

    const handleProgress = (data: any) => {
      setStatusText(
        `${data.submitted_count}/${data.total_players} jugadores completaron sus palabras`,
      );
    };

    const handleWordsCompleted = () => {
      navigateToGame();
    };

    on("word_submission_progress", handleProgress);
    on("words_phase_completed", handleWordsCompleted);

    return () => {
      mounted = false;
      clearInterval(timer);
      off("word_submission_progress", handleProgress);
      off("words_phase_completed", handleWordsCompleted);
    };
  }, [
    isHost,
    off,
    on,
    playerId,
    playerName,
    roomCode,
    router,
    roundsParam,
    timePerTurn,
    wordsPerPlayer,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (allowNavigationRef.current) {
        return;
      }

      e.preventDefault();
      Alert.alert(
        "Salir de la partida",
        "Si sales ahora dejaras la partida en curso. ¿Seguro que quieres salir?",
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

  const updateWord = (index: number, value: string) => {
    setWords((prev) => prev.map((word, i) => (i === index ? value : word)));
  };

  const submitWords = async () => {
    if (submitted || loading) return;

    if (cleanWords.length !== wordsPerPlayer) {
      Alert.alert(
        "Palabras incompletas",
        `Debes enviar exactamente ${wordsPerPlayer} palabras.`,
      );
      return;
    }

    setLoading(true);
    try {
      await gameApi.submitPlayerWords(roomCode, playerId, cleanWords);
      setSubmitted(true);
      setStatusText("Palabras enviadas. Esperando al resto de jugadores...");
    } catch (err: any) {
      const backendError =
        err?.response?.data?.error || "No se pudieron enviar";
      Alert.alert("Error", backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fase de palabras</Text>
        <Text style={styles.subtitle}>
          Cada jugador escribe {wordsPerPlayer} palabras desde su dispositivo
        </Text>
        <Text style={styles.roomText}>Sala: {roomCode}</Text>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
      >
        {words.map((word, index) => (
          <View key={index} style={styles.inputRow}>
            <Text style={styles.inputLabel}>Palabra {index + 1}</Text>
            <Input
              value={word}
              onChangeText={(value) => updateWord(index, value)}
              placeholder={`Escribe palabra ${index + 1}`}
              editable={!submitted}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.progressText}>{statusText}</Text>

        <Button
          title={
            loading ? "Enviando..." : submitted ? "Enviado" : "Enviar palabras"
          }
          onPress={submitWords}
          variant="primary"
          size="large"
          disabled={loading || submitted}
        />

        {!submitted && (
          <TouchableOpacity onPress={submitWords}>
            <Text style={styles.quickSubmitText}>Enviar ahora</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: "white",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    color: "#4b5563",
    fontSize: 15,
  },
  roomText: {
    marginTop: 10,
    color: "#1d4ed8",
    fontWeight: "600",
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 12,
  },
  inputRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputLabel: {
    marginBottom: 8,
    color: "#374151",
    fontWeight: "600",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
    backgroundColor: "white",
    gap: 10,
  },
  progressText: {
    textAlign: "center",
    color: "#4b5563",
  },
  quickSubmitText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
  },
});
