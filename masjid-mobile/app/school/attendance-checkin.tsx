import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface StudentClass {
  id: string;
  name: string;
  teacher: string;
  time: string;
  room: string;
  status: 'upcoming' | 'active' | 'completed';
}

const MY_CLASSES: StudentClass[] = [
  { id: '1', name: 'Quran Recitation - Beginner', teacher: 'Ustad Ahmad', time: '9:00 AM', room: 'Room 1', status: 'completed' },
  { id: '2', name: 'Islamic Studies - Fiqh', teacher: 'Ustad Omar', time: '11:00 AM', room: 'Main Hall', status: 'active' },
  { id: '3', name: 'Arabic Language - Level 1', teacher: 'Ustadah Sarah', time: '1:00 PM', room: 'Room 3', status: 'upcoming' },
];

const WEEKLY_ATTENDANCE = [
  { day: 'Sun', present: true },
  { day: 'Mon', present: true },
  { day: 'Tue', present: false },
  { day: 'Wed', present: true },
  { day: 'Thu', present: true },
  { day: 'Fri', present: null },
  { day: 'Sat', present: true },
];

export default function AttendanceCheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInClass, setCheckedInClass] = useState<string | null>(null);

  const activeClass = MY_CLASSES.find(c => c.status === 'active');
  const attendancePercentage = Math.round((WEEKLY_ATTENDANCE.filter(d => d.present).length / 5) * 100);

  const handleCheckIn = () => {
    if (!activeClass) {
      Alert.alert('No Active Class', 'There is no class currently in session to check in to.');
      return;
    }

    setCheckingIn(true);
    setTimeout(() => {
      setCheckingIn(false);
      setCheckedInClass(activeClass.id);
      Alert.alert(
        'Checked In!',
        `You have successfully checked in to ${activeClass.name}.`,
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'active': return COLORS.primary;
      case 'upcoming': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Today's Status */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Today's Attendance</Text>
          
          {activeClass ? (
            <View style={styles.activeClassSection}>
              <View style={[styles.classStatusBadge, { backgroundColor: COLORS.primary + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.classStatusText}>Class In Session</Text>
              </View>
              
              <Text style={styles.activeClassName}>{activeClass.name}</Text>
              <View style={styles.classDetails}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>{activeClass.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="door" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>{activeClass.room}</Text>
                </View>
              </View>

              {checkedInClass === activeClass.id ? (
                <View style={styles.checkedInCard}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                  <Text style={styles.checkedInText}>You're checked in!</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.checkInButton}
                  onPress={handleCheckIn}
                  disabled={checkingIn}
                >
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.checkInText}>
                    {checkingIn ? 'Checking in...' : 'Check In Now'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noClassSection}>
              <MaterialCommunityIcons name="calendar-clock" size={40} color={COLORS.textSecondary} />
              <Text style={styles.noClassText}>No class currently in session</Text>
              <Text style={styles.noClassSubtext}>Check back during class hours</Text>
            </View>
          )}
        </View>

        {/* Weekly Overview */}
        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekGrid}>
              {WEEKLY_ATTENDANCE.map((day, index) => (
                <View key={day.day} style={styles.dayColumn}>
                  <View style={[
                    styles.dayDot,
                    day.present === true && styles.dayPresent,
                    day.present === false && styles.dayAbsent,
                    day.present === null && styles.dayFuture,
                  ]}>
                    {day.present !== null && (
                      <MaterialCommunityIcons 
                        name={day.present ? 'check' : 'close'} 
                        size={12} 
                        color={COLORS.white} 
                      />
                    )}
                  </View>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.weekSummary}>
              <Text style={styles.summaryText}>
                {WEEKLY_ATTENDANCE.filter(d => d.present).length} of 5 days attended
              </Text>
              <Text style={styles.percentageText}>{attendancePercentage}%</Text>
            </View>
          </View>
        </View>

        {/* My Classes */}
        <View style={styles.classesSection}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          {MY_CLASSES.map((cls) => {
            const statusColor = getStatusColor(cls.status);
            return (
              <View key={cls.id} style={styles.classCard}>
                <View style={[styles.classIndicator, { backgroundColor: statusColor }]} />
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <View style={styles.classMeta}>
                    <Text style={styles.classMetaText}>{cls.teacher} • {cls.time}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {cls.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Attendance Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>92%</Text>
              <Text style={styles.statLabel}>Overall</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="check-all" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.error} />
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  todayCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  todayTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },

  activeClassSection: { alignItems: 'center' },
  classStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm + 4, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: SPACING.sm, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  classStatusText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  activeClassName: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  classDetails: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: COLORS.textSecondary },

  checkInButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, gap: SPACING.sm, ...SHADOWS.md },
  checkInText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  checkedInCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.successLight, paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, gap: SPACING.sm },
  checkedInText: { fontSize: 15, fontWeight: '600', color: COLORS.success },

  noClassSection: { alignItems: 'center', paddingVertical: SPACING.lg },
  noClassText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.sm },
  noClassSubtext: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  weekSection: { marginBottom: SPACING.md },
  weekCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  dayColumn: { alignItems: 'center' },
  dayDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dayPresent: { backgroundColor: COLORS.success },
  dayAbsent: { backgroundColor: COLORS.error },
  dayFuture: { backgroundColor: COLORS.border },
  dayLabel: { fontSize: 11, color: COLORS.textSecondary },
  weekSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  summaryText: { fontSize: 13, color: COLORS.textSecondary },
  percentageText: { fontSize: 16, fontWeight: '700', color: COLORS.success },

  classesSection: { marginBottom: SPACING.md },
  classCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  classIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: SPACING.sm },
  classInfo: { flex: 1 },
  className: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  classMeta: { marginTop: 2 },
  classMetaText: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  statsSection: { marginBottom: SPACING.md },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
});