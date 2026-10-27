import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper, TAB_BAR_HEIGHT } from '../../components/common';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface SchoolClass {
  id: string; name: string; teacher: string; schedule: string;
  dayOfWeek: string[]; enrolled: number;
}
const SERVICES = [
  { title: 'Parent Portal', icon: 'account-child-outline',
    description: 'Your students, assessments and invoices', route: '/school/parent' },
  { title: 'Enroll a Student', icon: 'account-plus-outline',
    description: 'Apply to join the school', route: '/school/enroll' },
  { title: 'Class Schedule', icon: 'calendar-clock-outline',
    description: 'Published class meeting times', route: '/school/schedule' },
  { title: 'Learning Resources', icon: 'book-open-outline',
    description: 'Published educational material', route: '/school/resources' },
  { title: 'Assessments', icon: 'chart-line',
    description: 'Verified family and teacher progress', route: '/school/grades' },
] as const;

export default function SchoolScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ classes: SchoolClass[] }>('/public/classes');
      setClasses(response.data.classes || []);
      setError('');
    } catch {
      setClasses([]);
      setError('Class listings are temporarily unavailable. Pull down to retry.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); }, []);
  const refresh = () => { setRefreshing(true); void load(); };
  const columns = width >= 790 ? 2 : 1;

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Islamic School</Text>
          <Text style={styles.subtitle}>Published classes, enrollment and family services</Text>
        </View>
        <Text style={styles.sectionTitle}>Classes</Text>
        {loading ? <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
          : error ? <View style={styles.empty}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retry} accessibilityRole="button" onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
          : classes.length === 0 ? (
            <Text style={styles.emptyText}>No classes are currently published. Contact the office for enrollment information.</Text>
          ) : <View style={styles.grid}>
            {classes.map(item => (
              <TouchableOpacity key={item.id} accessibilityRole="button"
                accessibilityLabel={`View ${item.name}`}
                style={[styles.classCard, { width: `${100 / columns - 1}%` }]}
                onPress={() => router.push({ pathname: '/school/classes/[id]',
                  params: { id: item.id } })}>
                <View style={styles.icon}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" color={COLORS.primary} size={24} />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.meta}>Instructor: {item.teacher}</Text>
                  <Text style={styles.meta}>{item.schedule}</Text>
                  <Text style={styles.count}>{item.enrolled} enrolled students</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" color={COLORS.textSecondary} size={21} />
              </TouchableOpacity>
            ))}
          </View>}
        <Text style={styles.sectionTitle}>School Services</Text>
        <View style={styles.grid}>
          {SERVICES.map(item => (
            <TouchableOpacity key={item.title} accessibilityRole="button"
              onPress={() => router.push(item.route)}
              style={[styles.serviceCard, { width: `${100 / columns - 1}%` }]}>
              <View style={styles.icon}>
                <MaterialCommunityIcons name={item.icon} color={COLORS.primary} size={24} />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{item.title}</Text>
                <Text style={styles.meta}>{item.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" color={COLORS.textSecondary} size={20} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.note}>
          Programs, instructors and schedules come from the masjid office.
          Student records require a verified family account.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 930, alignSelf: 'center',
    padding: SPACING.md, paddingBottom: TAB_BAR_HEIGHT + SPACING.xxl },
  header: { paddingVertical: SPACING.md },
  title: { color: COLORS.text, fontSize: 27, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21,
    marginTop: SPACING.xs },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: '700',
    marginTop: SPACING.lg, marginBottom: SPACING.md },
  loader: { margin: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: SPACING.sm },
  classCard: { minHeight: 106, flexDirection: 'row', gap: SPACING.md,
    alignItems: 'center', padding: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderColor: COLORS.border, borderWidth: 1 },
  serviceCard: { minHeight: 89, flexDirection: 'row', gap: SPACING.md,
    alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.surface,
    borderColor: COLORS.border, borderWidth: 1 },
  icon: { width: 46, height: 46, backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center', alignItems: 'center', borderRadius: RADIUS.md },
  classInfo: { flex: 1, gap: 4, minWidth: 0 },
  className: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  meta: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  count: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21,
    textAlign: 'center', paddingVertical: SPACING.lg },
  retry: { minHeight: 44, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19,
    textAlign: 'center', marginTop: SPACING.xl },
});
