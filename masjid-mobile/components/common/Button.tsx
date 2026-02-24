import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', loading, disabled, style }) => (
  <TouchableOpacity
    style={[styles.base, styles[variant], disabled && styles.disabled, style]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: COLORS.white },
  secondaryText: { color: COLORS.white },
  outlineText: { color: COLORS.primary },
  disabled: { opacity: 0.5 },
});
