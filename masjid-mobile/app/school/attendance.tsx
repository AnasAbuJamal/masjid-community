import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme-provider';
import { SPACING, RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { getStudentAttendance, StudentAttendance } from '../../services/student-attendance-service';

export default function AttendanceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isLoading: authLoading } = useAuthStore();
  const [result, setData] = useState<(StudentAttendance & { accountId?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const request = useRef(0);
  const load = useCallback(async (targetPage: number) => {
    const version = ++request.current;
    setLoading(true); setError(false); setData(null);
    try {
      const result = await getStudentAttendance(targetPage);
      if (version === request.current) setData({ ...result, accountId: user?.id });
    } catch { if (version === request.current) setError(true); }
    finally { if (version === request.current) setLoading(false); }
  }, [user?.id]);
  useFocusEffect(useCallback(() => {
    if (!authLoading && user?.role === 'student') void load(page);
    return () => { request.current++; };
  }, [authLoading, user?.id, user?.role, page, load]));
  const data = result?.accountId === user?.id && result?.page === page ? result : null;
  if (!authLoading && user?.role === 'member') return <Redirect href="/school/parent/attendance" />;
  const text = { color: colors.text };
  const secondary = { color: colors.textSecondary };
  const action = (label: string, onPress: () => void, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}><Text style={{ color: colors.primary, fontWeight: '600' }}>{label}</Text></TouchableOpacity>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={styles.page} refreshControl={user?.role === 'student' ? <RefreshControl refreshing={loading} onRefresh={() => load(page)} /> : undefined}>
      {action('Back to school', () => router.canGoBack() ? router.back() : router.replace('/(tabs)/school'))}
      <Text accessibilityRole="header" style={[styles.title, text]}>My attendance</Text>
      {authLoading ? <ActivityIndicator accessibilityLabel="Checking account" color={colors.primary} /> : !user ? <View style={styles.section}>
        <Text style={[styles.body, secondary]}>Sign in with your student account to view your attendance.</Text>
        {action('Sign in', () => router.push('/(auth)/login'))}
      </View> : user.role !== 'student' ? <Text style={[styles.body, secondary]}>This page is for student records. Teachers and staff manage attendance through the staff portal. Parents can view linked children in Family attendance.</Text> : <>
        <Text style={[styles.body, secondary]}>Attendance is recorded by your teacher or school office. Ask them about corrections; self-check-in is not available.</Text>
        {loading ? <ActivityIndicator accessibilityLabel="Loading attendance" color={colors.primary} /> : error ? <View style={styles.section}>
          <Text accessibilityRole="alert" style={[styles.body, text]}>Unable to load attendance. Check your connection and try again.</Text>
          {action('Try again', () => load(page))}
        </View> : !data?.student ? <View style={styles.section}>
          <Text style={[styles.heading, text]}>No linked student record</Text>
          <Text style={[styles.body, secondary]}>Ask the school office to link your account to your active enrollment.</Text>
        </View> : <>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.heading, text]}>{data.student.firstName} {data.student.lastName}</Text>
            <Text style={[styles.body, secondary]}>{data.student.class.name}</Text>
            <Text style={[styles.heading, text]}>All recorded attendance</Text>
            <View style={styles.counts}>{(['present', 'absent', 'late', 'excused'] as const).map(status => <View key={status} style={styles.count}>
              <Text style={[styles.heading, text]}>{data.summary?.[status] ?? 0}</Text>
              <Text style={[styles.body, secondary, { textTransform: 'capitalize' }]}>{status}</Text>
            </View>)}</View>
            <Text style={[styles.body, secondary]}>{data.summary?.total ?? 0} recorded days. Unrecorded days are not counted as absent.</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.heading, text]}>Attendance history</Text>
          {!data.records.length && <Text style={[styles.body, secondary]}>{page === 1 ? 'No attendance recorded yet.' : 'No records on this page. Return to the previous page or refresh.'}</Text>}
          {data.records.map(record => <View key={record.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}><Text style={[styles.heading, text]}>{record.date.slice(0, 10)}</Text><Text style={[styles.body, text, { textTransform: 'capitalize' }]}>{record.status}</Text></View>
            <Text style={[styles.body, secondary]}>{record.class.name}</Text>
          </View>)}
          {(data.totalPages > 1 || page > 1) && <View style={styles.section}>
            <Text style={[styles.body, secondary]}>Page {page}{data.totalPages >= page ? ` of ${data.totalPages}` : ''}</Text>
            <View style={styles.row}>{action('Previous', () => setPage(value => value - 1), page === 1)}{action('Next', () => setPage(value => value + 1), page >= data.totalPages)}</View>
          </View>}
        </>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { padding: SPACING.md, paddingBottom: 100, gap: SPACING.md, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700' }, heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 }, section: { gap: SPACING.sm },
  button: { minHeight: 48, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, justifyContent: 'center' },
  card: { padding: SPACING.md, borderWidth: 1, borderRadius: RADIUS.lg, gap: SPACING.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.sm },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }, count: { minWidth: 100, flexGrow: 1 },
});
