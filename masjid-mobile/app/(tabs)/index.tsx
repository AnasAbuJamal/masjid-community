import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { prayerService, announcementService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function getNextPrayer(prayers: Record<string, string>): string {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_NAMES) {
    if (name === 'Sunrise') continue;
    const time = prayers[name.toLowerCase()];
    if (!time) continue;
    const [h, m] = time.split(':').map(Number);
    if (h * 60 + m > nowMins) return name;
  }
  return 'Fajr';
}

const QUICK_ACTIONS = [
  { icon: 'heart', label: 'Donate', color: '#e53935', route: '/donate' },
  { icon: 'briefcase-outline', label: 'Jobs', color: COLORS.primary, route: '/jobs' },
  { icon: 'lightbulb-outline', label: 'Proposals', color: '#1976d2', route: '/proposals' },
  { icon: 'account-hard-hat', label: 'Workers', color: COLORS.accent, route: '/workers' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [prayers, setPrayers] = useState<Record<string, string> | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [p, a] = await Promise.all([
      prayerService.getToday(),
      announcementService.getAll(),
    ]);
    setPrayers(p);
    setAnnouncements(a);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const p = prayers ?? {
    fajr: '05:45', sunrise: '07:10', dhuhr: '12:30',
    asr: '15:45', maghrib: '18:00', isha: '19:30',
  };

  const nextPrayer = getNextPrayer(p);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>
              السلام عليكم،{' '}
              {user?.firstName ?? 'Brother/Sister'}
            </Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push('/announcements/1')}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color={COLORS.primary}
            />
            {announcements.length > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {/* Prayer times card */}
        <View style={styles.prayerCard}>
          <View style={styles.prayerHeader}>
            <Text style={styles.prayerCardTitle}>Today's Prayer Times</Text>
            <TouchableOpacity onPress={() => router.push('/prayers')}>
              <Text style={styles.viewAll}>View all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.prayerGrid}>
            {PRAYER_NAMES.map((name) => {
              const isNext = name === nextPrayer;
              return (
                <View
                  key={name}
                  style={[styles.prayerItem, isNext && styles.prayerItemActive]}
                >
                  {isNext && (
                    <Text style={styles.nextLabel}>NEXT</Text>
                  )}
                  <Text
                    style={[styles.prayerName, isNext && styles.prayerNameActive]}
                  >
                    {name}
                  </Text>
                  <Text
                    style={[styles.prayerTime, isNext && styles.prayerTimeActive]}
                  >
                    {p[name.toLowerCase()]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Announcements */}
        {announcements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Announcements</Text>
            {announcements.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/announcements/${item.id}`)}
                activeOpacity={0.7}
              >
                <Card style={styles.announcementCard}>
                  <View style={styles.announcementInner}>
                    <View
                      style={[
                        styles.announcementDot,
                        {
                          backgroundColor:
                            item.type === 'ramadan'
                              ? COLORS.accent
                              : COLORS.primary,
                        },
                      ]}
                    />
                    <View style={styles.announcementText}>
                      <Text style={styles.announcementTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text
                        style={styles.announcementMessage}
                        numberOfLines={2}
                      >
                        {item.message}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionButton}
              onPress={() => router.push(action.route)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: action.color + '15' },
                ]}
              >
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={26}
                  color={action.color}
                />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  dateText: { fontSize: 13, color: COLORS.textSecondary },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },

  prayerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  prayerCardTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  viewAll: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  prayerItem: {
    width: '30%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    minHeight: 66,
    justifyContent: 'center',
  },
  prayerItemActive: {
    backgroundColor: COLORS.accent,
  },
  nextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  prayerName: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginBottom: 4,
  },
  prayerNameActive: { color: COLORS.primary, fontWeight: '600' },
  prayerTime: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  prayerTimeActive: { color: COLORS.primary },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm + 4,
    marginTop: SPACING.xs,
  },

  announcementCard: { padding: SPACING.sm + 4, marginBottom: SPACING.sm },
  announcementInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  announcementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  announcementText: { flex: 1 },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  announcementMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm + 4,
  },
  actionButton: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs + 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});
