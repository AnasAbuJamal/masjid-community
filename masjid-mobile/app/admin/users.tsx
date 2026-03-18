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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'teacher' | 'member' | 'student';
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Ahmed Hassan', email: 'ahmed@masjid.com', role: 'admin', status: 'active', joinedDate: '2024-01-15' },
  { id: '2', name: 'Fatima Al-Rashid', email: 'fatima@masjid.com', role: 'staff', status: 'active', joinedDate: '2024-02-20' },
  { id: '3', name: 'Omar Malik', email: 'omar@masjid.com', role: 'teacher', status: 'active', joinedDate: '2024-03-10' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah@email.com', role: 'member', status: 'active', joinedDate: '2024-04-05' },
  { id: '5', name: 'Ali Khan', email: 'ali@email.com', role: 'student', status: 'pending', joinedDate: '2024-05-12' },
  { id: '6', name: 'Yusuf Ibrahim', email: 'yusuf@email.com', role: 'member', status: 'inactive', joinedDate: '2023-11-20' },
];

const ROLES = ['All', 'Admin', 'Staff', 'Teacher', 'Member', 'Student'];

export default function UserManagementScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === 'All' || user.role.toLowerCase() === selectedRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return COLORS.error;
      case 'staff': return COLORS.primary;
      case 'teacher': return COLORS.secondary;
      case 'member': return COLORS.success;
      case 'student': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'inactive': return COLORS.error;
      case 'pending': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const roleColor = getRoleColor(item.role);
    const statusColor = getStatusColor(item.status);
    
    return (
      <GlassCard style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>{item.role}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          data={ROLES}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rolesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.roleChip, selectedRole === item && styles.roleChipActive]}
              onPress={() => setSelectedRole(item)}
            >
              <Text style={[styles.roleChipText, selectedRole === item && styles.roleChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USERS.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {MOCK_USERS.filter(u => u.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {MOCK_USERS.filter(u => u.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.error }]}>
            {MOCK_USERS.filter(u => u.status === 'inactive').length}
          </Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
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

  filterSection: { padding: SPACING.md, backgroundColor: COLORS.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, marginLeft: SPACING.sm },
  rolesList: { gap: SPACING.xs },
  roleChip: { paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2, backgroundColor: COLORS.background, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  roleChipTextActive: { color: COLORS.white },

  statsBar: { flexDirection: 'row', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  listContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  userAvatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  userMeta: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs },
  roleBadge: { paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.full },
  roleText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xs + 2, paddingVertical: 2, borderRadius: RADIUS.full, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  menuButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.md },
});