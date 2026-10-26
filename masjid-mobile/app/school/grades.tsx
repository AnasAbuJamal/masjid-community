import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Assessment {
  id: string;
  date: string;
  type: string;
  description: string;
  rating: 'none' | 'weak' | 'good' | 'very_good' | 'excellent';
  status: 'pending' | 'completed';
}
interface ProgressReport {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}
interface StudentProgress {
  id: string;
  name: string;
  className: string;
  instructor: string;
  schedule: string;
  assignments: Assessment[];
  reports: ProgressReport[];
}
const formatLabel = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function SchoolProgressScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [tab, setTab] = useState<'progress' | 'teachers'>('progress');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ students: StudentProgress[] }>('/school/progress');
      setStudents(response.data.students);
      setError('');
    } catch (failure: unknown) {
      const httpStatus = (failure as { response?: { status?: number } })?.response?.status;
      setError(httpStatus === 403
        ? 'Verify your email address in Profile to view student progress.'
        : 'Unable to retrieve school progress. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const refresh = () => { setRefreshing(true); void load(); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}
          accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>School Progress</Text>
        <View style={styles.back} />
      </View>
      <View style={styles.tabs}>
        {(['progress', 'teachers'] as const).map(key => (
          <TouchableOpacity key={key} accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key === 'progress' ? 'Assessments' : 'Instructors'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.content}>
          {error ? <Text style={styles.notice}>{error}</Text>
            : students.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="school-outline" size={44} color={COLORS.textSecondary} />
                <Text style={styles.notice}>No student progress records are associated with your account.</Text>
              </View>
            ) : students.map(student => (
              <View style={styles.studentSection} key={student.id}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.subheading}>{student.className}</Text>
                {tab === 'teachers' ? (
                  <View style={styles.card}>
                    <View style={styles.iconRow}>
                      <MaterialCommunityIcons name="account-school-outline" size={24} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{student.instructor}</Text>
                        <Text style={styles.secondary}>{student.schedule}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    {student.assignments.length === 0 && student.reports.length === 0 && (
                      <Text style={styles.notice}>No assessments or reports have been published yet.</Text>
                    )}
                    {student.assignments.map(assessment => (
                      <View style={styles.card} key={`a${assessment.id}`}>
                        <Text style={styles.cardTitle}>{formatLabel(assessment.type)}</Text>
                        <Text style={styles.secondary}>{assessment.description}</Text>
                        <View style={styles.meta}>
                          <Text style={styles.secondary}>{new Date(assessment.date).toLocaleDateString()}</Text>
                          <Text style={styles.rating}>{assessment.rating === 'none'
                            ? formatLabel(assessment.status) : formatLabel(assessment.rating)}</Text>
                        </View>
                      </View>
                    ))}
                    {student.reports.map(report => (
                      <View style={styles.card} key={`r${report.id}`}>
                        <Text style={styles.cardTitle}>{report.title}</Text>
                        <Text style={styles.secondary}>{report.content}</Text>
                        <Text style={styles.date}>{new Date(report.date).toLocaleDateString()}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            ))}
          <Text style={styles.footerNote}>
            Results reflect instructor-entered assessments. Numeric grades are not assigned unless the school publishes them.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: SPACING.sm, gap: SPACING.sm },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primaryFaded },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  loader: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: 820, width: '100%', padding: SPACING.md, paddingBottom: SPACING.xxl },
  notice: { fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.lg },
  empty: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xxl },
  studentSection: { marginBottom: SPACING.lg },
  studentName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  subheading: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.xs },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, marginTop: SPACING.xs },
  rating: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  date: { color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.xs },
  footerNote: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: SPACING.lg },
});
