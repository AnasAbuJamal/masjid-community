import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../constants/theme-provider';
import { getTeachingClasses } from '../../../services/teaching-service';

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isLoading: authLoading } = useAuthStore();
  const allowed = !!user && ['admin', 'staff', 'teacher'].includes(user.role);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ owner: string; data: Awaited<ReturnType<typeof getTeachingClasses>> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const version = useRef(0);
  const load = useCallback(async () => {
    if (!user || !allowed) return;
    const current = ++version.current;
    setLoading(true); setError(false); setResult(null);
    try { const data = await getTeachingClasses(page); if (current === version.current) setResult({ owner: user.id, data }); }
    catch { if (current === version.current) setError(true); }
    finally { if (current === version.current) setLoading(false); }
  }, [user?.id, allowed, page]);
  useFocusEffect(useCallback(() => { if (!authLoading) void load(); return () => { version.current++; }; }, [load, authLoading]));
  const data = result?.owner === user?.id && result?.data.page === page ? result.data : null;
  const button = (label: string, onPress: () => void, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}><Text style={{ color: colors.primary }}>{label}</Text></TouchableOpacity>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={styles.page} refreshControl={allowed ? <RefreshControl refreshing={loading} onRefresh={load} /> : undefined}>
    {button('Back to school', () => router.canGoBack() ? router.back() : router.replace('/(tabs)/school'))}
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{user?.role === 'teacher' ? 'My teaching classes' : 'School classes'}</Text>
    {authLoading ? <ActivityIndicator color={colors.primary} /> : !allowed ? <Text style={[styles.body, { color: colors.text }]}>Sign in with an assigned teacher or school staff account to manage classes.</Text> : <>
      <Text style={[styles.body, { color: colors.textSecondary }]}>Open a class to review its active roster and record attendance. Account assignments are managed by the school administrator.</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Loading classes" color={colors.primary} /> : error ? <View style={styles.section}><Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>Unable to load classes.</Text>{button('Try again', load)}</View> : <>
        {data?.classes.length === 0 && <Text style={[styles.body, { color: colors.textSecondary }]}>{page === 1 ? 'No classes assigned. Ask the school administrator to check your class links.' : 'No classes on this page.'}</Text>}
        {data?.classes.map(cls => <View key={cls.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{cls.name}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{cls.schedule || 'Schedule not set'}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{cls.students.length} active students</Text>
          {button('Roster and attendance', () => router.push({ pathname: '/school/teacher/attendance', params: { classId: String(cls.id) } }))}
        </View>)}
        {(page > 1 || (data?.totalPages ?? 0) > 1) && <View style={styles.row}>{button('Previous', () => setPage(p => p - 1), page === 1)}<Text style={{ color: colors.text }}>Page {page}</Text>{button('Next', () => setPage(p => p + 1), page >= (data?.totalPages ?? 0))}</View>}
      </>}
    </>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 100, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700' }, heading: { fontSize: 18, fontWeight: '600' }, body: { fontSize: 16, lineHeight: 24 },
  section: { gap: 12 }, card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  button: { minHeight: 48, padding: 12, justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
});
