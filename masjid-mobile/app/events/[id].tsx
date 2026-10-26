import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface CommunityEvent {
  id: string; title: string; description: string; location: string; date: string;
  endDate: string | null; category: string; attendees: number; capacity: number | null;
  isRegistered: boolean; status: string;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const response = await api.instance.get<CommunityEvent>(`/public/events/${encodeURIComponent(id)}`);
      setEvent(response.data);
      setError('');
    } catch {
      setError('Event details are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [id]);

  const register = async () => {
    if (!event || event.isRegistered || registering) return;
    setRegistering(true);
    try {
      await api.instance.post(`/public/events/${encodeURIComponent(event.id)}/rsvp`);
      setEvent(current => current ? { ...current, isRegistered: true, attendees: current.attendees + 1 } : null);
      Alert.alert('Registration confirmed', 'You are registered for this event.');
    } catch (reason: unknown) {
      const status = reason && typeof reason === 'object' && 'response' in reason
        ? (reason as { response?: { status?: number } }).response?.status : undefined;
      Alert.alert('Unable to register', status === 401
        ? 'Please sign in before registering for events.'
        : status === 409 ? 'This event has reached capacity.' : 'Please try again later.');
    } finally {
      setRegistering(false);
    }
  };

  const share = async () => {
    if (!event) return;
    await Share.share({
      message: `${event.title} — ${new Date(event.date).toLocaleString('en-US')} at ${event.location}`,
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity onPress={share} accessibilityRole="button" accessibilityLabel="Share event" style={styles.iconButton}>
          <MaterialCommunityIcons name="share-variant-outline" size={23} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={styles.loading} color={COLORS.primary} /> : !event ? (
        <View style={styles.empty}><Text style={styles.meta}>{error || 'Event not found'}</Text></View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.category}>{event.category.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.card}>
              <View style={styles.line}>
                <MaterialCommunityIcons name="calendar" size={21} color={COLORS.primary} />
                <View style={styles.lineBody}>
                  <Text style={styles.label}>Date & time</Text>
                  <Text style={styles.value}>{new Date(event.date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.line}>
                <MaterialCommunityIcons name="map-marker-outline" size={21} color={COLORS.primary} />
                <View style={styles.lineBody}>
                  <Text style={styles.label}>Location</Text>
                  <Text style={styles.value}>{event.location}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.line}>
                <MaterialCommunityIcons name="account-group-outline" size={21} color={COLORS.primary} />
                <View style={styles.lineBody}>
                  <Text style={styles.label}>Attendance</Text>
                  <Text style={styles.value}>{event.attendees} registered{event.capacity ? ` · ${event.capacity} capacity` : ''}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.heading}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, event.isRegistered && styles.registered]}
              disabled={event.isRegistered || registering || event.status !== 'scheduled'}
              accessibilityRole="button"
              accessibilityLabel={event.isRegistered ? 'Already registered' : 'Register for event'}
              onPress={() => void register()}
            >
              <Text style={styles.buttonText}>{registering ? 'Registering…' : event.isRegistered
                ? 'Registered' : event.status !== 'scheduled' ? 'Registration closed' : 'Register for Event'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: SPACING.lg,
    paddingBottom: SPACING.xxl },
  category: { fontSize: 12, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3, marginBottom: SPACING.sm },
  title: { fontSize: 27, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xl },
  card: { borderRadius: RADIUS.xl, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  lineBody: { flex: 1 },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  value: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  heading: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: SPACING.xl, marginBottom: SPACING.sm },
  description: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 24 },
  footer: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  button: { height: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center' },
  registered: { backgroundColor: COLORS.success },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  meta: { color: COLORS.textSecondary, fontSize: 14 },
});
