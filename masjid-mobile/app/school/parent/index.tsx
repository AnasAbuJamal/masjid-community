import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/common';
import api from '../../../services/api-client';
import { useAuthStore } from '../../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface Child {
  id: string; name: string; className: string; instructor: string; schedule: string;
  assignments: { id: string; status: string; rating: string }[];
  reports: { id: string; title: string }[];
}
interface Invoice {
  id: string; childName: string; amount: number; dueDate: string;
  description: string; status: 'pending' | 'paid' | 'void' | 'refunded';
}
const ACTIONS = [
  { title: 'Progress', description: 'Published assessments and reports', icon: 'chart-line', route: '/school/grades' },
  { title: 'Payments', description: 'Review and pay invoices', icon: 'credit-card-outline', route: '/school/parent/payments' },
  { title: 'Class Schedule', description: 'Published weekly classes', icon: 'calendar-clock-outline', route: '/school/schedule' },
  { title: 'Resources', description: 'Learning material library', icon: 'book-open-outline', route: '/school/resources' },
  { title: 'Enrollment', description: 'Apply for a school place', icon: 'school-outline', route: '/school/enroll' },
] as const;
const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function ParentPortalScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const account = useAuthStore(state => state.user);
  const [children, setChildren] = useState<Child[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [progress, billing] = await Promise.all([
        api.instance.get<{ students: Child[] }>('/school/progress'),
        api.instance.get<{ invoices: Invoice[] }>('/school/invoices'),
      ]);
      setChildren(progress.data.students);
      setInvoices(billing.data.invoices);
      setError('');
    } catch (failure: unknown) {
      setChildren([]); setInvoices([]);
      const code = (failure as { response?: { status?: number } })?.response?.status;
      setError(code === 403
        ? 'Verify your email in Profile before viewing private family records.'
        : code === 401 ? 'Sign in to see your family’s school records.'
          : 'Family records are temporarily unavailable. Check your connection and retry.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => {
    if (account) void load();
    else setLoading(false);
  }, [account?.id]);

  const refresh = () => { setRefreshing(true); void load(); };
  const outstanding = invoices.filter(i => i.status === 'pending');
  const unpaidTotal = outstanding.reduce((total, invoice) => total + invoice.amount, 0);
  const widthBasis = width >= 760 ? '48%' : '100%';

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Parent Portal</Text>
          <Text style={styles.subtitle}>Your family's private school information</Text>
        </View>

        {!account ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-lock-outline" size={38} color={COLORS.textSecondary} />
            <Text style={styles.muted}>Sign in to view school records associated with your account.</Text>
            <TouchableOpacity accessibilityRole="button" style={styles.primaryAction}
              onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.primaryText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
        : error ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="shield-lock-outline" size={38} color={COLORS.textSecondary} />
            <Text style={styles.muted}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity accessibilityRole="button" style={styles.retry}
                onPress={refresh}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.retry}
                onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.retryText}>Open Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : <>
          <Text style={styles.sectionTitle}>Your Students</Text>
          {children.length === 0 ? (
            <Text style={styles.emptyText}>No students are currently linked to your verified account.</Text>
          ) : <View style={styles.grid}>
            {children.map(child => (
              <View key={child.id} style={[styles.card, { width: widthBasis }]}>
                <View style={styles.row}>
                  <MaterialCommunityIcons name="school-outline" size={25} color={COLORS.primary} />
                  <Text style={styles.childName}>{child.name}</Text>
                </View>
                <Text style={styles.label}>{child.className}</Text>
                <Text style={styles.meta}>Instructor: {child.instructor}</Text>
                <Text style={styles.meta}>{child.schedule}</Text>
                <Text style={styles.meta}>
                  {child.assignments.length} recent assessments · {child.reports.length} reports
                </Text>
                <TouchableOpacity accessibilityRole="button" style={styles.cardLink}
                  onPress={() => router.push('/school/grades')}>
                  <Text style={styles.linkText}>View progress</Text>
                  <MaterialCommunityIcons name="chevron-right" size={19} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>}
          <Text style={styles.sectionTitle}>Billing Summary</Text>
          <View style={styles.bill}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Outstanding invoices</Text>
              <Text style={styles.balance}>{money(unpaidTotal)}</Text>
              <Text style={styles.meta}>{outstanding.length} unpaid invoices</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.smallAction}
              onPress={() => router.push('/school/parent/payments')}>
              <Text style={styles.smallText}>View Payments</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.note}>
            Balances are based on invoices issued by the masjid office, not estimated tuition charges.
          </Text>
        </>}

        <Text style={styles.sectionTitle}>School Services</Text>
        <View style={styles.grid}>
          {ACTIONS.map(action => (
            <TouchableOpacity accessibilityRole="button" key={action.title}
              style={[styles.actionCard, { width: widthBasis }]}
              onPress={() => router.push(action.route)}>
              <View style={styles.actionIcon}>
                <MaterialCommunityIcons name={action.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.actionBody}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDesc}>{action.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 920, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.md },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.xs },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700',
    marginTop: SPACING.lg, marginBottom: SPACING.md },
  loader: { marginVertical: SPACING.xxl },
  muted: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center' },
  empty: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
    padding: SPACING.lg, gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21,
    paddingVertical: SPACING.md },
  primaryAction: { minHeight: 48, paddingHorizontal: SPACING.lg,
    justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  errorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  retry: { minHeight: 44, paddingHorizontal: SPACING.md,
    justifyContent: 'center', backgroundColor: COLORS.primaryFaded, borderRadius: RADIUS.md },
  retryText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: SPACING.sm },
  card: { borderColor: COLORS.border, borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.md, backgroundColor: COLORS.surface,
    gap: SPACING.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  childName: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  meta: { fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  cardLink: { alignSelf: 'flex-start', flexDirection: 'row', minHeight: 44,
    alignItems: 'center', marginTop: SPACING.sm },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  bill: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center',
    padding: SPACING.lg, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg },
  balance: { fontSize: 24, color: COLORS.text, fontWeight: '700', marginVertical: SPACING.xs },
  smallAction: { minHeight: 44, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center', alignItems: 'center' },
  smallText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 19, color: COLORS.textSecondary,
    marginTop: SPACING.sm },
  actionCard: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1,
    padding: SPACING.md, backgroundColor: COLORS.surface },
  actionIcon: { width: 43, height: 43, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaded, alignItems: 'center', justifyContent: 'center' },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  actionDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginTop: 3 },
});
