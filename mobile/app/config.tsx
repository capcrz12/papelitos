import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../src/components/Button";
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
  showIndividualStats?: boolean;
  players: PlayerConfig[];
  teamNames?: Record<string, string>;
  teamOrder?: number[];
}

const skipOptions = [1, 2, 3, null] as const;

const formatSkipsPerTurn = (value: number | null) =>
  value === null ? "Ilimitado" : String(value);

const TEAM_COLOR_NAMES: Record<number, string> = {
  1: "Azul",
  2: "Rojo",
  3: "Verde",
  4: "Morado",
  5: "Naranja",
};

const getDefaultTeamName = (teamId: number) =>
  TEAM_COLOR_NAMES[teamId] || "Equipo";

const roundNames = [
  "Ronda 1: Descripción",
  "Ronda 2: Una palabra",
  "Ronda 3: Mímica",
  "Ronda 4: Sonidos",
];

export default function ConfigScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const players = useMemo<PlayerConfig[]>(() => {
    const raw = params.players as string | undefined;
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.players]);

  const currentSettings = useMemo(() => {
    const raw = params.settings as string | undefined;
    if (!raw) {
      return {
        timePerTurn: 30,
        wordsPerPlayer: 3,
        skipsPerTurn: 1,
        rounds: [true, true, true, true] as boolean[],
        showIndividualStats: false,
        teamNames: { "1": "Azul", "2": "Rojo" },
        teamOrder: [1, 2],
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
        showIndividualStats: Boolean(parsed.showIndividualStats),
        teamNames:
          parsed.teamNames && typeof parsed.teamNames === "object"
            ? Object.entries(
                parsed.teamNames as Record<string, unknown>,
              ).reduce<Record<string, string>>((acc, [key, value]) => {
                const id = Number(key);
                if (
                  Number.isInteger(id) &&
                  id > 0 &&
                  typeof value === "string"
                ) {
                  acc[String(id)] = value.trim() || getDefaultTeamName(id);
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
        teamOrder:
          Array.isArray(parsed.teamOrder) && parsed.teamOrder.length >= 2
            ? parsed.teamOrder
                .map((value: unknown) => Number(value))
                .filter((value: number) => Number.isInteger(value) && value > 0)
            : [1, 2],
      };
    } catch {
      return {
        timePerTurn: 30,
        wordsPerPlayer: 3,
        skipsPerTurn: 1,
        rounds: [true, true, true, true] as boolean[],
        showIndividualStats: false,
        teamNames: { "1": "Azul", "2": "Rojo" },
        teamOrder: [1, 2],
      };
    }
  }, [params.settings]);

  const [timePerTurn, setTimePerTurn] = useState(currentSettings.timePerTurn);
  const [wordsPerPlayer, setWordsPerPlayer] = useState(
    currentSettings.wordsPerPlayer,
  );
  const [skipsPerTurn, setSkipsPerTurn] = useState<number | null>(
    currentSettings.skipsPerTurn,
  );
  const [rounds, setRounds] = useState<boolean[]>(currentSettings.rounds);
  const [showIndividualStats, setShowIndividualStats] = useState(
    Boolean(currentSettings.showIndividualStats),
  );

  const timeOptions = [20, 25, 30, 45, 60];
  const wordsOptions = [2, 3, 4, 5, 6];

  const toggleRound = (index: number) => {
    setRounds((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const saveConfig = () => {
    if (!rounds.some(Boolean)) {
      Alert.alert("Configuración incompleta", "Activa al menos una ronda.");
      return;
    }

    router.replace({
      pathname: "/teams",
      params: {
        players: JSON.stringify(players),
        settings: JSON.stringify({
          timePerTurn,
          wordsPerPlayer,
          skipsPerTurn,
          rounds,
          showIndividualStats,
          teamNames: currentSettings.teamNames,
          teamOrder: currentSettings.teamOrder,
        }),
      },
    });
  };

  return (
    <LinearGradient
      colors={["#fff4d9", "#ffe4d6", "#f7f7ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Configurar partida</Text>
        <Text style={styles.subtitle}>Ajustes rapidos</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tiempo por turno</Text>
          <View style={styles.optionsRow}>
            {timeOptions.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  value === timePerTurn && styles.optionButtonActive,
                ]}
                onPress={() => setTimePerTurn(value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    value === timePerTurn && styles.optionButtonTextActive,
                  ]}
                >
                  {value}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Palabras por jugador</Text>
          <View style={styles.optionsRow}>
            {wordsOptions.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  value === wordsPerPlayer && styles.optionButtonActive,
                ]}
                onPress={() => setWordsPerPlayer(value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    value === wordsPerPlayer && styles.optionButtonTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pases por turno</Text>
          <View style={styles.optionsRow}>
            {skipOptions.map((value) => {
              const isActive = value === skipsPerTurn;
              return (
                <TouchableOpacity
                  key={value === null ? "unlimited" : value}
                  style={[
                    styles.optionButton,
                    isActive && styles.optionButtonActive,
                  ]}
                  onPress={() => setSkipsPerTurn(value)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      isActive && styles.optionButtonTextActive,
                    ]}
                  >
                    {formatSkipsPerTurn(value)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rondas activas</Text>
          {roundNames.map((name, index) => (
            <View key={name} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{name}</Text>
              <Switch
                value={rounds[index]}
                onValueChange={() => toggleRound(index)}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Mostrar estadísticas individuales
            </Text>
            <Switch
              value={showIndividualStats}
              onValueChange={setShowIndividualStats}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.summaryText}>
            Rondas activas: {rounds.filter(Boolean).length}
          </Text>
          <Text style={styles.summaryText}>
            Tiempo por turno: {timePerTurn}s
          </Text>
          <Text style={styles.summaryText}>
            Palabras por jugador: {wordsPerPlayer}
          </Text>
          <Text style={styles.summaryText}>
            Pases por turno: {formatSkipsPerTurn(skipsPerTurn)}
          </Text>
          <Text style={styles.summaryText}>
            Estadísticas individuales:{" "}
            {showIndividualStats ? "Visibles" : "Ocultas"}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Guardar y volver"
          onPress={saveConfig}
          variant="primary"
          size="large"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  optionButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  optionButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: "#1d4ed8",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    color: "#374151",
    fontWeight: "600",
  },
  summaryText: {
    color: "#374151",
    marginBottom: 6,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#fed7aa",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
});
