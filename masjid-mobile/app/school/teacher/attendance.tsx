import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../constants/theme-provider';
import { useAuthStore } from '../../../stores/authStore';
import { AttendanceMark, getClassAttendance, saveClassAttendance } from '../../../services/teaching-service';

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const validDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(value).getTime()) && new Date(value).toISOString().slice(0, 10) === value;
const statuses: AttendanceMark[] = ['present', 'absent', 'late', 'excused'];

export default function TeacherAttendanceScreen() {
  const router = useRouter();
  const { classId: rawId } = useLocalSearchParams<{ classId?: string }>();
  const classId = Number(rawId);
  const validClass = Number.isSafeInteger(classId) && classId > 0;
  const { colors } = useTheme();
  const { user, isLoading: authLoading } = useAuthStore();
  const allowed = !!user && ['teacher', 'staff', 'admin'].includes(user.role);
  const [date, setDate] = useState(today);
  const [dateInput, setDateInput] = useState(today);
  const [result, setResult] = useState<{ key: string; data: Awaited<ReturnType<typeof getClassAttendance>> } | null>(null);
  const [changes, setChanges] = useState<Record<number, AttendanceMark>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const request = useRef(0);
  const savingRef = useRef(false);
  const key = `${user?.id}:${classId}:${date}`;
  const load = useCallback(async () => {
    if (!allowed || !validClass || savingRef.current) return;
    const version = ++request.current;
    setLoading(true); setError(''); setResult(null); setChanges({});
    try { const data = await getClassAttendance(classId, date); if (request.current === version) setResult({ key, data }); }
    catch { if (request.current === version) setError('Unable to load this class. Check your connection and class assignment, then try again.'); }
    finally { if (request.current === version) setLoading(false); }
  }, [allowed, validClass, classId, date, key]);
  useFocusEffect(useCallback(() => { if (!authLoading) void load(); return () => { request.current++; }; }, [load, authLoading]));
  const data = result?.key === key ? result.data : null;
  const students = data?.class?.students.filter(s => s.isActive) ?? [];
  const tooLarge = students.length > 500 || (data?.total ?? 0) > 500;
  const dirty = Object.keys(changes).length;
  const save = async () => {
    if (savingRef.current || loading || !data?.class || !dirty || tooLarge || dateInput !== date) return;
    savingRef.current = true; setSaving(true); setMessage('');
    const version = request.current;
    try {
      await saveClassAttendance(classId, date, students.filter(s => changes[s.id]).map(s => ({ studentId: s.id, status: changes[s.id] })));
      if (request.current === version) { setChanges({}); setMessage('Attendance saved.'); }
    } catch {
      // A lost response can happen after commit. Reload authoritative state before another save.
      if (request.current === version) setMessage('The save could not be confirmed. Review the refreshed records before trying again.');
    } finally {
      savingRef.current = false; setSaving(false);
      if (request.current === version) void load();
    }
  };
  const button = (label: string, onPress: () => void, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}><Text style={{ color: colors.primary, fontWeight: '600' }}>{label}</Text></TouchableOpacity>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    {button('Back to classes', () => router.replace('/school/teacher'), saving || !!dirty)}
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Class attendance</Text>
    {authLoading ? <ActivityIndicator color={colors.primary} /> : !allowed ? <Text style={[styles.body, { color: colors.text }]}>An assigned teacher or school staff account is required.</Text> : !validClass ? <Text style={[styles.body, { color: colors.text }]}>Choose a class from your teaching dashboard first.</Text> : <>
      <Text style={[styles.body, { color: colors.textSecondary }]}>Choose a date and mark only the students you have checked. Unmarked students stay unmarked. Save your changes before changing dates.</Text>
      <Text style={[styles.body, { color: colors.text }]}>Date (YYYY-MM-DD)</Text>
      <TextInput accessibilityLabel="Attendance date in YYYY-MM-DD format" value={dateInput} onChangeText={setDateInput} editable={!saving && !dirty} autoCapitalize="none" maxLength={10} style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} />
      {button('Load date', () => { setMessage(''); if (dateInput === date) void load(); else setDate(dateInput); }, saving || !!dirty || !validDay(dateInput))}
      {dateInput !== date && <Text style={[styles.body, { color: colors.textSecondary }]}>Load the selected date before marking attendance.</Text>}
      {!validDay(dateInput) && <Text accessibilityRole="alert" style={{ color: colors.text }}>Enter a valid calendar date.</Text>}
      {!!message && <Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>{message}</Text>}
      {loading ? <ActivityIndicator accessibilityLabel="Loading class attendance" color={colors.primary} /> : error ? <View style={styles.section}><Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>{error}</Text>{button('Try again', load, saving)}</View> : !data?.class ? <Text style={[styles.body, { color: colors.text }]}>Class unavailable. Ask the school administrator to check your assignment.</Text> : <>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{data.class.name} · {date}</Text>
        {tooLarge ? <Text style={[styles.body, { color: colors.text }]}>This roster exceeds the mobile form limit. Contact the school administrator to review the roster.</Text> : <>
          {!students.length && <Text style={[styles.body, { color: colors.textSecondary }]}>No active students in this class.</Text>}
          {!!students.length && button('Mark all present', () => setChanges(Object.fromEntries(students.map(s => [s.id, 'present' as AttendanceMark]))), saving || dateInput !== date)}
          {students.map(student => {
            const saved = data.records.find(r => r.studentId === student.id)?.status;
            const selected = changes[student.id] ?? saved;
            return <View key={student.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.heading, { color: colors.text }]}>{student.firstName} {student.lastName}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>Student {student.studentId} · {selected ?? 'Not marked'}{changes[student.id] ? ' (unsaved)' : ''}</Text>
              <View style={styles.row}>{statuses.map(status => <TouchableOpacity key={status} accessibilityRole="radio" accessibilityLabel={`${student.firstName} ${student.lastName}: ${status}`} accessibilityState={{ checked: selected === status, disabled: saving || dateInput !== date }} disabled={saving || dateInput !== date} onPress={() => setChanges(current => ({ ...current, [student.id]: status }))} style={[styles.button, { borderColor: selected === status ? colors.primary : colors.border, borderWidth: selected === status ? 2 : 1 }]}>
                <Text style={{ color: colors.text, textTransform: 'capitalize' }}>{selected === status ? '✓ ' : ''}{status}</Text>
              </TouchableOpacity>)}</View>
            </View>;
          })}
          {!!students.length && <View style={styles.section}><Text style={[styles.body, { color: colors.text }]}>{dirty} student changes to save</Text>{button(saving ? 'Saving…' : 'Save attendance', save, saving || !dirty || dateInput !== date)}{button('Discard unsaved changes', () => setChanges({}), saving || !dirty)}</View>}
        </>}
      </>}
    </>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 100, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700' }, heading: { fontSize: 18, fontWeight: '600' }, body: { fontSize: 16, lineHeight: 24 },
  section: { gap: 12 }, card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  button: { minHeight: 48, padding: 12, justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
