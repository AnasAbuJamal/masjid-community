import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { GlassCard, ScreenWrapper, FloatingIcon, TAB_BAR_HEIGHT } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface MenuItem { icon: string; title: string; subtitle?: string; onPress: () => void; danger?: boolean; }
interface MenuSection { title: string; items: MenuItem[]; }

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [prayerNotif, setPrayerNotif] = useState(true);
  const [communityNotif, setCommunityNotif] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const MENU_SECTIONS: MenuSection[] = [
    { title: 'Account', items: [
      { icon: 'account-edit-outline', title: 'Edit Profile', subtitle: 'Update your info', onPress: () => router.push('/profile/edit' as any) },
      { icon: 'heart-outline', title: 'Donation History', subtitle: 'View past donations', onPress: () => router.push('/donations/history' as any) },
      { icon: 'clipboard-text-outline', title: 'My Applications', subtitle: 'Jobs & volunteer apps', onPress: () => router.push('/applications' as any) },
      { icon: 'chart-bar', title: 'Finances', subtitle: 'Financial transparency', onPress: () => router.push('/finances' as any) },
    ]},
    { title: 'Notifications', items: [
      { icon: 'clock-alert-outline', title: 'Prayer Reminders', onPress: () => setPrayerNotif(!prayerNotif) },
      { icon: 'account-group-outline', title: 'Community Updates', onPress: () => setCommunityNotif(!communityNotif) },
    ]},
    { title: 'App', items: [
      { icon: 'cog-outline', title: 'Settings', onPress: () => Alert.alert('Settings', 'Coming soon') },
      { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => Alert.alert('Help', 'Coming soon') },
      { icon: 'information-outline', title: 'About', subtitle: 'Version 1.0.0', onPress: () => Alert.alert('About', 'Masjid Al-Momineen Community App v1.0.0') },
    ]},
  ];

  const initials = user ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() : '??';

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}><Text style={styles.avatarText}>{initials}</Text></View>
            <Text style={styles.userName}>{user?.firstName ?? 'Brother/Sister'} {user?.lastName ?? ''}</Text>
            <Text style={styles.userEmail}>{user?.email ?? 'user@example.com'}</Text>
            <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role?.toUpperCase() ?? 'MEMBER'}</Text></View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            {[{ label: 'Donations', value: '0', icon: 'heart' }, { label: 'Volunteer', value: '0', icon: 'hand-heart' }, { label: 'Proposals', value: '0', icon: 'lightbulb' }].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <FloatingIcon icon={<MaterialCommunityIcons name={stat.icon as any} size={18} color={COLORS.primary} />} size="sm" color={COLORS.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Sections - Column Layout */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard style={styles.menuCard} noPadding>
              {section.items.map((item, index) => {
                const isNotifItem = item.title === 'Prayer Reminders' || item.title === 'Community Updates';
                const toggleValue = item.title === 'Prayer Reminders' ? prayerNotif : communityNotif;
                return (
                  <TouchableOpacity key={item.title} style={[styles.menuItem, index < section.items.length - 1 && styles.menuItemBorder]} onPress={item.onPress} activeOpacity={isNotifItem ? 1 : 0.7}>
                    <View style={styles.menuIcon}><MaterialCommunityIcons name={item.icon as any} size={20} color={item.danger ? COLORS.error : COLORS.primary} /></View>
                    <View style={styles.menuContent}><Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>{item.title}</Text>{item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}</View>
                    {isNotifItem ? (
                      <Switch value={toggleValue} onValueChange={item.onPress} trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }} thumbColor={toggleValue ? COLORS.primary : COLORS.textSecondary} />
                    ) : <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textSecondary} />}
                  </TouchableOpacity>
                );
              })}
            </GlassCard>
          </View>
        ))}

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <MaterialCommunityIcons name="logout" size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: TAB_BAR_HEIGHT + SPACING.lg },

  // Header Section
  headerSection: { marginBottom: SPACING.md },
  profileHeader: { alignItems: 'center', paddingVertical: SPACING.lg, backgroundColor: COLORS.surfaceGlass, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.glassBorder },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.sm },
  roleBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.sm + 4, paddingVertical: 4, borderRadius: RADIUS.full },
  roleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },

  // Stats Section
  statsSection: { marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.surfaceGlass, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  // Menu Section
  menuSection: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.xs, marginLeft: SPACING.xs },
  menuCard: { overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  menuTitleDanger: { color: COLORS.error },
  menuSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

  // Logout Section
  logoutSection: { marginTop: SPACING.xs },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.errorLight, paddingVertical: SPACING.md, borderRadius: RADIUS.lg },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.error },

  bottomSpacer: { height: SPACING.lg },
});
