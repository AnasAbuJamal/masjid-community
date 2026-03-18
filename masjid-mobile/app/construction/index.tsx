import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { ConstructionProject } from '../../services/api-service';

export default function ConstructionScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await apiService.construction.getAll();
      setProjects(data);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return COLORS.success;
    if (percent >= 40) return COLORS.primary;
    if (percent >= 20) return COLORS.warning;
    return COLORS.error;
  };

  const handleProjectPress = (project: ConstructionProject) => {
    Alert.alert(
      project.title,
      project.description || 'No description available.',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.pageTitle}>Construction</Text>
      <Text style={styles.pageSubtitle}>Track our expansion progress</Text>

      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryIcon}>
            <MaterialCommunityIcons name="warehouse" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Total Projects</Text>
            <Text style={styles.summaryValue}>{projects.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Urgent</Text>
            <Text style={[styles.summaryValue, { color: COLORS.error }]}>
              {projects.filter(p => p.isUrgent).length}
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderProject = ({ item }: { item: ConstructionProject }) => {
    const progressColor = getProgressColor(item.progressPercent);
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleProjectPress(item)}>
        <GlassCard style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <View style={styles.projectTitleRow}>
              <View style={[styles.projectIcon, { backgroundColor: progressColor + '18' }]}>
                <MaterialCommunityIcons name="hammer-wrench" size={20} color={progressColor} />
              </View>
              <View style={styles.projectTitleContent}>
                <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.projectPercent}>{item.progressPercent}% complete</Text>
              </View>
              {item.isUrgent && (
                <View style={styles.urgentBadge}>
                  <MaterialCommunityIcons name="alert" size={14} color={COLORS.white} />
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
          </View>

          {item.description && (
            <Text style={styles.projectDesc} numberOfLines={2}>{item.description}</Text>
          )}

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progressPercent}%`, backgroundColor: progressColor }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressStart}>0%</Text>
              <Text style={styles.progressEnd}>100%</Text>
            </View>
          </View>

          <View style={styles.projectFooter}>
            <View style={styles.footerStat}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={progressColor} />
              <Text style={[styles.footerStatText, { color: progressColor }]}>
                {item.progressPercent >= 100 ? 'Completed' : 'In Progress'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonContent}>
            <Skeleton style={styles.skeletonIcon} />
            <View style={{ flex: 1, gap: SPACING.xs }}>
              <Skeleton style={styles.skeletonTitle} />
              <Skeleton style={styles.skeletonBody} />
              <Skeleton style={styles.skeletonBar} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={projects}
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  summaryCard: { marginTop: SPACING.xs },
  summaryContent: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  summaryIcon: { width: 52, height: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  summaryText: { flex: 1, alignItems: 'center' },
  summaryTitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  summaryDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  projectCard: { overflow: 'hidden' },
  projectHeader: { marginBottom: SPACING.sm },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  projectIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  projectTitleContent: { flex: 1 },
  projectTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  projectPercent: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.error, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  urgentText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  projectDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.sm },
  progressSection: { marginBottom: SPACING.sm },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressStart: { fontSize: 10, color: COLORS.textSecondary },
  progressEnd: { fontSize: 10, color: COLORS.textSecondary },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerStatText: { fontSize: 12, fontWeight: '600' },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  skeletonCard: { borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surface, padding: SPACING.md },
  skeletonContent: { flexDirection: 'row', gap: SPACING.sm },
  skeletonIcon: { width: 40, height: 40, borderRadius: RADIUS.md },
  skeletonTitle: { height: 18, width: '70%', borderRadius: RADIUS.sm },
  skeletonBody: { height: 14, width: '90%', borderRadius: RADIUS.sm },
  skeletonBar: { height: 8, borderRadius: RADIUS.full },
});
