import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/common';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface MonthlyReport {
  month: string;
  donations: number;
  expenses: number;
  newMembers: number;
}
interface EventReport {
  id: string;
  title: string;
  date: string;
  confirmedRSVPs: number;
  capacity: number | null;
}
interface Report {
  months: MonthlyReport[];
  totals: {
    donations: number; expenses: number; net: number;
    activeMembers: number; activeStudents: number;
    approvedVolunteerApplications: number; pendingJobApplications: number;
    pendingVolunteerApplications: number; pendingRentalBookings: number;
  };
  events: EventReport[];
}
type ViewName = 'financial' | 'events' | 'growth';
const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const monthLabel = (value: string) =>
  new Date(`${value}-15T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

export default function ReportsCrmScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const role = useAuthStore(state => state.user?.role);
  const [data, setData] = useState<Report | null>(null);
  const [active, setActive] = useState<ViewName>('financial');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<Report>('/mobile/admin/analytics');
      setData(response.data);
      setError('');
    } catch {
      setError('Reports are unavailable. Check your permission and connection.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { if (role === 'admin') void load(); else setLoading(false); }, [role]);
  const refresh = () => { setRefreshing(true); void load(); };

  const stat = (name: string, value: string, caption?: string) => (
    <View style={[styles.statCard, width >= 760 && styles.statCardWide]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{name}</Text>
      {caption ? <Text style={styles.statCaption}>{caption}</Text> : null}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
            style={styles.back} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Reports & Analytics</Text>
            <Text style={styles.subtitle}>Verified database totals · Most recent six months</Text>
          </View>
        </View>

        {role !== 'admin' ? (
          <Text style={styles.empty}>Administrator access is required.</Text>
        ) : loading ? <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
          : error ? <View style={styles.emptyBox}>
            <Text style={styles.empty}>{error}</Text>
            <TouchableOpacity style={styles.retry} accessibilityRole="button" onPress={refresh}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View> : data ? (
            <>
              <View style={styles.tabs}>
                {([
                  ['financial', 'Finances'], ['events', 'Event RSVPs'], ['growth', 'Membership'],
                ] as const).map(([key, label]) => (
                  <TouchableOpacity key={key} accessibilityRole="tab"
                    accessibilityState={{ selected: active === key }}
                    onPress={() => setActive(key)}
                    style={[styles.tab, active === key && styles.selectedTab]}>
                    <Text style={[styles.tabText, active === key && styles.selectedTabText]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {active === 'financial' && <>
                <View style={styles.stats}>
                  {stat('Confirmed donations', money(data.totals.donations), 'Payments confirmed in this period')}
                  {stat('Recorded expenses', money(data.totals.expenses))}
                  {stat('Difference', money(data.totals.net), 'Not an audited profit or bank balance')}
                </View>
                <Text style={styles.sectionTitle}>Donations and expenses</Text>
                {data.months.map(month => {
                  const max = Math.max(1, ...data.months.flatMap(m => [m.donations, m.expenses]));
                  return (
                    <View key={month.month} style={styles.monthCard}>
                      <Text style={styles.monthTitle}>{monthLabel(month.month)}</Text>
                      <View style={styles.barLine}>
                        <View style={[styles.bar, { width: `${Math.round(month.donations / max * 100)}%`, backgroundColor: COLORS.success }]} />
                      </View>
                      <Text style={styles.barLabel}>Donations {money(month.donations)}</Text>
                      <View style={styles.barLine}>
                        <View style={[styles.bar, { width: `${Math.round(month.expenses / max * 100)}%`, backgroundColor: COLORS.warning }]} />
                      </View>
                      <Text style={styles.barLabel}>Expenses {money(month.expenses)}</Text>
                    </View>
                  );
                })}
                <Text style={styles.note}>Donations exclude pending, refunded and failed payments. Expenses are recorded operational costs; figures are not audited financial statements.</Text>
              </>}

              {active === 'events' && <>
                <Text style={styles.sectionTitle}>Confirmed event registrations</Text>
                {data.events.length === 0 ? <Text style={styles.empty}>No public event registrations in this period.</Text>
                  : data.events.map(event => (
                    <View style={styles.eventCard} key={event.id}>
                      <Text style={styles.eventName}>{event.title}</Text>
                      <Text style={styles.eventMeta}>{new Date(event.date).toLocaleDateString()}</Text>
                      <Text style={styles.eventCount}>{event.confirmedRSVPs} confirmed RSVPs
                        {event.capacity ? ` · Capacity ${event.capacity}` : ''}</Text>
                    </View>
                  ))}
                <Text style={styles.note}>Registrations do not establish actual attendance. Event check-in data is not recorded by this report.</Text>
              </>}

              {active === 'growth' && <>
                <View style={styles.stats}>
                  {stat('Active accounts', data.totals.activeMembers.toLocaleString())}
                  {stat('Enrolled students', data.totals.activeStudents.toLocaleString())}
                  {stat('Approved volunteers', data.totals.approvedVolunteerApplications.toLocaleString(), 'Approved applications')}
                  {stat('Job applications pending', data.totals.pendingJobApplications.toLocaleString())}
                  {stat('Volunteer applications pending', data.totals.pendingVolunteerApplications.toLocaleString())}
                  {stat('Rental requests pending', data.totals.pendingRentalBookings.toLocaleString())}
                </View>
                <Text style={styles.sectionTitle}>New member accounts</Text>
                {data.months.map(month => (
                  <View key={month.month} style={styles.growthRow}>
                    <Text style={styles.growthMonth}>{monthLabel(month.month)}</Text>
                    <Text style={styles.growthCount}>{month.newMembers.toLocaleString()}</Text>
                  </View>
                ))}
                <Text style={styles.note}>Member growth counts newly created accounts, not unique attendees.</Text>
              </>}
            </>
          ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 900, alignSelf: 'center', width: '100%',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xs, borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  selectedTab: { backgroundColor: COLORS.primaryFaded },
  tabText: { fontSize: 12, textAlign: 'center', color: COLORS.textSecondary, fontWeight: '600' },
  selectedTabText: { color: COLORS.primary },
  loader: { marginTop: SPACING.xxl },
  emptyBox: { alignItems: 'center', padding: SPACING.xl },
  empty: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14,
    lineHeight: 22, marginVertical: SPACING.lg },
  retry: { minHeight: 44, justifyContent: 'center', padding: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.lg },
  statCard: { flexGrow: 1, flexBasis: '45%', minWidth: 135, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface },
  statCardWide: { flexBasis: '29%' },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  statCaption: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  monthCard: { padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.surface },
  monthTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: SPACING.sm },
  barLine: { backgroundColor: COLORS.background, borderRadius: RADIUS.sm,
    height: 12, overflow: 'hidden' },
  bar: { height: 12, minWidth: 0, borderRadius: RADIUS.sm },
  barLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5, marginBottom: SPACING.sm },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 20, marginTop: SPACING.lg },
  eventCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  eventName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  eventMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  eventCount: { color: COLORS.primary, fontSize: 13, marginTop: SPACING.sm, fontWeight: '600' },
  growthRow: { minHeight: 48, borderBottomColor: COLORS.border, borderBottomWidth: 1,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  growthMonth: { color: COLORS.text, fontSize: 14 },
  growthCount: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
