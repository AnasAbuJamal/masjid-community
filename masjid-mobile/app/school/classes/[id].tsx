import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';
import api from '../../../services/api-client';

interface ClassDetail {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  dayOfWeek: string[];
  enrolled: number;
}

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ClassDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api.instance.get<ClassDetail>(`/public/classes/${encodeURIComponent(id)}`)
      .then((result) => { if (active) setItem(result.data); })
      .catch(() => { if (active) setError('Class details could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button"
          accessibilityLabel="Go back" style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={styles.back} />
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : !item ? (
        <View style={styles.empty}><Text style={styles.error}>{error || 'Class not found'}</Text></View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>Masjid education program</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="account-outline" size={22} color={COLORS.primary} />
                <View style={styles.rowText}>
                  <Text style={styles.label}>Instructor</Text>
                  <Text style={styles.value}>{item.teacher}</Text>
                </View>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={22} color={COLORS.primary} />
                <View style={styles.rowText}>
                  <Text style={styles.label}>Schedule</Text>
                  <Text style={styles.value}>{item.schedule}</Text>
                </View>
              </View>
              <View style={styles.line} />
              <View style={styles.row}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color={COLORS.primary} />
                <View style={styles.rowText}>
                  <Text style={styles.label}>Enrollment</Text>
                  <Text style={styles.value}>{item.enrolled} students currently enrolled</Text>
                </View>
              </View>
            </View>
            <Text style={styles.note}>
              Submitting an application does not guarantee a class place. The masjid office will review enrollment requests.
            </Text>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} accessibilityRole="button"
              onPress={() => router.push('/school/enroll')}>
              <Text style={styles.buttonText}>Apply for Enrollment</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: COLORS.textSecondary, fontSize: 15 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '700', marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  rowText: { flex: 1 },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 3 },
  value: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  line: { height: 1, backgroundColor: COLORS.border },
  note: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: SPACING.lg },
  footer: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  button: { minHeight: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  buttonText: { fontSize: 16, color: COLORS.white, fontWeight: '700' },
});
