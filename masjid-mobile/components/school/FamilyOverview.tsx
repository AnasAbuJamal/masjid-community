import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme-provider';
import { SPACING, RADIUS } from '../../constants/theme';
import { getMyFamily, FamilyStudent } from '../../services/family-service';

export default function FamilyOverview({ attendanceOnly = false }: { attendanceOnly?: boolean }) {
 const router = useRouter();
 const { id } = useLocalSearchParams<{ id?: string }>();
 const { colors } = useTheme();
 const [children, setChildren] = useState<FamilyStudent[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);
 const load = useCallback(async () => {
  setLoading(true); setError(false);
  try { setChildren(await getMyFamily()); }
  catch { setChildren([]); setError(true); }
  finally { setLoading(false); }
 }, []);
 useFocusEffect(useCallback(() => { void load(); }, [load]));
 const visible = id ? children.filter(child => child.id === id) : children;
 return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
  <ScrollView contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
   <TouchableOpacity accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/school')} style={styles.action}><Text style={{ color: colors.primary }}>Back to school</Text></TouchableOpacity>
   <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{attendanceOnly ? 'Family attendance' : 'Parent portal'}</Text>
   <Text style={[styles.body, { color: colors.textSecondary }]}>School records for children linked to your account email.</Text>
   {loading ? <ActivityIndicator accessibilityLabel="Loading family records" color={colors.primary} /> : error ? <View style={styles.section}>
    <Text accessibilityRole="alert" style={[styles.body, { color: colors.text }]}>Unable to load school records. Sign in with your verified parent account, or ask the school office to verify your account.</Text>
    <TouchableOpacity accessibilityRole="button" onPress={load} style={styles.action}><Text style={{ color: colors.primary }}>Try again</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/(auth)/login')} style={styles.action}><Text style={{ color: colors.primary }}>Sign in</Text></TouchableOpacity>
   </View> : visible.length === 0 ? <View style={styles.section}>
    <Text style={[styles.heading, { color: colors.text }]}>{id ? 'Student unavailable' : 'No linked students'}</Text>
    <Text style={[styles.body, { color: colors.textSecondary }]}>Ask the school office to confirm your account email on your child's enrollment record.</Text>
   </View> : visible.map(child => {
    const count = child.attendances.length;
    const present = child.attendances.filter(row => row.status === 'present').length;
    return <View key={child.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
     <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{child.firstName} {child.lastName}</Text>
     <Text style={[styles.body, { color: colors.textSecondary }]}>{child.class.name} · {child.class.teacherName}</Text>
     <Text style={[styles.body, { color: colors.textSecondary }]}>{child.class.schedule}</Text>
     <Text style={[styles.heading, { color: colors.text, marginTop: SPACING.md }]}>Attendance</Text>
     <Text style={[styles.body, { color: colors.textSecondary }]}>{count ? `${present} present out of ${count} recent records` : 'No attendance recorded yet.'}</Text>
     {child.attendances.map(row => <View key={row.id} style={[styles.row, { borderColor: colors.border }]}>
      <View style={{ flex: 1 }}><Text style={{ color: colors.text }}>{row.date.slice(0, 10)}</Text><Text style={{ color: colors.textSecondary }}>{row.class.name}</Text></View>
      <Text style={{ color: colors.text, textTransform: 'capitalize' }}>{row.status}</Text>
     </View>)}
     {!attendanceOnly && <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text }]}>Teacher reports</Text>
      {!child.reports.length && <Text style={[styles.body, { color: colors.textSecondary }]}>No teacher reports published yet.</Text>}
      {child.reports.map(report => <View key={report.id} style={styles.section}>
       <Text style={[styles.heading, { color: colors.text }]}>{report.title}</Text>
       <Text style={{ color: colors.textSecondary }}>{new Date(report.createdAt).toLocaleDateString()}</Text>
       <Text style={[styles.body, { color: colors.text }]}>{report.content}</Text>
      </View>)}
     </View>}
    </View>;
   })}
  </ScrollView>
 </SafeAreaView>;
}
const styles = StyleSheet.create({
 page: { padding: SPACING.md, paddingBottom: 100, gap: SPACING.md, width: '100%', maxWidth: 760, alignSelf: 'center' },
 title: { fontSize: 26, fontWeight: '700' }, heading: { fontSize: 18, fontWeight: '600' },
 body: { fontSize: 16, lineHeight: 24 }, action: { minHeight: 44, justifyContent: 'center' },
 section: { gap: SPACING.sm }, card: { padding: SPACING.md, borderWidth: 1, borderRadius: RADIUS.lg, gap: SPACING.sm },
 row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, borderBottomWidth: 1, paddingVertical: SPACING.sm },
});
