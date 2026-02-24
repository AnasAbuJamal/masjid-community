import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';

export default function SchoolScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.title}>My Children</Text>
          <Text style={styles.empty}>No children registered</Text>
          <Text style={styles.subtext}>Contact the admin to add your children to your account</Text>
        </Card>
        <Card>
          <Text style={styles.title}>View Another Student</Text>
          <View style={styles.lookup}>
            <Card style={styles.lookupCard}><Text style={styles.lookupText}>Enter Student ID</Text></Card>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  empty: { fontSize: 16, color: COLORS.text, fontWeight: '500', textAlign: 'center', paddingVertical: 16 },
  subtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  lookup: { marginTop: 8 },
  lookupCard: { alignItems: 'center' },
  lookupText: { color: COLORS.textSecondary },
});
