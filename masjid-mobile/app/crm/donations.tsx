import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/common';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Donor {
  id: string;
  name: string;
  email: string;
  totalDonated: number;
  donationCount: number;
  lastDonationDate: string | null;
}
interface DonorPage {
  donors: Donor[];
  page: number;
  hasMore: boolean;
  totals: {
    amount: number;
    count: number;
    anonymousAmount: number;
    anonymousCount: number;
  };
}
const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

export default function DonationsCrmScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [totals, setTotals] = useState<DonorPage['totals'] | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = async (number: number, append = false) => {
    const response = await api.instance.get<DonorPage>('/mobile/admin/donors', {
      params: { q: query.trim() || undefined, page: number },
    });
    setDonors(previous => append
      ? [...previous, ...response.data.donors.filter(item => !previous.some(existing => existing.id === item.id))]
      : response.data.donors);
    setTotals(response.data.totals);
    setHasMore(response.data.hasMore);
    setPage(response.data.page);
    setError('');
  };

  useEffect(() => {
    if (role !== 'admin') { setLoading(false); return; }
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.instance.get<DonorPage>('/mobile/admin/donors', {
          params: { q: query.trim() || undefined, page: 1 },
        });
        if (!active) return;
        setDonors(result.data.donors); setTotals(result.data.totals);
        setPage(1); setHasMore(result.data.hasMore); setError('');
      } catch {
        if (active) setError('Unable to retrieve donor history. Please try again.');
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, role]);

  const refresh = async () => {
    setRefreshing(true);
    try { await fetchPage(1); }
    catch { setError('Unable to refresh donors.'); }
    finally { setRefreshing(false); }
  };
  const more = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try { await fetchPage(page + 1, true); }
    catch { setError('Could not load more donor records.'); }
    finally { setLoadingMore(false); }
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityRole="button"
          accessibilityLabel="Go back" onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Donations CRM</Text>
          <Text style={styles.subtitle}>Verified completed payments</Text>
        </View>
      </View>
      {role !== 'admin' ? <View style={styles.center}>
        <Text style={styles.muted}>Administrator access is required.</Text>
      </View> : <>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.searchInput} value={query}
            accessibilityLabel="Search donors" onChangeText={setQuery}
            placeholder="Search non-anonymous donor records"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none" />
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : (
          <FlatList
            data={donors}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} />}
            ListHeaderComponent={totals ? (
              <View>
                <View style={styles.metrics}>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{money(totals.amount)}</Text>
                    <Text style={styles.metricLabel}>Confirmed donations · All time</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{totals.count.toLocaleString()}</Text>
                    <Text style={styles.metricLabel}>Completed payments</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{money(totals.anonymousAmount)}</Text>
                    <Text style={styles.metricLabel}>Anonymous contributions</Text>
                  </View>
                </View>
                <Text style={styles.heading}>Non-anonymous donors</Text>
              </View>
            ) : null}
            ListEmptyComponent={<View style={styles.center}>
              <MaterialCommunityIcons name="account-search-outline" size={43} color={COLORS.textSecondary} />
              <Text style={styles.muted}>{error || 'No matching donor records are available.'}</Text>
            </View>}
            ListFooterComponent={hasMore ? (
              <TouchableOpacity accessibilityRole="button" style={styles.more}
                disabled={loadingMore} onPress={() => { void more(); }}>
                <Text style={styles.actionText}>{loadingMore ? 'Loading…' : 'Load more donors'}</Text>
              </TouchableOpacity>
            ) : <Text style={styles.note}>
              Anonymous donor identities are never displayed. Donations are linked by supplied email,
              so contact details may not be independently verified.
            </Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <View style={styles.row}>
                  <Text style={styles.amount}>{money(item.totalDonated)}</Text>
                  <Text style={styles.muted}>{item.donationCount} completed gifts</Text>
                </View>
                {item.lastDonationDate && <Text style={styles.date}>
                  Last gift: {new Date(item.lastDonationDate).toLocaleDateString()}
                </Text>}
              </View>
            )}
          />
        )}
        {!!error && donors.length > 0 && <Text style={styles.error}>{error}</Text>}
      </>}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', padding: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontWeight: '700', fontSize: 21 },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  search: { minHeight: 48, margin: SPACING.md, flexDirection: 'row', gap: SPACING.sm,
    alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  searchInput: { color: COLORS.text, fontSize: 16, minHeight: 46, flex: 1 },
  loader: { flex: 1 },
  content: { maxWidth: 850, width: '100%', alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  metric: { flexGrow: 1, flexBasis: '45%', minWidth: 150, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  metricValue: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  metricLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.sm, lineHeight: 18 },
  heading: { color: COLORS.text, fontWeight: '700', fontSize: 17, marginBottom: SPACING.md },
  card: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  email: { color: COLORS.textSecondary, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: SPACING.sm },
  amount: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  muted: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  date: { color: COLORS.textSecondary, fontSize: 12 },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: SPACING.lg },
  more: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: COLORS.primary, fontWeight: '700' },
  center: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  error: { color: COLORS.error, textAlign: 'center', padding: SPACING.md },
});
