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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { GamificationStudent } from '../../services/api-service';

const LEVEL_NAMES: Record<number, string> = { 1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Champion' };
const LEVEL_COLORS: Record<number, string> = { 1: '#CD7F32', 2: '#C0C0C0', 3: '#FFD700', 4: '#E5E4E2' };
const LEVEL_ICONS: Record<number, string> = { 1: 'medal', 2: 'medal-outline', 3: 'trophy', 4: 'crown' };

export default function LeaderboardScreen() {
  const { width } = useWindowDimensions();
  const [students, setStudents] = useState<GamificationStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await apiService.gamification.getLeaderboard();
      const sorted = [...data].sort((a, b) => b.totalPoints - a.totalPoints);
      setStudents(sorted);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const top3 = students.slice(0, 3);
  const rest = students.slice(3);

  const renderTop3Podium = () => {
    const positions = [
      { index: 1, order: 1 as const, height: 140, medal: top3[1] },
      { index: 0, order: 2 as const, height: 170, medal: top3[0] },
      { index: 2, order: 0 as const, height: 110, medal: top3[2] },
    ];

    return (
      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
        <GlassCard style={styles.podiumCard}>
          <View style={styles.podiumRow}>
            {positions.map(pos => {
              const student = pos.medal;
              if (!student) return <View key={pos.index} style={{ flex: 1 }} />;
              const levelColor = LEVEL_COLORS[student.currentLevel] || LEVEL_COLORS[1];
              const levelName = LEVEL_NAMES[student.currentLevel] || LEVEL_NAMES[1];
              const levelIcon = LEVEL_ICONS[student.currentLevel] || LEVEL_ICONS[1];
              const isFirst = pos.index === 0;

              return (
                <View key={student.id} style={[styles.podiumItem, { flex: 1, alignItems: 'center' }]}>
                  <TouchableOpacity style={styles.podiumStudent} activeOpacity={0.8}>
                    <View style={[styles.podiumAvatar, { borderColor: levelColor, backgroundColor: levelColor + '20' }]}>
                      <MaterialCommunityIcons name="account" size={isFirst ? 28 : 22} color={levelColor} />
                    </View>
                    <Text style={styles.podiumRank}>#{pos.index + 1}</Text>
                    <Text style={[styles.podiumName, { color: isFirst ? COLORS.text : COLORS.textSecondary }]} numberOfLines={1}>
                      {student.firstName} {student.lastName?.charAt(0)}.
                    </Text>
                    <Text style={[styles.podiumPoints, { color: levelColor }]}>
                      {student.totalPoints.toLocaleString()} pts
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: levelColor + '20' }]}>
                      <MaterialCommunityIcons name={levelIcon as any} size={12} color={levelColor} />
                      <Text style={[styles.levelBadgeText, { color: levelColor }]}>{levelName}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={[styles.podiumBase, { height: pos.height, backgroundColor: levelColor + '25', borderTopColor: levelColor }]}>
                    <Text style={[styles.podiumBaseNum, { color: levelColor }]}>{pos.index + 1}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>
      </View>
    );
  };

  const renderStudentRow = (student: GamificationStudent, rank: number) => {
    const levelColor = LEVEL_COLORS[student.currentLevel] || LEVEL_COLORS[1];
    const levelName = LEVEL_NAMES[student.currentLevel] || LEVEL_NAMES[1];
    const levelIcon = LEVEL_ICONS[student.currentLevel] || LEVEL_ICONS[1];

    return (
      <GlassCard key={student.id} style={styles.studentCard}>
        <View style={styles.studentRow}>
          <View style={styles.rankWrap}>
            <Text style={styles.rankNum}>{rank}</Text>
          </View>
          <View style={[styles.studentAvatar, { backgroundColor: levelColor + '20', borderColor: levelColor }]}>
            <MaterialCommunityIcons name="account" size={20} color={levelColor} />
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
            <View style={styles.studentMeta}>
              <MaterialCommunityIcons name="trophy-outline" size={12} color={levelColor} />
              <Text style={[styles.studentLevel, { color: levelColor }]}>{levelName}</Text>
              <View style={styles.metaDot} />
              <MaterialCommunityIcons name="calendar-check" size={12} color={COLORS.success} />
              <Text style={styles.attendanceText}>{student.attendanceRate}% attendance</Text>
            </View>
          </View>
          <View style={styles.pointsWrap}>
            <Text style={[styles.pointsValue, { color: levelColor }]}>
              {student.totalPoints.toLocaleString()}
            </Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const totalPoints = students.reduce((acc, s) => acc + s.totalPoints, 0);
  const avgAttendance = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length) : 0;

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Leaderboard</Text>
          <Text style={styles.pageSubtitle}>Islamic School rankings</Text>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <MaterialCommunityIcons name="trophy" size={20} color={COLORS.warning} />
            <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={20} color={COLORS.success} />
            <Text style={styles.statValue}>{students.length}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{avgAttendance}%</Text>
            <Text style={styles.statLabel}>Avg Attend.</Text>
          </GlassCard>
        </View>

        {loading ? (
          <View style={styles.skeletonSection}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} style={styles.skeletonRow} />)}
          </View>
        ) : students.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <GlassCard>
              <View style={styles.centeredContent}>
                <FloatingIcon icon={<MaterialCommunityIcons name="trophy-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No rankings yet</Text>
                <Text style={styles.emptySubtext}>Complete assignments to earn points!</Text>
              </View>
            </GlassCard>
          </View>
        ) : (
          <>
            {top3.length > 0 && renderTop3Podium()}

            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>All Rankings</Text>
              {rest.map((student, i) => renderStudentRow(student, i + 4))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.sm },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  podiumSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  podiumCard: { padding: SPACING.md },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end' },
  podiumItem: { alignItems: 'center' },
  podiumStudent: { alignItems: 'center', marginBottom: SPACING.xs },
  podiumAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  podiumRank: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: 4 },
  podiumName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  podiumPoints: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  levelBadgeText: { fontSize: 10, fontWeight: '600' },
  podiumBase: { width: '100%', borderTopWidth: 3, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  podiumBaseNum: { fontSize: 22, fontWeight: '800' },
  listSection: { paddingHorizontal: SPACING.md },
  studentCard: { marginBottom: SPACING.xs },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rankWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  studentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  studentLevel: { fontSize: 11, fontWeight: '600' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
  attendanceText: { fontSize: 11, color: COLORS.textSecondary },
  pointsWrap: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 16, fontWeight: '700' },
  pointsLabel: { fontSize: 10, color: COLORS.textSecondary },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  skeletonSection: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  skeletonRow: { height: 64, borderRadius: RADIUS.lg },
});
