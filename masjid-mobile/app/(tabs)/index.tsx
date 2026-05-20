import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, ScreenWrapper, FloatingIcon, TAB_BAR_HEIGHT } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { getHijriDate, getIslamicOccasion } from '../../utils/hijri';

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

function getTimeUntilNextPrayer(prayers: Record<string, string>): { hours: number; minutes: number; seconds: number; total: number } {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  let nextPrayerName = 'Fajr';
  let nextPrayerMins = 0;
  
  for (const name of PRAYER_NAMES) {
    if (name === 'Sunrise') continue;
    const time = prayers[name.toLowerCase()];
    if (!time) continue;
    const [h, m] = time.split(':').map(Number);
    const prayerMins = h * 60 + m;
    if (prayerMins > nowMins) {
      nextPrayerName = name;
      nextPrayerMins = prayerMins;
      break;
    }
  }
  
  if (nextPrayerMins <= nowMins) {
    nextPrayerName = 'Fajr';
    const fajrTime = prayers.fajr;
    if (fajrTime) {
      const [h, m] = fajrTime.split(':').map(Number);
      nextPrayerMins = h * 60 + m;
    } else {
      nextPrayerMins = 5 * 60 + 45;
    }
    const tomorrowMins = 24 * 60;
    nextPrayerMins += tomorrowMins;
  }
  
  const currentTotalSecs = nowSecs;
  const nextTotalSecs = nextPrayerMins * 60;
  let diffSecs = nextTotalSecs - currentTotalSecs;
  
  if (nextPrayerName === 'Fajr' && nextPrayerMins > 24 * 60) {
    diffSecs = nextTotalSecs - currentTotalSecs;
  }
  
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;
  
  return { hours, minutes, seconds, total: diffSecs };
}

const QUICK_ACTIONS = [
  { icon: 'heart', label: 'Donate', color: '#FF6B6B', route: '/donate' as const, iconComponent: <MaterialCommunityIcons name="heart" size={26} color="#FF6B6B" /> },
  { icon: 'newspaper-variant-outline', label: 'News', color: COLORS.accent, route: '/blog' as const, iconComponent: <MaterialCommunityIcons name="newspaper-variant-outline" size={26} color={COLORS.accent} /> },
  { icon: 'calendar-star', label: 'Events', color: COLORS.secondary, route: '/events' as const, iconComponent: <MaterialCommunityIcons name="calendar-star" size={26} color={COLORS.secondary} /> },
  { icon: 'hammer-wrench', label: 'Projects', color: '#FFB74D', route: '/construction' as const, iconComponent: <MaterialCommunityIcons name="hammer-wrench" size={26} color="#FFB74D" /> },
  { icon: 'chart-bar', label: 'Finances', color: COLORS.success, route: '/finances' as const, iconComponent: <MaterialCommunityIcons name="chart-bar" size={26} color={COLORS.success} /> },
  { icon: 'compass', label: 'Qibla', color: COLORS.primary, route: '/prayers/qibla' as const, iconComponent: <MaterialCommunityIcons name="compass" size={26} color={COLORS.primary} /> },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [prayers, setPrayers] = useState<Record<string, string> | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hijriDate, setHijriDate] = useState(getHijriDate());
  const [occasion, setOccasion] = useState<string | null>(getIslamicOccasion());
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  const prayerItemWidth = (width - SPACING.md * 2 - SPACING.sm * 2) / 3;
  const actionCardWidth = (width - SPACING.md * 2 - SPACING.sm) / 2;

  useEffect(() => {
    const interval = setInterval(() => {
      setHijriDate(getHijriDate());
      setOccasion(getIslamicOccasion());
      if (prayers) {
        setCountdown(getTimeUntilNextPrayer(prayers));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [prayers]);

  const loadData = async () => {
    const prayerTimes = { fajr: '05:45', sunrise: '07:10', dhuhr: '12:30', asr: '15:45', maghrib: '18:00', isha: '19:30' };
    setPrayers(prayerTimes);
    setCountdown(getTimeUntilNextPrayer(prayerTimes));
    setAnnouncements([
      { id: '1', title: 'Friday Prayer', message: "Join us for Jumu'ah prayer this Friday at 1:30 PM", type: 'general' },
      { id: '2', title: 'Ramadan Mubarak', message: 'Ramadan Kareem! May Allah accept our fasting', type: 'ramadan' },
    ]);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const p = prayers ?? { fajr: '05:45', sunrise: '07:10', dhuhr: '12:30', asr: '15:45', maghrib: '18:00', isha: '19:30' };
  const nextPrayer = getNextPrayer(p);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.greetingColumn}>
              <Text style={styles.greetingText}>السلام عليكم</Text>
              <Text style={styles.dateText}>{today}</Text>
              {occasion && (
                <View style={styles.occasionBadge}>
                  <MaterialCommunityIcons name="star" size={12} color={COLORS.accent} />
                  <Text style={styles.occasionText}>{occasion}</Text>
                </View>
              )}
              <Text style={styles.hijriText}>{hijriDate.format}</Text>
            </View>
            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
              {announcements.length > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayer Card Section */}
        <View style={styles.cardSection}>
          <GlassCard style={styles.prayerCard} variant="floating">
            <LinearGradient colors={['#4A90D9', '#6DD5ED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.prayerGradient}>
              <View style={styles.prayerShine} />
              
              {/* Main Header */}
              <View style={styles.prayerMainHeader}>
                <Text style={styles.prayerCardTitle}>Next Prayer</Text>
                <Text style={styles.nextPrayerName}>{nextPrayer}</Text>
                <Text style={styles.prayerTimeText}>{p[nextPrayer.toLowerCase()]}</Text>
              </View>
              
              {/* Countdown Timer */}
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>Time Remaining</Text>
                <View style={styles.countdownBox}>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(countdown.hours).padStart(2, '0')}</Text>
                    <Text style={styles.countdownUnit}>Hours</Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(countdown.minutes).padStart(2, '0')}</Text>
                    <Text style={styles.countdownUnit}>Min</Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{String(countdown.seconds).padStart(2, '0')}</Text>
                    <Text style={styles.countdownUnit}>Sec</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.prayerGrid}>
                {PRAYER_NAMES.map((name) => {
                  const isNext = name === nextPrayer;
                  return (
                    <View key={name} style={[styles.prayerItem, { width: prayerItemWidth }, isNext && styles.prayerItemActive]}>
                      {isNext && <Text style={styles.nextLabel}>NEXT</Text>}
                      <Text style={[styles.prayerName, isNext && styles.prayerNameActive]}>{name}</Text>
                      <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive]}>{p[name.toLowerCase()] || '--:--'}</Text>
                    </View>
                  );
                })}
              </View>
            </LinearGradient>
          </GlassCard>
        </View>

        {/* Announcements */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Announcements</Text><TouchableOpacity onPress={() => router.push('/announcements/1')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity></View>
            {announcements.slice(0, 2).map((item) => (
              <TouchableOpacity key={item.id} onPress={() => router.push(`/announcements/${item.id}`)} activeOpacity={0.7} style={styles.announcementWrapper}>
                <GlassCard>
                  <View style={styles.announcementInner}>
                    <View style={[styles.announcementDot, { backgroundColor: item.type === 'ramadan' ? COLORS.accent : COLORS.primary }]} />
                    <View style={styles.announcementText}><Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.announcementMessage} numberOfLines={2}>{item.message}</Text></View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity key={action.label} onPress={() => router.push(action.route as any)} activeOpacity={0.7} style={[styles.actionButtonWrapper, { width: actionCardWidth }]}>
                <GlassCard style={styles.actionButton}>
                  <FloatingIcon icon={action.iconComponent} size="md" color={action.color} glow />
                  <Text style={styles.actionText}>{action.label}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: TAB_BAR_HEIGHT + SPACING.lg },

  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetingColumn: { flex: 1 },
  greetingText: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  dateText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  occasionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent + '18', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: 6, gap: 4 },
  occasionText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  hijriText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  notifButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceGlass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.white },

  cardSection: { paddingHorizontal: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.md },
  prayerCard: { borderRadius: RADIUS.xxl, overflow: 'hidden' },
  prayerGradient: { borderRadius: RADIUS.xxl, padding: SPACING.lg, overflow: 'hidden' },
  prayerShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.25)', borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  prayerMainHeader: { alignItems: 'center', marginBottom: SPACING.md },
  prayerCardTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  nextPrayerName: { color: COLORS.white, fontSize: 36, fontWeight: '800', marginBottom: 4 },
  prayerTimeText: { color: COLORS.white, fontSize: 24, fontWeight: '700' },

  countdownContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  countdownLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: SPACING.xs },
  countdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  countdownItem: { alignItems: 'center', minWidth: 50 },
  countdownNumber: { color: COLORS.white, fontSize: 28, fontWeight: '800' },
  countdownUnit: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500' },
  countdownSeparator: { color: COLORS.white, fontSize: 28, fontWeight: '700', marginHorizontal: 4 },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm },
  prayerItem: { minHeight: 70, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', justifyContent: 'center' },
  prayerItemActive: { backgroundColor: COLORS.white },
  nextLabel: { fontSize: 8, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5, marginBottom: 2 },
  prayerName: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginBottom: 4, fontWeight: '600' },
  prayerNameActive: { color: COLORS.primary, fontWeight: '700' },
  prayerTime: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  prayerTimeActive: { color: COLORS.primary },

  section: { paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  viewAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  announcementWrapper: { marginBottom: SPACING.sm },
  announcementInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  announcementDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  announcementText: { flex: 1 },
  announcementTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  announcementMessage: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionButtonWrapper: { minHeight: 110 },
  actionButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: SPACING.sm },

  bottomSpacer: { height: SPACING.lg },
});
