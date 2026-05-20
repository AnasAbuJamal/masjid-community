import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { ScreenHeader } from '../components/common';
import apiService from '../services/api-service';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'prayer' | 'announcement' | 'donation' | 'job' | 'general';
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.notifications.getAll();
      setNotifications(data as Notification[]);
    } catch {
      setNotifications(getMockNotifications());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await apiService.notifications.markAsRead(id);
    } catch {}
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
      onPress={() => {
        markAsRead(item.id);
        if (item.type === 'announcement') {
          router.push(`/announcements/${item.id}`);
        }
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
          onPress: () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } : undefined}
      />

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
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>We'll notify you about important updates</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function getMockNotifications(): Notification[] {
  return [
    { id: '1', title: 'Fajr Prayer in 30 minutes', body: 'Time for Fajr prayer. May Allah accept your prayers.', type: 'prayer', read: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: '2', title: 'Ramadan Mubarak!', body: 'Wishing our entire community a blessed Ramadan.', type: 'announcement', read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: '3', title: 'New Job Posted', body: 'Part-time Arabic Teacher position available.', type: 'job', read: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: '4', title: 'Thank you for your donation!', body: 'Your generous donation has been received.', type: 'donation', read: true, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
  ];
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
