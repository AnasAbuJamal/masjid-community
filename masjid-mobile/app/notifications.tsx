import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api-client';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

interface Notification {
  id: string; title: string; message: string; type: string;
  link: string | null; isRead: boolean; createdAt: string;
}
interface Page {
  notifications: Notification[]; total: number; unreadCount: number;
  page: number; hasMore: boolean;
}
const LINK_ROOTS = [
  '/events/', '/jobs/', '/school/', '/donations/', '/proposals/',
  '/announcements/', '/rentals/', '/(tabs)/',
];
const safeLink = (link: string) => link.startsWith('/') &&
  !link.startsWith('//') && !link.includes('..') &&
  LINK_ROOTS.some(root => link.startsWith(root));

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = async (number: number, append = false) => {
    const result = await api.instance.get<Page>('/notifications', { params: { page: number } });
    setNotifications(old => append
      ? [...old, ...result.data.notifications.filter(n => !old.some(existing => existing.id === n.id))]
      : result.data.notifications);
    setUnread(result.data.unreadCount);
    setPage(result.data.page);
    setHasMore(result.data.hasMore);
    setError('');
  };

  useEffect(() => {
    void fetchPage(1).catch(() => {
      setError('Notifications are unavailable. Check your connection or sign in.');
    }).finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try { await fetchPage(1); }
    catch { setError('Unable to refresh notifications.'); }
    finally { setRefreshing(false); }
  };

  const more = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try { await fetchPage(page + 1, true); }
    catch { setError('Unable to load the next page.'); }
    finally { setLoadingMore(false); }
  };

  const markRead = async (item: Notification) => {
    if (busy) return;
    if (!item.isRead) {
      setBusy(true);
      try {
        await api.instance.patch(`/notifications/${encodeURIComponent(item.id)}/read`);
        setNotifications(old => old.map(n => n.id === item.id ? { ...n, isRead: true } : n));
        setUnread(old => Math.max(0, old - 1));
      } catch {
        Alert.alert('Unable to update', 'This notification could not be marked as read.');
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    if (item.link && safeLink(item.link)) router.push(item.link as any);
  };

  const markAll = async () => {
    if (busy || !unread) return;
    setBusy(true);
    try {
      await api.instance.post('/notifications', { markAllRead: true });
      setNotifications(previous => previous.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      Alert.alert('Unable to update', 'Notifications could not be marked as read.');
    } finally { setBusy(false); }
  };

  const iconFor = (type: string) => {
    switch (type) {
      case 'donation': return 'heart-outline';
      case 'job': return 'briefcase-outline';
      case 'attendance': return 'calendar-check-outline';
      case 'assignment': return 'school-outline';
      case 'warning': return 'alert-outline';
      default: return 'bell-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mark all as read"
          disabled={!unread || busy} style={styles.back} onPress={() => { void markAll(); }}>
          <MaterialCommunityIcons name="check-all" size={24}
            color={unread ? COLORS.primary : COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" /> : (
        <FlatList data={notifications} keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} />}
          ListHeaderComponent={<Text style={styles.count}>{unread} unread notifications</Text>}
          ListEmptyComponent={<View style={styles.empty}>
            <MaterialCommunityIcons name="bell-off-outline" size={44} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>{error || 'No notifications to display.'}</Text>
          </View>}
          ListFooterComponent={hasMore ? (
            <TouchableOpacity accessibilityRole="button" style={styles.more}
              disabled={loadingMore} onPress={() => { void more(); }}>
              <Text style={styles.moreText}>{loadingMore ? 'Loading…' : 'Load more notifications'}</Text>
            </TouchableOpacity>
          ) : null}
          renderItem={({ item }) => (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${item.isRead ? 'Read' : 'Unread'} notification: ${item.title}`}
              style={[styles.card, !item.isRead && styles.unread]} disabled={busy}
              onPress={() => { void markRead(item); }}>
              <View style={styles.icon}>
                <MaterialCommunityIcons name={iconFor(item.type)} size={21} color={COLORS.primary} />
              </View>
              <View style={styles.details}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.message}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </TouchableOpacity>
          )}
        />
      )}
      {!!error && notifications.length > 0 ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  loader: { flex: 1 },
  content: { width: '100%', maxWidth: 850, alignSelf: 'center', padding: SPACING.md,
    paddingBottom: SPACING.xxl, flexGrow: 1 },
  count: { color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.md },
  card: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start',
    padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  unread: { borderLeftColor: COLORS.primary, borderLeftWidth: 3 },
  icon: { width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaded, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, gap: 5 },
  title: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  body: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  date: { color: COLORS.textSecondary, fontSize: 12 },
  dot: { width: 8, height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  more: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  empty: { paddingVertical: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  error: { color: COLORS.error, fontSize: 13, textAlign: 'center', padding: SPACING.md },
});
