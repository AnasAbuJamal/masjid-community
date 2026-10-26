import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface ClassSchedule {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  dayOfWeek: string[];
}
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchoolScheduleScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [day, setDay] = useState(DAYS[(new Date().getDay() + 6) % 7]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ classes: ClassSchedule[] }>('/public/classes');
      setClasses(response.data.classes || []);
      setError('');
    } catch {
      setError('The class schedule is temporarily unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { void load(); }, []);
  const visible = classes.filter(c => c.dayOfWeek.some(d =>
    d.trim().toLowerCase() === day.toLowerCase() ||
    d.trim().toLowerCase().startsWith(day.slice(0, 3).toLowerCase())
  ));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}
          accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.heading}>Class Schedule</Text>
        <View style={styles.back} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <Text style={styles.subtitle}>Schedules provided by the school administration</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {DAYS.map(d => (
            <TouchableOpacity key={d} style={[styles.day, day === d && styles.activeDay]}
              onPress={() => setDay(d)} accessibilityRole="button" accessibilityState={{ selected: day === d }}>
              <Text style={[styles.dayText, day === d && styles.activeDayText]}>{d.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> :
          visible.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>{error || `No classes are scheduled for ${day}.`}</Text>
            </View>
          ) : visible.map(item => (
            <TouchableOpacity key={item.id} style={styles.card}
              onPress={() => router.push({ pathname: '/school/classes/[id]', params: { id: item.id } })}
              accessibilityRole="button" accessibilityLabel={`Details for ${item.name}`}>
              <View style={styles.icon}>
                <MaterialCommunityIcons name="book-open-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.teacher}</Text>
                <Text style={styles.meta}>{item.schedule}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  heading: { fontSize: 19, fontWeight: '700', color: COLORS.text },
  back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  content: { width: '100%', maxWidth: 850, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.md },
  days: { gap: SPACING.sm, paddingBottom: SPACING.lg },
  day: { minWidth: 60, minHeight: 44, paddingHorizontal: SPACING.md,
    alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  activeDay: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  activeDayText: { color: COLORS.white },
  loader: { marginTop: SPACING.xxl },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', minHeight: 90, gap: SPACING.md },
  icon: { backgroundColor: COLORS.primaryFaded, width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  name: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  meta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14 },
});
