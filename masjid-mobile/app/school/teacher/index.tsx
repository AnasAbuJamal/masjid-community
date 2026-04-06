import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../../components/common';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface TeacherClass {
  id: string;
  name: string;
  level: string;
  schedule: string;
  enrolledCount: number;
  maxCapacity: number;
  upcomingAssignment: number;
  pendingGrades: number;
}

const MOCK_CLASSES: TeacherClass[] = [
  { id: '1', name: 'Quran Recitation - Beginner', level: 'Beginner', schedule: 'Sat & Sun, 9:00 AM', enrolledCount: 12, maxCapacity: 15, upcomingAssignment: 1, pendingGrades: 5 },
  { id: '2', name: 'Quran Tajweed', level: 'Intermediate', schedule: 'Sat & Sun, 10:30 AM', enrolledCount: 8, maxCapacity: 12, upcomingAssignment: 0, pendingGrades: 0 },
  { id: '3', name: 'Arabic Language - Level 1', level: 'Beginner', schedule: 'Sat, 1:00 PM', enrolledCount: 10, maxCapacity: 15, upcomingAssignment: 2, pendingGrades: 8 },
];

const QUICK_ACTIONS = [
  { id: 'attendance', icon: 'clipboard-check', label: 'Take Attendance', color: COLORS.primary, route: '/school/teacher/attendance' },
  { id: 'grades', icon: 'grade', label: 'Enter Grades', color: COLORS.success, route: '/school/teacher/grades' },
  { id: 'assignments', icon: 'clipboard-text', label: 'Assignments', color: COLORS.secondary, route: '/school/teacher/assignments' },
  { id: 'students', icon: 'account-group', label: 'Students', color: COLORS.warning, route: '/school/teacher/students' },
];

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<TeacherClass[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClasses(MOCK_CLASSES);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const totalStudents = classes.reduce((sum, c) => sum + c.enrolledCount, 0);
  const totalPendingGrades = classes.reduce((sum, c) => sum + c.pendingGrades, 0);
  const upcomingAssignments = classes.reduce((sum, c) => sum + c.upcomingAssignment, 0);

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Teacher Portal</Text>
          <Text style={styles.subtitle}>Manage your classes and students</Text>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
              <MaterialCommunityIcons name="clipboard-check" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.statNumber}>{totalPendingGrades}</Text>
            <Text style={styles.statLabel}>Pending Grades</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <MaterialCommunityIcons name="clipboard-text" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.statNumber}>{upcomingAssignments}</Text>
            <Text style={styles.statLabel}>Assignments</Text>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.actionCardInner}>
                  <FloatingIcon
                    icon={<MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />}
                    size="md"
                    color={action.color}
                    glow
                  />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          {classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              onPress={() => router.push({ pathname: '/school/teacher/class/[id]', params: { id: classItem.id } } as any)}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.classCard}>
                <View style={styles.classHeader}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <View style={styles.classBadges}>
                    {classItem.pendingGrades > 0 && (
                      <View style={styles.badge}>
                        <MaterialCommunityIcons name="alert" size={12} color={COLORS.error} />
                        <Text style={styles.badgeText}>{classItem.pendingGrades}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.classMeta}>{classItem.level} • {classItem.schedule}</Text>
                <View style={styles.classFooter}>
                  <View style={styles.classStat}>
                    <MaterialCommunityIcons name="account-multiple" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.classStatText}>{classItem.enrolledCount}/{classItem.maxCapacity} students</Text>
                  </View>
                  <View style={styles.classStat}>
                    <MaterialCommunityIcons name="clipboard-text" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.classStatText}>{classItem.upcomingAssignment} upcoming</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  section: { padding: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: { width: '48%' },
  actionCardInner: { alignItems: 'center', padding: SPACING.md },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs },

  classCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  className: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  classBadges: { flexDirection: 'row', gap: SPACING.xs },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.error + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, gap: 2 },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.error },
  classMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  classFooter: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  classStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  classStatText: { fontSize: 12, color: COLORS.textSecondary },

  bottomSpacer: { height: 100 },
});
