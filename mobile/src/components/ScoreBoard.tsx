import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ScoreBoardProps {
  team1Score: number;
  team2Score: number;
  team1Name?: string;
  team2Name?: string;
  variant?: 'compact' | 'full';
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  team1Score,
  team2Score,
  team1Name = 'Equipo 1',
  team2Name = 'Equipo 2',
  variant = 'compact',
}) => {
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactTeam}>
          <Text style={styles.compactLabel}>🔵 {team1Score}</Text>
        </View>
        <View style={styles.compactTeam}>
          <Text style={styles.compactLabel}>🔴 {team2Score}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={[styles.teamCard, styles.team1]}>
        <Text style={styles.teamName}>🔵 {team1Name}</Text>
        <Text style={styles.score}>{team1Score}</Text>
      </View>
      <View style={styles.divider} />
      <View style={[styles.teamCard, styles.team2]}>
        <Text style={styles.teamName}>🔴 {team2Name}</Text>
        <Text style={styles.score}>{team2Score}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  compactTeam: {
    flex: 1,
  },
  compactLabel: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  fullContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  team1: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  team2: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  teamName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  score: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.dark,
  },
  divider: {
    width: 1,
    backgroundColor: colors.light,
  },
});
