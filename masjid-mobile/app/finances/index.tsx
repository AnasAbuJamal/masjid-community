import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { FinancialSummary, FinancialRecord } from '../../services/api-service';

interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  color: string;
}

const EXPENSE_CATEGORIES = [
  { name: 'Utilities', icon: 'lightning-bolt', color: '#FF9800' },
  { name: 'Maintenance', icon: 'wrench', color: '#2196F3' },
  { name: 'Salaries', icon: 'account-tie', color: '#9C27B0' },
  { name: 'Programs', icon: 'calendar', color: '#4CAF50' },
  { name: 'Equipment', icon: 'toolbox', color: '#F44336' },
  { name: 'Other', icon: 'dots-horizontal', color: '#607D8B' },
];

const MOCK_BUDGETS: Budget[] = [
  { id: '1', category: 'Utilities', allocated: 5000, spent: 4200, color: '#FF9800' },
  { id: '2', category: 'Maintenance', allocated: 3000, spent: 2800, color: '#2196F3' },
  { id: '3', category: 'Salaries', allocated: 15000, spent: 14500, color: '#9C27B0' },
  { id: '4', category: 'Programs', allocated: 8000, spent: 6500, color: '#4CAF50' },
  { id: '5', category: 'Equipment', allocated: 2000, spent: 1800, color: '#F44336' },
];

const MOCK_RECENT_EXPENSES = [
  { id: '1', description: 'Electricity Bill', category: 'Utilities', amount: 1200, date: '2024-03-15' },
  { id: '2', description: 'AC Repair', category: 'Maintenance', amount: 450, date: '2024-03-14' },
  { id: '3', description: 'Youth Program Supplies', category: 'Programs', amount: 280, date: '2024-03-12' },
  { id: '4', description: 'Cleaning Service', category: 'Maintenance', amount: 350, date: '2024-03-10' },
];

export default function FinancesScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'budgets' | 'expenses'>('overview');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<typeof MOCK_RECENT_EXPENSES>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, recordsData] = await Promise.all([
        apiService.finances.getSummary(),
        apiService.finances.getRecords(),
      ]);
      setSummary(summaryData);
      setRecords(recordsData);
    } catch {
      setSummary(null);
      setRecords([]);
    }
    setBudgets(MOCK_BUDGETS);
    setRecentExpenses(MOCK_RECENT_EXPENSES);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryInfo = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.name === category) || EXPENSE_CATEGORIES[5];
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'view-grid' },
    { key: 'budgets', label: 'Budgets', icon: 'chart-pie' },
    { key: 'expenses', label: 'Expenses', icon: 'receipt' },
  ];

  const renderOverview = () => (
    <>
      {summary && (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroGradient}>
              <Text style={styles.heroLabel}>Total Raised</Text>
              <Text style={styles.heroValue}>${summary.totalRaised.toLocaleString()}</Text>
              <View style={styles.heroProgress}>
                <View style={styles.heroProgressBar}>
                  <View
                    style={[
                      styles.heroProgressFill,
                      { width: `${Math.min(100, (summary.totalRaised / summary.totalGoal) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.heroProgressText}>
                  ${summary.totalGoal.toLocaleString()} goal
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <FloatingIcon
                icon={<MaterialCommunityIcons name="bank" size={20} color={COLORS.success} />}
                size="sm"
                color={COLORS.success}
              />
              <Text style={styles.statValue}>${summary.bankBalance.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Bank Balance</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <FloatingIcon
                icon={<MaterialCommunityIcons name="cash-minus" size={20} color={COLORS.error} />}
                size="sm"
                color={COLORS.error}
              />
              <Text style={styles.statValue}>${summary.totalSpent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <FloatingIcon
                icon={<MaterialCommunityIcons name="target" size={20} color={COLORS.warning} />}
                size="sm"
                color={COLORS.warning}
              />
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                ${summary.remainingNeeded.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </GlassCard>
          </View>
        </>
      )}

      <View style={styles.recordsSection}>
        <Text style={styles.sectionTitle}>Monthly Records</Text>
        <GlassCard>
          {records.length > 0 ? (
            records.map((record, index) => {
              const net = record.donations - record.expenses;
              return (
                <View
                  key={record.id}
                  style={[
                    styles.recordRow,
                    index < records.length - 1 && styles.recordRowBorder,
                  ]}
                >
                  <View style={styles.recordMonth}>
                    <Text style={styles.recordMonthText}>{record.month}</Text>
                    <Text style={styles.recordYear}>{record.year}</Text>
                  </View>
                  <View style={styles.recordStats}>
                    <View style={styles.recordStat}>
                      <MaterialCommunityIcons name="arrow-down-bold" size={12} color={COLORS.success} />
                      <Text style={[styles.recordStatValue, { color: COLORS.success }]}>
                        ${record.donations.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.recordStat}>
                      <MaterialCommunityIcons name="arrow-up-bold" size={12} color={COLORS.error} />
                      <Text style={[styles.recordStatValue, { color: COLORS.error }]}>
                        ${record.expenses.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.recordStat}>
                      <MaterialCommunityIcons
                        name={net >= 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={net >= 0 ? COLORS.success : COLORS.error}
                      />
                      <Text
                        style={[
                          styles.recordStatValue,
                          { color: net >= 0 ? COLORS.success : COLORS.error },
                        ]}
                      >
                        {net >= 0 ? '+' : ''}${net.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyText}>No financial records available</Text>
            </View>
          )}
        </GlassCard>
      </View>
    </>
  );

  const renderBudgets = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Budget vs Actual</Text>
      {budgets.map((budget) => {
        const percent = (budget.spent / budget.allocated) * 100;
        const isOver = percent > 100;
        const categoryInfo = getCategoryInfo(budget.category);
        return (
          <GlassCard key={budget.id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetCategory}>
                <View style={[styles.categoryIcon, { backgroundColor: budget.color + '20' }]}>
                  <MaterialCommunityIcons name={categoryInfo.icon as any} size={16} color={budget.color} />
                </View>
                <Text style={styles.budgetCategoryText}>{budget.category}</Text>
              </View>
              <Text style={[styles.budgetPercent, { color: isOver ? COLORS.error : COLORS.textSecondary }]}>
                {percent.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.budgetBar}>
              <View
                style={[
                  styles.budgetFill,
                  { width: `${Math.min(100, percent)}%`, backgroundColor: isOver ? COLORS.error : budget.color },
                ]}
              />
            </View>
            <View style={styles.budgetFooter}>
              <Text style={styles.budgetSpent}>${budget.spent.toLocaleString()} spent</Text>
              <Text style={styles.budgetAllocated}>${budget.allocated.toLocaleString()} budget</Text>
            </View>
          </GlassCard>
        );
      })}

      <View style={styles.budgetSummary}>
        <GlassCard style={styles.budgetSummaryCard}>
          <Text style={styles.budgetSummaryLabel}>Total Budget</Text>
          <Text style={styles.budgetSummaryValue}>
            ${budgets.reduce((sum, b) => sum + b.allocated, 0).toLocaleString()}
          </Text>
        </GlassCard>
        <GlassCard style={styles.budgetSummaryCard}>
          <Text style={styles.budgetSummaryLabel}>Total Spent</Text>
          <Text style={[styles.budgetSummaryValue, { color: COLORS.error }]}>
            ${budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
          </Text>
        </GlassCard>
      </View>
    </View>
  );

  const renderExpenses = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Expenses</Text>
      <GlassCard>
        {recentExpenses.map((expense, index) => {
          const categoryInfo = getCategoryInfo(expense.category);
          return (
            <View
              key={expense.id}
              style={[styles.expenseRow, index < recentExpenses.length - 1 && styles.expenseRowBorder]}
            >
              <View style={[styles.expenseIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                <MaterialCommunityIcons name={categoryInfo.icon as any} size={18} color={categoryInfo.color} />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseCategory}>{expense.category} • {expense.date}</Text>
              </View>
              <Text style={styles.expenseAmount}>-${expense.amount}</Text>
            </View>
          );
        })}
      </GlassCard>

      <TouchableOpacity style={styles.addExpenseButton}>
        <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
        <Text style={styles.addExpenseText}>Add New Expense</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View style={{ padding: SPACING.md, gap: SPACING.md }}>
      <Skeleton style={{ height: 160, borderRadius: RADIUS.xl }} />
      <View style={styles.statsRow}>
        <Skeleton style={{ height: 100, borderRadius: RADIUS.lg, flex: 1 }} />
        <Skeleton style={{ height: 100, borderRadius: RADIUS.lg, flex: 1 }} />
        <Skeleton style={{ height: 100, borderRadius: RADIUS.lg, flex: 1 }} />
      </View>
      <Skeleton style={{ height: 200, borderRadius: RADIUS.lg }} />
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finances</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
                onPress={() => setSelectedTab(tab.key as any)}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={16}
                  color={selectedTab === tab.key ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

        {loading ? (
          renderSkeleton()
        ) : !summary && selectedTab === 'overview' ? (
          <View style={styles.emptyWrapper}>
            <GlassCard>
              <View style={styles.centeredContent}>
                <FloatingIcon
                  icon={<MaterialCommunityIcons name="chart-bar" size={32} color={COLORS.textSecondary} />}
                  size="lg"
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyTitle}>No financial data</Text>
                <Text style={styles.emptySubtext}>
                  Financial information will be displayed here when available
                </Text>
              </View>
            </GlassCard>
          </View>
        ) : (
          <>
            {selectedTab === 'overview' && renderOverview()}
            {selectedTab === 'budgets' && renderBudgets()}
            {selectedTab === 'expenses' && renderExpenses()}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md, marginTop: SPACING.lg },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, marginRight: SPACING.sm, gap: 6 },
  tabActive: { backgroundColor: COLORS.primary + '15' },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },

  heroCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, marginTop: SPACING.md, borderRadius: RADIUS.xl, overflow: 'hidden' },
  heroGradient: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.xl },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs },
  heroValue: { color: COLORS.white, fontSize: 36, fontWeight: '800', marginBottom: SPACING.md },
  heroProgress: { gap: SPACING.xs },
  heroProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: RADIUS.full, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: RADIUS.full },
  heroProgressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.sm },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },

  recordsSection: { paddingHorizontal: SPACING.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  recordRow: { paddingVertical: SPACING.md },
  recordRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  recordMonth: { marginBottom: SPACING.sm },
  recordMonthText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  recordYear: { fontSize: 12, color: COLORS.textSecondary },
  recordStats: { flexDirection: 'row', justifyContent: 'space-between' },
  recordStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordStatValue: { fontSize: 13, fontWeight: '700' },

  section: { paddingHorizontal: SPACING.md },
  budgetCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  budgetCategory: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  categoryIcon: { width: 32, height: 32, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  budgetCategoryText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  budgetPercent: { fontSize: 14, fontWeight: '700' },
  budgetBar: { height: 8, backgroundColor: COLORS.background, borderRadius: RADIUS.full, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: RADIUS.full },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  budgetSpent: { fontSize: 12, color: COLORS.textSecondary },
  budgetAllocated: { fontSize: 12, color: COLORS.textSecondary },

  budgetSummary: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  budgetSummaryCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  budgetSummaryLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  budgetSummaryValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  expenseRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  expenseIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1, marginLeft: SPACING.sm },
  expenseDescription: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  expenseCategory: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: COLORS.error },

  addExpenseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg, marginTop: SPACING.md, gap: SPACING.sm },
  addExpenseText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },

  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  emptyRecords: { paddingVertical: SPACING.lg, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
