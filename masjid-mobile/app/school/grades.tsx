import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface SchoolFeedback {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  rating: 'weak' | 'good' | 'very_good' | 'excellent' | null;
}

const ratingLabels: Record<string, string> = {
  weak: 'Needs support',
  good: 'Good',
  very_good: 'Very good',
  excellent: 'Excellent',
};

export default function GradesScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<SchoolFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<SchoolFeedback[]>('/school/assignments');
      setRecords(response.data.filter(item => item.rating !== null));
      setError('');
    } catch {
      setError('Could not load student progress. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { void load(); }, []);
  const refresh = () => { setRefreshing(true); void load(); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}
          accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.heading}>Student Progress</Text>
        <View style={styles.back} />
      </View>
      <Text style={styles.note}>Teacher assessments from your school records. These are not percentage or letter grades.</Text>
      {loading ? <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} /> : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="school-outline" size={44} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>{error || 'No teacher assessments are available yet.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.icon}>
                <MaterialCommunityIcons name="book-open-variant" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.details}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.subject}</Text>
                <Text style={styles.date}>{new Date(item.dueDate).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.rating}>{item.rating ? ratingLabels[item.rating] || item.rating : ''}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  heading: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  note: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: SPACING.md,
    color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  list: { padding: SPACING.md, maxWidth: 800, width: '100%', alignSelf: 'center',
    paddingBottom: SPACING.xxl },
  loader: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    padding: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, marginBottom: SPACING.sm, minHeight: 96 },
  icon: { backgroundColor: COLORS.primaryFaded, width: 44, height: 44,
    borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  description: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  date: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  rating: { color: COLORS.primary, fontSize: 12, fontWeight: '700', maxWidth: 90, textAlign: 'right' },
  empty: { padding: SPACING.xxl, gap: SPACING.md, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontSize: 14, color: COLORS.textSecondary },
});
