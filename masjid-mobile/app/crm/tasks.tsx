import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api-client';

type Category = 'general' | 'follow_up';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'pending' | 'in_progress' | 'completed';
type Tab = 'tasks' | 'followups' | 'approvals';
interface Task {
  id: string; title: string; description: string; assignedTo: string | null;
  dueDate: string | null; category: Category; priority: Priority;
  status: Status; createdAt: string;
}
interface ResponseData {
  tasks: Task[];
  total: number;
  page: number;
  hasMore: boolean;
  pending: { volunteer: number; jobs: number; rentals: number };
}
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const INITIAL = {
  title: '', description: '', assignedTo: '',
  dueDate: '', priority: 'medium' as Priority,
};

export default function TasksCrmScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pending, setPending] = useState<ResponseData['pending']>({ volunteer: 0, jobs: 0, rentals: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');

  const category = tab === 'followups' ? 'follow_up' : 'general';
  const fetchPage = async (number: number, append = false) => {
    const response = await api.instance.get<ResponseData>('/mobile/admin/crm/tasks', {
      params: { page: number, category: tab === 'approvals' ? undefined : category },
    });
    setTasks(old => append
      ? [...old, ...response.data.tasks.filter(t => !old.some(previous => previous.id === t.id))]
      : response.data.tasks);
    setPending(response.data.pending); setPage(response.data.page);
    setHasMore(response.data.hasMore); setError('');
  };
  useEffect(() => {
    if (role !== 'admin') { setLoading(false); return; }
    let active = true;
    setLoading(true);
    const read = async () => {
      try {
        const response = await api.instance.get<ResponseData>('/mobile/admin/crm/tasks', {
          params: { category: tab === 'approvals' ? undefined : category, page: 1 },
        });
        if (!active) return;
        setTasks(response.data.tasks); setPending(response.data.pending);
        setHasMore(response.data.hasMore); setPage(1); setError('');
      } catch {
        if (active) setError('Unable to load the workflow queue.');
      } finally { if (active) setLoading(false); }
    };
    void read();
    return () => { active = false; };
  }, [role, tab]);

  const refresh = async () => {
    setRefreshing(true);
    try { await fetchPage(1); }
    catch { setError('Unable to refresh workflows.'); }
    finally { setRefreshing(false); }
  };
  const more = async () => {
    if (!hasMore || moreLoading || loading) return;
    setMoreLoading(true);
    try { await fetchPage(page + 1, true); }
    catch { setError('Unable to load more workflows.'); }
    finally { setMoreLoading(false); }
  };
  const createTask = async () => {
    const dateInput = form.dueDate.trim();
    const when = dateInput ? new Date(`${dateInput}T12:00:00`) : null;
    if (!form.title.trim() || (dateInput && (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput) || !Number.isFinite(when?.getTime())))) {
      Alert.alert('Invalid details', 'Enter a task title and an optional due date as YYYY-MM-DD.');
      return;
    }
    setSaving(true);
    try {
      await api.instance.post('/mobile/admin/crm/tasks', {
        title: form.title.trim(), description: form.description.trim(),
        assignedTo: form.assignedTo.trim(),
        dueDate: when?.toISOString() || null,
        priority: form.priority, category,
      });
      setShowCreate(false); setForm(INITIAL);
      await fetchPage(1);
    } catch (failure: unknown) {
      const details = (failure as { response?: { data?: { error?: string } } })?.response?.data?.error;
      Alert.alert('Unable to create task', details || 'Could not save this workflow.');
    } finally { setSaving(false); }
  };
  const changeStatus = async (item: Task, status: Status) => {
    setSaving(true);
    try {
      await api.instance.patch(`/mobile/admin/crm/tasks/${encodeURIComponent(item.id)}`, { status });
      await fetchPage(1);
    } catch {
      Alert.alert('Unable to update', 'The task status could not be saved.');
    } finally { setSaving(false); }
  };
  const deleteTask = (item: Task) => {
    Alert.alert('Delete task?', `Permanently remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await api.instance.delete(`/mobile/admin/crm/tasks/${encodeURIComponent(item.id)}`);
          await fetchPage(1);
        } catch { Alert.alert('Unable to delete', 'Task could not be removed.'); }
        finally { setSaving(false); }
      } },
    ]);
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tasks & Workflows</Text>
          <Text style={styles.subtitle}>Saved assignments and actual review queues</Text>
        </View>
        {role === 'admin' && tab !== 'approvals' ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add task"
            onPress={() => setShowCreate(true)} style={styles.back}>
            <MaterialCommunityIcons name="plus" size={25} color={COLORS.primary} />
          </TouchableOpacity>
        ) : <View style={styles.back} />}
      </View>
      {role !== 'admin' ? <View style={styles.empty}><Text style={styles.muted}>Administrator access is required.</Text></View>
        : <>
          <View style={styles.tabs}>
            {([
              ['tasks', 'Tasks'], ['followups', 'Follow-ups'], ['approvals', 'Approvals'],
            ] as const).map(([key, label]) => (
              <TouchableOpacity accessibilityRole="tab" key={key}
                accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)}
                style={[styles.tab, tab === key && styles.activeTab]}>
                <Text style={[styles.tabText, tab === key && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : (
            <ScrollView contentContainerStyle={styles.content}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
              {error ? <View style={styles.empty}>
                <Text style={styles.muted}>{error}</Text>
                <TouchableOpacity onPress={refresh} accessibilityRole="button" style={styles.action}>
                  <Text style={styles.actionText}>Retry</Text>
                </TouchableOpacity>
              </View> : tab === 'approvals' ? <>
                {([
                  ['Volunteer applications', pending.volunteer, '/admin/volunteers'],
                  ['Job applications', pending.jobs, '/admin/jobs'],
                  ['Rental requests', pending.rentals, '/crm/facilities'],
                ] as const).map(([label, count, route]) => (
                  <TouchableOpacity accessibilityRole="button" key={route}
                    style={styles.card} onPress={() => router.push(route)}>
                    <View style={styles.row}>
                      <Text style={styles.itemTitle}>{label}</Text>
                      <Text style={styles.value}>{count}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={23} color={COLORS.primary} />
                    </View>
                    <Text style={styles.muted}>Open the corresponding management screen to review requests.</Text>
                  </TouchableOpacity>
                ))}
              </> : tasks.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={44} color={COLORS.textSecondary} />
                  <Text style={styles.muted}>No {tab === 'tasks' ? 'tasks' : 'follow-ups'} have been assigned yet.</Text>
                </View>
              ) : tasks.map(item => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.status}>{item.status.replaceAll('_', ' ')}</Text>
                  </View>
                  {item.description && <Text style={styles.muted}>{item.description}</Text>}
                  {item.assignedTo && <Text style={styles.muted}>Assigned to {item.assignedTo}</Text>}
                  {item.dueDate && <Text style={styles.muted}>Due {new Date(item.dueDate).toLocaleDateString()}</Text>}
                  <Text style={styles.priority}>Priority: {item.priority}</Text>
                  <View style={styles.actions}>
                    {item.status !== 'completed' && (
                      <TouchableOpacity style={styles.action} accessibilityRole="button" disabled={saving}
                        onPress={() => { void changeStatus(item, 'completed'); }}>
                        <Text style={styles.actionText}>Complete</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'pending' && (
                      <TouchableOpacity style={styles.action} accessibilityRole="button" disabled={saving}
                        onPress={() => { void changeStatus(item, 'in_progress'); }}>
                        <Text style={styles.actionText}>Start</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'completed' && (
                      <TouchableOpacity style={styles.action} accessibilityRole="button" disabled={saving}
                        onPress={() => { void changeStatus(item, 'pending'); }}>
                        <Text style={styles.actionText}>Reopen</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.action} accessibilityRole="button" disabled={saving}
                      onPress={() => deleteTask(item)}>
                      <Text style={[styles.actionText, { color: COLORS.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {tab !== 'approvals' && hasMore && !error && (
                <TouchableOpacity accessibilityRole="button" style={styles.more}
                  disabled={moreLoading} onPress={() => { void more(); }}>
                  <Text style={styles.actionText}>{moreLoading ? 'Loading…' : 'Load more'}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </>
      }

      <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Close task form"
              onPress={() => setShowCreate(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{tab === 'followups' ? 'New Follow-up' : 'New Task'}</Text>
            <View style={styles.back} />
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.form}>
              {([
                ['title', 'Task title'], ['assignedTo', 'Assigned to'],
                ['dueDate', 'Due date (YYYY-MM-DD)'],
              ] as const).map(([key, label]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput style={styles.input} value={form[key]}
                    onChangeText={value => setForm(v => ({ ...v, [key]: value }))}
                    placeholder={label} placeholderTextColor={COLORS.textSecondary} />
                </View>
              ))}
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, { minHeight: 120 }]} multiline
                textAlignVertical="top" value={form.description}
                onChangeText={value => setForm(v => ({ ...v, description: value }))}
                placeholder="Details and next steps" placeholderTextColor={COLORS.textSecondary} />
              <Text style={styles.label}>Priority</Text>
              <View style={styles.actions}>
                {PRIORITIES.map(priority => (
                  <TouchableOpacity key={priority} accessibilityRole="radio"
                    accessibilityState={{ checked: form.priority === priority }}
                    style={[styles.action, form.priority === priority && styles.selected]}
                    onPress={() => setForm(v => ({ ...v, priority }))}>
                    <Text style={styles.actionText}>{priority}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity accessibilityRole="button" disabled={saving}
                style={styles.submit} onPress={() => { void createTask(); }}>
                <Text style={styles.submitText}>{saving ? 'Saving…' : 'Create Task'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, padding: SPACING.sm,
    borderBottomWidth: 1, borderColor: COLORS.border },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  tabs: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.sm },
  tab: { flex: 1, minHeight: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  activeTab: { backgroundColor: COLORS.primaryFaded },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: COLORS.primary },
  loader: { flex: 1 },
  content: { maxWidth: 860, width: '100%', alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  empty: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  muted: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  card: { padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm, gap: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  itemTitle: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '700' },
  value: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  status: { fontSize: 12, color: COLORS.primary, fontWeight: '700', textTransform: 'capitalize' },
  priority: { color: COLORS.textSecondary, fontSize: 12, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  action: { minHeight: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center', paddingHorizontal: SPACING.md },
  actionText: { color: COLORS.primary, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  selected: { borderWidth: 1, borderColor: COLORS.primary },
  more: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  form: { width: '100%', maxWidth: 800, alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  field: { gap: 5 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  input: { minHeight: 48, padding: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 16 },
  submit: { backgroundColor: COLORS.primary, minHeight: 52,
    borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
