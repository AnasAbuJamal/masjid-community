import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface Assessment {
  id: string;
  date: string;
  type: string;
  description: string;
  rating: string;
  status: string;
}
interface TeacherReport {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}
interface Child {
  id: string;
  name: string;
  className: string;
  instructor: string;
  schedule: string;
  assignments: Assessment[];
  reports: TeacherReport[];
}
const format = (text: string) => text.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());

export default function ParentReportScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ students: Child[] }>('/school/progress');
      setChildren(response.data.students);
      setSelected(current => response.data.students.some(c => c.id === current)
        ? current : response.data.students[0]?.id || null);
      setError('');
    } catch (failure: unknown) {
      const code = (failure as { response?: { status?: number } })?.response?.status;
      setError(code === 403
        ? 'Verify your email in Profile to access family progress records.'
        : 'School reports are unavailable. Check your connection and retry.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); }, []);
  const refresh = () => { setRefreshing(true); void load(); };
  const child = children.find(c => c.id === selected);
  const completed = child?.assignments.filter(a => a.status === 'completed') || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Student Reports</Text>
        <View style={styles.back} />
      </View>
      {loading ? <ActivityIndicator style={styles.loading} size="large" color={COLORS.primary} /> : (
        <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          {error ? <View style={styles.empty}>
            <Text style={styles.secondary}>{error}</Text>
            <TouchableOpacity onPress={refresh} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View> : children.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="file-document-outline" size={44} color={COLORS.textSecondary} />
              <Text style={styles.secondary}>No students are associated with this verified parent account.</Text>
            </View>
          ) : <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childTabs}>
              {children.map(c => (
                <TouchableOpacity key={c.id} accessibilityRole="tab"
                  accessibilityState={{ selected: selected === c.id }} onPress={() => setSelected(c.id)}
                  style={[styles.childTab, selected === c.id && styles.selectedTab]}>
                  <Text style={[styles.childName, selected === c.id && styles.selectedName]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {child && <>
              <View style={styles.summary}>
                <Text style={styles.studentName}>{child.name}</Text>
                <Text style={styles.secondary}>{child.className}</Text>
                <Text style={styles.secondary}>Teacher: {child.instructor}</Text>
                <Text style={styles.secondary}>{child.schedule}</Text>
                <Text style={styles.completed}>{completed.length} completed assessments in the recent record</Text>
              </View>

              <Text style={styles.sectionTitle}>Teacher reports</Text>
              {child.reports.length === 0 ?
                <Text style={styles.emptyText}>No written reports have been published for this student.</Text>
                : child.reports.map(report => (
                  <View key={`report${report.id}`} style={styles.card}>
                    <Text style={styles.cardTitle}>{report.title}</Text>
                    <Text style={styles.secondary}>{report.content}</Text>
                    <Text style={styles.date}>{format(report.category)} · {new Date(report.date).toLocaleDateString()}</Text>
                  </View>
                ))}

              <Text style={styles.sectionTitle}>Recent assessments</Text>
              {child.assignments.length === 0 ?
                <Text style={styles.emptyText}>No assessments have been recorded yet.</Text>
                : child.assignments.map(item => (
                  <View key={`assignment${item.id}`} style={styles.card}>
                    <View style={styles.row}>
                      <Text style={styles.cardTitle}>{format(item.type)}</Text>
                      <Text style={styles.rating}>{item.rating === 'none'
                        ? format(item.status) : format(item.rating)}</Text>
                    </View>
                    <Text style={styles.secondary}>{item.description}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                  </View>
                ))}
              <Text style={styles.note}>The school currently records descriptive assessments and instructor reports. No GPA, official letter grade, or issued report-card certificate is stored for these students.</Text>
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
    padding: SPACING.sm, borderColor: COLORS.border, borderBottomWidth: 1,
    backgroundColor: COLORS.surface },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  loading: { flex: 1 },
  content: { padding: SPACING.md, maxWidth: 840, width: '100%', alignSelf: 'center',
    paddingBottom: SPACING.xxl },
  childTabs: { gap: SPACING.sm, paddingVertical: SPACING.sm, marginBottom: SPACING.md },
  childTab: { minHeight: 44, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface, justifyContent: 'center', borderColor: COLORS.border,
    borderWidth: 1 },
  selectedTab: { backgroundColor: COLORS.primaryFaded, borderColor: COLORS.primary },
  childName: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  selectedName: { color: COLORS.primary },
  summary: { borderRadius: RADIUS.lg, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
    marginBottom: SPACING.lg, gap: SPACING.xs },
  studentName: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  completed: { color: COLORS.primary, fontWeight: '600', fontSize: 13, marginTop: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700',
    marginTop: SPACING.lg, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20,
    marginVertical: SPACING.md },
  card: { padding: SPACING.md, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1,
    marginBottom: SPACING.sm, gap: SPACING.xs },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    justifyContent: 'space-between' },
  rating: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  date: { color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.xs },
  empty: { alignItems: 'center', gap: SPACING.md, padding: SPACING.xxl },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 20, marginTop: SPACING.lg },
});
