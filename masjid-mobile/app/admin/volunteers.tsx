import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface VolunteerApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  opportunity: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  notes?: string;
}

const MOCK_APPLICATIONS: VolunteerApplication[] = [
  { id: '1', applicantName: 'Omar Malik', applicantEmail: 'omar@email.com', opportunity: 'Ramadan Iftar Program', status: 'pending', appliedDate: '2026-03-17' },
  { id: '2', applicantName: 'Fatima Hassan', applicantEmail: 'fatima@email.com', opportunity: 'Community Cleanup Day', status: 'pending', appliedDate: '2026-03-16' },
  { id: '3', applicantName: 'Ali Khan', applicantEmail: 'ali@email.com', opportunity: 'Eid Preparation', status: 'pending', appliedDate: '2026-03-15' },
  { id: '4', applicantName: 'Sarah Johnson', applicantEmail: 'sarah@email.com', opportunity: 'Youth Islamic Quiz Night', status: 'approved', appliedDate: '2026-03-10', notes: 'Great experience with youth programs' },
  { id: '5', applicantName: 'Ahmed Ibrahim', applicantEmail: 'ahmed@email.com', opportunity: 'Ramadan Iftar Program', status: 'approved', appliedDate: '2026-03-08' },
  { id: '6', applicantName: 'Yusuf Rahman', applicantEmail: 'yusuf@email.com', opportunity: 'Friday Prayer Setup', status: 'rejected', appliedDate: '2026-03-05', notes: 'Schedule conflict' },
  { id: '7', applicantName: 'Aisha Mohamed', applicantEmail: 'aisha@email.com', opportunity: 'Quran Workshop', status: 'pending', appliedDate: '2026-03-18' },
];

const STATUSES = ['All', 'pending', 'approved', 'rejected'];

export default function VolunteerApprovalScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedApp, setSelectedApp] = useState<VolunteerApplication | null>(null);

  const filteredApps = MOCK_APPLICATIONS.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(search.toLowerCase()) || 
                          app.opportunity.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = MOCK_APPLICATIONS.filter(a => a.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const handleApprove = (app: VolunteerApplication) => {
    setSelectedApp(null);
  };

  const handleReject = (app: VolunteerApplication) => {
    setSelectedApp(null);
  };

  const renderApplication = ({ item }: { item: VolunteerApplication }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <GlassCard style={styles.appCard}>
        <View style={styles.appHeader}>
          <View style={styles.appAvatar}>
            <Text style={styles.appAvatarText}>{item.applicantName.charAt(0)}</Text>
          </View>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>{item.applicantName}</Text>
            <Text style={styles.appEmail}>{item.applicantEmail}</Text>
            <Text style={styles.appOpportunity}>{item.opportunity}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.appFooter}>
          <Text style={styles.appDate}>Applied {item.appliedDate}</Text>
          {item.status === 'pending' && (
            <View style={styles.appActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item)}
              >
                <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item)}
              >
                <MaterialCommunityIcons name="close" size={14} color={COLORS.error} />
                <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <MaterialCommunityIcons name="note-text" size={14} color={COLORS.textSecondary} />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Volunteer Applications</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{pendingCount}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_APPLICATIONS.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{MOCK_APPLICATIONS.filter(a => a.status === 'approved').length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{MOCK_APPLICATIONS.filter(a => a.status === 'rejected').length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applicants..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          data={STATUSES}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedStatus === item && styles.filterChipActive]}
              onPress={() => setSelectedStatus(item)}
            >
              <Text style={[styles.filterChipText, selectedStatus === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApps}
        keyExtractor={item => item.id}
        renderItem={renderApplication}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No applications found</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
      />
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
  pendingBadge: { backgroundColor: COLORS.warning, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  pendingText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

  statsBar: { flexDirection: 'row', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textSecondary },

  filterSection: { padding: SPACING.md, backgroundColor: COLORS.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: SPACING.sm },
  filterList: { gap: SPACING.xs },
  filterChip: { paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs, backgroundColor: COLORS.background, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'capitalize' },
  filterChipTextActive: { color: COLORS.white },

  listContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  appCard: { padding: SPACING.md },
  appHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  appAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  appAvatarText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  appEmail: { fontSize: 12, color: COLORS.textSecondary },
  appOpportunity: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  appFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appDate: { fontSize: 11, color: COLORS.textSecondary },
  appActions: { flexDirection: 'row', gap: SPACING.xs },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.md, gap: 4 },
  approveButton: { backgroundColor: COLORS.success },
  rejectButton: { backgroundColor: COLORS.errorLight },
  actionButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.white },

  notesSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: RADIUS.sm, marginTop: SPACING.sm, gap: SPACING.xs },
  notesText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.md },
});