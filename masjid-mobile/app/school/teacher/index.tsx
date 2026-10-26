import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/common';
import api from '../../../services/api-client';
import { useAuthStore } from '../../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

type Mark = 'present' | 'absent' | 'late' | 'excused';
interface Student {
  id: string;
  code: string;
  name: string;
  attendance: Mark | null;
}
interface Class {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  days: string[];
  students: Student[];
}
interface Overview { date: string; classes: Class[] }
const MARKS: { value: Mark; label: string }[] = [
  { value: 'present', label: 'Present' }, { value: 'late', label: 'Late' },
  { value: 'absent', label: 'Absent' }, { value: 'excused', label: 'Excused' },
];

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<Overview>('/school/teacher/overview');
      setOverview(response.data);
      setSelectedClass(old => response.data.classes.some(c => c.id === old)
        ? old : response.data.classes[0]?.id || null);
      setError('');
    } catch {
      setError('The classroom roster could not be loaded. Contact the school office if you have no assigned class.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => {
    if (role === 'admin' || role === 'teacher') void load();
    else setLoading(false);
  }, [role]);
  const refresh = () => { setRefreshing(true); void load(); };
  const activeClass = overview?.classes.find(c => c.id === selectedClass);
  const mark = async (student: Student, status: Mark) => {
    if (!activeClass || !overview || saving !== null) return;
    setSaving(student.id);
    try {
      await api.instance.post('/school/teacher/attendance', {
        classId: Number(activeClass.id),
        studentId: Number(student.id),
        date: overview.date, status,
      });
      setOverview(prev => prev ? {
        ...prev,
        classes: prev.classes.map(cls => cls.id !== activeClass.id ? cls : {
          ...cls, students: cls.students.map(s => s.id === student.id ? { ...s, attendance: status } : s),
        }),
      } : prev);
    } catch (failure: unknown) {
      const message = (failure as { response?: { data?: { error?: string } } })?.response?.data?.error;
      Alert.alert('Attendance not saved', message || 'Please try again. The mark has not changed.');
    } finally { setSaving(null); }
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Teacher Classroom</Text>
          <Text style={styles.subtitle}>Enrolled students and recorded attendance</Text>
        </View>
      </View>
      {role !== 'admin' && role !== 'teacher' ? (
        <View style={styles.empty}><Text style={styles.secondary}>Teacher or administrator access is required.</Text></View>
      ) : loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} size="large" /> : (
        <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          {error ? <View style={styles.empty}>
            <Text style={styles.secondary}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View> : !overview?.classes.length ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="school-outline" size={46} color={COLORS.textSecondary} />
              <Text style={styles.secondary}>No classes are assigned to this teacher account.</Text>
              <Text style={styles.note}>Ask the administrator to set the class instructor name to match your account.</Text>
            </View>
          ) : <>
            <Text style={styles.sectionTitle}>My Classes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classTabs}>
              {overview.classes.map(cls => (
                <TouchableOpacity key={cls.id} accessibilityRole="tab"
                  accessibilityState={{ selected: cls.id === selectedClass }}
                  onPress={() => setSelectedClass(cls.id)}
                  style={[styles.classTab, cls.id === selectedClass && styles.selectedTab]}>
                  <Text style={[styles.classTabText, cls.id === selectedClass && styles.selectedText]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {activeClass && <>
              <View style={styles.summary}>
                <Text style={styles.classTitle}>{activeClass.name}</Text>
                <Text style={styles.secondary}>{activeClass.schedule}</Text>
                <Text style={styles.secondary}>Instructor: {activeClass.instructor}</Text>
                <Text style={styles.value}>{activeClass.students.length} enrolled students</Text>
              </View>
              <Text style={styles.sectionTitle}>Attendance · {overview.date}</Text>
              <Text style={styles.note}>Only enrolled students may be marked. Attendance is saved immediately and can be corrected by choosing another status.</Text>
              {activeClass.students.length === 0 ?
                <Text style={styles.secondary}>No students are enrolled in this class yet.</Text>
                : activeClass.students.map(student => (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.secondary}>Student #{student.code}</Text>
                      </View>
                      <Text style={styles.status}>{student.attendance || 'Unmarked'}</Text>
                    </View>
                    <View style={styles.marks}>
                      {MARKS.map(option => (
                        <TouchableOpacity key={option.value} accessibilityRole="radio"
                          accessibilityState={{ checked: student.attendance === option.value }}
                          style={[styles.markButton, student.attendance === option.value && styles.selectedTab]}
                          onPress={() => { void mark(student, option.value); }}
                          disabled={saving !== null}>
                          <Text style={[styles.markText, student.attendance === option.value && styles.selectedText]}>
                            {saving === student.id ? 'Saving…' : option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
            </>}
          </>}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.surface, borderBottomColor: COLORS.border,
    borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  loader: { flex: 1 },
  content: { width: '100%', maxWidth: 860, alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  sectionTitle: { color: COLORS.text, fontSize: 17,
    fontWeight: '700', marginVertical: SPACING.md },
  classTabs: { gap: SPACING.sm, marginBottom: SPACING.md },
  classTab: { minHeight: 48, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, justifyContent: 'center' },
  classTabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  selectedTab: { backgroundColor: COLORS.primaryFaded, borderColor: COLORS.primary },
  selectedText: { color: COLORS.primary },
  summary: { backgroundColor: COLORS.surface, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1, gap: SPACING.sm },
  classTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  value: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19,
    marginBottom: SPACING.md },
  studentCard: { backgroundColor: COLORS.surface,
    borderColor: COLORS.border, borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  studentHeader: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center',
    marginBottom: SPACING.md },
  studentName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  status: { color: COLORS.primary, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  marks: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  markButton: { minHeight: 44, flexGrow: 1,
    paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, borderColor: COLORS.border, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  empty: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '700' },
});
