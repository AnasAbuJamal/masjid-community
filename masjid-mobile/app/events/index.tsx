import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface CommunityEvent {
  id: string; title: string; description: string; location: string; date: string;
  endDate?: string | null; category: string; attendees: number; capacity: number | null;
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await api.instance.get<{ events: CommunityEvent[] }>('/public/events');
      setEvents(response.data.events || []);
      setError('');
    } catch {
      setError('Could not load upcoming events. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const refresh = () => { setRefreshing(true); void load(); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heading}>
        <Text style={styles.title}>Community Events</Text>
        <Text style={styles.subtitle}>Upcoming gatherings and programs</Text>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" /> : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>{error || 'No upcoming community events are currently scheduled.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`View event ${item.title}`}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: item.id } })}
            >
              <View style={styles.dateBox}>
                <Text style={styles.dateMonth}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
                <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
              </View>
              <View style={styles.details}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.meta}>{new Date(item.date).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.location}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heading: { padding: SPACING.lg, paddingBottom: SPACING.sm, maxWidth: 860, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.xs },
  loader: { flex: 1 },
  content: { maxWidth: 860, width: '100%', alignSelf: 'center', paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, minHeight: 124, gap: SPACING.md },
  dateBox: { borderRadius: RADIUS.md, backgroundColor: COLORS.primaryFaded,
    minWidth: 64, paddingVertical: SPACING.sm, justifyContent: 'center', alignItems: 'center' },
  dateMonth: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  dateDay: { fontSize: 25, fontWeight: '700', color: COLORS.text },
  details: { flex: 1, gap: 3 },
  eventTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  description: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
