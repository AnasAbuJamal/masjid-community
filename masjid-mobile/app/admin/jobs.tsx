import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type Status = 'pending_review' | 'active' | 'paused' | 'expired' | 'closed' | 'rejected';
type Employment = 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
interface JobEntry {
  id: string; title: string; company: string; description: string;
  location: string; status: Status; employmentType: Employment;
  applicationCount: number; postedAt: string;
}
interface JobsPage { jobs: JobEntry[]; page: number; total: number; hasMore: boolean }
const FILTERS: { value: string; title: string }[] = [
  { value: '', title: 'All' }, { value: 'active', title: 'Active' },
  { value: 'paused', title: 'Paused' }, { value: 'closed', title: 'Closed' },
  { value: 'pending_review', title: 'Pending' },
];
const INITIAL = {
  title: '', company: '', contactName: '', contactEmail: '',
  description: '', location: '', category: '', employmentType: 'part_time' as Employment,
};
const LABELS: { value: Employment; title: string }[] = [
  { value: 'full_time', title: 'Full-time' }, { value: 'part_time', title: 'Part-time' },
  { value: 'contract', title: 'Contract' }, { value: 'temporary', title: 'Temporary' },
  { value: 'internship', title: 'Internship' },
];

export default function JobsAdminScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(INITIAL);

  const fetchPage = async (number: number, append = false) => {
    const result = await api.instance.get<JobsPage>('/mobile/admin/jobs', {
      params: { page: number, status: filter || undefined, q: search.trim() || undefined },
    });
    setJobs(old => append
      ? [...old, ...result.data.jobs.filter(j => !old.some(previous => previous.id === j.id))]
      : result.data.jobs);
    setPage(result.data.page); setTotal(result.data.total);
    setHasMore(result.data.hasMore); setError('');
  };
  useEffect(() => {
    if (role !== 'admin') { setLoading(false); return; }
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.instance.get<JobsPage>('/mobile/admin/jobs', {
          params: { page: 1, status: filter || undefined, q: search.trim() || undefined },
        });
        if (active) {
          setJobs(result.data.jobs); setTotal(result.data.total);
          setHasMore(result.data.hasMore); setPage(1); setError('');
        }
      } catch {
        if (active) setError('Job postings could not be loaded.');
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [role, filter, search]);

  const refresh = async () => {
    setRefreshing(true);
    try { await fetchPage(1); }
    catch { setError('Unable to refresh job postings.'); }
    finally { setRefreshing(false); }
  };
  const more = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try { await fetchPage(page + 1, true); }
    catch { setError('Unable to load more postings.'); }
    finally { setLoadingMore(false); }
  };
  const changeStatus = (job: JobEntry, status: 'active' | 'paused' | 'closed') => {
    Alert.alert('Update job?', `Set "${job.title}" to ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        setSaving(true);
        try {
          await api.instance.patch(`/mobile/admin/jobs/${encodeURIComponent(job.id)}`, { status });
          await fetchPage(1);
        } catch {
          Alert.alert('Unable to update', 'The posting could not be changed. Please try again.');
        } finally { setSaving(false); }
      } },
    ]);
  };
  const create = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const response = await api.instance.post('/mobile/admin/jobs', form);
      if (response.status !== 201) throw new Error('Unexpected response');
      setEditing(false); setForm(INITIAL);
      await fetchPage(1);
      Alert.alert('Job published', 'The posting is now available in the community jobs list.');
    } catch (failure: unknown) {
      const reason = (failure as { response?: { data?: { error?: string } } })?.response?.data?.error;
      Alert.alert('Unable to publish', reason || 'Complete all required job fields and try again.');
    } finally { setSaving(false); }
  };
  const update = (key: keyof typeof INITIAL, value: string) =>
    setForm(previous => ({ ...previous, [key]: value }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Management</Text>
        {role === 'admin' ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Publish job"
          onPress={() => setEditing(true)} style={styles.back}>
          <MaterialCommunityIcons name="plus" size={26} color={COLORS.primary} />
        </TouchableOpacity> : <View style={styles.back} />}
      </View>
      {role !== 'admin' ? <View style={styles.center}><Text style={styles.muted}>Administrator access is required.</Text></View> : <>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.searchInput} accessibilityLabel="Search jobs" value={search}
            onChangeText={setSearch} placeholder="Search job or company"
            placeholderTextColor={COLORS.textSecondary} />
        </View>
        <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
          {FILTERS.map(item => (
            <TouchableOpacity key={item.value} accessibilityRole="tab"
              accessibilityState={{ selected: filter === item.value }}
              onPress={() => setFilter(item.value)}
              style={[styles.filter, filter === item.value && styles.activeFilter]}>
              <Text style={[styles.filterText, filter === item.value && styles.activeFilterText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.count}>{total} postings</Text>
        {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : (
          <FlatList data={jobs} keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} />}
            ListEmptyComponent={<View style={styles.center}>
              <Text style={styles.muted}>{error || 'No postings match this search.'}</Text>
            </View>}
            ListFooterComponent={hasMore ? (
              <TouchableOpacity style={styles.more} disabled={loadingMore}
                accessibilityRole="button" onPress={() => { void more(); }}>
                <Text style={styles.actionText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobName}>{item.title}</Text>
                    <Text style={styles.muted}>{item.company} · {item.location}</Text>
                  </View>
                  <Text style={styles.status}>{item.status.replaceAll('_', ' ')}</Text>
                </View>
                <Text style={styles.muted}>{item.applicationCount} applications · Published {new Date(item.postedAt).toLocaleDateString()}</Text>
                <View style={styles.actions}>
                  {item.status !== 'active' && <TouchableOpacity accessibilityRole="button"
                    disabled={saving} style={styles.action} onPress={() => changeStatus(item, 'active')}>
                    <Text style={styles.actionText}>Activate</Text>
                  </TouchableOpacity>}
                  {item.status === 'active' && <TouchableOpacity accessibilityRole="button"
                    disabled={saving} style={styles.action} onPress={() => changeStatus(item, 'paused')}>
                    <Text style={styles.actionText}>Pause</Text>
                  </TouchableOpacity>}
                  {item.status !== 'closed' && <TouchableOpacity accessibilityRole="button"
                    disabled={saving} style={styles.action} onPress={() => changeStatus(item, 'closed')}>
                    <Text style={[styles.actionText, { color: COLORS.error }]}>Close</Text>
                  </TouchableOpacity>}
                </View>
              </View>
            )}
          />
        )}
        {!!error && jobs.length > 0 && <Text style={styles.error}>{error}</Text>}
      </>}
      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setEditing(false)}
              style={styles.back} accessibilityLabel="Close new job form">
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Publish Job</Text>
            <View style={styles.back} />
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.form}>
              {([
                ['title', 'Job title'], ['company', 'Organization'],
                ['contactName', 'Contact name'], ['contactEmail', 'Contact email'],
                ['location', 'Location'], ['category', 'Category'],
              ] as const).map(([key, title]) => (
                <View style={styles.field} key={key}>
                  <Text style={styles.label}>{title}</Text>
                  <TextInput value={form[key]} onChangeText={value => update(key, value)}
                    style={styles.input} placeholder={title} placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize={key === 'contactEmail' ? 'none' : 'sentences'}
                    keyboardType={key === 'contactEmail' ? 'email-address' : 'default'} />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput multiline value={form.description} onChangeText={value => update('description', value)}
                  textAlignVertical="top" style={[styles.input, { minHeight: 120 }]}
                  placeholder="Describe the role" placeholderTextColor={COLORS.textSecondary} />
              </View>
              <Text style={styles.label}>Employment type</Text>
              <View style={styles.actions}>
                {LABELS.map(item => (
                  <TouchableOpacity accessibilityRole="radio"
                    accessibilityState={{ checked: form.employmentType === item.value }}
                    key={item.value} onPress={() => update('employmentType', item.value)}
                    style={[styles.action, form.employmentType === item.value && styles.activeFilter]}>
                    <Text style={styles.actionText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity accessibilityRole="button" style={styles.submit}
                disabled={saving} onPress={() => { void create(); }}>
                <Text style={styles.submitText}>{saving ? 'Publishing…' : 'Publish Job'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', minHeight: 48, alignItems: 'center',
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    margin: SPACING.md, backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md, gap: SPACING.sm },
  searchInput: { fontSize: 16, color: COLORS.text, flex: 1, minHeight: 46 },
  filters: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  filter: { minHeight: 44, paddingHorizontal: SPACING.md, alignItems: 'center',
    justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: COLORS.surface },
  activeFilter: { backgroundColor: COLORS.primaryFaded },
  filterText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: COLORS.primary },
  count: { color: COLORS.textSecondary, fontSize: 12, marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm },
  loader: { flex: 1 },
  list: { width: '100%', maxWidth: 860, alignSelf: 'center',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  jobName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  muted: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  status: { fontSize: 12, fontWeight: '700', color: COLORS.primary, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  action: { minHeight: 44, justifyContent: 'center',
    paddingHorizontal: SPACING.md, backgroundColor: COLORS.primaryFaded, borderRadius: RADIUS.md },
  actionText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  more: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', padding: SPACING.xxl },
  error: { color: COLORS.error, textAlign: 'center', margin: SPACING.md },
  form: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl, gap: SPACING.md },
  field: { gap: 5 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  input: { minHeight: 48, backgroundColor: COLORS.surface, color: COLORS.text,
    borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: 16 },
  submit: { minHeight: 52, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
