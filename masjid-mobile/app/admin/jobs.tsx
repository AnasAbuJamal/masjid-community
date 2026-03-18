import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Job {
  id: string;
  title: string;
  type: 'full-time' | 'part-time' | 'contract' | 'volunteer';
  department: string;
  salary: string;
  location: string;
  status: 'active' | 'closed' | 'draft';
  applicants: number;
  postedDate: string;
}

const MOCK_JOBS: Job[] = [
  { id: '1', title: 'Arabic Language Teacher', type: 'part-time', department: 'Education', salary: '$25-35/hr', location: 'On-site', status: 'active', applicants: 8, postedDate: '2026-03-10' },
  { id: '2', title: 'Administrative Assistant', type: 'full-time', department: 'Operations', salary: '$40,000-50,000', location: 'On-site', status: 'active', applicants: 12, postedDate: '2026-03-05' },
  { id: '3', title: 'Maintenance Technician', type: 'full-time', department: 'Facilities', salary: '$45,000-55,000', location: 'On-site', status: 'active', applicants: 5, postedDate: '2026-02-28' },
  { id: '4', title: 'Youth Program Coordinator', type: 'part-time', department: 'Youth', salary: '$20-25/hr', location: 'Hybrid', status: 'closed', applicants: 15, postedDate: '2026-02-15' },
  { id: '5', title: 'Weekend Security Guard', type: 'contract', department: 'Security', salary: '$18/hr', location: 'On-site', status: 'draft', applicants: 0, postedDate: '2026-03-18' },
];

const JOB_TYPES = ['All', 'full-time', 'part-time', 'contract', 'volunteer'];
const STATUSES = ['All', 'active', 'closed', 'draft'];

export default function JobManagementScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.department.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || job.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return COLORS.success;
      case 'part-time': return COLORS.primary;
      case 'contract': return COLORS.warning;
      case 'volunteer': return COLORS.secondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'closed': return COLORS.error;
      case 'draft': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const handleCreateJob = () => {
    Alert.alert(
      'Create New Job',
      'This would open a form to create a new job posting.',
      [{ text: 'OK' }]
    );
  };

  const handleEditJob = (job: Job) => {
    Alert.alert('Edit Job', `Edit "${job.title}"?`, [{ text: 'OK' }]);
  };

  const handleDeleteJob = (job: Job) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const renderJob = ({ item }: { item: Job }) => {
    const typeColor = getTypeColor(item.type);
    const statusColor = getStatusColor(item.status);
    
    return (
      <GlassCard style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.jobMeta}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>{item.type.replace('-', ' ')}</Text>
            </View>
            <Text style={styles.departmentText}>{item.department}</Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="currency-usd" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.salary}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-group" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.applicants} applicants</Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <Text style={styles.postedDate}>Posted {item.postedDate}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleEditJob(item)}>
              <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <MaterialCommunityIcons name="eye" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteJob(item)}>
              <MaterialCommunityIcons name="delete" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateJob}>
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_JOBS.filter(j => j.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{MOCK_JOBS.filter(j => j.status === 'closed').length}</Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.textSecondary }]}>{MOCK_JOBS.filter(j => j.status === 'draft').length}</Text>
          <Text style={styles.statLabel}>Draft</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_JOBS.reduce((a, j) => a + j.applicants, 0)}</Text>
          <Text style={styles.statLabel}>Total Applicants</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
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

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={item => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="briefcase-search" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No jobs found</Text>
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
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },

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
  jobCard: { padding: SPACING.md },
  jobHeader: { marginBottom: SPACING.sm },
  jobTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs },
  jobTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  typeBadge: { paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.full },
  typeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  departmentText: { fontSize: 12, color: COLORS.textSecondary },

  jobDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: COLORS.textSecondary },

  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  postedDate: { fontSize: 11, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACING.xs },
  actionButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.md },
});