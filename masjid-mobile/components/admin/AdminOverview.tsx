import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api-client';

interface OverviewData {
  totals: {
    donations: number;
    expenses: number;
    activeMembers: number;
    activeStudents: number;
    approvedVolunteerApplications: number;
    pendingJobApplications: number;
    pendingVolunteerApplications: number;
    pendingRentalBookings: number;
  };
  months: { month: string; donations: number; expenses: number; newMembers: number }[];
}
const NAV = [
  { title: 'Users', detail: 'Accounts and permissions', icon: 'account-group-outline', route: '/admin/users' },
  { title: 'Announcements', detail: 'Community communications', icon: 'bullhorn-outline', route: '/admin/announcements' },
  { title: 'Jobs', detail: 'Job postings and applications', icon: 'briefcase-outline', route: '/admin/jobs' },
  { title: 'Volunteers', detail: 'Review volunteer requests', icon: 'hand-heart-outline', route: '/admin/volunteers' },
  { title: 'Analytics', detail: 'Real operational reports', icon: 'chart-bar', route: '/crm/reports' },
  { title: 'Audit logs', detail: 'Accountable changes', icon: 'shield-check-outline', route: '/admin/audit-logs' },
] as const;

export function AdminOverview({ title }: { title: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const role = useAuthStore(state => state.user?.role);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const response = await api.instance.get<OverviewData>('/mobile/admin/analytics');
      setData(response.data);
      setError('');
    } catch {
      setError('Unable to retrieve the dashboard. Try again when connected.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };
  useEffect(() => {
    if (role === 'admin') void load();
    else setLoading(false);
  }, [role]);
  const refresh = () => { setRefreshing(true); void load(); };

  const values = data?.totals;
  const stats = values ? [
    { title: 'Active accounts', value: values.activeMembers.toLocaleString() },
    { title: 'Active students', value: values.activeStudents.toLocaleString() },
    { title: 'Donations (six months)', value: `$${values.donations.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { title: 'Approved volunteer applications', value: values.approvedVolunteerApplications.toLocaleString() },
    { title: 'Pending job applications', value: values.pendingJobApplications.toLocaleString() },
    { title: 'Pending rental requests', value: values.pendingRentalBookings.toLocaleString() },
  ] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Live community operations</Text>
          </View>
        </View>
        {role !== 'admin' ? <Text style={styles.info}>Administrator access is required.</Text>
          : loading ? <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
          : error ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="wifi-off" size={30} color={COLORS.textSecondary} />
              <Text style={styles.info}>{error}</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retry}
                onPress={refresh}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            </View>
          ) : <>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.stats}>
              {stats.map(stat => (
                <View key={stat.title} style={[styles.stat, width >= 768 && styles.statTablet]}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.nav}>
              {NAV.map(item => (
                <TouchableOpacity key={item.route} style={[styles.navItem, width >= 768 && styles.navTablet]}
                  accessibilityRole="button" accessibilityLabel={item.title}
                  onPress={() => router.push(item.route)}>
                  <View style={styles.icon}>
                    <MaterialCommunityIcons name={item.icon} color={COLORS.primary} size={22} />
                  </View>
                  <View style={styles.navText}>
                    <Text style={styles.navTitle}>{item.title}</Text>
                    <Text style={styles.navDetail}>{item.detail}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.disclaimer}>Financial totals show completed donations and recorded expenses, not bank balances or audited statements.</Text>
          </>}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  sectionTitle: { color: COLORS.text, fontWeight: '700', fontSize: 17, marginBottom: SPACING.md },
  stats: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.xl },
  stat: { flexGrow: 1, flexBasis: '45%', minWidth: 140, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  statTablet: { flexBasis: '29%' },
  statValue: { color: COLORS.text, fontSize: 23, fontWeight: '700' },
  statTitle: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: SPACING.xs },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  navItem: { flexBasis: '100%', minHeight: 72, backgroundColor: COLORS.surface,
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1, gap: SPACING.sm },
  navTablet: { flexBasis: '48%', flexGrow: 1 },
  icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryFaded, borderRadius: RADIUS.md },
  navText: { flex: 1 },
  navTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  navDetail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  disclaimer: { fontSize: 12, lineHeight: 19, color: COLORS.textSecondary, marginTop: SPACING.xl },
  info: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  loader: { marginTop: SPACING.xxl },
  empty: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.md },
  retry: { justifyContent: 'center', minHeight: 44, paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '600' },
});
