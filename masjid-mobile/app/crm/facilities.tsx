import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api-client';

interface Facility {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isAvailable: boolean;
  priceHourly: number | null;
  priceDaily: number | null;
}
interface Booking {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  renterName: string;
  renterEmail: string;
  eventName: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
}
interface FacilitiesResponse { facilities: Facility[]; bookings: Booking[] }
type Tab = 'facilities' | 'bookings';
const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function FacilitiesCrmScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<Tab>('facilities');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<FacilitiesResponse>('/mobile/admin/facilities');
      setFacilities(response.data.facilities);
      setBookings(response.data.bookings);
      setError('');
    } catch {
      setError('Could not load facilities and rental requests.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => {
    if (role === 'admin') void load();
    else setLoading(false);
  }, [role]);
  const refresh = () => { setRefreshing(true); void load(); };

  const review = (item: Booking, status: 'approved' | 'rejected') => {
    Alert.alert('Review booking?', `${status === 'approved' ? 'Approve' : 'Reject'} the rental request for ${item.itemName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: status === 'approved' ? 'Approve' : 'Reject',
        style: status === 'rejected' ? 'destructive' : 'default',
        onPress: async () => {
          setSaving(item.id);
          try {
            await api.instance.patch(
              `/mobile/admin/facilities/bookings/${encodeURIComponent(item.id)}`,
              { status }
            );
            await load();
          } catch (failure: unknown) {
            const response = (failure as { response?: { data?: { error?: string } } })?.response?.data;
            Alert.alert('Unable to review', response?.error || 'This booking could not be updated.');
          } finally { setSaving(null); }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Facilities CRM</Text>
          <Text style={styles.subtitle}>Actual rental inventory and requests</Text>
        </View>
      </View>
      {role !== 'admin' ? <View style={styles.center}>
        <Text style={styles.secondary}>Administrator access is required.</Text>
      </View> : <>
        <View style={styles.tabs}>
          {([
            ['facilities', 'Facilities'], ['bookings', 'Booking Requests'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity key={key} accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)}
              style={[styles.tab, tab === key && styles.activeTab]}>
              <Text style={[styles.tabText, tab === key && styles.activeTabText]}>
                {label}{key === 'bookings' ? ` (${bookings.filter(b => b.status === 'pending').length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? <ActivityIndicator style={styles.loading} size="large" color={COLORS.primary} />
          : <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            contentContainerStyle={styles.content}>
            {error ? (
              <View style={styles.center}>
                <Text style={styles.secondary}>{error}</Text>
                <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={refresh}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : tab === 'facilities' ? facilities.length === 0 ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="office-building-outline" size={44} color={COLORS.textSecondary} />
                <Text style={styles.secondary}>No rental facilities are registered.</Text>
              </View>
            ) : facilities.map(item => (
              <View style={styles.card} key={item.id}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={[styles.status, { color: item.isAvailable ? COLORS.success : COLORS.error }]}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
                <Text style={styles.secondary}>{item.category}</Text>
                {item.description ? <Text style={styles.secondary}>{item.description}</Text> : null}
                {item.priceHourly != null ? <Text style={styles.price}>{money(item.priceHourly)} / hour</Text> : null}
                {item.priceDaily != null ? <Text style={styles.price}>{money(item.priceDaily)} / day</Text> : null}
              </View>
            )) : bookings.length === 0 ? (
              <View style={styles.center}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={COLORS.textSecondary} />
                <Text style={styles.secondary}>No bookings have been submitted.</Text>
              </View>
            ) : bookings.map(booking => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{booking.itemName}</Text>
                  <Text style={styles.status}>{booking.status}</Text>
                </View>
                <Text style={styles.secondary}>{booking.renterName} · {booking.renterEmail}</Text>
                {booking.eventName && <Text style={styles.secondary}>{booking.eventName}</Text>}
                <Text style={styles.secondary}>From {new Date(booking.startDate).toLocaleString()}</Text>
                <Text style={styles.secondary}>To {new Date(booking.endDate).toLocaleString()}</Text>
                <Text style={styles.price}>Requested total: {money(booking.totalPrice)}</Text>
                {['pending', 'approved'].includes(booking.status) && (
                  <View style={styles.actions}>
                    {booking.status !== 'approved' && (
                      <TouchableOpacity accessibilityRole="button" style={styles.action}
                        disabled={saving !== null} onPress={() => review(booking, 'approved')}>
                        <Text style={styles.actionText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity accessibilityRole="button" style={styles.action}
                      disabled={saving !== null} onPress={() => review(booking, 'rejected')}>
                      <Text style={[styles.actionText, { color: COLORS.error }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            <Text style={styles.note}>
              Approved bookings are checked for overlapping facility reservations. The masjid office must verify availability before final approval.
            </Text>
          </ScrollView>}
      </>}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderColor: COLORS.border, padding: SPACING.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 21, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: SPACING.sm, margin: SPACING.md },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  activeTab: { backgroundColor: COLORS.primaryFaded },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: COLORS.primary },
  content: { width: '100%', maxWidth: 860, alignSelf: 'center', paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl },
  loading: { flex: 1 },
  center: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: SPACING.sm },
  itemTitle: { fontWeight: '700', color: COLORS.text, fontSize: 16, flexShrink: 1 },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'left' },
  status: { color: COLORS.primary, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  price: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  action: { minHeight: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryFaded,
    paddingHorizontal: SPACING.md, justifyContent: 'center' },
  actionText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  note: { marginTop: SPACING.lg, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
});
