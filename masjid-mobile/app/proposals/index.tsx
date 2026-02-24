import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';

export default function ProposalsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.content}>
        <Card><Text style={styles.title}>Community Proposals</Text><Text style={styles.desc}>Proposals will appear here.</Text></Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
