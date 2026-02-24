import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';
import { prayerService, announcementService } from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [prayers, setPrayers] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    prayerService.getToday().then(setPrayers);
    announcementService.getAll().then(setAnnouncements);
  }, []);

  const p = prayers || { fajr: '05:45', sunrise: '07:10', dhuhr: '12:30', asr: '15:45', maghrib: '18:00', isha: '19:30' };

  const actions = [
    { icon: 'heart', label: 'Donate', color: COLORS.secondary, route: '/donate' },
    { icon: 'briefcase', label: 'Jobs', color: COLORS.primary, route: '/jobs' },
    { icon: 'lightbulb', label: 'Proposals', color: '#1976d2', route: '/proposals' },
    { icon: 'account-tie', label: 'Workers', color: COLORS.accent, route: '/workers' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.prayerCard}>
          <Text style={styles.prayerTitle}>Today's Prayers</Text>
          <View style={styles.prayerGrid}>
            {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => (
              <View key={name} style={styles.prayerItem}>
                <Text style={styles.prayerName}>{name}</Text>
                <Text style={styles.prayerTime}>{p[name.toLowerCase()]}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Announcements</Text>
        {announcements.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => router.push(`/announcements/${item.id}`)}>
            <Card><Text style={styles.announcementTitle}>{item.title}</Text><Text style={styles.announcementMessage}>{item.message}</Text></Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionButton} onPress={() => router.push(action.route)}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}><MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} /></View>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  prayerCard: { backgroundColor: COLORS.primary },
  prayerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '600', marginBottom: 16 },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  prayerItem: { width: '30%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  prayerName: { color: COLORS.white, fontSize: 12 },
  prayerTime: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  announcementTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  announcementMessage: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
});
