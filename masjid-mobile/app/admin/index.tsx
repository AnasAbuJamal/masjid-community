import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

const STATS: StatCard[] = [
  { title: 'Total Members', value: '1,234', change: '+12%', icon: 'account-group', color: COLORS.primary },
  { title: 'Active Students', value: '89', change: '+5%', icon: 'school', color: COLORS.secondary },
  { title: 'Monthly Donations', value: '$24.5K', change: '+18%', icon: 'heart', color: COLORS.success },
  { title: 'Volunteers', value: '156', change: '+8%', icon: 'hand-heart', color: COLORS.warning },
];

const RECENT_ACTIVITY = [
  { id: '1', type: 'donation', message: 'New donation: $500', time: '5 min ago', icon: 'heart' },
  { id: '2', type: 'registration', message: 'New member registered', time: '15 min ago', icon: 'account-plus' },
  { id: '3', type: 'volunteer', message: '5 new volunteers signed up', time: '1 hour ago', icon: 'hand-heart' },
  { id: '4', type: 'job', message: 'New job application', time: '2 hours ago', icon: 'briefcase' },
];

const PENDING_ITEMS = [
  { id: '1', type: 'application', title: '3 job applications pending review', count: 3, icon: 'file-document' },
  { id: '2', type: 'proposal', title: '2 proposals need approval', count: 2, icon: 'lightbulb' },
  { id: '3', type: 'announcement', title: '1 announcement awaiting', count: 1, icon: 'bullhorn' },
];

export default function AdminDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialCommunityIcons name="cog" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, Admin</Text>
          <Text style={styles.welcomeSubtext}>Here's what's happening today</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <GlassCard key={stat.title} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '18' }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <View style={styles.statChange}>
                <MaterialCommunityIcons name="arrow-up" size={12} color={COLORS.success} />
                <Text style={styles.statChangeText}>{stat.change}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Add Member', icon: 'account-plus', color: COLORS.primary, route: '' },
            { label: 'Create Event', icon: 'calendar-plus', color: COLORS.secondary, route: '' },
            { label: 'Post Announcement', icon: 'bullhorn', color: COLORS.warning, route: '/admin/announcements' },
            { label: 'Manage Jobs', icon: 'briefcase', color: COLORS.success, route: '/admin/jobs' },
            { label: 'Audit Logs', icon: 'file-document', color: COLORS.accent, route: '/admin/audit-logs' },
            { label: 'Volunteers', icon: 'hand-heart', color: COLORS.secondary, route: '/admin/volunteers' },
          ].map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionButton} onPress={() => action.route ? router.push(action.route as any) : {}}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                <MaterialCommunityIcons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Items */}
        <Text style={styles.sectionTitle}>Pending Actions</Text>
        <GlassCard style={styles.pendingCard}>
          {PENDING_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.pendingItem, index < PENDING_ITEMS.length - 1 && styles.pendingItemBorder]}
              onPress={() => {}}
            >
              <View style={styles.pendingIcon}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>{item.title}</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{item.count}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <GlassCard>
          {RECENT_ACTIVITY.map((item, index) => (
            <View key={item.id} style={[styles.activityItem, index < RECENT_ACTIVITY.length - 1 && styles.activityItemBorder]}>
              <View style={styles.activityIcon}>
                <MaterialCommunityIcons name={item.icon as any} size={16} color={COLORS.textSecondary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityMessage}>{item.message}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* System Info */}
        <View style={styles.systemInfo}>
          <Text style={styles.systemInfoText}>Masjid Al-Momineen v1.0.0 • Last sync: Just now</Text>
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  headerRight: { flexDirection: 'row', gap: SPACING.xs },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  welcomeSection: { marginBottom: SPACING.md },
  welcomeText: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  welcomeSubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { width: '48%', padding: SPACING.md, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statTitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statChange: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statChangeText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm, marginTop: SPACING.md, textTransform: 'uppercase', letterSpacing: 0.5 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionButton: { width: '31%', alignItems: 'center', padding: SPACING.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  actionLabel: { fontSize: 11, color: COLORS.text, textAlign: 'center', fontWeight: '500' },

  pendingCard: { padding: 0 },
  pendingItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  pendingItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pendingIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  pendingContent: { flex: 1 },
  pendingTitle: { fontSize: 14, color: COLORS.text },
  pendingBadge: { backgroundColor: COLORS.error + '18', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginRight: SPACING.xs },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.error },

  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  activityItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  activityIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  activityContent: { flex: 1 },
  activityMessage: { fontSize: 13, color: COLORS.text },
  activityTime: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  systemInfo: { alignItems: 'center', marginTop: SPACING.lg },
  systemInfoText: { fontSize: 11, color: COLORS.textLight },
});