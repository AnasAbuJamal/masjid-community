import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, EmptyState } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { StudentApplication } from '../../services/api-service';

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: COLORS.warning + '20', text: COLORS.warning, icon: 'clock-outline', label: 'Pending Review' },
  approved: { bg: COLORS.success + '20', text: COLORS.success, icon: 'check-circle-outline', label: 'Approved' },
  rejected: { bg: COLORS.error + '20', text: COLORS.error, icon: 'close-circle-outline', label: 'Rejected' },
};

export default function MyApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      const data = await apiService.school.getMyApplications();
      setApplications(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const renderApplicationCard = (app: StudentApplication) => {
    const config = statusConfig[app.status] || statusConfig.pending;
    return (
      <GlassCard key={app.id} style={styles.appCard}>
        <View style={styles.appHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <MaterialCommunityIcons name={config.icon as any} size={14} color={config.text} />
            <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
          </View>
          <Text style={styles.appDate}>
            {new Date(app.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <Text style={styles.studentName}>{app.studentName}</Text>
        
        <View style={styles.appDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="school-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{app.gradeLevel}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="book-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{app.programName}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{app.parentName}</Text>
          </View>
        </View>

        {app.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{app.notes}</Text>
          </View>
        )}
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ title: 'My Applications' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '15' }]}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Enrollment Applications</Text>
          <Text style={styles.subtitle}>Track the status of your submitted applications</Text>
        </View>

        {applications.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
              <Text style={[styles.statNumber, { color: COLORS.success }]}>{approvedCount}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.error + '15' }]}>
              <Text style={[styles.statNumber, { color: COLORS.error }]}>{rejectedCount}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        )}

        {applications.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={<MaterialCommunityIcons name="file-document-outline" size={48} color={COLORS.textSecondary} />}
              title="No Applications Yet"
              message="You haven't submitted any enrollment applications yet. Enroll your child to get started."
            />
          </GlassCard>
        ) : (
          <View style={styles.applicationsList}>
            <Text style={styles.sectionTitle}>Your Applications</Text>
            {applications.map(renderApplicationCard)}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.warning },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  applicationsList: { gap: SPACING.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm },
  appCard: { padding: SPACING.md },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '600' },
  appDate: { fontSize: 12, color: COLORS.textSecondary },
  studentName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  appDetails: { gap: SPACING.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  detailText: { fontSize: 13, color: COLORS.textSecondary },
  notesSection: { marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: COLORS.background, borderRadius: RADIUS.md },
  notesLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  notesText: { fontSize: 12, color: COLORS.textSecondary },
});