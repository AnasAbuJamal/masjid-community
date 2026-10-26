import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface ClassSession {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  dayOfWeek: string[];
}
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchoolScheduleScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [selectedDay, setSelectedDay] = useState(DAYS[(new Date().getDay() + 6) % 7]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ classes: ClassSession[] }>('/public/classes');
      setClasses(response.data.classes);
      setError('');
    } catch {
      setError('The class schedule is temporarily unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const items = classes.filter(c => (c.dayOfWeek || [])
    .some(day => day.toLowerCase() === selectedDay.toLowerCase()));
  const onRefresh = () => { setRefreshing(true); void load(); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}
          accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Schedule</Text>
        <View style={styles.back} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.daysContainer} contentContainerStyle={styles.days}>
        {DAYS.map(day => (
          <TouchableOpacity key={day} onPress={() => setSelectedDay(day)}
            accessibilityRole="tab" accessibilityState={{ selected: day === selectedDay }}
            style={[styles.day, selectedDay === day && styles.daySelected]}>
            <Text style={[styles.dayLabel, selectedDay === day && styles.dayLabelSelected]}>{day.slice(0, 3)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <ActivityIndicator style={styles.loading} size="large" color={COLORS.primary} /> : (
        <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Text style={styles.title}>{selectedDay}</Text>
          <Text style={styles.subtitle}>Published masjid class schedule</Text>
          {error ? <Text style={styles.empty}>{error}</Text>
            : items.length === 0 ? (
              <Text style={styles.empty}>No classes are currently scheduled for {selectedDay}.</Text>
            ) : items.map(item => (
              <TouchableOpacity key={item.id} style={styles.card} accessibilityRole="button"
                accessibilityLabel={`View ${item.name}`}
                onPress={() => router.push({ pathname: '/school/classes/[id]', params: { id: item.id } })}>
                <View style={styles.classIcon}>
                  <MaterialCommunityIcons name="calendar-clock-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.classDetails}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.classSchedule}>{item.schedule}</Text>
                  <Text style={styles.teacher}>{item.teacher}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          <Text style={styles.note}>
            Times and instructors are maintained by the masjid office. Changes will appear when the schedule is updated.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontWeight: '700', fontSize: 18 },
  daysContainer: { flexGrow: 0, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  days: { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.xs },
  day: { minWidth: 62, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
  daySelected: { backgroundColor: COLORS.primaryFaded },
  dayLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  dayLabelSelected: { color: COLORS.primary },
  loading: { flex: 1 },
  content: { maxWidth: 820, width: '100%', alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { color: COLORS.text, fontSize: 23, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, padding: SPACING.md, minHeight: 94, marginBottom: SPACING.sm },
  classIcon: { width: 48, height: 48, backgroundColor: COLORS.primaryFaded,
    alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
  classDetails: { flex: 1 },
  className: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  classSchedule: { color: COLORS.textSecondary, fontSize: 13, marginTop: 3 },
  teacher: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 14, paddingVertical: SPACING.xxl },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: SPACING.lg },
});
