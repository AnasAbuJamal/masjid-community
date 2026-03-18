import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface ScheduleItem {
  id: string;
  className: string;
  teacher: string;
  time: string;
  endTime: string;
  room: string;
  type: string;
  day: string;
}

const WEEK_SCHEDULE: Record<string, ScheduleItem[]> = {
  Saturday: [
    { id: '1', className: 'Quran Recitation - Beginner', teacher: 'Ustad Ahmad', time: '9:00 AM', endTime: '10:00 AM', room: 'Room 1', type: 'quran', day: 'Saturday' },
    { id: '2', className: 'Quran Tajweed', teacher: 'Ustadah Fatima', time: '10:30 AM', endTime: '11:30 AM', room: 'Room 2', type: 'quran', day: 'Saturday' },
    { id: '3', className: 'Islamic Studies - Fiqh', teacher: 'Ustad Omar', time: '11:00 AM', endTime: '12:00 PM', room: 'Main Hall', type: 'islamic', day: 'Saturday' },
    { id: '4', className: 'Arabic Language - Level 1', teacher: 'Ustadah Sarah', time: '1:00 PM', endTime: '2:00 PM', room: 'Room 3', type: 'arabic', day: 'Saturday' },
  ],
  Sunday: [
    { id: '5', className: 'Quran Recitation - Beginner', teacher: 'Ustad Ahmad', time: '9:00 AM', endTime: '10:00 AM', room: 'Room 1', type: 'quran', day: 'Sunday' },
    { id: '6', className: 'Quran Tajweed', teacher: 'Ustadah Fatima', time: '10:30 AM', endTime: '11:30 AM', room: 'Room 2', type: 'quran', day: 'Sunday' },
    { id: '7', className: 'Youth Program - Ages 8-12', teacher: 'Br. Ahmed', time: '10:00 AM', endTime: '11:30 AM', room: 'Youth Center', type: 'youth', day: 'Sunday' },
    { id: '8', className: 'Seerah & History', teacher: 'Ustad Omar', time: '11:00 AM', endTime: '12:00 PM', room: 'Room 4', type: 'islamic', day: 'Sunday' },
    { id: '9', className: 'Arabic Conversation', teacher: 'Ustadah Sarah', time: '1:00 PM', endTime: '2:00 PM', room: 'Room 3', type: 'arabic', day: 'Sunday' },
    { id: '10', className: 'Youth Program - Ages 13-17', teacher: 'Br. Ali', time: '12:00 PM', endTime: '1:30 PM', room: 'Youth Center', type: 'youth', day: 'Sunday' },
  ],
};

const DAYS = ['Saturday', 'Sunday'];

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState('Saturday');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quran': return COLORS.primary;
      case 'arabic': return COLORS.secondary;
      case 'islamic': return COLORS.success;
      case 'youth': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const schedule = WEEK_SCHEDULE[selectedDay] || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Class Schedule</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No classes on {selectedDay}</Text>
          </View>
        ) : (
          schedule.map((item, index) => {
            const typeColor = getTypeColor(item.type);
            return (
              <View key={item.id} style={styles.scheduleCard}>
                <View style={[styles.timeIndicator, { backgroundColor: typeColor }]}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  <Text style={styles.timeEnd}>{item.endTime}</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                    <Text style={[styles.typeText, { color: typeColor }]}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.className}>{item.className}</Text>
                  <View style={styles.classInfo}>
                    <View style={styles.infoItem}>
                      <MaterialCommunityIcons name="account-tie" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>{item.teacher}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MaterialCommunityIcons name="door" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>{item.room}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Weekly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>2</Text>
              <Text style={styles.summaryLabel}>Days</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Object.values(WEEK_SCHEDULE).flat().length}</Text>
              <Text style={styles.summaryLabel}>Total Classes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>8h</Text>
              <Text style={styles.summaryLabel}>Instruction Time</Text>
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

  daySelector: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  dayTab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  dayTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayTabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  dayTabTextActive: { color: COLORS.white },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  scheduleCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOWS.sm },
  timeIndicator: { width: 80, padding: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  timeEnd: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cardContent: { flex: 1, padding: SPACING.md },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.full, marginBottom: SPACING.xs },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  className: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  classInfo: { flexDirection: 'row', gap: SPACING.md },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: COLORS.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.md },

  summaryCard: { backgroundColor: COLORS.primary + '12', borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '30' },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary },
});