import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  subject: string;
}

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', date: '2026-02-20', status: 'present', subject: 'Quran' },
  { id: '2', date: '2026-02-19', status: 'present', subject: 'Islamic Studies' },
  { id: '3', date: '2026-02-18', status: 'excused', subject: 'Arabic' },
];

export default function AttendanceScreen() {
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState(false);
  const [attendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);

  const handleCheckIn = () => {
    Alert.alert('Check In', 'Mark yourself present for today?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check In', onPress: () => {
        setCheckingIn(true);
        setTimeout(() => {
          setCheckingIn(false);
          Alert.alert('Success!', 'You have been checked in.');
        }, 1000);
      }},
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return COLORS.success;
      case 'absent': return COLORS.error;
      case 'excused': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalCount = attendance.length;
  const attendancePercent = Math.round((presentCount / totalCount) * 100);

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
        <View style={styles.statsCard}>
          <View style={styles.statCircle}>
            <Text style={styles.statPercent}>{attendancePercent}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {attendance.filter(a => a.status === 'excused').length}
              </Text>
              <Text style={styles.statLabel}>Excused</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.error }]}>
                {attendance.filter(a => a.status === 'absent').length}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn} disabled={checkingIn}>
          <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.white} />
          <Text style={styles.checkInText}>{checkingIn ? 'Checking in...' : 'Check In Now'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent History</Text>
        
        {attendance.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(record.status) }]} />
              <View>
                <Text style={styles.recordSubject}>{record.subject}</Text>
                <Text style={styles.recordDate}>{new Date(record.date).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </Text>
            </View>
          </View>
        ))}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },
  statsCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.lg, alignItems: 'center', ...SHADOWS.md,
  },
  statCircle: { alignItems: 'center', marginBottom: SPACING.lg },
  statPercent: { fontSize: 48, fontWeight: '700', color: COLORS.primary },
  statsRow: { flexDirection: 'row', gap: SPACING.xl },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  checkInButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success,
    paddingVertical: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, gap: SPACING.sm, ...SHADOWS.md,
  },
  checkInText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.sm },
  recordCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  recordSubject: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  recordDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '600' },
});
