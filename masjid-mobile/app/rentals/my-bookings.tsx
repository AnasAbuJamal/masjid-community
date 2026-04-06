import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, EmptyState } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { RentalBooking } from '../../services/api-service';

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: COLORS.warning + '20', text: COLORS.warning, icon: 'clock-outline', label: 'Pending Review' },
  approved: { bg: COLORS.success + '20', text: COLORS.success, icon: 'check-circle-outline', label: 'Approved' },
  rejected: { bg: COLORS.error + '20', text: COLORS.error, icon: 'close-circle-outline', label: 'Rejected' },
  completed: { bg: COLORS.primary + '20', text: COLORS.primary, icon: 'check-all', label: 'Completed' },
  cancelled: { bg: COLORS.textSecondary + '20', text: COLORS.textSecondary, icon: 'cancel', label: 'Cancelled' },
};

export default function MyRentalsScreen() {
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      const data = await apiService.rentals.getMyBookings();
      setBookings(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;

  const renderBooking = (booking: RentalBooking) => {
    const config = statusConfig[booking.status] || statusConfig.pending;
    return (
      <GlassCard key={booking.id} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <MaterialCommunityIcons name={config.icon as any} size={14} color={config.text} />
            <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
          </View>
          <Text style={styles.bookingDate}>
            {new Date(booking.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.itemName}>{booking.item.name}</Text>
        
        {booking.eventName && (
          <Text style={styles.eventName}>{booking.eventName}</Text>
        )}

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-usd" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>${booking.totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {booking.adminNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{booking.adminNotes}</Text>
          </View>
        )}
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ title: 'My Rentals' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Rental Bookings</Text>
          <Text style={styles.subtitle}>Track the status of your rental requests</Text>
        </View>

        {bookings.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
              <Text style={[styles.statNumber, { color: COLORS.success }]}>{approvedCount}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>
        )}

        {bookings.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={<MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.textSecondary} />}
              title="No Bookings Yet"
              message="You haven't made any rental bookings yet. Browse our rentals to book equipment or halls for your events."
            />
          </GlassCard>
        ) : (
          <View style={styles.bookingsList}>
            <Text style={styles.sectionTitle}>Your Bookings</Text>
            {bookings.map(renderBooking)}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  header: { marginBottom: SPACING.lg },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.warning },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  bookingsList: { gap: SPACING.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm },
  bookingCard: { padding: SPACING.md },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '600' },
  bookingDate: { fontSize: 12, color: COLORS.textSecondary },
  itemName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  eventName: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  bookingDetails: { gap: SPACING.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  detailText: { fontSize: 13, color: COLORS.textSecondary },
  notesSection: { marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: COLORS.background, borderRadius: RADIUS.md },
  notesLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  notesText: { fontSize: 12, color: COLORS.textSecondary },
});