import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat' | 'colored';
  accentColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  style,
  contentStyle,
  variant = 'default',
  accentColor,
}) => (
  <View
    style={[
      styles.card,
      variant === 'elevated' && styles.elevated,
      variant === 'flat' && styles.flat,
      variant === 'colored' && accentColor
        ? { backgroundColor: accentColor }
        : null,
      style,
    ]}
  >
    {title && (
      <Text
        style={[
          styles.title,
          variant === 'colored' && styles.titleColored,
        ]}
      >
        {title}
      </Text>
    )}
    <View style={contentStyle}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  elevated: {
    ...SHADOWS.md,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm + 4,
  },
  titleColored: {
    color: COLORS.white,
  },
});
