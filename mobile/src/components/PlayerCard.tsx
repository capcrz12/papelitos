import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface PlayerCardProps {
  name: string;
  team: 1 | 2;
  isConnected?: boolean;
  isCurrent?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  team,
  isConnected = true,
  isCurrent = false,
}) => {
  const teamColor = team === 1 ? colors.team1 : colors.team2;
  const teamEmoji = team === 1 ? '🔵' : '🔴';

  return (
    <View style={[styles.container, isCurrent && styles.container_current]}>
      <View style={[styles.indicator, { backgroundColor: teamColor }]} />
      <View style={styles.content}>
        <Text style={styles.name}>
          {teamEmoji} {name}
        </Text>
        {!isConnected && <Text style={styles.disconnected}>Desconectado</Text>}
        {isCurrent && <Text style={styles.currentLabel}>Jugando ahora</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  container_current: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: colors.warning,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.md,
    color: colors.dark,
    fontWeight: typography.weights.medium,
  },
  disconnected: {
    fontSize: typography.sizes.xs,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  currentLabel: {
    fontSize: typography.sizes.xs,
    color: colors.warning,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
});
