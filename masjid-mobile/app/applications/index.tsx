import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { JobApplication, VolunteerApplication } from '../../services/api-service';

type TabKey = 'jobs' | 'volunteers';

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  submitted: { label: 'Submitted', color: COLORS.primary, icon: 'send' },
  reviewed: { label: 'Reviewed', color: COLORS.warning, icon: 'eye-check' },
  shortlisted: { label: 'Shortlisted', color: COLORS.secondary, icon: 'star' },
  hired: { label: 'Hired', color: COLORS.success, icon: 'check-circle' },
  declined: { label: 'Declined', color: COLORS.error, icon: 'close-circle' },
};

const VOL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: COLORS.warning, icon: 'clock-outline' },
  approved: { label: 'Approved', color: COLORS.success, icon: 'check-circle' },
  rejected: { label: 'Rejected', color: COLORS.error, icon: 'close-circle' },
};

export default function MyApplicationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('jobs');
  const [jobApps, setJobApps] = useState<JobApplication[]>([]);
  const [volApps, setVolApps] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await apiService.applications.getMyApplications();
      setJobApps(data.jobs);
      setVolApps(data.volunteers);
    } catch {
      setJobApps([]);
      setVolApps([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
    { key: 'volunteers', label: 'Volunteer', icon: 'hand-heart-outline' },
  ];

  const renderJobApp = ({ item }: { item: JobApplication }) => {
    const status = JOB_STATUS_CONFIG[item.status] || JOB_STATUS_CONFIG.submitted;
    return (
      <GlassCard style={styles.appCard}>
        <View style={styles.appHeader}>
          <View style={styles.appTitleGroup}>
            <Text style={styles.appTitle}>{item.jobTitle}</Text>
            <Text style={styles.appSubtitle}>{item.company}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <MaterialCommunityIcons name={status.icon as any} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.appFooter}>
          <View style={styles.appDate}>
            <MaterialCommunityIcons name="calendar-check-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.appDateText}>Applied {item.appliedAt}</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderVolApp = ({ item }: { item: VolunteerApplication }) => {
    const status = VOL_STATUS_CONFIG[item.status] || VOL_STATUS_CONFIG.pending;
    return (
      <GlassCard style={styles.appCard}>
        <View style={styles.appHeader}>
          <View style={styles.appTitleGroup}>
            <Text style={styles.appTitle}>{item.title}</Text>
            <Text style={styles.appSubtitle}>Event: {item.eventDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <MaterialCommunityIcons name={status.icon as any} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.appFooter}>
          <View style={styles.appDate}>
            <MaterialCommunityIcons name="calendar-check-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.appDateText}>Applied {item.appliedAt}</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderEmpty = (type: string) => (
    <View style={styles.emptyWrapper}>
      <GlassCard>
        <View style={styles.centeredContent}>
          <FloatingIcon
            icon={
              <MaterialCommunityIcons
                name={type === 'jobs' ? 'briefcase-outline' : 'hand-heart-outline'}
                size={32}
                color={COLORS.textSecondary}
              />
            }
            size="lg"
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>
            No {type === 'jobs' ? 'job' : 'volunteer'} applications
          </Text>
          <Text style={styles.emptySubtext}>
            Your submitted applications will appear here
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push(type === 'jobs' ? '/jobs' as any : '/community' as any)}
          >
            <Text style={styles.browseBtnText}>Browse Opportunities</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>My Applications</Text>
        <Text style={styles.pageSubtitle}>Track your submitted applications</Text>
      </View>

      <View style={styles.tabBarSection}>
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
          {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 88, borderRadius: RADIUS.lg }} />)}
        </View>
      ) : activeTab === 'jobs' ? (
        <FlatList
          data={jobApps}
          keyExtractor={item => item.id}
          renderItem={renderJobApp}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={renderEmpty('jobs')}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      ) : (
        <FlatList
          data={volApps}
          keyExtractor={item => item.id}
          renderItem={renderVolApp}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={renderEmpty('volunteers')}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  tabBarSection: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: SPACING.xs, gap: SPACING.xs, borderRadius: RADIUS.lg },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.md, gap: 6 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  appCard: { overflow: 'hidden' },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  appTitleGroup: { flex: 1, marginRight: SPACING.sm },
  appTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  appSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '600' },
  appFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  appDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appDateText: { fontSize: 12, color: COLORS.textSecondary },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  browseBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderRadius: RADIUS.md, marginTop: SPACING.sm },
  browseBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
});
