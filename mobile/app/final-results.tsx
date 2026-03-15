import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
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

interface FinalStats {
  teamScores: { team1: number; team2: number };
  roundWins: { team1: number; team2: number };
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

const fallbackSetup: GameSetup = {
  timePerTurn: 30,
  wordsPerPlayer: 3,
  skipsPerTurn: 1,
  rounds: [true, true, true, true],
  players: [],
};

const fallbackStats: FinalStats = {
  teamScores: { team1: 0, team2: 0 },
  roundWins: { team1: 0, team2: 0 },
  playerScores: {},
  roundPlayerScores: {},
  enabledRounds: [1],
};

export default function FinalResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

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
      const parsed = JSON.parse(raw);
      return {
        teamScores: {
          team1: Number(parsed?.teamScores?.team1) || 0,
          team2: Number(parsed?.teamScores?.team2) || 0,
        },
        roundWins: {
          team1: Number(parsed?.roundWins?.team1) || 0,
          team2: Number(parsed?.roundWins?.team2) || 0,
        },
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

  const winnerTeam: 1 | 2 | null =
    stats.roundWins.team1 === stats.roundWins.team2
      ? null
      : stats.roundWins.team1 > stats.roundWins.team2
        ? 1
        : 2;

  const winnerPlayers =
    winnerTeam === 1
      ? setup.players.filter((player) => player.team === 1)
      : winnerTeam === 2
        ? setup.players.filter((player) => player.team === 2)
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
        }),
      },
    });
  };

  return (
    <LinearGradient
      colors={["#082f49", "#0f766e", "#115e59"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 18, scale: 0.97 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", duration: 420 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroKicker}>Resultado final</Text>
          <Text style={styles.heroTitle}>
            {winnerTeam ? `Equipo ${winnerTeam} ganador` : "Empate"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {winnerTeam
              ? `Rondas ganadas: ${
                  winnerTeam === 1
                    ? stats.roundWins.team1
                    : stats.roundWins.team2
                }`
              : "Ningun equipo supero al otro en rondas"}
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
            <View style={styles.teamBox}>
              <Text style={styles.teamName}>Equipo 1</Text>
              <Text style={styles.teamMetric}>
                Aciertos: {stats.teamScores.team1}
              </Text>
              <Text style={styles.teamMetric}>
                Rondas: {stats.roundWins.team1}
              </Text>
            </View>
            <View style={styles.teamBox}>
              <Text style={styles.teamName}>Equipo 2</Text>
              <Text style={styles.teamMetric}>
                Aciertos: {stats.teamScores.team2}
              </Text>
              <Text style={styles.teamMetric}>
                Rondas: {stats.roundWins.team2}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Aciertos por jugador y ronda</Text>
          {stats.enabledRounds.map((roundId) => {
            const roundName =
              ROUND_META.find((round) => round.id === roundId)?.name ||
              `Ronda ${roundId}`;
            const roundData = stats.roundPlayerScores[roundId] || {};
            const team1Round = setup.players
              .filter((player) => player.team === 1)
              .reduce(
                (total, player) => total + (roundData[player.id] || 0),
                0,
              );
            const team2Round = setup.players
              .filter((player) => player.team === 2)
              .reduce(
                (total, player) => total + (roundData[player.id] || 0),
                0,
              );

            return (
              <View key={`round-${roundId}`} style={styles.roundCard}>
                <Text style={styles.roundTitle}>
                  Ronda {roundId}: {roundName}
                </Text>
                <Text style={styles.roundTeamTotals}>
                  Equipo 1: {team1Round} · Equipo 2: {team2Round}
                </Text>

                {setup.players.map((player) => (
                  <View
                    key={`${roundId}-${player.id}`}
                    style={styles.playerRow}
                  >
                    <Text style={styles.playerLabel}>
                      {player.name} (E{player.team})
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
                  {player.name} (E{player.team})
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
    backgroundColor: "rgba(240, 253, 250, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.38)",
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  heroKicker: {
    color: "#0f766e",
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
    color: "#155e75",
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
    backgroundColor: "rgba(20, 184, 166, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.28)",
  },
  winnerNameText: {
    color: "#134e4a",
    fontWeight: "700",
  },
  statsCard: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.93)",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
    gap: 8,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  teamRow: {
    flexDirection: "row",
    gap: 10,
  },
  teamBox: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    gap: 4,
  },
  teamName: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
  },
  teamMetric: {
    color: "#164e63",
    fontWeight: "600",
  },
  roundCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(240, 249, 255, 0.9)",
    gap: 6,
  },
  roundTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
  },
  roundTeamTotals: {
    color: "#0e7490",
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
