import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper, TAB_BAR_HEIGHT } from '../../components/common';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface PrayerTimes {
  date: string; fajr: string; sunrise: string; dhuhr: string; asr: string;
  maghrib: string; isha: string; jummah1: string; jummah2: string;
}
const TIMES = [
  { key: 'fajr', name: 'Fajr', icon: 'weather-night' },
  { key: 'sunrise', name: 'Sunrise', icon: 'weather-sunset-up' },
  { key: 'dhuhr', name: 'Dhuhr', icon: 'weather-sunny' },
  { key: 'asr', name: 'Asr', icon: 'weather-partly-cloudy' },
  { key: 'maghrib', name: 'Maghrib', icon: 'weather-sunset' },
  { key: 'isha', name: 'Isha', icon: 'weather-night' },
] as const;

function parseMinutes(value: string): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
function getUpcoming(times: PrayerTimes, now: Date): string | null {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  for (const key of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
    const minutes = parseMinutes(times[key]);
    if (minutes !== null && minutes > minutesNow) return key;
  }
  return null;
}

export default function PrayersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<PrayerTimes>('/prayers/today');
      setTimes(response.data);
      setError('');
    } catch (failure: unknown) {
      setTimes(null); // Do not keep stale prayer times after a failed refresh.
      const status = (failure as { response?: { status?: number } })?.response?.status;
      setError(status === 404
        ? 'Prayer times have not been published for today.'
        : 'Unable to load today’s prayer times. Check your connection.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    const clockTimer = setInterval(() => setClock(new Date()), 60_000);
    const update = setInterval(() => { void load(); }, 120_000);
    return () => { clearInterval(clockTimer); clearInterval(update); };
  }, []);

  const refresh = () => { setRefreshing(true); void load(); };
  const upcoming = times ? getUpcoming(times, clock) : null;
  const columns = width >= 790 ? 3 : 2;

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}
          tintColor={COLORS.primary} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <Text style={styles.subtitle}>
            {clock.toLocaleDateString(undefined, {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" style={styles.navButton}
            onPress={() => router.push('/prayers/calendar')}>
            <MaterialCommunityIcons name="calendar-month-outline" size={23} color={COLORS.primary} />
            <Text style={styles.navText}>Prayer Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.navButton}
            onPress={() => router.push('/prayers/qibla')}>
            <MaterialCommunityIcons name="compass-outline" size={23} color={COLORS.primary} />
            <Text style={styles.navText}>Qibla</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
          : error ? <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-clock" size={42} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" style={styles.retry}
              onPress={refresh}><Text style={styles.retryText}>Try Again</Text></TouchableOpacity>
          </View>
          : times ? <>
            {upcoming && (
              <View style={styles.upcoming}>
                <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.white} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingHint}>Next prayer today</Text>
                  <Text style={styles.upcomingTitle}>
                    {TIMES.find(item => item.key === upcoming)?.name} · {times[upcoming as keyof PrayerTimes]}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Published adhan times</Text>
            <View style={styles.grid}>
              {TIMES.map(item => (
                <View key={item.key} style={[styles.card, {
                  width: `${(100 / columns) - 1.8}%`,
                }]}>
                  <MaterialCommunityIcons name={item.icon} color={COLORS.primary} size={24} />
                  <Text style={styles.prayerName}>{item.name}</Text>
                  <Text style={styles.prayerTime}>{times[item.key] || 'Not set'}</Text>
                </View>
              ))}
            </View>

            {(times.jummah1 || times.jummah2) && (
              <View style={styles.jummah}>
                <View style={styles.jummahTitle}>
                  <MaterialCommunityIcons name="mosque" size={22} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Friday Jumu’ah</Text>
                </View>
                {times.jummah1 ? <Text style={styles.jummahTime}>First: {times.jummah1}</Text> : null}
                {times.jummah2 ? <Text style={styles.jummahTime}>Second: {times.jummah2}</Text> : null}
              </View>
            )}
            <Text style={styles.note}>
              These times are published by the masjid office. Iqamah times are not currently
              recorded separately, so none are estimated. Please confirm any last-minute
              changes with the masjid.
            </Text>
          </> : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 870, width: '100%', alignSelf: 'center', padding: SPACING.md,
    paddingBottom: TAB_BAR_HEIGHT + SPACING.xxl },
  header: { paddingVertical: SPACING.sm },
  title: { color: COLORS.text, fontSize: 27, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.lg },
  navButton: { flex: 1, flexDirection: 'row', minHeight: 54, alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm, padding: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg },
  navText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  loader: { marginTop: SPACING.xxl },
  empty: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  retry: { minHeight: 44, paddingHorizontal: SPACING.md, justifyContent: 'center' },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  upcoming: { backgroundColor: COLORS.primary, padding: SPACING.lg,
    borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.lg },
  upcomingHint: { fontSize: 13, color: COLORS.white, opacity: 0.85 },
  upcomingTitle: { fontSize: 20, color: COLORS.white, fontWeight: '700', marginTop: 3 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700',
    marginTop: SPACING.sm, marginBottom: SPACING.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: SPACING.sm },
  card: { minHeight: 132, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderColor: COLORS.border,
    borderWidth: 1, padding: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  prayerName: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm },
  prayerTime: { color: COLORS.text, fontWeight: '700', fontSize: 21, marginTop: SPACING.xs },
  jummah: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginTop: SPACING.lg },
  jummahTitle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  jummahTime: { color: COLORS.text, fontSize: 16, marginVertical: SPACING.xs },
  note: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20,
    marginTop: SPACING.lg, textAlign: 'center' },
});
