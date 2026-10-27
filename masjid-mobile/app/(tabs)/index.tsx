import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { ScreenWrapper, TAB_BAR_HEIGHT } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface PrayerTimes {
  date: string;
  fajr: string; sunrise: string; dhuhr: string; asr: string;
  maghrib: string; isha: string; jummah1: string; jummah2: string;
}
interface Announcement { id: number; title: string; message: string; type: string; startsAt: string }
const PRAYERS = [
  { key: 'fajr', name: 'Fajr' },
  { key: 'sunrise', name: 'Sunrise' },
  { key: 'dhuhr', name: 'Dhuhr' },
  { key: 'asr', name: 'Asr' },
  { key: 'maghrib', name: 'Maghrib' },
  { key: 'isha', name: 'Isha' },
] as const;
const ACTIONS = [
  { icon: 'heart-outline', title: 'Donate', route: '/donate' },
  { icon: 'newspaper-variant-outline', title: 'Community News', route: '/blog' },
  { icon: 'calendar-month-outline', title: 'Events', route: '/events' },
  { icon: 'school-outline', title: 'School', route: '/(tabs)/school' },
  { icon: 'briefcase-outline', title: 'Jobs', route: '/jobs' },
  { icon: 'calendar-clock-outline', title: 'Prayer Calendar', route: '/prayers/calendar' },
] as const;

function validTime(value: string): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function nextPrayer(today: PrayerTimes, now: Date) {
  const current = now.getHours() * 60 + now.getMinutes();
  for (const prayer of PRAYERS) {
    if (prayer.key === 'sunrise') continue;
    const minutes = validTime(today[prayer.key]);
    if (minutes !== null && minutes > current) {
      return { name: prayer.name, time: today[prayer.key], minutes: minutes - current };
    }
  }
  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [error, setError] = useState('');

  const load = async () => {
    const responses = await Promise.allSettled([
      api.instance.get<PrayerTimes>('/prayers/today'),
      api.instance.get<{ announcements: Announcement[] }>('/public/announcements'),
    ]);
    if (responses[0].status === 'fulfilled') setPrayers(responses[0].value.data);
    else setPrayers(null);
    if (responses[1].status === 'fulfilled') setAnnouncements(responses[1].value.data.announcements || []);
    else setAnnouncements([]);
    setError(responses.every(result => result.status === 'rejected')
      ? 'Community updates are temporarily unavailable. Please check your connection.'
      : '');
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
    const clockTimer = setInterval(() => { setClock(new Date()); }, 30_000);
    const pollTimer = setInterval(() => { void load(); }, 120_000);
    return () => { clearInterval(clockTimer); clearInterval(pollTimer); };
  }, []);
  const refresh = () => { setRefreshing(true); void load(); };
  const upcoming = prayers ? nextPrayer(prayers, clock) : null;
  const columns = width >= 840 ? 3 : 2;

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}
          tintColor={COLORS.primary} />}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>السلام عليكم</Text>
            <Text style={styles.date}>{clock.toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications"
            style={styles.notifButton} onPress={() => router.push('/notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={23} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" style={styles.loader} color={COLORS.primary} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.prayerCard}>
          <View style={styles.prayerHeading}>
            <MaterialCommunityIcons name="mosque" color={COLORS.white} size={25} />
            <Text style={styles.prayerCardTitle}>Today's Prayer Times</Text>
          </View>
          {prayers && upcoming ? (
            <>
              <Text style={styles.nextLabel}>Next prayer today</Text>
              <Text style={styles.nextName}>{upcoming.name}</Text>
              <Text style={styles.nextTime}>{upcoming.time}</Text>
              <Text style={styles.remaining}>
                About {Math.floor(upcoming.minutes / 60)}h {upcoming.minutes % 60}m remaining
              </Text>
            </>
          ) : <Text style={styles.notAvailable}>
            {prayers ? 'All scheduled prayers for today have passed.'
              : 'Today’s prayer timetable is not available.'}
          </Text>}

          {prayers ? <View style={styles.prayerGrid}>
            {PRAYERS.map(prayer => (
              <View key={prayer.key} style={[styles.prayerItem, {
                width: `${(100 / (width >= 700 ? 3 : 2)) - 2}%`,
              }]}>
                <Text style={styles.prayerName}>{prayer.name}</Text>
                <Text style={styles.prayerValue}>{prayers[prayer.key] || 'Not set'}</Text>
              </View>
            ))}
          </View> : null}
          <TouchableOpacity accessibilityRole="button" style={styles.prayerAction}
            onPress={() => router.push('/(tabs)/prayers')}>
            <Text style={styles.prayerActionText}>View prayer timetable</Text>
            <MaterialCommunityIcons name="arrow-right" color={COLORS.white} size={19} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Announcements</Text>
        </View>
        {announcements.length ? announcements.slice(0, 4).map(item => (
          <TouchableOpacity key={item.id} accessibilityRole="button" style={styles.announcement}
            onPress={() => router.push({ pathname: '/announcements/[id]',
              params: { id: String(item.id) } })}>
            <View style={styles.announcementText}>
              <Text style={styles.announcementTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.announcementBody} numberOfLines={3}>{item.message}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )) : <Text style={styles.muted}>
          No current community announcements have been published.
        </Text>}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          {ACTIONS.map(action => (
            <TouchableOpacity key={action.title} accessibilityRole="button"
              accessibilityLabel={action.title}
              onPress={() => router.push(action.route)}
              style={[styles.action, { width: `${(100 / columns) - 1.8}%` }]}>
              <MaterialCommunityIcons name={action.icon} size={25} color={COLORS.primary} />
              <Text style={styles.actionName}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.footer}>
          Prayer and announcement information is published by the masjid office.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 930, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, gap: SPACING.md },
  greeting: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.xs },
  notifButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface },
  loader: { margin: SPACING.lg },
  error: { textAlign: 'center', fontSize: 13, lineHeight: 20, color: COLORS.error,
    marginVertical: SPACING.md },
  prayerCard: { backgroundColor: COLORS.primary, padding: SPACING.lg,
    borderRadius: RADIUS.xl, marginBottom: SPACING.xl },
  prayerHeading: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  prayerCardTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  nextLabel: { color: COLORS.white, opacity: 0.85, fontSize: 13,
    marginTop: SPACING.lg },
  nextName: { color: COLORS.white, fontSize: 34, fontWeight: '700', marginTop: 5 },
  nextTime: { color: COLORS.white, fontSize: 22, fontWeight: '600', marginTop: 2 },
  remaining: { color: COLORS.white, opacity: 0.85, fontSize: 12, marginTop: SPACING.sm },
  notAvailable: { color: COLORS.white, fontSize: 15, lineHeight: 23,
    marginVertical: SPACING.lg },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: SPACING.sm, marginTop: SPACING.lg },
  prayerItem: { minHeight: 67, backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center',
    justifyContent: 'center' },
  prayerName: { fontSize: 12, color: COLORS.white, opacity: 0.85 },
  prayerValue: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginTop: 4 },
  prayerAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.lg,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  prayerActionText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  sectionHeader: { marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: COLORS.text,
    marginBottom: SPACING.md },
  announcement: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1,
    backgroundColor: COLORS.surface, minHeight: 87, padding: SPACING.md,
    marginBottom: SPACING.sm },
  announcementText: { flex: 1, gap: 4 },
  announcementTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  announcementBody: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  muted: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21,
    marginBottom: SPACING.lg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: SPACING.sm, marginBottom: SPACING.md },
  action: { minHeight: 104, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.sm },
  actionName: { color: COLORS.text, fontSize: 13, fontWeight: '600',
    textAlign: 'center' },
  footer: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12,
    lineHeight: 19, marginTop: SPACING.lg },
});
