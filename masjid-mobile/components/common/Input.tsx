import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  style?: TextStyle;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'name' | 'off';
  secureTextEntry?: boolean;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={20}
            color={focused ? COLORS.primary : COLORS.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textLight}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.rightIcon}>
            <MaterialCommunityIcons
              name={secure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} disabled={!onRightIconPress}>
            <MaterialCommunityIcons name={rightIcon as any} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    fontSize: 15,
    color: COLORS.text,
  },
  leftIcon: {
    marginRight: SPACING.xs + 2,
  },
  rightIcon: {
    marginLeft: SPACING.xs + 2,
    padding: 2,
  },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
