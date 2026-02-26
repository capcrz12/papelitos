import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

interface TimerProps {
  seconds: number;
  total?: number;
  variant?: 'default' | 'warning' | 'danger';
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  total = 60,
  variant = 'default',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (seconds <= 10) {
      // Pulse animation when time is running out
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [seconds]);

  const getVariant = () => {
    if (variant !== 'default') return variant;
    if (seconds <= 10) return 'danger';
    if (seconds <= 20) return 'warning';
    return 'default';
  };

  const currentVariant = getVariant();

  return (
    <Animated.View
      style={[
        styles.container,
        styles[`container_${currentVariant}`],
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={[styles.time, styles[`time_${currentVariant}`]]}>
        {seconds}s
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  container_default: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  container_warning: {
    backgroundColor: 'rgba(243, 156, 18, 0.3)',
  },
  container_danger: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  time: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  time_default: {
    color: colors.white,
  },
  time_warning: {
    color: colors.warning,
  },
  time_danger: {
    color: colors.danger,
  },
});
