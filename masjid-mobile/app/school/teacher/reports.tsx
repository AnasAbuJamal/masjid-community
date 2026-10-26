import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../constants/theme-provider';
import { useAuthStore } from '../../../stores/authStore';
import { updateSchoolReport, createSchoolReport, getReportStudents, getSchoolReports, ReportCategory, ReportStudent, SchoolReport } from '../../../services/school-reports-service';

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.action, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}><Text style={{ color: colors.primary, fontWeight: '600' }}>{label}</Text></TouchableOpacity>;
}

function StudentReports({ student, onBack, onEdit }: { student: ReportStudent; onBack: () => void; onEdit: () => void }) {
  const { colors } = useTheme();
  const [reportPage, setReportPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [editing, setEditing] = useState<SchoolReport | null>(null);
  const [reports, setReports] = useState<SchoolReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ReportCategory>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const version = useRef(0);
  const savingRef = useRef(false);
  const dirty = !!title || !!content;
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setLoadError(false);
    try { const rows = await getSchoolReports(student.id, reportPage); if (current === version.current) { setReports(rows.reports); setHasMore(rows.hasMore); } }
    catch { if (current === version.current) { setReports([]); setLoadError(true); } }
    finally { if (current === version.current) setLoading(false); }
  }, [student.id, reportPage]);
  useFocusEffect(useCallback(() => { void load(); return () => { version.current++; }; }, [load]));
  const save = async () => {
    if (savingRef.current || loading || loadError || uncertain || !title.trim() || !content.trim()) return;
    savingRef.current = true; setSaving(true); setMessage('');
    const current = version.current;
    try {
      if (editing) await updateSchoolReport(editing.id, { title: title.trim(), content: content.trim(), category, expectedUpdatedAt: editing.updatedAt });
      else await createSchoolReport({ studentId: student.id, title: title.trim(), content: content.trim(), category });
      if (current === version.current) { setEditing(null); setTitle(''); setContent(''); setCategory('general'); setMessage(editing ? 'Report updated.' : 'Report published. Linked family accounts can now read it.'); }
    } catch (error) {
      if (current === version.current) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 409) { setUncertain(true); setMessage('This report changed or is no longer accessible. Review history and discard this draft before editing the current version.'); }
        else if (status && status >= 400 && status < 500) setMessage('Report was not saved. Check the fields and your class assignment, then try again.');
        else { setUncertain(true); setMessage('The save could not be confirmed. Review the refreshed history before submitting again to avoid a duplicate.'); }
      }
    } finally {
      savingRef.current = false; setSaving(false);
      if (current === version.current) void load();
    }
  };
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }];
  return <>
    <Action label="Back to students" onPress={onBack} disabled={saving || dirty || uncertain} />
    <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{student.firstName} {student.lastName} · {student.studentId}</Text>
    <Text style={[styles.body, { color: colors.textSecondary }]}>Reports are visible to this student and their verified linked family. Save or discard your draft before selecting another student.</Text>
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{editing ? 'Edit report' : 'New report'}</Text>
      <Text style={[styles.body, { color: colors.text }]}>Title</Text>
      <TextInput accessibilityLabel="Report title" editable={!saving && !uncertain} value={title} onChangeText={setTitle} maxLength={200} style={inputStyle} />
      <Text style={[styles.body, { color: colors.text }]}>Category</Text>
      <View style={styles.row}>{(['general', 'academic', 'behavioral', 'daily'] as const).map(value => <TouchableOpacity key={value} accessibilityRole="radio" accessibilityState={{ checked: category === value, disabled: saving || uncertain }} disabled={saving || uncertain} onPress={() => setCategory(value)} style={[styles.action, { borderColor: category === value ? colors.primary : colors.border, borderWidth: category === value ? 2 : 1 }]}><Text style={{ color: colors.text, textTransform: 'capitalize' }}>{category === value ? '✓ ' : ''}{value}</Text></TouchableOpacity>)}</View>
      <Text style={[styles.body, { color: colors.text }]}>Report</Text>
      <TextInput accessibilityLabel="Report content" editable={!saving && !uncertain} value={content} onChangeText={setContent} maxLength={20000} multiline textAlignVertical="top" style={[...inputStyle, { minHeight: 160 }]} />
      <Text style={{ color: colors.textSecondary }}>{content.length}/20,000 characters</Text>
      <Action label={saving ? 'Saving…' : editing ? 'Save report changes' : 'Publish report'} onPress={save} disabled={saving || loading || loadError || uncertain || !title.trim() || !content.trim()} />
      <Action label="Discard draft" onPress={() => { setEditing(null); setTitle(''); setContent(''); setUncertain(false); setMessage(''); }} disabled={saving || (!dirty && !uncertain)} />
      {!!message && <Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>{message}</Text>}
    </View>
    <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>Report history</Text>
    {loading ? <ActivityIndicator accessibilityLabel="Loading reports" color={colors.primary} /> : loadError ? <><Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>Reports could not be loaded.</Text><Action label="Retry reports" onPress={load} disabled={saving} /></> : <>
      {!reports.length && <Text style={[styles.body, { color: colors.textSecondary }]}>No reports published yet.</Text>}
      {reports.map(report => <View key={report.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.heading, { color: colors.text }]}>{report.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{report.category} · {new Date(report.createdAt).toLocaleDateString()} · {report.teacher ? `${report.teacher.firstName} ${report.teacher.lastName}` : 'School staff'}</Text>
        <Text style={[styles.body, { color: colors.text }]}>{report.content}</Text>
        <Action label="Edit report" disabled={saving || dirty || uncertain} onPress={() => { setEditing(report); setTitle(report.title); setContent(report.content); setCategory(report.category); setMessage('Editing the selected report.'); onEdit(); }} />
      </View>)}
      {(reportPage > 1 || hasMore) && <View style={styles.row}><Action label="Newer reports" disabled={saving || dirty || uncertain || reportPage === 1} onPress={() => setReportPage(p => p - 1)} /><Text style={{ color: colors.text }}>Page {reportPage}</Text><Action label="Older reports" disabled={saving || dirty || uncertain || !hasMore} onPress={() => setReportPage(p => p + 1)} /></View>}
      {uncertain && !editing && <Action label="I reviewed history; allow another submission" onPress={() => setUncertain(false)} />}
    </>}
  </>;
}

function ClassReports({ classId, onEdit }: { classId: number; onEdit: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof getReportStudents>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [student, setStudent] = useState<ReportStudent | null>(null);
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current; setLoading(true); setError(false); setData(null);
    try { const result = await getReportStudents(classId, page); if (version.current === current) setData(result); }
    catch { if (version.current === current) setError(true); }
    finally { if (version.current === current) setLoading(false); }
  }, [classId, page]);
  useFocusEffect(useCallback(() => { void load(); return () => { version.current++; }; }, [load]));
  if (student) return <StudentReports key={student.id} student={student} onEdit={onEdit} onBack={() => setStudent(null)} />;
  return <>
    <Action label="Back to teaching classes" onPress={() => router.replace('/school/teacher')} />
    <Text style={[styles.body, { color: colors.textSecondary }]}>Select an active student from your assigned class.</Text>
    {loading ? <ActivityIndicator accessibilityLabel="Loading students" color={colors.primary} /> : error ? <><Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>Unable to load this class.</Text><Action label="Try again" onPress={load} /></> : <>
      {!data?.students.length && <Text style={[styles.body, { color: colors.textSecondary }]}>No accessible active students. Ask the school office to check your class assignment.</Text>}
      {data?.students.map(item => <Action key={item.id} label={`${item.firstName} ${item.lastName} · ${item.studentId}`} onPress={() => setStudent(item)} />)}
      {(page > 1 || (data?.totalPages ?? 0) > 1) && <View style={styles.row}><Action label="Previous" onPress={() => setPage(p => p - 1)} disabled={page === 1} /><Text style={{ color: colors.text }}>Page {page}</Text><Action label="Next" onPress={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 0)} /></View>}
    </>}
  </>;
}

export default function TeacherReportsScreen() {
  const scroll = useRef<ScrollView>(null);
  const { classId: value } = useLocalSearchParams<{ classId?: string }>();
  const classId = Number(value);
  const { user, isLoading } = useAuthStore();
  const { colors } = useTheme();
  const router = useRouter();
  const allowed = !!user && ['teacher', 'staff', 'admin'].includes(user.role);
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Student reports</Text>
    {isLoading ? <ActivityIndicator color={colors.primary} /> : allowed && Number.isSafeInteger(classId) && classId > 0 ? <ClassReports key={`${user.id}:${classId}`} classId={classId} onEdit={() => scroll.current?.scrollTo({ y: 0, animated: true })} /> : <><Text style={[styles.body, { color: colors.text }]}>Choose a class using your assigned teacher or staff account.</Text><Action label="Back to school" onPress={() => router.replace('/(tabs)/school')} /></>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 100, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700' }, heading: { fontSize: 18, fontWeight: '600' }, body: { fontSize: 16, lineHeight: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  action: { minHeight: 48, padding: 12, justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
});
