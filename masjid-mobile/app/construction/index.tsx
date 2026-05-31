import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, FloatingIcon, Skeleton, ScreenHeader } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { ConstructionProject } from '../../services/api-service';

export default function ConstructionScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await apiService.construction.getAll();
      setProjects(data);
    } catch { setProjects([]); }
    setLoading(false);
  };

  const handleRefresh = async () => { setRefreshing(true); await loadProjects(); setRefreshing(false); };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return COLORS.success;
    if (percent >= 40) return COLORS.primary;
    if (percent >= 20) return COLORS.warning;
    return COLORS.error;
  };

  const getProgressLabel = (percent: number) => {
    if (percent >= 100) return 'Completed';
    if (percent >= 75) return 'Almost Done';
    if (percent >= 40) return 'In Progress';
    if (percent >= 20) return 'Started';
    return 'Planning';
  };

  const handleDonate = () => {
    Alert.alert('Support Construction', 'Your donations help us build and expand. Would you like to contribute?', [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Donate Now', onPress: () => Linking.openURL('https://masjidalmomineen.com/donate') },
    ]);
  };

  const sorted = [...projects].sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    return b.progressPercent - a.progressPercent;
  });

  const totalProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length) : 0;

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>Construction</Text>
            <Text style={styles.pageSubtitle}>Track our expansion progress</Text>
          </View>
          <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
            <MaterialCommunityIcons name="hand-heart" size={16} color={COLORS.white} />
            <Text style={styles.donateButtonText}>Donate</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="warehouse" size={22} color={COLORS.primary} />
              <Text style={styles.summaryValue}>{projects.length}</Text>
              <Text style={styles.summaryLabel}>Projects</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="percent" size={22} color={COLORS.primary} />
              <Text style={[styles.summaryValue, { color: getProgressColor(totalProgress) }]}>{totalProgress}%</Text>
              <Text style={styles.summaryLabel}>Complete</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="alert-circle" size={22} color={COLORS.error} />
              <Text style={[styles.summaryValue, { color: COLORS.error }]}>{projects.filter(p => p.isUrgent).length}</Text>
              <Text style={styles.summaryLabel}>Urgent</Text>
            </View>
          </View>
        </GlassCard>

        {/* Overall Progress Bar */}
        {projects.length > 0 && (
          <View style={styles.overallProgress}>
            <View style={styles.overallProgressHeader}>
              <Text style={styles.overallProgressLabel}>Overall Progress</Text>
              <Text style={[styles.overallProgressPct, { color: getProgressColor(totalProgress) }]}>{totalProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${totalProgress}%`, backgroundColor: getProgressColor(totalProgress) }]} />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderProject = ({ item }: { item: ConstructionProject }) => {
    const progressColor = getProgressColor(item.progressPercent);
    const statusLabel = getProgressLabel(item.progressPercent);
    return (
      <GlassCard style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectTitleRow}>
            <View style={[styles.projectIcon, { backgroundColor: progressColor + '18' }]}>
              <MaterialCommunityIcons name="hammer-wrench" size={20} color={progressColor} />
            </View>
            <View style={styles.projectTitleContent}>
              <View style={styles.projectTitleRow2}>
                <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                {item.isUrgent && (
                  <View style={styles.urgentBadge}>
                    <MaterialCommunityIcons name="alert" size={10} color={COLORS.white} />
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot2, { backgroundColor: progressColor }]} />
                <Text style={styles.statusLabel}>{statusLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.projectDesc} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>{item.progressPercent}%</Text>
            <Text style={styles.progressRemaining}>{100 - item.progressPercent}% remaining</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.progressPercent}%`, backgroundColor: progressColor }]} />
          </View>
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.footerStat}>
            <MaterialCommunityIcons name="check-circle-outline" size={14} color={progressColor} />
            <Text style={[styles.footerStatText, { color: progressColor }]}>
              {item.progressPercent >= 100 ? 'Completed' : 'In Progress'}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailButton} onPress={() => {
            Alert.alert(item.title, item.description || 'No description available.', [
              { text: 'Close', style: 'cancel' },
              { text: 'Support This Project', onPress: handleDonate },
            ]);
          }}>
            <Text style={styles.detailButtonText}>Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
      <View style={styles.skeletonCard}>
        <Skeleton style={{ height: 80, borderRadius: RADIUS.lg }} />
      </View>
      <View style={styles.skeletonCard}>
        <Skeleton style={{ height: 80, borderRadius: RADIUS.lg }} />
      </View>
      <View style={styles.skeletonCard}>
        <Skeleton style={{ height: 80, borderRadius: RADIUS.lg }} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Construction" showBack />

      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={renderProject}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <GlassCard>
                <View style={styles.centeredContent}>
                  <FloatingIcon icon={<MaterialCommunityIcons name="hammer-wrench" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                  <Text style={styles.emptyTitle}>No projects</Text>
                  <Text style={styles.emptySubtext}>Construction updates will appear here</Text>
                </View>
              </GlassCard>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  headerText: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  donateButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  donateButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  summaryCard: { marginBottom: SPACING.md },
  summaryContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  overallProgress: { marginBottom: SPACING.md },
  overallProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  overallProgressLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  overallProgressPct: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  projectCard: { overflow: 'hidden' },
  projectHeader: { marginBottom: SPACING.sm },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  projectIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  projectTitleContent: { flex: 1 },
  projectTitleRow2: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  projectTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.error, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  urgentText: { fontSize: 9, fontWeight: '700', color: COLORS.white },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot2: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  projectDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.sm },
  progressSection: { marginBottom: SPACING.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  progressRemaining: { fontSize: 12, color: COLORS.textSecondary },
  progressBarBg: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: RADIUS.full },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerStatText: { fontSize: 12, fontWeight: '600' },
  detailButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailButtonText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  skeletonCard: { borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surface, padding: SPACING.md },
});
