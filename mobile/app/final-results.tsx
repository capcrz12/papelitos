import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
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
  players: PlayerConfig[];
  teamOrder: number[];
  teamNames: Record<string, string>;
}

interface FinalStats {
  teamScores: Record<number, number>;
  roundWins: Record<number, number>;
  playerScores: Record<string, number>;
  roundPlayerScores: Record<number, Record<string, number>>;
  enabledRounds: number[];
}

const ROUND_META = [
  { id: 1, name: "Descripcion" },
  { id: 2, name: "Una palabra" },
  { id: 3, name: "Mimica" },
  { id: 4, name: "Sonidos" },
];

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

const fallbackStats: FinalStats = {
  teamScores: { 1: 0, 2: 0 },
  roundWins: { 1: 0, 2: 0 },
  playerScores: {},
  roundPlayerScores: {},
  enabledRounds: [1],
};

export default function FinalResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const setup = useMemo<GameSetup>(() => {
    const raw = params.setup as string | undefined;
    if (!raw) {
      return fallbackSetup;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) {
        return fallbackSetup;
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
                }
                return acc;
              }, {})
            : { "1": getDefaultTeamName(1), "2": getDefaultTeamName(2) },
      };
    } catch {
      return fallbackSetup;
    }
  }, [params.setup]);

  const stats = useMemo<FinalStats>(() => {
    const raw = params.stats as string | undefined;
    if (!raw) {
      return fallbackStats;
    }

    try {
      const parseTeamScores = (value: unknown): Record<number, number> => {
        if (!value || typeof value !== "object") {
          return { 1: 0, 2: 0 };
        }

        const input = value as Record<string, unknown>;
        const output: Record<number, number> = {};

        Object.entries(input).forEach(([key, raw]) => {
          const numericKey = Number(key);
          if (Number.isInteger(numericKey) && numericKey > 0) {
            output[numericKey] = Number(raw) || 0;
            return;
          }

          const match = key.match(/^team(\d+)$/i);
          if (match) {
            const teamId = Number(match[1]);
            output[teamId] = Number(raw) || 0;
          }
        });

        return Object.keys(output).length > 0 ? output : { 1: 0, 2: 0 };
      };

      const parsed = JSON.parse(raw);
      return {
        teamScores: parseTeamScores(parsed?.teamScores),
        roundWins: parseTeamScores(parsed?.roundWins),
        playerScores:
          parsed?.playerScores && typeof parsed.playerScores === "object"
            ? parsed.playerScores
            : {},
        roundPlayerScores:
          parsed?.roundPlayerScores &&
          typeof parsed.roundPlayerScores === "object"
            ? parsed.roundPlayerScores
            : {},
        enabledRounds: Array.isArray(parsed?.enabledRounds)
          ? parsed.enabledRounds
              .map((value: unknown) => Number(value))
              .filter(Boolean)
          : [1],
      };
    } catch {
      return fallbackStats;
    }
  }, [params.stats]);

  const teamIds = useMemo(() => {
    const idsFromOrder = setup.teamOrder;
    const idsFromPlayers = setup.players.map((player) => player.team);
    const idsFromScores = [
      ...Object.keys(stats.teamScores).map((value) => Number(value)),
      ...Object.keys(stats.roundWins).map((value) => Number(value)),
    ];

    const merged = Array.from(
      new Set([...idsFromOrder, ...idsFromPlayers, ...idsFromScores]),
    )
      .filter((value) => Number.isInteger(value) && value > 0)
      .sort((a, b) => a - b);

    return merged.length > 0 ? merged : [1, 2];
  }, [setup.players, setup.teamOrder, stats.roundWins, stats.teamScores]);

  const getTeamName = (teamId: number) =>
    setup.teamNames[String(teamId)] || getDefaultTeamName(teamId);

  const maxRoundWins = Math.max(
    ...teamIds.map((teamId) => stats.roundWins[teamId] || 0),
    0,
  );
  const teamsWithMaxRoundWins = teamIds.filter(
    (teamId) => (stats.roundWins[teamId] || 0) === maxRoundWins,
  );
  const maxScoreAmongTied = Math.max(
    ...teamsWithMaxRoundWins.map((teamId) => stats.teamScores[teamId] || 0),
    0,
  );
  const winnerTeams = teamsWithMaxRoundWins.filter(
    (teamId) => (stats.teamScores[teamId] || 0) === maxScoreAmongTied,
  );

  const usedScoreTiebreak =
    teamsWithMaxRoundWins.length > 1 && winnerTeams.length === 1;

  const winnerPlayers =
    winnerTeams.length === 1
      ? setup.players.filter((player) => player.team === winnerTeams[0])
      : [];

  const goToTeamsWithSameSetup = () => {
    router.replace({
      pathname: "/teams",
      params: {
        players: JSON.stringify(setup.players),
        settings: JSON.stringify({
          timePerTurn: setup.timePerTurn,
          wordsPerPlayer: setup.wordsPerPlayer,
          skipsPerTurn: setup.skipsPerTurn,
          rounds: setup.rounds,
          teamNames: setup.teamNames,
          teamOrder: setup.teamOrder,
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <MotiView
          from={{ opacity: 0, translateY: 18, scale: 0.97 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", duration: 420 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroKicker}>Resultado final</Text>
          <Text style={styles.heroTitle}>
            {winnerTeams.length === 1
              ? `${getTeamName(winnerTeams[0])} gana`
              : "Empate"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {winnerTeams.length === 1
              ? `Rondas ganadas: ${stats.roundWins[winnerTeams[0]] || 0}${
                  usedScoreTiebreak ? " · Desempate por total de aciertos" : ""
                }`
              : "Empate en rondas y en total de aciertos"}
          </Text>

          {winnerPlayers.length > 0 && (
            <View style={styles.winnerNamesRow}>
              {winnerPlayers.map((player, index) => (
                <MotiView
                  key={player.id}
                  from={{ opacity: 0, translateY: 8, scale: 0.95 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{
                    type: "timing",
                    duration: 280,
                    delay: index * 110,
                  }}
                  style={styles.winnerNameChip}
                >
                  <Text style={styles.winnerNameText}>{player.name}</Text>
                </MotiView>
              ))}
            </View>
          )}
        </MotiView>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadisticas por equipo</Text>
          <View style={styles.teamRow}>
            {teamIds.map((teamId) => (
              <View key={`team-box-${teamId}`} style={styles.teamBox}>
                <Text style={styles.teamName}>{getTeamName(teamId)}</Text>
                <Text style={styles.teamMetric}>
                  Aciertos: {stats.teamScores[teamId] || 0}
                </Text>
                <Text style={styles.teamMetric}>
                  Rondas: {stats.roundWins[teamId] || 0}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Aciertos por jugador y ronda</Text>
          {stats.enabledRounds.map((roundId) => {
            const roundName =
              ROUND_META.find((round) => round.id === roundId)?.name ||
              `Ronda ${roundId}`;
            const roundData = stats.roundPlayerScores[roundId] || {};
            const roundTotals = teamIds.map((teamId) => {
              const total = setup.players
                .filter((player) => player.team === teamId)
                .reduce((sum, player) => sum + (roundData[player.id] || 0), 0);
              return `${getTeamName(teamId)}: ${total}`;
            });

            return (
              <View key={`round-${roundId}`} style={styles.roundCard}>
                <Text style={styles.roundTitle}>
                  Ronda {roundId}: {roundName}
                </Text>
                <Text style={styles.roundTeamTotals}>
                  {roundTotals.join(" · ")}
                </Text>

                {setup.players.map((player) => (
                  <View
                    key={`${roundId}-${player.id}`}
                    style={styles.playerRow}
                  >
                    <Text style={styles.playerLabel}>
                      {player.name} ({getTeamName(player.team)})
                    </Text>
                    <Text style={styles.playerValue}>
                      {roundData[player.id] || 0}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Total individual</Text>
          {setup.players
            .slice()
            .sort(
              (a, b) =>
                (stats.playerScores[b.id] || 0) -
                (stats.playerScores[a.id] || 0),
            )
            .map((player) => (
              <View key={`total-${player.id}`} style={styles.playerRow}>
                <Text style={styles.playerLabel}>
                  {player.name} ({getTeamName(player.team)})
                </Text>
                <Text style={styles.playerValue}>
                  {stats.playerScores[player.id] || 0}
                </Text>
              </View>
            ))}
        </View>

        <Button
          title="Nueva partida"
          onPress={goToTeamsWithSameSetup}
          variant="primary"
          size="large"
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  heroKicker: {
    color: "#c2410c",
    textAlign: "center",
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontSize: 12,
  },
  heroTitle: {
    color: "#0f172a",
    textAlign: "center",
    fontSize: 31,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#374151",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
  winnerNamesRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  winnerNameChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(251, 191, 36, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.26)",
  },
  winnerNameText: {
    color: "#92400e",
    fontWeight: "700",
  },
  statsCard: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: 8,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  teamRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  teamBox: {
    minWidth: "47%",
    borderRadius: 14,
    padding: 10,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    gap: 4,
  },
  teamName: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
  },
  teamMetric: {
    color: "#78350f",
    fontWeight: "600",
  },
  roundCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 250, 245, 0.95)",
    gap: 6,
  },
  roundTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
  },
  roundTeamTotals: {
    color: "#c2410c",
    fontWeight: "700",
    fontSize: 12,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  playerLabel: {
    color: "#1e293b",
    fontWeight: "600",
    flexShrink: 1,
    paddingRight: 8,
  },
  playerValue: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 16,
  },
});
