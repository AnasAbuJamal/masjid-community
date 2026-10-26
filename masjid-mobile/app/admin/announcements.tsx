import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type AnnouncementType = 'general' | 'urgent' | 'event' | 'ramadan' | 'fundraiser';
interface Announcement {
  id: string; title: string; message: string; type: AnnouncementType;
  priority: number; isActive: boolean; startsAt: string; expiresAt: string | null;
  createdAt: string;
}
const TYPES: AnnouncementType[] = ['general', 'urgent', 'event', 'ramadan', 'fundraiser'];
const PRIORITIES = [
  { label: 'Normal', priority: 0 }, { label: 'Important', priority: 1 },
  { label: 'Urgent', priority: 2 },
];

export default function AnnouncementsAdminScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');
  const [priority, setPriority] = useState(0);
  const [schedule, setSchedule] = useState(false);
  const [startText, setStartText] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ announcements: Announcement[] }>(
        '/mobile/admin/announcements'
      );
      setAnnouncements(response.data.announcements);
      setError('');
    } catch {
      setError('Could not retrieve announcements. Check your connection.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => {
    if (role === 'admin') void load();
    else setLoading(false);
  }, [role]);
  const refresh = () => { setRefreshing(true); void load(); };

  const create = async () => {
    if (creating || !title.trim() || !message.trim()) return;
    let startsAt: string | undefined;
    if (schedule) {
      const normalized = startText.trim().replace(' ', 'T');
      const when = new Date(normalized);
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized) ||
          !Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) {
        Alert.alert('Invalid scheduled date', 'Use YYYY-MM-DD HH:mm in your local timezone, later than now.');
        return;
      }
      startsAt = when.toISOString();
    }
    setCreating(true);
    try {
      const response = await api.instance.post<{ status: 'scheduled' | 'published' }>(
        '/mobile/admin/announcements',
        { title: title.trim(), message: message.trim(), type, priority, startsAt }
      );
      setTitle(''); setMessage(''); setStartText(''); setSchedule(false);
      setType('general'); setPriority(0);
      await load();
      Alert.alert('Announcement saved',
        response.data.status === 'scheduled'
          ? 'The announcement will become visible at the scheduled time.'
          : 'The announcement is now available in the community feed.');
    } catch (failure: unknown) {
      const detail = (failure as { response?: { data?: { error?: string } } })?.response?.data?.error;
      Alert.alert('Unable to publish', detail || 'Could not save the announcement. Try again.');
    } finally { setCreating(false); }
  };

  const toggle = (item: Announcement) => {
    const label = item.isActive ? 'Hide announcement?' : 'Show announcement?';
    Alert.alert(label, `Change visibility of "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        setBusy(item.id);
        try {
          await api.instance.patch(
            `/mobile/admin/announcements/${encodeURIComponent(item.id)}`,
            { isActive: !item.isActive }
          );
          await load();
        } catch {
          Alert.alert('Unable to update', 'Could not change announcement visibility.');
        } finally { setBusy(null); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.heading}>Announcements</Text>
        <View style={styles.back} />
      </View>
      {role !== 'admin' ? <View style={styles.empty}><Text style={styles.muted}>Administrator access is required.</Text></View>
        : <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <Text style={styles.sectionTitle}>New Announcement</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle}
              maxLength={120} placeholder="Announcement title"
              placeholderTextColor={COLORS.textSecondary} accessibilityLabel="Announcement title" />
            <Text style={styles.label}>Message</Text>
            <TextInput style={[styles.input, styles.messageInput]} value={message}
              onChangeText={setMessage} maxLength={4000} multiline
              textAlignVertical="top" placeholder="Write your message"
              placeholderTextColor={COLORS.textSecondary} accessibilityLabel="Announcement message" />

            <Text style={styles.label}>Category</Text>
            <View style={styles.choices}>
              {TYPES.map(kind => (
                <TouchableOpacity key={kind} accessibilityRole="radio"
                  accessibilityState={{ checked: type === kind }}
                  style={[styles.choice, type === kind && styles.choiceSelected]}
                  onPress={() => setType(kind)}>
                  <Text style={[styles.choiceText, type === kind && styles.choiceTextSelected]}>
                    {kind.charAt(0).toUpperCase() + kind.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.choices}>
              {PRIORITIES.map(item => (
                <TouchableOpacity key={item.priority} accessibilityRole="radio"
                  accessibilityState={{ checked: priority === item.priority }}
                  style={[styles.choice, priority === item.priority && styles.choiceSelected]}
                  onPress={() => setPriority(item.priority)}>
                  <Text style={[styles.choiceText, priority === item.priority && styles.choiceTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.schedule} accessibilityRole="checkbox"
              accessibilityState={{ checked: schedule }} onPress={() => setSchedule(!schedule)}>
              <MaterialCommunityIcons
                name={schedule ? 'checkbox-marked' : 'checkbox-blank-outline'}
                color={COLORS.primary} size={24} />
              <Text style={styles.scheduleLabel}>Schedule for later</Text>
            </TouchableOpacity>
            {schedule && <>
              <Text style={styles.label}>Date and time (local)</Text>
              <TextInput accessibilityLabel="Scheduled date and time" value={startText}
                onChangeText={setStartText} autoCapitalize="none"
                placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={COLORS.textSecondary}
                style={styles.input} />
              <Text style={styles.helper}>Example: 2026-11-15 17:00. Times use your device timezone.</Text>
            </>}
            <TouchableOpacity accessibilityRole="button" style={[styles.submit,
              (!title.trim() || !message.trim() || creating) && styles.disabled]}
              disabled={!title.trim() || !message.trim() || creating} onPress={() => { void create(); }}>
              <MaterialCommunityIcons name="send-outline" size={19} color={COLORS.white} />
              <Text style={styles.submitText}>
                {creating ? 'Saving…' : schedule ? 'Schedule Announcement' : 'Publish Announcement'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent Announcements</Text>
          {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : error ? (
            <View style={styles.empty}>
              <Text style={styles.muted}>{error}</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retry}
                onPress={refresh}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
            </View>
          ) : announcements.length === 0 ? (
            <Text style={styles.emptyText}>No announcements have been created yet.</Text>
          ) : announcements.map(item => {
            const future = new Date(item.startsAt).getTime() > Date.now();
            const displayStatus = !item.isActive ? 'Hidden' : future ? 'Scheduled' : 'Published';
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.status}>{displayStatus}</Text>
                </View>
                <Text style={styles.muted}>{item.type} · Priority {item.priority}</Text>
                <Text style={styles.itemMessage} numberOfLines={4}>{item.message}</Text>
                <Text style={styles.muted}>Starts: {new Date(item.startsAt).toLocaleString()}</Text>
                <TouchableOpacity accessibilityRole="button" disabled={busy !== null}
                  style={styles.action} onPress={() => toggle(item)}>
                  <Text style={styles.actionText}>{busy === item.id ? 'Saving…'
                    : item.isActive ? 'Hide announcement' : 'Make active'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <Text style={styles.helper}>Scheduled content is not visible to community members until its start time.</Text>
        </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderColor: COLORS.border,
    padding: SPACING.sm, backgroundColor: COLORS.surface },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  content: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl },
  sectionTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700',
    marginTop: SPACING.md, marginBottom: SPACING.md },
  card: { padding: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderColor: COLORS.border,
    borderWidth: 1, gap: SPACING.sm, marginBottom: SPACING.md },
  label: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginTop: 4 },
  input: { minHeight: 48, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.text,
    fontSize: 16 },
  messageInput: { minHeight: 130 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  choice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border },
  choiceSelected: { backgroundColor: COLORS.primaryFaded, borderColor: COLORS.primary },
  choiceText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  choiceTextSelected: { color: COLORS.primary },
  schedule: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  scheduleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  helper: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19 },
  submit: { flexDirection: 'row', gap: SPACING.sm, minHeight: 52,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  disabled: { opacity: 0.5 },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  itemTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', flex: 1 },
  status: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  muted: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 21 },
  itemMessage: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
  action: { minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primaryFaded, borderRadius: RADIUS.md, justifyContent: 'center' },
  actionText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.xl },
  loader: { marginVertical: SPACING.xl },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '700' },
});
