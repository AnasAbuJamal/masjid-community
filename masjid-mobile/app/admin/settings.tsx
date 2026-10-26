import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type Key = 'site_name' | 'site_tagline' | 'contact_email' |
  'contact_phone' | 'address' | 'kiosk_rotation_interval';
type Settings = Record<Key, string>;
const EMPTY: Settings = {
  site_name: 'Masjid Al-Momineen', site_tagline: '',
  contact_email: '', contact_phone: '', address: '',
  kiosk_rotation_interval: '8',
};
const FIELDS: { key: Key; label: string; detail: string; max: number;
  keyboard?: 'email-address' | 'phone-pad' | 'number-pad' }[] = [
  { key: 'site_name', label: 'Masjid name', detail: 'Name used on TV display', max: 120 },
  { key: 'site_tagline', label: 'Tagline', detail: 'Public community description', max: 250 },
  { key: 'contact_email', label: 'Office email', detail: 'Shown publicly', max: 254, keyboard: 'email-address' },
  { key: 'contact_phone', label: 'Office phone', detail: 'Shown publicly', max: 80, keyboard: 'phone-pad' },
  { key: 'address', label: 'Public address', detail: 'Leave blank when not published', max: 400 },
  { key: 'kiosk_rotation_interval', label: 'TV slide interval',
    detail: 'Between 5 and 60 seconds', max: 2, keyboard: 'number-pad' },
];

export default function AdminSettingsScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [values, setValues] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ settings: Partial<Settings> }>('/settings');
      setValues({ ...EMPTY, ...response.data.settings });
      setError('');
    } catch { setError('Settings could not be loaded. Check your connection.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (role === 'admin') void load();
    else setLoading(false);
  }, [role]);

  const save = async () => {
    if (saving) return;
    if (!values.site_name.trim() || !/^(?:[5-9]|[1-5]\d|60)$/.test(values.kiosk_rotation_interval)) {
      Alert.alert('Check settings', 'Enter a masjid name and a TV interval between 5 and 60 seconds.');
      return;
    }
    setSaving(true);
    try {
      await api.instance.post('/settings', values);
      Alert.alert('Settings saved', 'The public masjid configuration has been updated.');
      await load();
    } catch (failure: unknown) {
      const message = (failure as { response?: { data?: { error?: string } } })?.response?.data?.error;
      Alert.alert('Unable to save', message || 'Check your connection and try again.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Masjid Settings</Text>
        <View style={styles.back} />
      </View>
      {role !== 'admin' ? <View style={styles.center}>
        <Text style={styles.muted}>Administrator access is required.</Text>
      </View> : loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <View style={styles.notice}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={() => { void load(); }}>
              <Text style={styles.link}>Retry</Text>
            </TouchableOpacity>
          </View> : null}
          <Text style={styles.description}>
            Edit saved public information. Security, database backups and notification delivery
            are managed separately and cannot be changed by unsupported local switches.
          </Text>
          <View style={styles.card}>
            {FIELDS.map(field => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput accessibilityLabel={field.label} style={styles.input}
                  value={values[field.key]} maxLength={field.max}
                  keyboardType={field.keyboard || 'default'}
                  autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'sentences'}
                  placeholder={field.label} placeholderTextColor={COLORS.textSecondary}
                  onChangeText={value => setValues(current => ({ ...current, [field.key]: value }))} />
                <Text style={styles.hint}>{field.detail}</Text>
              </View>
            ))}
            <TouchableOpacity accessibilityRole="button" style={styles.submit}
              disabled={saving} onPress={() => { void save(); }}>
              <Text style={styles.submitText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.audit}
            onPress={() => router.push('/admin/audit-logs')}>
            <MaterialCommunityIcons name="shield-check-outline" size={23} color={COLORS.primary} />
            <Text style={styles.auditText}>View change history</Text>
            <MaterialCommunityIcons name="chevron-right" size={19} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, padding: SPACING.sm,
    borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  loader: { flex: 1 },
  center: { flex: 1, alignItems: 'center', padding: SPACING.xxl },
  content: { maxWidth: 780, width: '100%', alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  description: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22,
    marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.md },
  field: { gap: 6 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  input: { minHeight: 48, backgroundColor: COLORS.background,
    borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, fontSize: 16, color: COLORS.text },
  hint: { color: COLORS.textSecondary, fontSize: 12 },
  submit: { minHeight: 52, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  audit: { flexDirection: 'row', gap: SPACING.md, minHeight: 56, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  auditText: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600' },
  muted: { fontSize: 14, color: COLORS.textSecondary },
  notice: { borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error,
    padding: SPACING.md, marginBottom: SPACING.md },
  error: { fontSize: 14, color: COLORS.error, lineHeight: 20 },
  retry: { minHeight: 44, justifyContent: 'center' },
  link: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
