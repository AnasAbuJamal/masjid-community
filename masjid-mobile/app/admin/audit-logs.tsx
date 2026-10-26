import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface AuditEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  email: string | null;
  details: string | null;
  success: boolean;
  timestamp: string;
  userId: string | null;
}
interface AuditPage {
  logs: AuditEntry[];
  page: number;
  total: number;
  hasMore: boolean;
}
const nice = (text: string) =>
  text.replaceAll('_', ' ').replace(/\b\w/g, match => match.toUpperCase());

export default function AuditLogsScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const read = async (number: number, append = false) => {
    const response = await api.instance.get<AuditPage>('/mobile/admin/audit-logs', {
      params: { q: query.trim() || undefined, page: number },
    });
    setLogs(old => append
      ? [...old, ...response.data.logs.filter(l => !old.some(existing => existing.id === l.id))]
      : response.data.logs);
    setPage(number);
    setHasMore(response.data.hasMore);
    setTotal(response.data.total);
    setError('');
  };
  useEffect(() => {
    if (role !== 'admin') { setLoading(false); return; }
    let active = true;
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await api.instance.get<AuditPage>('/mobile/admin/audit-logs', {
          params: { q: query.trim() || undefined, page: 1 },
        });
        if (active) {
          setLogs(response.data.logs); setPage(1); setTotal(response.data.total);
          setHasMore(response.data.hasMore); setError('');
        }
      } catch {
        if (active) setError('Audit entries are unavailable. Try again.');
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timeout); };
  }, [query, role]);

  const refresh = async () => {
    setRefreshing(true);
    try { await read(1); }
    catch { setError('Unable to refresh audit entries.'); }
    finally { setRefreshing(false); }
  };
  const more = async () => {
    if (!hasMore || moreLoading || loading) return;
    setMoreLoading(true);
    try { await read(page + 1, true); }
    catch { setError('Could not retrieve the next page.'); }
    finally { setMoreLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Audit Logs</Text>
        <View style={styles.back} />
      </View>
      {role !== 'admin' ? <View style={styles.center}>
        <Text style={styles.empty}>Administrator access is required.</Text>
      </View> : <>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
          <TextInput value={query} onChangeText={setQuery}
            accessibilityLabel="Search audit logs"
            placeholder="Search action, email or entity"
            placeholderTextColor={COLORS.textSecondary} style={styles.searchInput}
            autoCapitalize="none" />
          {!!query && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search"
            onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>}
        </View>
        <Text style={styles.count}>{total} recorded events</Text>
        {loading ? <ActivityIndicator style={styles.loading} color={COLORS.primary} /> : (
          <FlatList
            data={logs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} />}
            ListEmptyComponent={<View style={styles.center}>
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={42} color={COLORS.textSecondary} />
              <Text style={styles.empty}>{error || 'No recorded events match your search.'}</Text>
            </View>}
            ListFooterComponent={hasMore ? (
              <TouchableOpacity accessibilityRole="button" style={styles.more}
                disabled={moreLoading} onPress={() => { void more(); }}>
                <Text style={styles.moreText}>{moreLoading ? 'Loading…' : 'Load more'}</Text>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name={item.success ? 'check-circle-outline' : 'alert-circle-outline'}
                    color={item.success ? COLORS.success : COLORS.error} size={20} />
                  <Text style={styles.action}>{nice(item.action)}</Text>
                </View>
                {item.details ? <Text style={styles.detail}>{item.details}</Text> : null}
                {item.entity ? <Text style={styles.detail}>Entity: {item.entity}
                  {item.entityId ? ` #${item.entityId}` : ''}</Text> : null}
                {item.email ? <Text style={styles.detail}>{item.email}</Text> : null}
                <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
            )}
          />
        )}
        {!!error && logs.length > 0 ? <Text style={styles.error}>{error}</Text> : null}
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    margin: SPACING.md, gap: SPACING.sm, paddingHorizontal: SPACING.md,
    borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.lg, minHeight: 48 },
  searchInput: { color: COLORS.text, fontSize: 16, flex: 1, minHeight: 46 },
  count: { color: COLORS.textSecondary, fontSize: 12, marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm },
  loading: { flex: 1 },
  list: { width: '100%', maxWidth: 860, alignSelf: 'center',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  card: { padding: SPACING.md, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1, marginBottom: SPACING.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  action: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '700' },
  detail: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 3 },
  timestamp: { color: COLORS.textSecondary, fontSize: 12, marginTop: 7 },
  more: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: COLORS.primary, fontWeight: '600' },
  center: { paddingVertical: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  empty: { fontSize: 14, lineHeight: 22, textAlign: 'center', color: COLORS.textSecondary },
  error: { color: COLORS.error, fontSize: 13, textAlign: 'center', padding: SPACING.md },
});
