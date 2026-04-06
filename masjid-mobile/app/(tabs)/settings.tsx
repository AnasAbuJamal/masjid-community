import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { useSettingsStore, ThemeMode } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import notificationService from '../../services/notification-service';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement }: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingsIcon}>
        <MaterialCommunityIcons name={icon as any} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && (
        <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
      ))}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { 
    themeMode, 
    setThemeMode,
    prayerNotifications,
    setPrayerNotifications,
    announcementNotifications,
    setAnnouncementNotifications,
    donationNotifications,
    setDonationNotifications,
    attendanceAlerts,
    setAttendanceAlerts,
    gradeNotifications,
    setGradeNotifications,
    paymentReminders,
    setPaymentReminders,
  } = useSettingsStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const handlePrayerNotificationsToggle = async (enabled: boolean) => {
    await setPrayerNotifications(enabled);
    if (!enabled) {
      await notificationService.cancelAllPrayerNotifications();
    }
  };

  const ThemeOption = ({ mode, label }: { mode: ThemeMode; label: string }) => (
    <TouchableOpacity
      style={[styles.themeOption, themeMode === mode && styles.themeOptionActive]}
      onPress={() => setThemeMode(mode)}
    >
      <Text style={[styles.themeOptionText, themeMode === mode && styles.themeOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="account-circle"
            title={user?.firstName ? `${user.firstName} ${user.lastName}` : 'Profile'}
            subtitle={user?.email}
            onPress={() => router.push('/profile')}
          />
          <SettingsItem
            icon="heart"
            title="Donation History"
            subtitle="View past donations"
            onPress={() => {}}
          />
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <View style={styles.settingsItem}>
            <View style={styles.settingsIcon}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>Theme</Text>
            </View>
          </View>
          <View style={styles.themeSelector}>
            <ThemeOption mode="light" label="Light" />
            <ThemeOption mode="dark" label="Dark" />
            <ThemeOption mode="system" label="System" />
          </View>
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="bell"
            title="Prayer Notifications"
            subtitle="5 times daily alerts"
            rightElement={
              <Switch
                value={prayerNotifications}
                onValueChange={handlePrayerNotificationsToggle}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          <SettingsItem
            icon="bullhorn"
            title="Announcements"
            subtitle="Masjid news and updates"
            rightElement={
              <Switch
                value={announcementNotifications}
                onValueChange={setAnnouncementNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          <SettingsItem
            icon="heart"
            title="Donations"
            subtitle="Campaign updates"
            rightElement={
              <Switch
                value={donationNotifications}
                onValueChange={setDonationNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          <SettingsItem
            icon="school"
            title="Attendance Alerts"
            subtitle="Notify when child is absent"
            rightElement={
              <Switch
                value={attendanceAlerts}
                onValueChange={setAttendanceAlerts}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          <SettingsItem
            icon="certificate"
            title="Grade Updates"
            subtitle="New grades and assignments"
            rightElement={
              <Switch
                value={gradeNotifications}
                onValueChange={setGradeNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
          <SettingsItem
            icon="credit-card"
            title="Payment Reminders"
            subtitle="Upcoming tuition payments"
            rightElement={
              <Switch
                value={paymentReminders}
                onValueChange={setPaymentReminders}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="television-play"
            title="Kiosk / TV Mode"
            subtitle="Display announcements on TV"
            onPress={() => router.push('/kiosk' as any)}
          />
          <SettingsItem
            icon="information"
            title="App Version"
            subtitle="1.0.0"
          />
          <SettingsItem
            icon="file-document"
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield-check"
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: SPACING.xs,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  themeSelector: {
    flexDirection: 'row',
    padding: SPACING.sm,
    paddingTop: 0,
    gap: SPACING.sm,
  },
  themeOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: COLORS.primary + '12',
    borderColor: COLORS.primary,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  themeOptionTextActive: {
    color: COLORS.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444' + '12',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
});
