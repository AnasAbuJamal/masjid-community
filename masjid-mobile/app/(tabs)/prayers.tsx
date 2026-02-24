import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { prayerService } from '../../services/api';

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah1: string;
  jummah2: string;
}

interface PrayerRow {
  name: string;
  key: keyof PrayerTimes;
  icon: string;
  iqamah?: string;
}

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
    const [h, m] = p[key].split(':').map(Number);
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
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await prayerService.getToday();
    setPrayers(data as PrayerTimes);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const p: PrayerTimes = prayers ?? {
    fajr: '05:45', sunrise: '07:10', dhuhr: '12:30',
    asr: '15:45', maghrib: '18:00', isha: '19:30',
    jummah1: '13:00', jummah2: '14:00',
  };

  const nextKey = getNextPrayerKey(p);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Jummah card */}
        <Card style={styles.jummahCard}>
          <View style={styles.jummahHeader}>
            <MaterialCommunityIcons name="mosque" size={20} color={COLORS.white} />
            <Text style={styles.jummahTitle}>Friday Prayers (Jummah)</Text>
          </View>
          <View style={styles.jummahRow}>
            {[
              { label: '1st Jummah', time: p.jummah1 },
              { label: '2nd Jummah', time: p.jummah2 },
            ].map(({ label, time }) => (
              <View key={label} style={styles.jummahItem}>
                <Text style={styles.jummahLabel}>{label}</Text>
                <Text style={styles.jummahTime}>{time}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Column headers */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 2 }]}>Prayer</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Adhan</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Iqamah</Text>
        </View>

        {/* Prayer rows */}
        {PRAYER_ROWS.map((row) => {
          const isNext = row.key === nextKey;
          const iqamahTime = row.iqamah
            ? addMinutes(p[row.key], parseInt(row.iqamah))
            : null;

          return (
            <View
              key={row.key}
              style={[styles.prayerRow, isNext && styles.prayerRowActive]}
            >
              <View style={[styles.prayerNameCell, { flex: 2 }]}>
                <MaterialCommunityIcons
                  name={row.icon as any}
                  size={18}
                  color={isNext ? COLORS.white : COLORS.primary}
                />
                <View>
                  <Text
                    style={[styles.prayerLabel, isNext && styles.activePrayerLabel]}
                  >
                    {row.name}
                  </Text>
                  {isNext && (
                    <Text style={styles.nextBadge}>NEXT</Text>
                  )}
                </View>
              </View>
              <Text
                style={[styles.timeCell, { flex: 1.5 }, isNext && styles.activeTime]}
              >
                {p[row.key]}
              </Text>
              <Text
                style={[
                  styles.timeCell,
                  { flex: 1.5 },
                  isNext && styles.activeTime,
                  !iqamahTime && styles.noIqamah,
                ]}
              >
                {iqamahTime ?? '—'}
              </Text>
            </View>
          );
        })}

        <Text style={styles.note}>
          * Iqamah times are approximate. Please arrive early.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  jummahCard: {
    backgroundColor: COLORS.secondary,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  jummahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  jummahTitle: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  jummahRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  jummahItem: { alignItems: 'center' },
  jummahLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
  jummahTime: { color: COLORS.white, fontSize: 22, fontWeight: '800' },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginBottom: SPACING.xs,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 6,
    marginBottom: SPACING.xs + 2,
    ...SHADOWS.sm,
  },
  prayerRowActive: {
    backgroundColor: COLORS.primary,
  },
  prayerNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  prayerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  activePrayerLabel: { color: COLORS.white },
  nextBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  timeCell: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeTime: { color: COLORS.white },
  noIqamah: { color: COLORS.textSecondary, fontWeight: '400' },

  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
