import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, ScreenWrapper, TAB_BAR_HEIGHT } from '../../components/common';
import apiService from '../../services/api-service';
import { DEMO_MODE } from '../../services/api-config';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface PrayerTimes { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string; jummah1: string; jummah2: string; }
interface PrayerRow { name: string; key: keyof PrayerTimes; icon: string; iqamah?: string; }

const PRAYER_ROWS: PrayerRow[] = [
  { name: 'Fajr', key: 'fajr', icon: 'weather-night', iqamah: '+20 min' },
  { name: 'Sunrise', key: 'sunrise', icon: 'weather-sunset-up' },
  { name: 'Dhuhr', key: 'dhuhr', icon: 'weather-sunny', iqamah: '+15 min' },
  { name: 'Asr', key: 'asr', icon: 'weather-partly-cloudy', iqamah: '+15 min' },
  { name: 'Maghrib', key: 'maghrib', icon: 'weather-sunset', iqamah: '+5 min' },
  { name: 'Isha', key: 'isha', icon: 'weather-night', iqamah: '+15 min' },
];

function getNextPrayerKey(p: PrayerTimes): keyof PrayerTimes | null {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const order: (keyof PrayerTimes)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const key of order) {
    const [h, m] = (p[key] || '00:00').split(':').map(Number);
    if (h * 60 + m > nowMins) return key;
  }
  return null;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export default function PrayersScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [p, setPrayers] = useState<PrayerTimes>({ fajr: '--:--', sunrise: '--:--', dhuhr: '--:--', asr: '--:--', maghrib: '--:--', isha: '--:--', jummah1: '--:--', jummah2: '--:--' });
  const [error, setError] = useState<string | null>(null);
  const onRefresh = async () => {
    setRefreshing(true);
    try { setPrayers(await apiService.prayers.getToday()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load prayer times.'); }
    finally { setRefreshing(false); }
  };
  useEffect(() => { void onRefresh(); }, []);

  const nextKey = getNextPrayerKey(p);

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {DEMO_MODE && <Text style={styles.note}>Preview mode · Sample prayer times</Text>}
        {error && <TouchableOpacity onPress={onRefresh} accessibilityRole="button" style={{ padding: SPACING.md }}><Text accessibilityRole="alert" style={{ color: COLORS.error }}>{error} Tap to retry.</Text></TouchableOpacity>}
        {/* Column Layout: Jummah Card Section */}
        <View style={styles.cardSection}>
          <GlassCard style={styles.jummahCard} variant="floating">
            <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.jummahGradient}>
              <View style={styles.jummahShine} />
              <View style={styles.jummahHeader}>
                <MaterialCommunityIcons name="mosque" size={24} color={COLORS.white} />
                <Text style={styles.jummahTitle}>Friday Prayers (Jummah)</Text>
              </View>
              <View style={styles.jummahRow}>
                {[{ label: '1st Jummah', time: p.jummah1 }, { label: '2nd Jummah', time: p.jummah2 }].map(({ label, time }) => (
                  <View key={label} style={styles.jummahItem}><Text style={styles.jummahLabel}>{label}</Text><Text style={styles.jummahTime}>{time}</Text></View>
                ))}
              </View>
            </LinearGradient>
          </GlassCard>
        </View>

        {/* Column Layout: Table Header */}
        <View style={styles.tableSection}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Prayer</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Adhan</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Iqamah</Text>
          </View>
        </View>

        {/* Column Layout: Prayer Rows */}
        <View style={styles.prayersSection}>
          {PRAYER_ROWS.map((row) => {
            const isNext = row.key === nextKey;
            const iqamahTime = null; // Publish confirmed iqamah times before displaying them.
            return (
              <GlassCard key={row.key} style={styles.prayerRow} variant={isNext ? 'floating' : 'default'}>
                <View style={[styles.prayerNameCell, { flex: 2 }]}>
                  <View style={[styles.iconBox, isNext && styles.iconBoxActive]}>
                    <MaterialCommunityIcons name={row.icon as any} size={18} color={isNext ? COLORS.white : COLORS.primary} />
                  </View>
                  <View><Text style={styles.prayerLabel}>{row.name}</Text>
                    {isNext && <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>NEXT</Text></View>}
                  </View>
                </View>
                <Text style={[styles.timeCell, { flex: 1.5 }]}>{p[row.key]}</Text>
                <Text style={[styles.timeCell, { flex: 1.5 }, !iqamahTime && styles.noIqamah]}>{iqamahTime ?? '—'}</Text>
              </GlassCard>
            );
          })}
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.note}>Iqamah times have not been published. Please confirm with the masjid.</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: TAB_BAR_HEIGHT + SPACING.lg },

  // Card Section
  cardSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  jummahCard: { borderRadius: RADIUS.xxl, overflow: 'hidden' },
  jummahGradient: { borderRadius: RADIUS.xxl, padding: SPACING.lg, overflow: 'hidden' },
  jummahShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(255, 255, 255, 0.25)', borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  jummahHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  jummahTitle: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  jummahRow: { flexDirection: 'row', justifyContent: 'space-around' },
  jummahItem: { alignItems: 'center' },
  jummahLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
  jummahTime: { color: COLORS.white, fontSize: 24, fontWeight: '800' },

  // Table Section
  tableSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  tableHeader: { flexDirection: 'row', paddingVertical: SPACING.sm },
  headerCell: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Prayers Section
  prayersSection: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  prayerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4, minHeight: 60 },
  prayerNameCell: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  iconBoxActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  prayerLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  nextBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
  nextBadgeText: { fontSize: 8, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  timeCell: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  noIqamah: { color: COLORS.textSecondary, fontWeight: '400' },

  // Note Section
  noteSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  note: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', fontStyle: 'italic' },

  bottomSpacer: { height: SPACING.lg },
});
