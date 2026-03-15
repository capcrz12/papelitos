import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "../src/components/Input";
import { Button } from "../src/components/Button";
import { LoadingOverlay } from "../src/components/LoadingOverlay";

interface PlayerConfig {
  id: string;
  name: string;
  team: number;
}

interface MatchSettings {
  timePerTurn: number;
  wordsPerPlayer: number;
  skipsPerTurn: number | null;
  rounds: boolean[];
  teamNames: Record<string, string>;
  teamOrder: number[];
}

const TEAM_COLOR_NAMES: Record<number, string> = {
  1: "Azul",
  2: "Rojo",
  3: "Verde",
  4: "Morado",
  5: "Naranja",
};

const TEAM_THEME: Record<
  number,
  { tint: string; border: string; dot: string }
> = {
  1: { tint: "#edf5ff", border: "#bfdbfe", dot: "#2563eb" },
  2: { tint: "#fff1f2", border: "#fecdd3", dot: "#dc2626" },
  3: { tint: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" },
  4: { tint: "#f5f3ff", border: "#ddd6fe", dot: "#7c3aed" },
  5: { tint: "#fff7ed", border: "#fed7aa", dot: "#ea580c" },
};

const getDefaultTeamName = (teamId: number) =>
  TEAM_COLOR_NAMES[teamId] || "Equipo";

const formatSkipsPerTurn = (value: number | null) =>
  value === null
    ? "pases ilimitados"
    : `${value} pase${value === 1 ? "" : "s"}`;

const normalizeTeamOrder = (input: unknown): number[] => {
  if (!Array.isArray(input)) {
    return [1, 2];
  }

  const parsed = input
    .map((value) => Number(value))
    .filter(
      (value, index, all) =>
        Number.isInteger(value) && value > 0 && all.indexOf(value) === index,
    )
    .sort((a, b) => a - b);

  return parsed.length >= 2 ? parsed : [1, 2];
};

const normalizeTeamNames = (
  input: unknown,
  teamOrder: number[],
): Record<string, string> => {
  const fallback: Record<string, string> = {};
  teamOrder.forEach((teamId) => {
    fallback[String(teamId)] = getDefaultTeamName(teamId);
  });

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const raw = input as Record<string, unknown>;
  const normalized: Record<string, string> = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value !== "string") {
      return;
    }

    const numericKey = Number(key);
    if (Number.isInteger(numericKey) && numericKey > 0) {
      normalized[String(numericKey)] =
        value.trim() || getDefaultTeamName(numericKey);
      return;
    }

    const match = key.match(/^team(\d+)$/i);
    if (match) {
      const id = Number(match[1]);
      normalized[String(id)] = value.trim() || getDefaultTeamName(id);
    }
  });

  return teamOrder.reduce<Record<string, string>>((acc, teamId) => {
    const id = String(teamId);
    acc[id] = normalized[id] || fallback[id];
    return acc;
  }, {});
};

export default function TeamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialPlayers = useMemo<PlayerConfig[]>(() => {
    const raw = params.players as string | undefined;
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((player) => ({
        id: String(player.id),
        name: String(player.name || "").trim(),
        team: Number(player.team) || 1,
      }));
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
        teamOrder: [1, 2],
        teamNames: {
          "1": getDefaultTeamName(1),
          "2": getDefaultTeamName(2),
        },
      };
    }

    try {
      const parsed = JSON.parse(raw);
      const teamOrder = normalizeTeamOrder(parsed.teamOrder);
      const teamNames = normalizeTeamNames(parsed.teamNames, teamOrder);

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
        teamOrder,
        teamNames,
      };
    } catch {
      return {
        timePerTurn: 30,
        wordsPerPlayer: 3,
        skipsPerTurn: 1,
        rounds: [true, true, true, true],
        teamOrder: [1, 2],
        teamNames: {
          "1": getDefaultTeamName(1),
          "2": getDefaultTeamName(2),
        },
      };
    }
  }, [params.settings]);

  const [players, setPlayers] = useState<PlayerConfig[]>(initialPlayers);
  const [settings, setSettings] = useState<MatchSettings>(initialSettings);
  const [draftNamesByTeam, setDraftNamesByTeam] = useState<
    Record<string, string>
  >({});
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;

  const playersByTeam = useMemo(() => {
    const grouped: Record<number, PlayerConfig[]> = {};
    settings.teamOrder.forEach((teamId) => {
      grouped[teamId] = [];
    });

    players.forEach((player) => {
      if (!grouped[player.team]) {
        grouped[player.team] = [];
      }
      grouped[player.team].push(player);
    });

    return grouped;
  }, [players, settings.teamOrder]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.025,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const addTeam = () => {
    setSettings((previous) => {
      if (previous.teamOrder.length >= 5) {
        Alert.alert("Limite alcanzado", "Puedes jugar con hasta 5 equipos.");
        return previous;
      }

      const nextTeamId =
        previous.teamOrder.reduce((max, id) => Math.max(max, id), 0) + 1;
      return {
        ...previous,
        teamOrder: [...previous.teamOrder, nextTeamId],
        teamNames: {
          ...previous.teamNames,
          [String(nextTeamId)]: getDefaultTeamName(nextTeamId),
        },
      };
    });
  };

  const removeTeam = (teamId: number) => {
    if (settings.teamOrder.length <= 2) {
      Alert.alert(
        "Minimo 2 equipos",
        "La partida necesita al menos 2 equipos.",
      );
      return;
    }

    if ((playersByTeam[teamId] || []).length > 0) {
      Alert.alert(
        "Equipo con jugadores",
        "Quita primero los jugadores del equipo antes de eliminarlo.",
      );
      return;
    }

    setSettings((previous) => {
      const teamOrder = previous.teamOrder.filter((id) => id !== teamId);
      const teamNames = { ...previous.teamNames };
      delete teamNames[String(teamId)];
      return {
        ...previous,
        teamOrder,
        teamNames,
      };
    });
  };

  const addPlayerToTeam = (teamId: number) => {
    const key = String(teamId);
    const name = (draftNamesByTeam[key] || "").trim();

    if (!name) {
      Alert.alert("Nombre requerido", "Escribe el nombre del jugador.");
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlayers((previous) => [
      ...previous,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        name,
        team: teamId,
      },
    ]);

    setDraftNamesByTeam((previous) => ({
      ...previous,
      [key]: "",
    }));
  };

  const removePlayer = (playerId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlayers((previous) =>
      previous.filter((player) => player.id !== playerId),
    );
  };

  const startMatch = () => {
    const teamIds = settings.teamOrder;

    if (teamIds.length < 2) {
      Alert.alert(
        "Equipos insuficientes",
        "Necesitas al menos 2 equipos para empezar.",
      );
      return;
    }

    const teamsWithFewPlayers = teamIds.filter(
      (teamId) => (playersByTeam[teamId] || []).length < 2,
    );

    if (teamsWithFewPlayers.length > 0) {
      const teamList = teamsWithFewPlayers
        .map((teamId) => {
          const rawName = (settings.teamNames[String(teamId)] || "").trim();
          return rawName || getDefaultTeamName(teamId);
        })
        .join(", ");

      Alert.alert(
        "Jugadores insuficientes por equipo",
        `Cada equipo necesita al menos 2 jugadores. Revisa: ${teamList}.`,
      );
      return;
    }

    const finalTeamNames = teamIds.reduce<Record<string, string>>(
      (acc, teamId) => {
        const rawName = (settings.teamNames[String(teamId)] || "").trim();
        acc[String(teamId)] = rawName || getDefaultTeamName(teamId);
        return acc;
      },
      {},
    );

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
            teamOrder: teamIds,
            teamNames: finalTeamNames,
          }),
        },
      });
      setIsStartingMatch(false);
    }, 450);
  };

  return (
    <LinearGradient
      colors={["#fff4d9", "#ffe4d6", "#f7f7ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Equipos</Text>
          <Text style={styles.subtitle}>
            Minimal, directo y sin pasos extra
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
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
          <Ionicons name="options-outline" size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {settings.teamOrder.map((teamId) => {
          const teamName =
            (settings.teamNames[String(teamId)] || "").trim() ||
            getDefaultTeamName(teamId);
          const teamPlayers = playersByTeam[teamId] || [];
          const theme = TEAM_THEME[teamId] || TEAM_THEME[5];

          return (
            <View
              key={`team-${teamId}`}
              style={[
                styles.teamCard,
                { backgroundColor: theme.tint, borderColor: theme.border },
              ]}
            >
              <View style={styles.teamHeader}>
                <View style={styles.teamIdentity}>
                  <View
                    style={[styles.teamDot, { backgroundColor: theme.dot }]}
                  />
                  <View style={styles.teamTitleWrap}>
                    <Text style={styles.teamTitle}>{teamName}</Text>
                    <Text style={styles.teamMeta}>
                      {teamPlayers.length} jugadores
                    </Text>
                  </View>
                </View>
                {settings.teamOrder.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeTeamButton}
                    onPress={() => removeTeam(teamId)}
                  >
                    <Text style={styles.removeTeamButtonText}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Input
                placeholder="Nombre del jugador"
                value={draftNamesByTeam[String(teamId)] || ""}
                onChangeText={(value) =>
                  setDraftNamesByTeam((previous) => ({
                    ...previous,
                    [String(teamId)]: value,
                  }))
                }
                onSubmitEditing={() => addPlayerToTeam(teamId)}
              />

              <View style={styles.addPlayerRowCompact}>
                <View style={styles.addPlayerInputWrap}>
                  <Text style={styles.addPlayerHint}>
                    Agregar jugador a {teamName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addPlayerButton}
                  onPress={() => addPlayerToTeam(teamId)}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.playerList}>
                {teamPlayers.length === 0 ? (
                  <Text style={styles.emptyText}>Sin jugadores</Text>
                ) : (
                  teamPlayers.map((player) => (
                    <View key={player.id} style={styles.playerChip}>
                      <Text style={styles.playerChipText}>{player.name}</Text>
                      <TouchableOpacity onPress={() => removePlayer(player.id)}>
                        <Ionicons name="close" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addTeamCta} onPress={addTeam}>
          <Text style={styles.addTeamCtaText}>+ Agregar equipo</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {settings.timePerTurn}s · {settings.wordsPerPlayer} palabras ·{" "}
          {formatSkipsPerTurn(settings.skipsPerTurn)} ·{" "}
          {settings.rounds.filter(Boolean).length} rondas
        </Text>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748b",
    fontWeight: "600",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  teamCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  teamIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamTitleWrap: {
    flex: 1,
  },
  teamTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 20,
  },
  teamMeta: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 12,
  },
  removeTeamButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  removeTeamButtonText: {
    color: "#be123c",
    fontWeight: "700",
    fontSize: 12,
  },
  addPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addPlayerRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  addPlayerInputWrap: {
    flex: 1,
  },
  addPlayerHint: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
  },
  addPlayerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  playerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
  },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 10,
  },
  playerChipText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  addTeamCta: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "rgba(255,255,255,0.84)",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addTeamCtaText: {
    color: "#0f172a",
    fontWeight: "800",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  footerText: {
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
  },
});
