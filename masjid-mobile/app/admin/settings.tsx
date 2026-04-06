import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface SettingSection {
  title: string;
  items: Array<{
    icon: string;
    title: string;
    subtitle?: string;
    type: 'toggle' | 'navigation' | 'input';
    value?: boolean;
    onToggle?: (val: boolean) => void;
    route?: string;
  }>;
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    generalNotifications: true,
    prayerAlerts: true,
    donationAlerts: true,
    eventAlerts: true,
    kioskMode: true,
    kioskRotation: '10',
    darkMode: false,
    maintenanceMode: false,
  });

  const sections: SettingSection[] = [
    {
      title: 'General',
      items: [
        { icon: 'cog', title: 'Site Information', subtitle: 'Masjid Al-Momineen', type: 'navigation' },
        { icon: 'theme-light-dark', title: 'Default Theme', subtitle: 'System', type: 'navigation' },
        { icon: 'wifi-off', title: 'Maintenance Mode', subtitle: 'Show offline message', type: 'toggle', value: settings.maintenanceMode, onToggle: (v) => setSettings(s => ({ ...s, maintenanceMode: v })) },
      ],
    },
    {
      title: 'Kiosk Mode',
      items: [
        { icon: 'television-play', title: 'Enable Kiosk Mode', subtitle: 'TV display feature', type: 'toggle', value: settings.kioskMode, onToggle: (v) => setSettings(s => ({ ...s, kioskMode: v })) },
        { icon: 'clock-outline', title: 'Rotation Interval', subtitle: `${settings.kioskRotation} seconds`, type: 'navigation' },
        { icon: 'volume-high', title: 'Sound Effects', subtitle: 'Announcement sounds', type: 'toggle', value: true, onToggle: () => {} },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { icon: 'bell', title: 'Push Notifications', type: 'toggle', value: settings.generalNotifications, onToggle: (v) => setSettings(s => ({ ...s, generalNotifications: v })) },
        { icon: 'clock-alert', title: 'Prayer Alerts', type: 'toggle', value: settings.prayerAlerts, onToggle: (v) => setSettings(s => ({ ...s, prayerAlerts: v })) },
        { icon: 'heart', title: 'Donation Alerts', type: 'toggle', value: settings.donationAlerts, onToggle: (v) => setSettings(s => ({ ...s, donationAlerts: v })) },
        { icon: 'calendar-star', title: 'Event Alerts', type: 'toggle', value: settings.eventAlerts, onToggle: (v) => setSettings(s => ({ ...s, eventAlerts: v })) },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: 'shield-check', title: 'Two-Factor Auth', subtitle: 'Required for staff', type: 'navigation' },
        { icon: 'key', title: 'Session Timeout', subtitle: '30 minutes', type: 'navigation' },
        { icon: 'login', title: 'Login History', subtitle: 'View recent logins', type: 'navigation' },
        { icon: 'file-document', title: 'Audit Logs', subtitle: 'View activity logs', type: 'navigation', route: '/admin/audit-logs' },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: 'database', title: 'Backup Database', type: 'navigation' },
        { icon: 'export', title: 'Export Data', type: 'navigation' },
        { icon: 'delete', title: 'Clear Cache', subtitle: 'Free up storage', type: 'navigation' },
      ],
    },
  ];

  const handleSave = () => {
    Alert.alert('Settings Saved', 'Your admin settings have been updated.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Settings</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Site Info Card */}
        <GlassCard style={styles.siteCard}>
          <View style={styles.siteLogo}>
            <MaterialCommunityIcons name="mosque" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.siteInfo}>
            <Text style={styles.siteName}>Masjid Al-Momineen</Text>
            <Text style={styles.siteAddress}>123 Islamic Center Dr, Atlanta, GA 30303</Text>
            <Text style={styles.siteContact}>info@masjidalmomineen.org • (555) 123-4567</Text>
          </View>
        </GlassCard>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard style={styles.settingsCard} noPadding>
              {section.items.map((item, itemIndex) => (
                <View 
                  key={item.title} 
                  style={[
                    styles.settingItem, 
                    itemIndex < section.items.length - 1 && styles.settingItemBorder
                  ]}
                >
                  <View style={styles.settingIcon}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
                  </View>
                  {item.type === 'toggle' && item.onToggle && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.white}
                    />
                  )}
                  {item.type === 'navigation' && (
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                  )}
                </View>
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Masjid Al-Momineen Admin v1.0.0</Text>
          <Text style={styles.versionSubtext}>Powered by staff-web API</Text>
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  saveButton: { paddingHorizontal: SPACING.sm },
  saveText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  siteCard: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  siteLogo: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  siteInfo: { flex: 1 },
  siteName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  siteAddress: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  siteContact: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  section: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: SPACING.xs },
  settingsCard: { overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  settingSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  versionInfo: { alignItems: 'center', marginTop: SPACING.lg, paddingTop: SPACING.md },
  versionText: { fontSize: 12, color: COLORS.textSecondary },
  versionSubtext: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
});