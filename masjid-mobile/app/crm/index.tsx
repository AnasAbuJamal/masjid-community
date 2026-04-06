import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const CRM_SECTIONS = [
  { id: 'donations', icon: 'heart', label: 'Donations CRM', color: '#FF6B6B', route: '/crm/donations' },
  { id: 'volunteers', icon: 'account-group', label: 'Volunteers', color: COLORS.primary, route: '/crm/volunteers' },
  { id: 'facilities', icon: 'door', label: 'Facilities', color: COLORS.secondary, route: '/crm/facilities' },
  { id: 'tasks', icon: 'checkbox-marked-outline', label: 'Tasks & Workflows', color: '#9C27B0', route: '/crm/tasks' },
  { id: 'reports', icon: 'chart-line', label: 'Reports & Analytics', color: COLORS.success, route: '/crm/reports' },
  { id: 'approvals', icon: 'check-circle-outline', label: 'Approvals', color: COLORS.warning, route: '/crm/approvals' },
];

const MOCK_STATS = {
  totalDonations: 156800,
  activeDonors: 234,
  volunteerHours: 1250,
  activeVolunteers: 45,
  pendingTasks: 28,
  openBookings: 12,
};

export default function CrmDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>CRM Dashboard</Text>
          <Text style={styles.subtitle}>Manage donations, volunteers, and more</Text>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <FloatingIcon icon={<MaterialCommunityIcons name="heart" size={20} color="#FF6B6B" />} size="sm" color="#FF6B6B" />
            <Text style={styles.statValue}>${(MOCK_STATS.totalDonations / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <FloatingIcon icon={<MaterialCommunityIcons name="account-multiple" size={20} color={COLORS.primary} />} size="sm" color={COLORS.primary} />
            <Text style={styles.statValue}>{MOCK_STATS.activeDonors}</Text>
            <Text style={styles.statLabel}>Active Donors</Text>
          </GlassCard>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <FloatingIcon icon={<MaterialCommunityIcons name="clock" size={20} color={COLORS.success} />} size="sm" color={COLORS.success} />
            <Text style={styles.statValue}>{MOCK_STATS.volunteerHours}</Text>
            <Text style={styles.statLabel}>Volunteer Hours</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <FloatingIcon icon={<MaterialCommunityIcons name="account-group" size={20} color={COLORS.secondary} />} size="sm" color={COLORS.secondary} />
            <Text style={styles.statValue}>{MOCK_STATS.activeVolunteers}</Text>
            <Text style={styles.statLabel}>Active Volunteers</Text>
          </GlassCard>
        </View>

        <View style={styles.quickStats}>
          <GlassCard style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <MaterialCommunityIcons name="clipboard-list" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.quickStatInfo}>
              <Text style={styles.quickStatValue}>{MOCK_STATS.pendingTasks}</Text>
              <Text style={styles.quickStatLabel}>Pending Tasks</Text>
            </View>
          </GlassCard>
          <GlassCard style={styles.quickStatCard}>
            <View style={[styles.quickStatIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="calendar-check" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.quickStatInfo}>
              <Text style={styles.quickStatValue}>{MOCK_STATS.openBookings}</Text>
              <Text style={styles.quickStatLabel}>Open Bookings</Text>
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CRM Sections</Text>
          <View style={styles.grid}>
            {CRM_SECTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.gridCard}>
                  <View style={[styles.gridIcon, { backgroundColor: item.color + '15' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={styles.gridLabel}>{item.label}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  quickStats: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  quickStatCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  quickStatIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  quickStatInfo: { marginLeft: SPACING.sm },
  quickStatValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  quickStatLabel: { fontSize: 11, color: COLORS.textSecondary },

  section: { padding: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  gridItem: { width: '48%' },
  gridCard: { alignItems: 'center', padding: SPACING.md },
  gridIcon: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  gridLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

  bottomSpacer: { height: 100 },
});
