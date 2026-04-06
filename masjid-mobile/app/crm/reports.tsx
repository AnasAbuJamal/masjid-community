import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface FinancialData {
  month: string;
  donations: number;
  expenses: number;
}

interface AttendanceData {
  eventName: string;
  registered: number;
  attended: number;
  rate: number;
}

interface GrowthData {
  month: string;
  newMembers: number;
  activeMembers: number;
}

const MOCK_FINANCIAL: FinancialData[] = [
  { month: 'Oct', donations: 45000, expenses: 28000 },
  { month: 'Nov', donations: 52000, expenses: 31000 },
  { month: 'Dec', donations: 78000, expenses: 45000 },
  { month: 'Jan', donations: 38000, expenses: 29000 },
  { month: 'Feb', donations: 42000, expenses: 26000 },
  { month: 'Mar', donations: 55000, expenses: 32000 },
];

const MOCK_ATTENDANCE: AttendanceData[] = [
  { eventName: 'Friday Prayer (Avg)', registered: 350, attended: 320, rate: 91 },
  { eventName: 'Ramadan Iftar', registered: 150, attended: 142, rate: 95 },
  { eventName: 'Youth Program', registered: 45, attended: 38, rate: 84 },
  { eventName: "Women's Circle", registered: 28, attended: 25, rate: 89 },
  { eventName: 'Islamic School', registered: 85, attended: 78, rate: 92 },
];

const MOCK_GROWTH: GrowthData[] = [
  { month: 'Oct', newMembers: 12, activeMembers: 245 },
  { month: 'Nov', newMembers: 18, activeMembers: 260 },
  { month: 'Dec', newMembers: 25, activeMembers: 280 },
  { month: 'Jan', newMembers: 15, activeMembers: 290 },
  { month: 'Feb', newMembers: 10, activeMembers: 298 },
  { month: 'Mar', newMembers: 22, activeMembers: 315 },
];

export default function ReportsCrmScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<'financial' | 'attendance' | 'growth'>('financial');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load mock data
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const totalDonations = MOCK_FINANCIAL.reduce((sum, m) => sum + m.donations, 0);
  const totalExpenses = MOCK_FINANCIAL.reduce((sum, m) => sum + m.expenses, 0);
  const netIncome = totalDonations - totalExpenses;
  const avgAttendance = Math.round(MOCK_ATTENDANCE.reduce((sum, e) => sum + e.rate, 0) / MOCK_ATTENDANCE.length);
  const totalNewMembers = MOCK_GROWTH.reduce((sum, m) => sum + m.newMembers, 0);
  const currentMembers = MOCK_GROWTH[MOCK_GROWTH.length - 1].activeMembers;

  const getMaxValue = (data: FinancialData[]) => Math.max(...data.map(d => Math.max(d.donations, d.expenses)));

  const renderFinancialReport = () => (
    <View>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name="arrow-down-bold" size={20} color={COLORS.success} />} size="sm" color={COLORS.success} />
          <Text style={styles.statValue}>${(totalDonations / 1000).toFixed(0)}K</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name="arrow-up-bold" size={20} color={COLORS.error} />} size="sm" color={COLORS.error} />
          <Text style={styles.statValue}>${(totalExpenses / 1000).toFixed(0)}K</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name={netIncome >= 0 ? 'trending-up' : 'trending-down'} size={20} color={netIncome >= 0 ? COLORS.success : COLORS.error} />} size="sm" color={netIncome >= 0 ? COLORS.success : COLORS.error} />
          <Text style={[styles.statValue, { color: netIncome >= 0 ? COLORS.success : COLORS.error }]}>${(netIncome / 1000).toFixed(0)}K</Text>
          <Text style={styles.statLabel}>Net Income</Text>
        </GlassCard>
      </View>

      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue vs Expenses</Text>
        <View style={styles.chartContainer}>
          {MOCK_FINANCIAL.map((item, index) => {
            const max = getMaxValue(MOCK_FINANCIAL);
            const donationHeight = (item.donations / max) * 120;
            const expenseHeight = (item.expenses / max) * 120;
            return (
              <View key={item.month} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View style={[styles.bar, styles.donationBar, { height: donationHeight }]} />
                  <View style={[styles.bar, styles.expenseBar, { height: expenseHeight }]} />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Donations</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
      {MOCK_FINANCIAL.map(item => (
        <GlassCard key={item.month} style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownMonth}>{item.month}</Text>
            <View style={styles.breakdownNet}>
              <Text style={[styles.breakdownNetValue, { color: item.donations - item.expenses >= 0 ? COLORS.success : COLORS.error }]}>
                {item.donations - item.expenses >= 0 ? '+' : ''}${(item.donations - item.expenses).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="arrow-down" size={14} color={COLORS.success} />
              <Text style={styles.breakdownLabel}>Donations:</Text>
              <Text style={styles.breakdownValue}>${item.donations.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <MaterialCommunityIcons name="arrow-up" size={14} color={COLORS.error} />
              <Text style={styles.breakdownLabel}>Expenses:</Text>
              <Text style={styles.breakdownValue}>${item.expenses.toLocaleString()}</Text>
            </View>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  const renderAttendanceReport = () => (
    <View>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />} size="sm" color={COLORS.primary} />
          <Text style={styles.statValue}>{MOCK_ATTENDANCE.reduce((sum, e) => sum + e.attended, 0)}</Text>
          <Text style={styles.statLabel}>Total Attended</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name="percent" size={20} color={COLORS.success} />} size="sm" color={COLORS.success} />
          <Text style={styles.statValue}>{avgAttendance}%</Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>Event Attendance</Text>
      {MOCK_ATTENDANCE.map(item => (
        <GlassCard key={item.eventName} style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <Text style={styles.attendanceName}>{item.eventName}</Text>
            <Text style={[styles.attendanceRate, { color: item.rate >= 90 ? COLORS.success : item.rate >= 80 ? COLORS.primary : COLORS.error }]}>
              {item.rate}%
            </Text>
          </View>
          <View style={styles.attendanceProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.rate}%`, backgroundColor: item.rate >= 90 ? COLORS.success : item.rate >= 80 ? COLORS.primary : COLORS.error }]} />
            </View>
          </View>
          <View style={styles.attendanceStats}>
            <Text style={styles.attendanceStat}>Registered: {item.registered}</Text>
            <Text style={styles.attendanceStat}>Attended: {item.attended}</Text>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  const renderGrowthReport = () => (
    <View>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name="account-plus" size={20} color={COLORS.success} />} size="sm" color={COLORS.success} />
          <Text style={styles.statValue}>+{totalNewMembers}</Text>
          <Text style={styles.statLabel}>New Members</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <FloatingIcon icon={<MaterialCommunityIcons name="account-multiple" size={20} color={COLORS.primary} />} size="sm" color={COLORS.primary} />
          <Text style={styles.statValue}>{currentMembers}</Text>
          <Text style={styles.statLabel}>Active Members</Text>
        </GlassCard>
      </View>

      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Member Growth</Text>
        <View style={styles.chartContainer}>
          {MOCK_GROWTH.map((item, index) => {
            const max = Math.max(...MOCK_GROWTH.map(d => d.activeMembers));
            const height = (item.activeMembers / max) * 120;
            return (
              <View key={item.month} style={styles.barGroup}>
                <View style={[styles.singleBar, { height }]} />
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>Monthly New Members</Text>
      {MOCK_GROWTH.map(item => (
        <GlassCard key={item.month} style={styles.growthCard}>
          <View style={styles.growthHeader}>
            <Text style={styles.growthMonth}>{item.month}</Text>
            <Text style={styles.growthNew}>+{item.newMembers} new</Text>
          </View>
          <View style={styles.growthStats}>
            <Text style={styles.growthActive}>{item.activeMembers} active members</Text>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Reports & Analytics</Text>
          <Text style={styles.subtitle}>Financial, attendance & growth</Text>
        </View>

        <View style={styles.tabs}>
          {[
            { key: 'financial', label: 'Financial', icon: 'chart-line' },
            { key: 'attendance', label: 'Attendance', icon: 'calendar-check' },
            { key: 'growth', label: 'Growth', icon: 'account-multiple' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedReport === tab.key && styles.tabActive]}
              onPress={() => setSelectedReport(tab.key as any)}
            >
              <MaterialCommunityIcons 
                name={tab.icon as any} 
                size={16} 
                color={selectedReport === tab.key ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.tabText, selectedReport === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {selectedReport === 'financial' && renderFinancialReport()}
          {selectedReport === 'attendance' && renderAttendanceReport()}
          {selectedReport === 'growth' && renderGrowthReport()}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  content: { paddingHorizontal: SPACING.md, paddingBottom: 100 },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },

  chartCard: { marginBottom: SPACING.md, padding: SPACING.md },
  chartTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150 },
  barGroup: { alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 130 },
  bar: { width: 16, borderRadius: 4 },
  donationBar: { backgroundColor: COLORS.success },
  expenseBar: { backgroundColor: COLORS.error },
  singleBar: { width: 24, backgroundColor: COLORS.primary, borderRadius: 4 },
  barLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: SPACING.xs },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginTop: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.textSecondary },

  breakdownCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownMonth: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  breakdownNet: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  breakdownNetValue: { fontSize: 14, fontWeight: '700' },
  breakdownRow: { flexDirection: 'row', marginTop: SPACING.sm, gap: SPACING.md },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breakdownLabel: { fontSize: 12, color: COLORS.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  attendanceCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  attendanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendanceName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  attendanceRate: { fontSize: 20, fontWeight: '700' },
  attendanceProgress: { marginTop: SPACING.sm },
  progressBar: { height: 8, backgroundColor: COLORS.background, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  attendanceStats: { flexDirection: 'row', marginTop: SPACING.xs, gap: SPACING.md },
  attendanceStat: { fontSize: 12, color: COLORS.textSecondary },

  growthCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthMonth: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  growthNew: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  growthStats: { marginTop: SPACING.xs },
  growthActive: { fontSize: 13, color: COLORS.textSecondary },
});
