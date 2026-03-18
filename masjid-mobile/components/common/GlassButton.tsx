import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: GlassButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[`size_${size}`],
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
    disabled && styles.textDisabled,
    textStyle,
  ];

  const content = (
    <>
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? COLORS.white : COLORS.primary} 
          size="small" 
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </View>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={['#4A90D9', '#7BB3E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            styles[`size_${size}`],
            disabled && styles.disabled,
          ]}
        >
          <View style={styles.gradientShine} />
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={['rgba(0, 217, 255, 0.2)', 'rgba(109, 213, 237, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            styles[`size_${size}`],
            styles.secondary,
            disabled && styles.disabled,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={buttonStyles}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  gradient: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  gradientShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  secondary: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  size_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 40,
  },
  size_md: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 56,
  },

  // Variants
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Text
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 17,
  },
  textPrimary: {
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.primary,
  },
  textDisabled: {
    color: COLORS.textLight,
  },
});
