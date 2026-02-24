import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';

export const Card: React.FC<{ children: React.ReactNode; title?: string; style?: ViewStyle }> = ({ children, title, style }) => (
  <View style={[styles.card, style]}>
    {title && <Text style={styles.title}>{title}</Text>}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
});
