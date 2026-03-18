import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'floating';
  onPress?: () => void;
  noPadding?: boolean;
}

export function GlassCard({ 
  children, 
  style, 
  variant = 'default',
  onPress,
  noPadding = false,
}: GlassCardProps) {
  const cardStyle = [
    styles.glass,
    variant === 'elevated' && styles.elevated,
    variant === 'floating' && styles.floating,
    noPadding && styles.noPadding,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.shine} />
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      <View style={styles.shine} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    padding: SPACING.md,
    ...SHADOWS.glass,
  },
  elevated: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderLight,
  },
  floating: {
    backgroundColor: COLORS.surfaceGlassLight,
    borderColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  noPadding: {
    padding: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: COLORS.glassShine,
    opacity: 0.4,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
});
