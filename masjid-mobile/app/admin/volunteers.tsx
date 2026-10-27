import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type Status = 'pending' | 'approved' | 'rejected';
interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  skills: string | null;
  opportunity: string;
  opportunityId: string;
  status: Status;
  appliedDate: string;
  eventDate: string;
  capacity: number;
  approvedCount: number;
}
interface Page {
  applications: Application[];
  page: number;
  total: number;
  hasMore: boolean;
}
const STATUS: ('all' | Status)[] = ['all', 'pending', 'approved', 'rejected'];

export default function VolunteerAdministrationScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [applications, setApplications] = useState<Application[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = async (number: number, append = false) => {
    const response = await api.instance.get<Page>('/mobile/admin/volunteer-applications', {
      params: { page: number, status: status === 'all' ? undefined : status,
        q: query.trim() || undefined },
    });
    setApplications(previous => append
      ? [...previous, ...response.data.applications.filter(a => !previous.some(old => old.id === a.id))]
      : response.data.applications);
    setPage(response.data.page);
    setHasMore(response.data.hasMore);
    setTotal(response.data.total);
    setError('');
  };

  useEffect(() => {
    if (role !== 'admin') { setLoading(false); return; }
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await api.instance.get<Page>('/mobile/admin/volunteer-applications', {
          params: { page: 1, status: status === 'all' ? undefined : status,
            q: query.trim() || undefined },
        });
        if (active) {
          setApplications(response.data.applications);
          setPage(1); setTotal(response.data.total);
          setHasMore(response.data.hasMore); setError('');
        }
      } catch {
        if (active) setError('Could not load volunteer applications.');
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [role, status, query]);

  const refresh = async () => {
    setRefreshing(true);
    try { await fetchPage(1); }
    catch { setError('Could not refresh applications.'); }
    finally { setRefreshing(false); }
  };
  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try { await fetchPage(page + 1, true); }
    catch { setError('Unable to load more applications.'); }
    finally { setLoadingMore(false); }
  };

  const review = (application: Application, newStatus: 'approved' | 'rejected') => {
    Alert.alert(
      newStatus === 'approved' ? 'Approve volunteer?' : 'Reject application?',
      `Change ${application.applicantName}'s application to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: newStatus === 'approved' ? 'Approve' : 'Reject',
          style: newStatus === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setSaving(application.id);
            try {
              await api.instance.patch(`/mobile/admin/volunteer-applications/${encodeURIComponent(application.id)}`, {
                status: newStatus,
              });
              await fetchPage(1);
            } catch (error: unknown) {
              const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
              Alert.alert('Review unsuccessful', message || 'Could not change the application. Try again.');
            } finally { setSaving(null); }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Volunteer Applications</Text>
        <View style={styles.back} />
      </View>
      {role !== 'admin' ? <View style={styles.center}>
        <Text style={styles.muted}>Administrator access is required.</Text>
      </View> : <>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" color={COLORS.textSecondary} size={19} />
          <TextInput style={styles.searchText} value={query} onChangeText={setQuery}
            accessibilityLabel="Search volunteer applications"
            placeholder="Search volunteer or opportunity"
            placeholderTextColor={COLORS.textSecondary} />
        </View>
        <View style={styles.filters}>
          {STATUS.map(item => (
            <TouchableOpacity key={item} accessibilityRole="tab"
              accessibilityState={{ selected: status === item }}
              style={[styles.filter, status === item && styles.activeFilter]}
              onPress={() => setStatus(item)}>
              <Text style={[styles.filterText, status === item && styles.activeFilterText]}>
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.count}>{total} applications</Text>
        {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : (
          <FlatList data={applications} keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} />}
            ListEmptyComponent={<View style={styles.center}>
              <Text style={styles.muted}>{error || 'No applications match these filters.'}</Text>
            </View>}
            ListFooterComponent={hasMore ? (
              <TouchableOpacity accessibilityRole="button" disabled={loadingMore}
                onPress={() => { void loadMore(); }} style={styles.more}>
                <Text style={styles.actionText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.applicantName}</Text>
                    <Text style={styles.muted}>{item.applicantEmail}</Text>
                  </View>
                  <Text style={[styles.status, {
                    color: item.status === 'approved' ? COLORS.success
                      : item.status === 'rejected' ? COLORS.error : COLORS.warning,
                  }]}>{item.status}</Text>
                </View>
                <Text style={styles.opp}>{item.opportunity}</Text>
                <Text style={styles.muted}>{new Date(item.eventDate).toLocaleDateString()} · {item.approvedCount}/{item.capacity} spots filled</Text>
                {item.skills ? <Text style={styles.muted}>Skills: {item.skills}</Text> : null}
                <Text style={styles.timestamp}>Applied {new Date(item.appliedDate).toLocaleDateString()}</Text>
                <View style={styles.actions}>
                  {item.status !== 'approved' && (
                    <TouchableOpacity style={styles.action} disabled={saving !== null}
                      accessibilityRole="button" onPress={() => review(item, 'approved')}>
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                  {item.status !== 'rejected' && (
                    <TouchableOpacity style={styles.action} disabled={saving !== null}
                      accessibilityRole="button" onPress={() => review(item, 'rejected')}>
                      <Text style={[styles.actionText, { color: COLORS.error }]}>Reject</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        )}
        {!!error && applications.length > 0 && <Text style={styles.error}>{error}</Text>}
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, backgroundColor: COLORS.surface, borderColor: COLORS.border, borderBottomWidth: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  search: { minHeight: 48, margin: SPACING.md, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, borderColor: COLORS.border, borderWidth: 1,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md },
  searchText: { flex: 1, minHeight: 46, fontSize: 16, color: COLORS.text },
  filters: { flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: SPACING.md },
  filter: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  activeFilter: { backgroundColor: COLORS.primaryFaded },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  activeFilterText: { color: COLORS.primary },
  count: { color: COLORS.textSecondary, fontSize: 12, margin: SPACING.md },
  loader: { flex: 1 },
  list: { maxWidth: 850, width: '100%', alignSelf: 'center', paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl },
  card: { padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, gap: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  muted: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  status: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  opp: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  timestamp: { fontSize: 12, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  action: { minHeight: 44, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    justifyContent: 'center', backgroundColor: COLORS.primaryFaded },
  actionText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  more: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', padding: SPACING.xxl },
  error: { color: COLORS.error, textAlign: 'center', marginBottom: SPACING.md },
});
