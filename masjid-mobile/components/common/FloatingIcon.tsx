import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface FloatingIconProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  glow?: boolean;
}

export function FloatingIcon({
  icon,
  size = 'md',
  color = COLORS.primary,
  style,
  glow = false,
}: FloatingIconProps) {
  const sizeValue = {
    sm: 40,
    md: 52,
    lg: 64,
  }[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: color + '18',
        },
        glow && styles.glow,
        style,
      ]}
    >
      <View style={[styles.inner, { backgroundColor: color + '30' }]}>
        {icon}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  inner: {
    width: '85%',
    height: '85%',
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
