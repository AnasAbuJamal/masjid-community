import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Student { id: string; name: string; grade: string; attendance: number }
interface AttendanceRecord { date: string; present: boolean }

export default function AttendanceRecordsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [recordError, setRecordError] = useState('');

  const loadStudents = async () => {
    try {
      const response = await api.instance.get<Student[]>('/school/students');
      setStudents(response.data);
      setSelected(old => response.data.some(s => s.id === old) ? old : response.data[0]?.id || null);
      setError('');
    } catch (failure: unknown) {
      const code = (failure as { response?: { status?: number } })?.response?.status;
      setError(code === 403 ? 'Verify your email in Profile to access family attendance.'
        : 'Unable to retrieve student attendance records.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void loadStudents(); }, []);
  useEffect(() => {
    if (!selected) { setRecords([]); return; }
    let active = true;
    setRecordLoading(true);
    api.instance.get<AttendanceRecord[]>(`/school/attendance/${encodeURIComponent(selected)}`)
      .then(response => {
        if (active) {
          setRecords(response.data);
          setRecordError('');
        }
      })
      .catch(() => { if (active) setRecordError('Could not load recorded attendance for this student.'); })
      .finally(() => { if (active) setRecordLoading(false); });
    return () => { active = false; };
  }, [selected]);
  const refresh = () => { setRefreshing(true); void loadStudents(); };
  const student = students.find(s => s.id === selected);
  const presentCount = records.filter(r => r.present).length;
  const absentCount = records.filter(r => !r.present).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Attendance Records</Text>
        <View style={styles.back} />
      </View>
      {loading ? <ActivityIndicator style={styles.loading} color={COLORS.primary} size="large" /> : (
        <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          {error ? <View style={styles.empty}>
            <Text style={styles.secondary}>{error}</Text>
            <TouchableOpacity onPress={refresh} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View> : students.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-check-outline" size={43} color={COLORS.textSecondary} />
              <Text style={styles.secondary}>No student records are linked to this account.</Text>
            </View>
          ) : <>
            <Text style={styles.sectionTitle}>Choose a student</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.studentTabs}>
              {students.map(item => (
                <TouchableOpacity key={item.id} accessibilityRole="tab"
                  accessibilityState={{ selected: selected === item.id }}
                  onPress={() => setSelected(item.id)}
                  style={[styles.studentTab, selected === item.id && styles.selectedTab]}>
                  <Text style={[styles.studentName, selected === item.id && styles.selectedName]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {student && <View style={styles.summary}>
              <Text style={styles.studentTitle}>{student.name}</Text>
              <Text style={styles.secondary}>{student.grade}</Text>
              <Text style={styles.summaryNote}>Attendance is marked by authorized teachers and staff, not by tapping a button in this app.</Text>
            </View>}
            {recordLoading ? <ActivityIndicator color={COLORS.primary} style={styles.loading} /> :
              recordError ? <Text style={styles.error}>{recordError}</Text> : <>
                <Text style={styles.sectionTitle}>Recent recorded sessions</Text>
                {records.length === 0 ? (
                  <Text style={styles.emptyText}>No attendance has been entered for this student.</Text>
                ) : <>
                  <View style={styles.totals}>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{presentCount}</Text>
                      <Text style={styles.secondary}>Present / late</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{absentCount}</Text>
                      <Text style={styles.secondary}>Absent / excused</Text>
                    </View>
                  </View>
                  {records.map((entry, index) => (
                    <View key={`${entry.date}:${index}`} style={styles.row}>
                      <MaterialCommunityIcons name={entry.present ? 'check-circle-outline' : 'minus-circle-outline'}
                        size={22} color={entry.present ? COLORS.success : COLORS.textSecondary} />
                      <Text style={styles.date}>{new Date(entry.date).toLocaleDateString()}</Text>
                      <Text style={[styles.status, {
                        color: entry.present ? COLORS.success : COLORS.textSecondary,
                      }]}>{entry.present ? 'Present or late' : 'Absent or excused'}</Text>
                    </View>
                  ))}
                  <Text style={styles.note}>This summary includes the {records.length} most recent stored attendance entries. Contact the teacher to correct any entry.</Text>
                </>}
              </>}
          </>}
        </ScrollView>
      )}
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
  loading: { flex: 1, marginVertical: SPACING.xl },
  content: { width: '100%', maxWidth: 820, alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700',
    marginTop: SPACING.md, marginBottom: SPACING.md },
  studentTabs: { gap: SPACING.sm, paddingBottom: SPACING.md },
  studentTab: { minHeight: 44, paddingHorizontal: SPACING.md,
    justifyContent: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderColor: COLORS.border, borderWidth: 1 },
  selectedTab: { backgroundColor: COLORS.primaryFaded, borderColor: COLORS.primary },
  studentName: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  selectedName: { color: COLORS.primary },
  summary: { backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  studentTitle: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 21 },
  summaryNote: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19 },
  totals: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  stat: { flex: 1, padding: SPACING.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg },
  statValue: { color: COLORS.text, fontSize: 23, fontWeight: '700' },
  row: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center',
    padding: SPACING.md, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  date: { flex: 1, color: COLORS.text, fontWeight: '600', fontSize: 13 },
  status: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },
  empty: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  error: { color: COLORS.error, paddingVertical: SPACING.md },
  note: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 19, marginTop: SPACING.md },
});
