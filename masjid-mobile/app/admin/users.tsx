import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type Role = 'admin' | 'staff' | 'teacher' | 'member' | 'student';
interface UserEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  joinedDate: string;
}
interface UserPage {
  users: UserEntry[];
  page: number;
  total: number;
  hasMore: boolean;
}
const ROLES: { value: string; title: string }[] = [
  { value: 'all', title: 'All' },
  { value: 'admin', title: 'Admins' },
  { value: 'staff', title: 'Staff' },
  { value: 'teacher', title: 'Teachers' },
  { value: 'member', title: 'Members' },
  { value: 'student', title: 'Students' },
];
const EDITABLE_ROLES: Role[] = ['member', 'student', 'teacher', 'staff'];

export default function UserManagementScreen() {
  const router = useRouter();
  const current = useAuthStore(state => state.user);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);

  const fetchPage = async (nextPage: number, append = false) => {
    const result = await api.instance.get<UserPage>('/mobile/admin/users', {
      params: { page: nextPage, q: search.trim(), role: role === 'all' ? undefined : role },
    });
    setUsers(old => append
      ? [...old, ...result.data.users.filter(u => !old.some(existing => existing.id === u.id))]
      : result.data.users);
    setPage(result.data.page);
    setHasMore(result.data.hasMore);
    setTotal(result.data.total);
    setError('');
  };

  useEffect(() => {
    if (current?.role !== 'admin') {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const response = await api.instance.get<UserPage>('/mobile/admin/users', {
          params: { page: 1, q: search.trim(), role: role === 'all' ? undefined : role },
        });
        if (active) {
          setUsers(response.data.users);
          setTotal(response.data.total);
          setHasMore(response.data.hasMore);
          setPage(1);
          setError('');
        }
      } catch {
        if (active) setError('Unable to load users. Check your connection and try again.');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [search, role, current?.role]);

  const refresh = async () => {
    setRefreshing(true);
    try { await fetchPage(1); }
    catch { setError('Unable to refresh users.'); }
    finally { setRefreshing(false); }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try { await fetchPage(page + 1, true); }
    catch { setError('Could not load the next page.'); }
    finally { setLoadingMore(false); }
  };

  const update = async (target: UserEntry, change: { role?: Role; isActive?: boolean }) => {
    setChanging(true);
    try {
      await api.instance.patch(`/mobile/admin/users/${encodeURIComponent(target.id)}`, change);
      setSelectedUser(null);
      await fetchPage(1);
    } catch {
      Alert.alert('Update unsuccessful', 'Could not save the change. Check your connection and permissions.');
    } finally { setChanging(false); }
  };

  const confirmToggle = (target: UserEntry) => {
    Alert.alert(
      target.isActive ? 'Deactivate account?' : 'Reactivate account?',
      `Change the account status for ${target.firstName} ${target.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => { void update(target, { isActive: !target.isActive }); } },
      ]
    );
  };

  if (current?.role !== 'admin') return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}><Text style={styles.muted}>Administrator access is required.</Text></View>
    </SafeAreaView>
  );

  const editable = (target: UserEntry) => target.role !== 'admin' && target.id !== current.id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.back} />
      </View>
      <View style={styles.filters}>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={21} color={COLORS.textSecondary} />
          <TextInput style={styles.input} value={search} onChangeText={setSearch}
            accessibilityLabel="Search users" placeholder="Search names or email" autoCapitalize="none"
            placeholderTextColor={COLORS.textSecondary} />
          {search.length > 0 && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear search"
              onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle-outline" size={21} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleList}>
          {ROLES.map(item => (
            <TouchableOpacity key={item.value} accessibilityRole="tab"
              accessibilityState={{ selected: role === item.value }}
              onPress={() => setRole(item.value)}
              style={[styles.chip, role === item.value && styles.chipActive]}>
              <Text style={[styles.chipText, role === item.value && styles.chipTextActive]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Text style={styles.count}>{total} accounts</Text>
      {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loading} /> : (
        <FlatList data={users} keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} />}
          ListEmptyComponent={
            <View style={styles.center}><Text style={styles.muted}>{error || 'No matching users.'}</Text></View>
          }
          ListFooterComponent={hasMore ? (
            <TouchableOpacity accessibilityRole="button" disabled={loadingMore} style={styles.loadMore}
              onPress={() => { void loadMore(); }}>
              <Text style={styles.actionText}>{loadingMore ? 'Loading…' : 'Load more users'}</Text>
            </TouchableOpacity>
          ) : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.firstName.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.details}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.meta}>{item.role} · {item.isActive ? 'Active' : 'Inactive'} · {item.isVerified ? 'Verified' : 'Unverified'}</Text>
                {editable(item) && (
                  <View style={styles.actions}>
                    <TouchableOpacity accessibilityRole="button" style={styles.action}
                      onPress={() => setSelectedUser(item)}>
                      <Text style={styles.actionText}>Change role</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" style={styles.action}
                      onPress={() => confirmToggle(item)}>
                      <Text style={[styles.actionText, !item.isActive && { color: COLORS.success }]}>
                        {item.isActive ? 'Deactivate' : 'Reactivate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}
      {!!error && users.length > 0 && <Text style={styles.error}>{error}</Text>}
      <Modal visible={selectedUser !== null} animationType="slide" transparent
        onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Change account role</Text>
            <Text style={styles.muted}>{selectedUser?.firstName} {selectedUser?.lastName}</Text>
            {EDITABLE_ROLES.map(value => (
              <TouchableOpacity key={value} accessibilityRole="button" disabled={changing}
                style={styles.roleOption}
                onPress={() => { if (selectedUser) void update(selectedUser, { role: value }); }}>
                <Text style={styles.name}>{value.charAt(0).toUpperCase() + value.slice(1)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity accessibilityRole="button" style={styles.cancel}
              onPress={() => setSelectedUser(null)}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  filters: { backgroundColor: COLORS.surface, paddingVertical: SPACING.sm },
  search: { minHeight: 48, marginHorizontal: SPACING.md, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    borderColor: COLORS.border, borderWidth: 1 },
  input: { flex: 1, fontSize: 16, color: COLORS.text, minHeight: 46 },
  roleList: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingTop: SPACING.sm },
  chip: { minHeight: 44, paddingHorizontal: SPACING.md, alignItems: 'center',
    justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: COLORS.background },
  chipActive: { backgroundColor: COLORS.primaryFaded },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary },
  count: { color: COLORS.textSecondary, fontSize: 12, marginHorizontal: SPACING.md, marginVertical: SPACING.sm },
  loading: { flex: 1 },
  list: { maxWidth: 900, width: '100%', alignSelf: 'center',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  card: { flexDirection: 'row', gap: SPACING.md, backgroundColor: COLORS.surface,
    padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: SPACING.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryFaded,
    alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  details: { flex: 1, minWidth: 0 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  email: { color: COLORS.textSecondary, fontSize: 13, marginTop: 3 },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primaryFaded, borderRadius: RADIUS.md },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  loadMore: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', padding: SPACING.xxl },
  muted: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },
  error: { color: COLORS.error, textAlign: 'center', padding: SPACING.sm },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalPanel: { maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: COLORS.surface,
    padding: SPACING.lg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
  modalTitle: { fontSize: 19, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  roleOption: { minHeight: 50, borderBottomWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', paddingHorizontal: SPACING.sm },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
});
