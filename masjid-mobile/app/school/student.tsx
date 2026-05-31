import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { StudentDetail, StudentReport } from '../../services/api-service';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    const data = await apiService.school.lookupByStudentId(id);
    setStudent(data);
    setLoading(false);
  };

  const getLevelColor = (level: number) => {
    if (level >= 4) return '#FFD700';
    if (level >= 3) return '#C0C0C0';
    if (level >= 2) return '#CD7F32';
    return COLORS.textSecondary;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return COLORS.success;
      case 'absent': return COLORS.error;
      case 'late': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getAttendancePercent = () => {
    if (!student) return 0;
    const total = student.attendance.totalPresent + student.attendance.totalAbsent + student.attendance.totalLate;
    if (total === 0) return 0;
    return Math.round((student.attendance.totalPresent / total) * 100);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Looking up student...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!student) {
    return (
      <ScreenWrapper>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="account-search" size={64} color={COLORS.textSecondary} />
          <Text style={styles.notFoundTitle}>Student Not Found</Text>
          <Text style={styles.notFoundSubtext}>No student found with ID: {id}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const attendancePercent = getAttendancePercent();

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ title: fullName }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <GlassCard style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={40} color={COLORS.primary} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{student.currentLevel}</Text>
            </View>
          </View>
          <Text style={styles.studentName}>{fullName}</Text>
          <Text style={styles.studentId}>ID: {student.studentId}</Text>
          {student.class && (
            <View style={styles.classRow}>
              <MaterialCommunityIcons name="school-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.classText}>{student.class.name}</Text>
            </View>
          )}
        </GlassCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{attendancePercent}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{student.totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: getLevelColor(student.currentLevel) + '25' }]}>
            <Text style={[styles.statValue, { color: getLevelColor(student.currentLevel) }]}>{student.currentLevel}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Recent Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          {student.attendance.recentRecords.length > 0 ? (
            <GlassCard>
              {student.attendance.recentRecords.map((record, index) => (
                <View key={index} style={[styles.attendanceRow, index > 0 && styles.attendanceRowBorder]}>
                  <View style={[styles.attendanceDot, { backgroundColor: getStatusColor(record.status) }]} />
                  <Text style={styles.attendanceDate}>{new Date(record.date).toLocaleDateString()}</Text>
                  <Text style={styles.attendanceClass}>{record.className}</Text>
                  <View style={[styles.attendanceStatus, { backgroundColor: getStatusColor(record.status) + '18' }]}>
                    <Text style={[styles.attendanceStatusText, { color: getStatusColor(record.status) }]}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          ) : (
            <GlassCard>
              <Text style={styles.emptyText}>No attendance records found</Text>
            </GlassCard>
          )}
        </View>

        {/* Recent Assignments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Assignments</Text>
          {student.recentAssignments.length > 0 ? (
            <GlassCard>
              {student.recentAssignments.map((assignment, index) => (
                <View key={assignment.id} style={[styles.assignmentRow, index > 0 && styles.attendanceRowBorder]}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentType}>{assignment.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    <Text style={styles.assignmentDate}>{new Date(assignment.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.assignmentDesc} numberOfLines={2}>{assignment.description}</Text>
                  <View style={styles.assignmentFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: assignment.status === 'completed' ? COLORS.success + '18' : COLORS.warning + '18' }]}>
                      <Text style={[styles.statusBadgeText, { color: assignment.status === 'completed' ? COLORS.success : COLORS.warning }]}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </Text>
                    </View>
                    {assignment.rating !== 'none' && (
                      <Text style={styles.ratingText}>Rating: {assignment.rating}</Text>
                    )}
                  </View>
                </View>
              ))}
            </GlassCard>
          ) : (
            <GlassCard>
              <Text style={styles.emptyText}>No assignments found</Text>
            </GlassCard>
          )}
        </View>

        {/* Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reports</Text>
          </View>
          {student.reports.length > 0 ? (
            student.reports.map((report) => (
              <GlassCard key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={[styles.reportCategory, { backgroundColor: COLORS.primary + '18' }]}>
                    <Text style={styles.reportCategoryText}>{report.category.charAt(0).toUpperCase() + report.category.slice(1)}</Text>
                  </View>
                  <Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportContent}>{report.content}</Text>
              </GlassCard>
            ))
          ) : (
            <GlassCard>
              <Text style={styles.emptyText}>No reports yet</Text>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  notFoundTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  notFoundSubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.xs },
  backButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 4, borderRadius: RADIUS.md, marginTop: SPACING.lg },
  backButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

  headerCard: { alignItems: 'center', padding: SPACING.lg, marginBottom: SPACING.md },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  levelBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  levelText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  studentName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  studentId: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm },
  classText: { fontSize: 14, color: COLORS.textSecondary },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  section: { marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.lg },

  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  attendanceRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  attendanceDot: { width: 8, height: 8, borderRadius: 4 },
  attendanceDate: { fontSize: 13, color: COLORS.text, flex: 1 },
  attendanceClass: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  attendanceStatus: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  attendanceStatusText: { fontSize: 10, fontWeight: '600' },

  assignmentRow: { paddingVertical: SPACING.sm },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  assignmentType: { fontSize: 13, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  assignmentDate: { fontSize: 12, color: COLORS.textSecondary },
  assignmentDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.xs },
  assignmentFooter: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },
  ratingText: { fontSize: 12, color: COLORS.textSecondary },

  reportCard: { marginBottom: SPACING.sm },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  reportCategory: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  reportCategoryText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
  reportDate: { fontSize: 12, color: COLORS.textSecondary },
  reportTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  reportContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
