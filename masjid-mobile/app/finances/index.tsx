import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { FinancialSummary, FinancialRecord } from '../../services/api-service';

export default function FinancesScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const cardWidth = width - SPACING.md * 2;

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Finances</Text>
        <Text style={styles.pageSubtitle}>Community financial transparency</Text>
      </View>

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
    </View>
  );

  const renderRecords = () => (
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
                    <Text style={styles.recordStatLabel}>raised</Text>
                  </View>
                  <View style={styles.recordStat}>
                    <MaterialCommunityIcons name="arrow-up-bold" size={12} color={COLORS.error} />
                    <Text style={[styles.recordStatValue, { color: COLORS.error }]}>
                      ${record.expenses.toLocaleString()}
                    </Text>
                    <Text style={styles.recordStatLabel}>spent</Text>
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
                    <Text style={styles.recordStatLabel}>net</Text>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {loading ? (
          renderSkeleton()
        ) : !summary ? (
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
            {renderHeader()}
            {renderRecords()}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  heroCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: RADIUS.xl, overflow: 'hidden' },
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
  recordStatLabel: { fontSize: 11, color: COLORS.textSecondary },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  emptyRecords: { paddingVertical: SPACING.lg, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
