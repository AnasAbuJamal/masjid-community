import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
}) => {
  const containerStyle = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`${variant}Label`],
    styles[`${size}Label`],
    textStyle,
  ];

  const loaderColor =
    variant === 'outline' || variant === 'ghost'
      ? COLORS.primary
      : variant === 'danger'
      ? COLORS.white
      : COLORS.white;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={loaderColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={labelStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  // Variant containers
  primaryContainer: { backgroundColor: COLORS.primary, ...SHADOWS.sm },
  secondaryContainer: { backgroundColor: COLORS.secondary, ...SHADOWS.sm },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghostContainer: { backgroundColor: 'transparent' },
  dangerContainer: { backgroundColor: COLORS.error, ...SHADOWS.sm },

  // Variant labels
  primaryLabel: { color: COLORS.white },
  secondaryLabel: { color: COLORS.white },
  outlineLabel: { color: COLORS.primary },
  ghostLabel: { color: COLORS.primary },
  dangerLabel: { color: COLORS.white },

  // Size containers
  smContainer: { paddingVertical: 8, paddingHorizontal: 16 },
  mdContainer: { paddingVertical: 13, paddingHorizontal: 24 },
  lgContainer: { paddingVertical: 16, paddingHorizontal: 32 },

  // Size labels
  smLabel: { fontSize: 13, fontWeight: '600' },
  mdLabel: { fontSize: 15, fontWeight: '600' },
  lgLabel: { fontSize: 17, fontWeight: '700' },

  // Shared label base
  label: { letterSpacing: 0.2 },
  
  // Content and icon
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
});
