import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getHijriDate } from '../utils/hijri';

const { width, height } = Dimensions.get('window');

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'event' | 'ramadan' | 'fundraiser';
  priority: 'low' | 'normal' | 'high';
  scheduledStart?: string;
  scheduledEnd?: string;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Friday Prayer', message: "Join us for Jumu'ah prayer this Friday at 1:30 PM. May Allah accept our prayers.", type: 'event', priority: 'high', scheduledStart: '2026-03-18T12:00:00', scheduledEnd: '2026-03-18T14:00:00' },
  { id: '2', title: 'Ramadan Mubarak', message: 'Ramadan Kareem! May Allah accept our fasting and grant us barakah in this blessed month.', type: 'ramadan', priority: 'normal' },
  { id: '3', title: 'Emergency Repair Fund', message: 'Our roof needs urgent repairs. Please donate to help us reach our goal of $15,000.', type: 'fundraiser', priority: 'high' },
  { id: '4', title: 'Youth Program Registration', message: 'Register now for our summer youth program. Classes start April 1st.', type: 'general', priority: 'normal' },
];

const PRAYER_TIMES = [
  { name: 'Fajr', time: '05:45', iqamah: '06:15' },
  { name: 'Sunrise', time: '07:10' },
  { name: 'Dhuhr', time: '12:30', iqamah: '12:45' },
  { name: 'Asr', time: '15:45', iqamah: '16:00' },
  { name: 'Maghrib', time: '18:00', iqamah: '18:05' },
  { name: 'Isha', time: '19:30', iqamah: '19:45' },
];

export default function KioskScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const isTVMode = mode === 'tv';
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const hijriDate = getHijriDate();
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (!isTVMode) return;
    
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -50, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setCurrentAnnouncementIndex(prev => (prev + 1) % MOCK_ANNOUNCEMENTS.length);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isTVMode]);

  const getAnnouncementStyle = (type: string) => {
    switch (type) {
      case 'urgent': return { bg: [COLORS.error, '#FF8A80'], icon: 'alert-circle' };
      case 'ramadan': return { bg: ['#4A90D9', '#6DD5ED'], icon: 'star-crescent' };
      case 'event': return { bg: [COLORS.success, '#81C784'], icon: 'calendar-star' };
      case 'fundraiser': return { bg: ['#FFB74D', '#FFD54F'], icon: 'heart' };
      default: return { bg: [COLORS.primary, '#7BB3E8'], icon: 'bullhorn' };
    }
  };

  const currentAnnouncement = MOCK_ANNOUNCEMENTS[currentAnnouncementIndex];
  const annStyle = getAnnouncementStyle(currentAnnouncement?.type || 'general');

  if (!isTVMode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.adminHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.adminTitle}>Kiosk / TV Mode</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.adminContent}>
          <Text style={styles.adminDesc}>Display announcements on a TV screen in the mosque.</Text>
          
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={() => router.setParams({ mode: 'tv' })}
          >
            <MaterialCommunityIcons name="television-play" size={24} color={COLORS.white} />
            <Text style={styles.previewButtonText}>Launch TV Display</Text>
          </TouchableOpacity>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Preview Mode</Text>
            <Text style={styles.previewSubtitle}>Tap to see what will display on TV</Text>
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Display Settings</Text>
            <View style={styles.settingRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Rotation Interval</Text>
              <Text style={styles.settingValue}>8 seconds</Text>
            </View>
            <View style={styles.settingRow}>
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Announcements</Text>
              <Text style={styles.settingValue}>{MOCK_ANNOUNCEMENTS.length} active</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.tvContainer}>
      <LinearGradient colors={['#0D1B2A', '#1B2838', '#0D1B2A']} style={styles.tvBackground}>
        {/* Header */}
        <View style={styles.tvHeader}>
          <View style={styles.tvLogo}>
            <MaterialCommunityIcons name="mosque" size={32} color={COLORS.white} />
            <Text style={styles.tvMasjidName}>Masjid Al-Momineen</Text>
          </View>
          <View style={styles.tvDateTime}>
            <Text style={styles.tvDate}>{currentDate}</Text>
            <Text style={styles.tvTime}>{currentTime}</Text>
          </View>
        </View>

        {/* Hijri Date */}
        <View style={styles.tvHijri}>
          <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.secondary} />
          <Text style={styles.tvHijriText}>{hijriDate.format}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.tvMain}>
          {/* Announcement Slide */}
          <Animated.View style={[styles.tvAnnouncement, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={annStyle.bg as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.announcementGradient}>
              <View style={styles.announcementIconWrap}>
                <MaterialCommunityIcons name={annStyle.icon as any} size={40} color={COLORS.white} />
              </View>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>{currentAnnouncement?.title}</Text>
                <Text style={styles.announcementMessage}>{currentAnnouncement?.message}</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Prayer Times Grid */}
          <View style={styles.prayerGrid}>
            {PRAYER_TIMES.map((prayer, index) => (
              <View key={prayer.name} style={[styles.prayerCard, index === 0 && styles.prayerNext]}>
                <Text style={styles.prayerName}>{prayer.name}</Text>
                <Text style={styles.prayerAdhan}>{prayer.time}</Text>
                {prayer.iqamah && <Text style={styles.prayerIqamah}>{prayer.iqamah}</Text>}
              </View>
            ))}
          </View>

          {/* Jummah Times */}
          <View style={styles.jummahSection}>
            <Text style={styles.jummahTitle}>Friday (Jummah)</Text>
            <View style={styles.jummahTimes}>
              <View style={styles.jummahTimeItem}>
                <Text style={styles.jummahLabel}>1st Khutbah</Text>
                <Text style={styles.jummahTime}>1:00 PM</Text>
              </View>
              <View style={styles.jummahTimeItem}>
                <Text style={styles.jummahLabel}>2nd Khutbah</Text>
                <Text style={styles.jummahTime}>2:00 PM</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.tvFooter}>
          <Text style={styles.footerText}>• ٥صلوات • ٥ prayers daily •</Text>
        </View>

        {/* Exit Button */}
        <TouchableOpacity style={styles.exitButton} onPress={() => router.setParams({ mode: '' })}>
          <MaterialCommunityIcons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  adminHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  adminTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  adminContent: { padding: SPACING.md },
  adminDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  previewButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg,
    gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  previewButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  previewCard: {
    backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.lg,
    marginBottom: SPACING.md, alignItems: 'center',
  },
  previewTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  previewSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  settingsCard: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.lg },
  settingsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, marginLeft: SPACING.sm },
  settingValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  // TV Mode Styles
  tvContainer: { flex: 1 },
  tvBackground: { flex: 1, padding: SPACING.lg },
  tvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  tvLogo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  tvMasjidName: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  tvDateTime: { alignItems: 'flex-end' },
  tvDate: { fontSize: 16, color: COLORS.white },
  tvTime: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  tvHijri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, marginBottom: SPACING.lg },
  tvHijriText: { fontSize: 18, color: COLORS.secondary },
  tvMain: { flex: 1, justifyContent: 'center' },
  tvAnnouncement: { marginBottom: SPACING.xl },
  announcementGradient: { borderRadius: RADIUS.xl, padding: SPACING.xl, flexDirection: 'row', alignItems: 'center' },
  announcementIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.lg },
  announcementContent: { flex: 1 },
  announcementTitle: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.sm },
  announcementMessage: { fontSize: 18, color: 'rgba(255,255,255,0.9)', lineHeight: 26 },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  prayerCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', minWidth: 100 },
  prayerNext: { backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white },
  prayerName: { fontSize: 14, color: COLORS.white, fontWeight: '600', marginBottom: 4 },
  prayerAdhan: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  prayerIqamah: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  jummahSection: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.lg, padding: SPACING.md },
  jummahTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.sm, textAlign: 'center' },
  jummahTimes: { flexDirection: 'row', justifyContent: 'space-around' },
  jummahTimeItem: { alignItems: 'center' },
  jummahLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  jummahTime: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  tvFooter: { alignItems: 'center', paddingTop: SPACING.md },
  footerText: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  exitButton: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
});