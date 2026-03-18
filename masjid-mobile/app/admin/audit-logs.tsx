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
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityType: 'user' | 'donation' | 'job' | 'announcement' | 'event' | 'volunteer' | 'proposal';
  user: string;
  timestamp: string;
  details?: string;
}

const MOCK_LOGS: AuditLog[] = [
  { id: '1', action: 'CREATE', entity: 'New donation received', entityType: 'donation', user: 'System', timestamp: '2026-03-18T14:30:00Z', details: '$500 from ahmad@email.com' },
  { id: '2', action: 'LOGIN', entity: 'User logged in', entityType: 'user', user: 'fatima@email.com', timestamp: '2026-03-18T13:45:00Z' },
  { id: '3', action: 'UPDATE', entity: 'Job posting updated', entityType: 'job', user: 'admin@masjid.com', timestamp: '2026-03-18T12:20:00Z', details: 'Arabic Teacher position' },
  { id: '4', action: 'APPROVE', entity: 'Volunteer application approved', entityType: 'volunteer', user: 'admin@masjid.com', timestamp: '2026-03-18T11:15:00Z', details: 'Omar Malik for Ramadan Iftar' },
  { id: '5', action: 'CREATE', entity: 'Announcement published', entityType: 'announcement', user: 'staff@masjid.com', timestamp: '2026-03-18T10:00:00Z', details: 'Friday Prayer reminder' },
  { id: '6', action: 'VOTE', entity: 'Proposal voted on', entityType: 'proposal', user: 'sarah@email.com', timestamp: '2026-03-17T16:30:00Z', details: 'New Parking Lot Expansion' },
  { id: '7', action: 'REGISTER', entity: 'New user registered', entityType: 'user', user: 'newuser@email.com', timestamp: '2026-03-17T14:00:00Z' },
  { id: '8', action: 'ENROLL', entity: 'Class enrollment', entityType: 'event', user: 'ali@email.com', timestamp: '2026-03-17T12:45:00Z', details: 'Quran Recitation - Beginner' },
  { id: '9', action: 'DELETE', entity: 'Old announcement removed', entityType: 'announcement', user: 'admin@masjid.com', timestamp: '2026-03-16T09:30:00Z', details: 'Past Ramadan event' },
  { id: '10', action: 'UPDATE', entity: 'Prayer times modified', entityType: 'event', user: 'admin@masjid.com', timestamp: '2026-03-15T08:00:00Z', details: 'Updated Ramadan schedule' },
];

const ACTIONS = ['All', 'CREATE', 'LOGIN', 'UPDATE', 'APPROVE', 'VOTE', 'REGISTER', 'ENROLL', 'DELETE'];
const ENTITIES = ['All', 'user', 'donation', 'job', 'announcement', 'volunteer', 'proposal', 'event'];

export default function AuditLogsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedEntity, setSelectedEntity] = useState('All');

  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = log.entity.toLowerCase().includes(search.toLowerCase()) || 
                          log.user.toLowerCase().includes(search.toLowerCase());
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    const matchesEntity = selectedEntity === 'All' || log.entityType === selectedEntity;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return COLORS.success;
      case 'UPDATE': return COLORS.primary;
      case 'DELETE': return COLORS.error;
      case 'APPROVE': return COLORS.success;
      case 'LOGIN': return COLORS.secondary;
      default: return COLORS.textSecondary;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'user': return 'account';
      case 'donation': return 'heart';
      case 'job': return 'briefcase';
      case 'announcement': return 'bullhorn';
      case 'volunteer': return 'hand-heart';
      case 'proposal': return 'lightbulb';
      case 'event': return 'calendar';
      default: return 'file-document';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const renderLog = ({ item }: { item: AuditLog }) => {
    const actionColor = getActionColor(item.action);
    return (
      <GlassCard style={styles.logCard}>
        <View style={[styles.actionBadge, { backgroundColor: actionColor + '18' }]}>
          <Text style={[styles.actionText, { color: actionColor }]}>{item.action}</Text>
        </View>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <View style={[styles.entityIcon, { backgroundColor: COLORS.surface }]}>
              <MaterialCommunityIcons name={getEntityIcon(item.entityType) as any} size={16} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.logEntity}>{item.entity}</Text>
          </View>
          {item.details && <Text style={styles.logDetails}>{item.details}</Text>}
          <View style={styles.logFooter}>
            <Text style={styles.logUser}>by {item.user}</Text>
            <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
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
        <Text style={styles.headerTitle}>Audit Logs</Text>
        <TouchableOpacity style={styles.exportButton}>
          <MaterialCommunityIcons name="export" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          data={ACTIONS}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedAction === item && styles.filterChipActive]}
              onPress={() => setSelectedAction(item)}
            >
              <Text style={[styles.filterChipText, selectedAction === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          horizontal
          data={ENTITIES}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedEntity === item && styles.filterChipActive]}
              onPress={() => setSelectedEntity(item)}
            >
              <Text style={[styles.filterChipText, selectedEntity === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{filteredLogs.length} entries found</Text>
        <Text style={styles.statsText}>Last 30 days</Text>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No logs found</Text>
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
  exportButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  filterSection: { padding: SPACING.md, backgroundColor: COLORS.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: SPACING.sm },
  filterList: { gap: SPACING.xs },
  filterChip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, backgroundColor: COLORS.background, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.white },

  statsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statsText: { fontSize: 12, color: COLORS.textSecondary },

  listContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  logCard: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md },
  actionBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, marginRight: SPACING.sm },
  actionText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  entityIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xs },
  logEntity: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  logDetails: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  logUser: { fontSize: 11, color: COLORS.primary },
  logTime: { fontSize: 11, color: COLORS.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.md },
});