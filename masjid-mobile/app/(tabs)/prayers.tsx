import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';
import { prayerService } from '../../services/api';

export default function PrayersScreen() {
  const [prayers, setPrayers] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');

  useEffect(() => { prayerService.getToday().then(setPrayers); }, []);

  const p = prayers || { fajr: '05:45', sunrise: '07:10', dhuhr: '12:30', asr: '15:45', maghrib: '18:00', isha: '19:30', jummah1: '13:00', jummah2: '14:00' };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.tab, viewMode === 'today' && styles.tabActive]} onPress={() => setViewMode('today')}><Text style={[styles.tabText, viewMode === 'today' && styles.tabTextActive]}>Today</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, viewMode === 'week' && styles.tabActive]} onPress={() => setViewMode('week')}><Text style={[styles.tabText, viewMode === 'week' && styles.tabTextActive]}>Week</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.jummahCard}>
          <Text style={styles.jummahTitle}>Friday Prayers (Jummah)</Text>
          <View style={styles.jummahRow}>
            <View style={styles.jummahItem}><Text style={styles.jummahLabel}>1st</Text><Text style={styles.jummahTime}>{p.jummah1}</Text></View>
            <View style={styles.jummahItem}><Text style={styles.jummahLabel}>2nd</Text><Text style={styles.jummahTime}>{p.jummah2}</Text></View>
          </View>
        </Card>
        {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => (
          <Card key={name} style={styles.prayerCard}>
            <Text style={styles.prayerName}>{name}</Text>
            <Text style={styles.prayerTime}>{p[name.toLowerCase()]}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.surface },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  content: { padding: 16 },
  jummahCard: { backgroundColor: COLORS.secondary, marginBottom: 16 },
  jummahTitle: { color: COLORS.white, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  jummahRow: { flexDirection: 'row', justifyContent: 'space-around' },
  jummahItem: { alignItems: 'center' },
  jummahLabel: { color: COLORS.white, fontSize: 12, opacity: 0.8 },
  jummahTime: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  prayerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayerName: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  prayerTime: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
});
