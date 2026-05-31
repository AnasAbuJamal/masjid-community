import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { Student, Assignment } from '../../services/api-service';

const FEATURES = [
  { icon: 'book-open-outline', title: 'Quran Classes', description: 'Weekly Quran recitation & tajweed', time: 'Sat & Sun, 9 AM', color: COLORS.primary, route: '/school/classes' as const },
  { icon: 'school-outline', title: 'Islamic Studies', description: 'Fiqh, Aqeedah, Seerah', time: 'Sat, 11 AM', color: COLORS.secondary, route: '/school/classes' as const },
  { icon: 'account-group-outline', title: 'Youth Program', description: 'Ages 8-17, activities & learning', time: 'Sun, 10 AM', color: '#1976d2', route: '/school/classes' as const },
  { icon: 'translate', title: 'Arabic Language', description: 'Modern Standard & Classical Arabic', time: 'Sat, 1 PM', color: COLORS.accent, route: '/school/classes' as const },
  { icon: 'calendar-clock', title: 'Class Schedule', description: 'Weekly class times & locations', time: 'View schedule', color: COLORS.success, route: '/school/schedule' as const },
];

type TabKey = 'programs' | 'students' | 'assignments';

export default function SchoolScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>('programs');
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    } else if (activeTab === 'assignments') {
      loadAssignments();
    }
  }, [activeTab]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await apiService.school.getStudents();
      setStudents(data);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await apiService.school.getAssignments();
      setAssignments(data);
    } catch {
      setAssignments([]);
    }
    setLoading(false);
  };

  const handleLookup = () => {
    if (!studentId.trim()) { Alert.alert('Error', 'Please enter a student ID'); return; }
    router.push({ pathname: '/school/student' as any, params: { id: studentId.trim() } });
  };

  const handleEnroll = () => {
    router.push('/school/enroll' as any);
  };

  const cardWidth = (width - SPACING.md * 2 - SPACING.sm) / 2;

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'programs', label: 'Programs', icon: 'book-open-outline' },
    { key: 'students', label: 'My Kids', icon: 'account-group-outline' },
    { key: 'assignments', label: 'Homework', icon: 'pencil-outline' },
  ];

  const renderPrograms = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Programs & Classes</Text>
      <View style={styles.programsGrid}>
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.title}
            onPress={() => router.push(f.route)}
            activeOpacity={0.7}
            style={[styles.programCardWrapper, { width: cardWidth }]}
          >
            <GlassCard style={styles.programCard}>
              <FloatingIcon icon={<MaterialCommunityIcons name={f.icon as any} size={24} color={f.color} />} size="sm" color={f.color} />
              <Text style={styles.programTitle}>{f.title}</Text>
              <Text style={styles.programDesc} numberOfLines={2}>{f.description}</Text>
              <View style={styles.programTimeBadge}>
                <MaterialCommunityIcons name="clock-outline" size={11} color={COLORS.textSecondary} />
                <Text style={styles.programTime}>{f.time}</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Student Lookup</Text>
      <GlassCard>
        <View style={styles.lookupForm}>
          <Text style={styles.lookupDesc}>Enter a student ID to view grades and attendance.</Text>
          <View style={styles.lookupRow}>
            <TextInput
              style={styles.lookupInput}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Student ID"
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity style={styles.lookupButton} onPress={handleLookup}>
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderStudents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>My Children</Text>
      {students.length > 0 ? (
        students.map((student) => (
          <GlassCard key={student.id} style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentGrade}>{student.grade}</Text>
              </View>
              <View style={styles.attendanceBadge}>
                <Text style={styles.attendanceText}>{student.attendance}%</Text>
                <Text style={styles.attendanceLabel}>Attendance</Text>
              </View>
            </View>
          </GlassCard>
        ))
      ) : (
        <GlassCard>
          <View style={styles.centeredContent}>
            <FloatingIcon icon={<MaterialCommunityIcons name="account-child-outline" size={28} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No children linked</Text>
            <Text style={styles.emptySubtext}>Contact the school office to link your children to your account.</Text>
            <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
              <Text style={styles.enrollText}>Enroll My Child</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}
    </View>
  );

  const renderAssignments = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Homework & Assignments</Text>
      {assignments.length > 0 ? (
        assignments.map((assignment) => (
          <GlassCard key={assignment.id} style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <View style={[styles.subjectBadge, { backgroundColor: COLORS.primary + '20' }]}>
                <Text style={styles.subjectText}>{assignment.subject}</Text>
              </View>
              <View style={[styles.statusBadge, assignment.completed ? styles.statusCompleted : styles.statusPending]}>
                <Text style={[styles.statusText, assignment.completed ? styles.statusTextCompleted : styles.statusTextPending]}>
                  {assignment.completed ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            <View style={styles.dueDateRow}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.dueDateText}>Due: {new Date(assignment.dueDate).toLocaleDateString()}</Text>
            </View>
          </GlassCard>
        ))
      ) : (
        <GlassCard>
          <View style={styles.centeredContent}>
            <FloatingIcon icon={<MaterialCommunityIcons name="pencil-outline" size={28} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No homework</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        </GlassCard>
      )}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>Islamic School</Text>
                          <TouchableOpacity style={styles.leaderboardBtn} onPress={() => router.push('/school/leaderboard' as any)}>
              <MaterialCommunityIcons name="trophy" size={16} color={COLORS.warning} />
              <Text style={styles.leaderboardBtnText}>Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBarSection}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={16} color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === 'programs' && renderPrograms()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'assignments' && renderAssignments()}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  leaderboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning + '18', paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full },
  leaderboardBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
  tabBarSection: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: SPACING.xs, gap: SPACING.xs, borderRadius: RADIUS.lg },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.md, gap: 6 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  section: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  programsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  programCardWrapper: { marginBottom: SPACING.xs },
  programCard: { gap: SPACING.xs },
  programTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  programDesc: { fontSize: 12, color: COLORS.textSecondary },
  programTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  programTime: { fontSize: 11, color: COLORS.textSecondary },
  lookupForm: { gap: SPACING.sm },
  lookupDesc: { fontSize: 13, color: COLORS.textSecondary },
  lookupRow: { flexDirection: 'row', gap: SPACING.sm },
  lookupInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  lookupButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, justifyContent: 'center' },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  enrollButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderRadius: RADIUS.md, marginTop: SPACING.sm },
  enrollText: { color: COLORS.white, fontWeight: '600' },
  studentCard: { marginBottom: SPACING.sm },
  studentHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  studentGrade: { fontSize: 13, color: COLORS.textSecondary },
  attendanceBadge: { alignItems: 'center', backgroundColor: COLORS.success + '15', paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md },
  attendanceText: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  attendanceLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  assignmentCard: { marginBottom: SPACING.sm },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  subjectBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  subjectText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusCompleted: { backgroundColor: COLORS.success + '15' },
  statusPending: { backgroundColor: COLORS.warning + '15' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextCompleted: { color: COLORS.success },
  statusTextPending: { color: COLORS.warning },
  assignmentTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDateText: { fontSize: 12, color: COLORS.textSecondary },
});
