import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/common';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';
import api from '../../../services/api-client';

interface ClassSummary {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  dayOfWeek: string[];
  enrolled: number;
}

export default function ClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadClasses = useCallback(async () => {
    try {
      const response = await api.instance.get<{ classes: ClassSummary[] }>('/public/classes');
      setClasses(response.data.classes);
      setError('');
    } catch {
      setError('Classes are temporarily unavailable. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadClasses(); }, [loadClasses]);

  const refresh = () => {
    setRefreshing(true);
    void loadClasses();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Classes" showBack />
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
          ListHeaderComponent={
            <View style={styles.heading}>
              <Text style={styles.title}>Available Classes</Text>
              <Text style={styles.subtitle}>Schedules and instructors from the masjid office</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="school-outline" size={42} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>{error || 'No classes are currently listed.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/school/classes/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${item.name}`}
            >
              <View style={styles.icon}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.className}>{item.name}</Text>
                <Text style={styles.secondary}>{item.teacher}</Text>
                <Text style={styles.secondary}>{item.schedule}</Text>
                <Text style={styles.count}>{item.enrolled} enrolled</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1 },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl,
    maxWidth: 900, width: '100%', alignSelf: 'center' },
  heading: { marginBottom: SPACING.lg },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.xs },
  card: { borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: 96 },
  icon: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center',
    justifyContent: 'center', backgroundColor: COLORS.primaryFaded },
  cardBody: { flex: 1, gap: 3 },
  className: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: 13 },
  count: { color: COLORS.primary, fontSize: 12, marginTop: 3, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
