import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api-client';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Prayer {
  date: string;
  fajr: string; sunrise: string; dhuhr: string; asr: string;
  maghrib: string; isha: string; jummah1: string; jummah2: string;
}
interface Announcement {
  id: number; title: string; message: string; type: string;
  priority: number; startsAt: string; expiresAt: string | null;
}
const PRAYERS = [
  { key: 'fajr', label: 'Fajr' }, { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Dhuhr' }, { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' }, { key: 'isha', label: 'Isha' },
] as const;

export default function KioskScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isTV = mode === 'tv';
  const [prayers, setPrayers] = useState<Prayer | null>(null);
  const [siteName, setSiteName] = useState("Masjid Al-Momineen");
  const [rotationSeconds, setRotationSeconds] = useState(8);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      api.instance.get<Prayer>('/prayers/today'),
      api.instance.get<{ announcements: Announcement[] }>('/public/announcements'),
      api.instance.get<{ siteName: string; kioskRotationSeconds: number }>('/public/site-settings'),
    ]);
    const prayerResult = results[0];
    const announcementResult = results[1];
    const settingsResult = results[2];
    if (settingsResult.status === 'fulfilled') {
      setSiteName(settingsResult.value.data.siteName);
      setRotationSeconds(settingsResult.value.data.kioskRotationSeconds);
    }
    if (prayerResult.status === 'fulfilled') {
      setPrayers(prayerResult.value.data);
    } else {
      setPrayers(null); // Never display yesterday's prayer times as today's.
    }
    if (announcementResult.status === 'fulfilled') {
      setAnnouncements(announcementResult.value.data.announcements || []);
      setIndex(0);
    } else {
      setAnnouncements([]); // Never rotate stale or fictitious announcements.
    }
    setError(results.every(r => r.status === 'rejected')
      ? 'Kiosk data is unavailable. Check the connection or contact the masjid office.'
      : '');
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const poll = setInterval(() => { void refresh(); }, 120_000);
    const clock = setInterval(() => setNow(new Date()), 30_000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [refresh]);

  useEffect(() => {
    if (!isTV || announcements.length < 2) return;
    const timer = setInterval(() => {
      setIndex(old => (old + 1) % announcements.length);
    }, rotationSeconds * 1000);
    return () => clearInterval(timer);
  }, [isTV, announcements.length, rotationSeconds]);

  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const timeString = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const current = announcements[index] || null;
  const gridColumns = width >= 920 ? 6 : width >= 580 ? 3 : 2;

  return (
    <SafeAreaView style={[styles.container, isTV && styles.tvContainer]} edges={isTV ? [] : ['top']}>
      {!isTV && (
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
            style={styles.back} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Masjid Display</Text>
          <View style={styles.back} />
        </View>
      )}
      <ScrollView contentContainerStyle={[styles.content, isTV && styles.tvContent]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true); void refresh();
        }} tintColor={COLORS.primary} />}>
        <View style={styles.heading}>
          <MaterialCommunityIcons name="mosque" color={isTV ? COLORS.white : COLORS.primary} size={34} />
          <Text style={[styles.title, isTV && styles.tvText]}>{siteName}</Text>
          <Text style={[styles.date, isTV && styles.tvSecondary]}>{dateString}</Text>
          <Text style={[styles.time, isTV && styles.tvText]}>{timeString}</Text>
        </View>

        {!isTV && (
          <TouchableOpacity accessibilityRole="button" style={styles.launch}
            onPress={() => router.setParams({ mode: 'tv' })}>
            <MaterialCommunityIcons name="television-play" color={COLORS.white} size={22} />
            <Text style={styles.launchText}>Open TV Mode</Text>
          </TouchableOpacity>
        )}
        {isTV && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Exit TV mode"
            style={styles.exit} onPress={() => router.setParams({ mode: '' })}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} size="large" />
          : error ? <Text style={[styles.empty, isTV && styles.tvSecondary]}>{error}</Text>
          : null}

        <Text style={[styles.sectionTitle, isTV && styles.tvText]}>Today's Prayer Times</Text>
        {prayers ? (
          <View style={styles.prayerGrid}>
            {PRAYERS.map(prayer => (
              <View key={prayer.key} style={[styles.prayerCard, {
                width: `${(100 / gridColumns) - 1.8}%`,
              }, isTV && styles.tvPrayer]}>
                <Text style={[styles.prayerName, isTV && styles.tvSecondary]}>{prayer.label}</Text>
                <Text style={[styles.prayerTime, isTV && styles.tvText]}>
                  {prayers[prayer.key] || 'Not set'}
                </Text>
              </View>
            ))}
          </View>
        ) : <Text style={[styles.empty, isTV && styles.tvSecondary]}>
          Prayer times have not been published for today.
        </Text>}

        {prayers && (prayers.jummah1 || prayers.jummah2) && (
          <View style={[styles.jummah, isTV && styles.tvPrayer]}>
            <Text style={[styles.sectionTitle, isTV && styles.tvText]}>Friday Prayer</Text>
            {prayers.jummah1 ? <Text style={[styles.jummahTime, isTV && styles.tvText]}>
              First Jumu'ah: {prayers.jummah1}</Text> : null}
            {prayers.jummah2 ? <Text style={[styles.jummahTime, isTV && styles.tvText]}>
              Second Jumu'ah: {prayers.jummah2}</Text> : null}
          </View>
        )}

        <Text style={[styles.sectionTitle, isTV && styles.tvText]}>Community Announcements</Text>
        {announcements.length === 0 ? (
          <Text style={[styles.empty, isTV && styles.tvSecondary]}>No current announcements.</Text>
        ) : isTV ? (
          <View style={[styles.announcement, styles.tvAnnouncement]}>
            <Text style={[styles.announcementTitle, styles.tvText]}>{current?.title}</Text>
            <Text style={[styles.announcementBody, styles.tvSecondary]}>{current?.message}</Text>
            <Text style={styles.pager}>{index + 1} / {announcements.length}</Text>
          </View>
        ) : announcements.map(item => (
          <View key={item.id} style={styles.announcement}>
            <Text style={styles.announcementTitle}>{item.title}</Text>
            <Text style={styles.announcementBody}>{item.message}</Text>
          </View>
        ))}
        <Text style={[styles.note, isTV && styles.tvSecondary]}>
          Updated from published masjid records approximately every two minutes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tvContainer: { backgroundColor: '#0D1B2A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 1160, alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  tvContent: { paddingTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  heading: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  date: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  time: { fontSize: 32, fontWeight: '700', color: COLORS.text },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700',
    marginVertical: SPACING.md },
  launch: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg },
  launchText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  exit: { alignSelf: 'flex-end', minHeight: 48, minWidth: 48,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  loader: { margin: SPACING.lg },
  empty: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginVertical: SPACING.lg },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', rowGap: SPACING.sm },
  prayerCard: { minHeight: 94, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center',
    justifyContent: 'center' },
  prayerName: { fontSize: 13, color: COLORS.textSecondary },
  prayerTime: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginTop: SPACING.sm },
  jummah: { borderRadius: RADIUS.lg, borderColor: COLORS.border,
    borderWidth: 1, backgroundColor: COLORS.surface, padding: SPACING.md,
    marginTop: SPACING.md },
  jummahTime: { color: COLORS.text, fontSize: 16, marginTop: SPACING.xs },
  announcement: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, padding: SPACING.lg, marginBottom: SPACING.md },
  announcementTitle: { fontSize: 20, color: COLORS.text, fontWeight: '700',
    marginBottom: SPACING.sm },
  announcementBody: { fontSize: 16, lineHeight: 25, color: COLORS.textSecondary },
  note: { color: COLORS.textSecondary, fontSize: 12,
    textAlign: 'center', marginTop: SPACING.lg },
  tvText: { color: COLORS.white },
  tvSecondary: { color: '#DCE8F5' },
  tvPrayer: { backgroundColor: '#22374A', borderColor: '#40566A' },
  tvAnnouncement: { backgroundColor: '#22374A', borderColor: '#40566A' },
  pager: { color: '#9AB4CA', marginTop: SPACING.md, textAlign: 'right' },
});
