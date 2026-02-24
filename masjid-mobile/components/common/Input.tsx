import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { COLORS } from '../../constants/theme';

export const Input: React.FC<TextInputProps & { label?: string; error?: string; containerStyle?: ViewStyle }> = ({ label, error, containerStyle, ...props }) => (
  <View style={[styles.container, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputContainer, error && styles.inputError]}>
      <TextInput style={styles.input} placeholderTextColor={COLORS.textSecondary} {...props} />
    </View>
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  inputContainer: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 12 },
  inputError: { borderColor: COLORS.error },
  input: { paddingVertical: 12, fontSize: 16, color: COLORS.text },
  error: { fontSize: 12, color: COLORS.error, marginTop: 4 },
});
