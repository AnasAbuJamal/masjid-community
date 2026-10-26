import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Summary {
  totalSpent: number;
  bankBalance: number;
  totalGoal: number;
  totalRaised: number;
  remainingNeeded: number;
  lastUpdated: string;
}
interface RecordMonth {
  id: number;
  month: string;
  year: number;
  donations: number;
  expenses: number;
}
interface BudgetLine {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  color: string | null;
  icon: string | null;
}
interface Report {
  summary: Summary | null;
  records: RecordMonth[];
  budgets: BudgetLine[];
  expenseCategories: { name: string; amount: number }[];
  period: { year: number; month: number };
}
type Tab = 'overview' | 'budgets' | 'expenses';
const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
const label = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export default function FinancesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState(() => {
    const date = new Date();
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  });
  const [tab, setTab] = useState<Tab>('overview');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<Report>('/public/finances', { params: period });
      setReport(response.data);
      setError('');
    } catch {
      setError('Published finances could not be retrieved. Check your connection and retry.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    void load();
  }, [period.year, period.month]);
  const refresh = () => { setRefreshing(true); void load(); };

  const shiftPeriod = (direction: number) => {
    const target = new Date(period.year, period.month - 1 + direction, 1);
    if (target.getFullYear() < 2020 || target.getFullYear() > 2100) return;
    setPeriod({ year: target.getFullYear(), month: target.getMonth() + 1 });
  };

  const summaryItem = (name: string, value: string) => (
    <View style={[styles.metric, width >= 768 && styles.metricTablet]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{name}</Text>
    </View>
  );

  const summary = report?.summary;
  const budgets = report?.budgets ?? [];
  const expenses = report?.expenseCategories ?? [];
  const budgetTotal = budgets.reduce((total, b) => total + b.allocated, 0);
  const spentTotal = budgets.reduce((total, b) => total + b.spent, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={styles.title}>Community Finances</Text>
          <Text style={styles.subtitle}>Published financial transparency</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {([
          ['overview', 'Overview'], ['budgets', 'Budgets'], ['expenses', 'Expenses'],
        ] as const).map(([key, name]) => (
          <TouchableOpacity key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        {tab !== 'overview' && (
          <View style={styles.period}>
            <TouchableOpacity style={styles.periodArrow} accessibilityRole="button"
              accessibilityLabel="Previous month" onPress={() => shiftPeriod(-1)}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.periodLabel}>{label(period.year, period.month)}</Text>
            <TouchableOpacity style={styles.periodArrow} accessibilityRole="button"
              accessibilityLabel="Next month" onPress={() => shiftPeriod(1)}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        )}
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          : error ? <View style={styles.empty}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={refresh}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View> : report ? (
            <>
              {tab === 'overview' && (
                <>
                  <Text style={styles.sectionTitle}>Financial summary</Text>
                  {summary ? (
                    <>
                      <View style={styles.metrics}>
                        {summaryItem('Total raised', money(summary.totalRaised))}
                        {summaryItem('Total spent', money(summary.totalSpent))}
                        {summaryItem('Remaining goal', money(summary.remainingNeeded))}
                        {summaryItem('Bank balance (reported)', money(summary.bankBalance))}
                      </View>
                      {summary.totalGoal > 0 && (
                        <View style={styles.goal}>
                          <Text style={styles.goalLabel}>Fundraising progress</Text>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, {
                              width: `${Math.max(0, Math.min(100, summary.totalRaised / summary.totalGoal * 100))}%`,
                            }]} />
                          </View>
                          <Text style={styles.note}>{money(summary.totalRaised)} of {money(summary.totalGoal)}</Text>
                        </View>
                      )}
                      <Text style={styles.note}>Last recorded update: {new Date(summary.lastUpdated).toLocaleDateString()}</Text>
                    </>
                  ) : <Text style={styles.emptyText}>No financial summary has been published.</Text>}

                  <Text style={styles.sectionTitle}>Recorded monthly results</Text>
                  {report.records.length === 0 ?
                    <Text style={styles.emptyText}>No monthly financial records have been recorded.</Text>
                    : report.records.map(month => (
                      <View key={month.id} style={styles.card}>
                        <Text style={styles.cardTitle}>{month.month} {month.year}</Text>
                        <View style={styles.moneyRow}>
                          <Text style={styles.secondary}>Donations</Text>
                          <Text style={styles.moneyText}>{money(month.donations)}</Text>
                        </View>
                        <View style={styles.moneyRow}>
                          <Text style={styles.secondary}>Expenses</Text>
                          <Text style={styles.moneyText}>{money(month.expenses)}</Text>
                        </View>
                      </View>
                    ))}
                  <Text style={styles.note}>The summary and monthly records are reported by masjid staff; they are not automatically audited bank statements.</Text>
                </>
              )}

              {tab === 'budgets' && (
                <>
                  <Text style={styles.sectionTitle}>Published category allocations</Text>
                  {budgets.length === 0 ? <Text style={styles.emptyText}>
                    No budgets have been published for {label(period.year, period.month)}.
                  </Text> : <>
                    <View style={styles.metrics}>
                      {summaryItem('Published allocations', money(budgetTotal))}
                      {summaryItem('Recorded category spend', money(spentTotal))}
                    </View>
                    {budgets.map(budget => {
                      const percent = budget.allocated > 0 ? budget.spent / budget.allocated * 100 : 0;
                      return (
                        <View key={budget.id} style={styles.card}>
                          <View style={styles.moneyRow}>
                            <Text style={styles.cardTitle}>{budget.category}</Text>
                            <Text style={styles.secondary}>
                              {budget.allocated > 0 ? `${percent.toFixed(0)}% used` : 'No allocation'}
                            </Text>
                          </View>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, {
                              width: `${Math.max(0, Math.min(100, percent))}%`,
                              backgroundColor: percent > 100 ? COLORS.error : COLORS.primary,
                            }]} />
                          </View>
                          <View style={styles.moneyRow}>
                            <Text style={styles.secondary}>Spent {money(budget.spent)}</Text>
                            <Text style={styles.secondary}>Budget {money(budget.allocated)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </>}
                </>
              )}

              {tab === 'expenses' && (
                <>
                  <Text style={styles.sectionTitle}>Published expense category totals</Text>
                  {expenses.length === 0 ? <Text style={styles.emptyText}>
                    No expense breakdown has been published for {label(period.year, period.month)}.
                  </Text> : expenses.map(expense => (
                    <View key={expense.name} style={styles.card}>
                      <View style={styles.moneyRow}>
                        <Text style={styles.cardTitle}>{expense.name}</Text>
                        <Text style={styles.moneyText}>{money(expense.amount)}</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={styles.note}>Category totals include only published budget categories. Individual expense descriptions and private receipts are not publicly exposed.</Text>
                </>
              )}
            </>
          ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 3 },
  tabs: { flexDirection: 'row', padding: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm },
  tab: { flex: 1, minHeight: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.primaryFaded },
  tabLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: COLORS.primary },
  content: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl },
  period: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md,
    marginBottom: SPACING.lg },
  periodArrow: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  periodLabel: { color: COLORS.text, fontWeight: '700', fontSize: 16, minWidth: 170, textAlign: 'center' },
  loader: { marginTop: SPACING.xxl },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 14,
    lineHeight: 21, marginVertical: SPACING.lg },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  sectionTitle: { color: COLORS.text, fontWeight: '700', fontSize: 17,
    marginTop: SPACING.md, marginBottom: SPACING.md },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  metric: { flexGrow: 1, flexBasis: '45%', minWidth: 130, padding: SPACING.md,
    backgroundColor: COLORS.surface, borderColor: COLORS.border,
    borderWidth: 1, borderRadius: RADIUS.lg },
  metricTablet: { flexBasis: '23%' },
  metricValue: { fontSize: 19, fontWeight: '700', color: COLORS.text },
  metricLabel: { marginTop: SPACING.xs, color: COLORS.textSecondary, fontSize: 12 },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: 12 },
  moneyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.sm },
  moneyText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  goal: { padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border },
  goalLabel: { color: COLORS.text, fontWeight: '600', fontSize: 14, marginBottom: SPACING.sm },
  progressTrack: { height: 10, backgroundColor: COLORS.background,
    borderRadius: RADIUS.full, overflow: 'hidden', marginVertical: SPACING.xs },
  progressFill: { height: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19,
    marginTop: SPACING.md, marginBottom: SPACING.sm },
});
