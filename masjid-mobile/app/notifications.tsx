import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { ScreenHeader } from '../components/common';
import { notificationDestination } from '../services/notification-link';
import apiService from '../services/api-service';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setError(null);
    try {
      const data = await apiService.notifications.getAll();
      setNotifications(data);
    } catch {
      setNotifications([]);
      setError("Unable to load notifications. Please sign in and try again.");
    } finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id?: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      if (id) await apiService.notifications.markAsRead(id);
      else await apiService.notifications.markAllRead();
      setNotifications(prev => prev.map(n => !id || n.id === id ? { ...n, read: true } : n));
    } catch { setError('Unable to save read status. Please try again.'); }
    finally { setSaving(false); }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'prayer': return 'clock';
      case 'announcement': return 'bullhorn';
      case 'donation': return 'heart';
      case 'job': return 'briefcase';
      default: return 'bell';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'prayer': return COLORS.primary;
      case 'announcement': return COLORS.warning;
      case 'donation': return COLORS.secondary;
      case 'job': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.notificationUnread]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.read ? 'read' : 'unread'}`}
      disabled={saving}
      onPress={() => {
        void markAsRead(item.id);
        const destination = notificationDestination(item.link);
        if (destination) router.push(destination as Href);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
        <MaterialCommunityIcons 
          name={getIcon(item.type) as any} 
          size={22} 
          color={getIconColor(item.type)} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !item.read && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationDate}>{formatDate(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader 
        title="Notifications" 
        showBack 
        rightAction={unreadCount > 0 ? {
          icon: 'check-all',
          onPress: () => { void markAsRead(); }
        } : undefined}
      />

      {error && <View style={{ padding: SPACING.md }}><Text accessibilityRole="alert" style={styles.notificationBody}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={onRefresh} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.notificationTitle}>Try again</Text></TouchableOpacity></View>}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color={COLORS.textLight} />
            {loading && <ActivityIndicator accessibilityLabel="Loading notifications" />}
            <Text style={styles.emptyText}>{loading ? 'Loading…' : error ? 'Notifications unavailable' : 'No notifications yet'}</Text>
            <Text style={styles.emptySubtext}>{!loading && !error ? 'Your latest 100 notifications appear here.' : ''}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  notificationUnread: {
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
