import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface PrayerTimes {
  date: string;
  fajr: string; sunrise: string; dhuhr: string; asr: string;
  maghrib: string; isha: string; jummah1: string; jummah2: string;
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PRAYERS = [
  { key: 'fajr', name: 'Fajr' }, { key: 'sunrise', name: 'Sunrise' },
  { key: 'dhuhr', name: 'Dhuhr' }, { key: 'asr', name: 'Asr' },
  { key: 'maghrib', name: 'Maghrib' }, { key: 'isha', name: 'Isha' },
] as const;

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function PrayerCalendarScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [times, setTimes] = useState<PrayerTimes[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (year: number, monthNumber: number) => {
    try {
      const result = await api.instance.get<PrayerTimes[]>(`/prayers/${year}/${monthNumber}`);
      setTimes(result.data);
      setError('');
    } catch {
      setTimes([]);
      setError('This month’s prayer timetable is unavailable. Try again later.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => {
    setLoading(true);
    setSelected(null);
    void load(month.getFullYear(), month.getMonth() + 1);
  }, [month.getFullYear(), month.getMonth()]);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const number = month.getMonth();
    const offset = new Date(year, number, 1).getDay();
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(year, number, i - offset + 1);
      return { date, key: localDateKey(date), inMonth: date.getMonth() === number };
    });
  }, [month.getFullYear(), month.getMonth()]);

  const records = useMemo(() => new Map(times.map(t => [t.date, t])), [times]);
  const record = selected ? records.get(selected) : undefined;
  const todayKey = localDateKey(new Date());
  const gridWidth = Math.max(336, Math.min(900, width - SPACING.md * 2));
  const cellWidth = gridWidth / 7;
  const refresh = () => {
    setRefreshing(true);
    void load(month.getFullYear(), month.getMonth() + 1);
  };
  const navigate = (direction: number) =>
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Prayer Calendar</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.monthNav}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month"
            style={styles.navButton} onPress={() => navigate(-1)}>
            <MaterialCommunityIcons name="chevron-left" size={25} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month"
            style={styles.navButton} onPress={() => navigate(1)}>
            <MaterialCommunityIcons name="chevron-right" size={25} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loading} />
          : error ? <View style={styles.empty}>
            <Text style={styles.message}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.retry}>
              <Text style={styles.retryLabel}>Retry</Text>
            </TouchableOpacity>
          </View> : <>
            <ScrollView horizontal style={styles.calendarScroll}
              contentContainerStyle={styles.calendarHorizontal}>
              <View style={[styles.calendar, { width: gridWidth }]}>
                <View style={styles.weekdays}>
                  {DAYS.map(day => (
                    <View key={day} style={[styles.weekday, { width: cellWidth }]}>
                      <Text style={styles.weekdayLabel}>{day}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.days}>
                  {days.map(item => {
                    const available = item.inMonth && records.has(item.key);
                    const isToday = item.key === todayKey;
                    const isSelected = selected === item.key;
                    return (
                      <TouchableOpacity key={item.key} accessibilityRole="button"
                        accessibilityLabel={`${item.date.toLocaleDateString()}${available ? ', timetable available' : ', no timetable'}`}
                        accessibilityState={{ selected: isSelected, disabled: !available }}
                        disabled={!available} onPress={() => setSelected(item.key)}
                        style={[styles.day, { width: cellWidth }, !item.inMonth && styles.otherMonth,
                          isToday && styles.today, isSelected && styles.selected]}>
                        <Text style={[styles.dayText, isToday && styles.todayText,
                          isSelected && styles.selectedText]}>{item.date.getDate()}</Text>
                        {available ? <View style={[styles.dot, isSelected && styles.selectedDot]} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            {!times.length ? (
              <Text style={styles.message}>No prayer timetables have been published for this month.</Text>
            ) : record ? (
              <View style={styles.details}>
                <View style={styles.detailsHeading}>
                  <Text style={styles.detailsTitle}>
                    {new Date(`${record.date}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close date details"
                    style={styles.close} onPress={() => setSelected(null)}>
                    <MaterialCommunityIcons name="close" size={23} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                {PRAYERS.map(item => (
                  <View style={styles.row} key={item.key}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowTime}>{record[item.key]}</Text>
                  </View>
                ))}
                {record.jummah1 ? <View style={styles.row}><Text style={styles.rowName}>First Jumu’ah</Text><Text style={styles.rowTime}>{record.jummah1}</Text></View> : null}
                {record.jummah2 ? <View style={styles.row}><Text style={styles.rowName}>Second Jumu’ah</Text><Text style={styles.rowTime}>{record.jummah2}</Text></View> : null}
              </View>
            ) : <Text style={styles.message}>Select a date with a blue dot to view its published prayer times.</Text>}
          </>}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl },
  monthNav: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.md },
  monthTitle: { fontSize: 19, color: COLORS.text, fontWeight: '700' },
  navButton: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  calendarScroll: { flexGrow: 0 },
  calendarHorizontal: { flexGrow: 1, justifyContent: 'center' },
  calendar: { backgroundColor: COLORS.surface, borderColor: COLORS.border,
    borderWidth: 1, borderRadius: RADIUS.xl, paddingVertical: SPACING.md,
    overflow: 'hidden' },
  weekdays: { flexDirection: 'row' },
  weekday: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  weekdayLabel: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { minHeight: 49, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.sm },
  dayText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  otherMonth: { opacity: 0.25 },
  today: { backgroundColor: COLORS.primaryFaded },
  todayText: { color: COLORS.primary },
  selected: { backgroundColor: COLORS.primary },
  selectedText: { color: COLORS.white },
  dot: { marginTop: 3, height: 5, width: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  selectedDot: { backgroundColor: COLORS.white },
  loading: { marginVertical: SPACING.xxl },
  empty: { alignItems: 'center', padding: SPACING.xl },
  message: { textAlign: 'center', color: COLORS.textSecondary,
    fontSize: 14, lineHeight: 21, paddingVertical: SPACING.xl },
  retry: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  retryLabel: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  details: { marginTop: SPACING.lg, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface, borderColor: COLORS.border,
    borderWidth: 1, padding: SPACING.lg },
  detailsHeading: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.md },
  detailsTitle: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '700' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 45,
    alignItems: 'center', borderTopColor: COLORS.border, borderTopWidth: 1,
    gap: SPACING.sm },
  rowName: { fontSize: 14, color: COLORS.textSecondary },
  rowTime: { fontSize: 15, fontWeight: '700', color: COLORS.text },
});
