import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Room {
  id: string;
  name: string;
  capacity: number;
  hourlyRate: number;
  dailyRate: number;
  amenities: string[];
}

interface Booking {
  id: string;
  roomName: string;
  requesterName: string;
  eventName: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  totalPrice: number;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  condition: string;
}

const MOCK_ROOMS: Room[] = [
  { id: '1', name: 'Main Prayer Hall', capacity: 500, hourlyRate: 100, dailyRate: 500, amenities: ['Sound System', 'Projector', 'AC'] },
  { id: '2', name: 'Conference Room A', capacity: 30, hourlyRate: 30, dailyRate: 150, amenities: ['TV', 'Whiteboard', 'AC'] },
  { id: '3', name: 'Conference Room B', capacity: 20, hourlyRate: 25, dailyRate: 120, amenities: ['TV', 'Whiteboard'] },
  { id: '4', name: 'Youth Center', capacity: 100, hourlyRate: 50, dailyRate: 250, amenities: ['Sound System', 'Kitchen'] },
  { id: '5', name: "Women's Lounge", capacity: 40, hourlyRate: 35, dailyRate: 175, amenities: ['AC', 'Private Entrance'] },
];

const MOCK_BOOKINGS: Booking[] = [
  { id: '1', roomName: 'Main Prayer Hall', requesterName: 'Ahmed Ali', eventName: 'Wedding Reception', date: '2026-04-05', time: '4:00 PM - 10:00 PM', status: 'approved', totalPrice: 600 },
  { id: '2', roomName: 'Conference Room A', requesterName: 'Fatima Hassan', eventName: 'Board Meeting', date: '2026-03-28', time: '10:00 AM - 2:00 PM', status: 'pending', totalPrice: 120 },
  { id: '3', roomName: 'Youth Center', requesterName: 'Omar Malik', eventName: 'Youth Program', date: '2026-03-29', time: '9:00 AM - 12:00 PM', status: 'approved', totalPrice: 150 },
];

const MOCK_EQUIPMENT: Equipment[] = [
  { id: '1', name: 'Projector', category: 'AV', quantity: 3, available: 2, condition: 'excellent' },
  { id: '2', name: 'Sound System', category: 'AV', quantity: 2, available: 1, condition: 'good' },
  { id: '3', name: 'Chairs', category: 'Furniture', quantity: 200, available: 150, condition: 'good' },
  { id: '4', name: 'Tables', category: 'Furniture', quantity: 30, available: 22, condition: 'excellent' },
  { id: '5', name: 'Microphones', category: 'AV', quantity: 8, available: 6, condition: 'good' },
  { id: '6', name: 'Coffee Maker', category: 'Kitchen', quantity: 2, available: 2, condition: 'fair' },
];

const AMENITY_ICONS: Record<string, string> = {
  'Sound System': 'speaker',
  'Projector': 'projector',
  'AC': 'air-conditioner',
  'TV': 'television',
  'Whiteboard': 'marker',
  'Kitchen': 'silverware-fork-knife',
  'Private Entrance': 'door-open',
};

export default function FacilitiesCrmScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedTab, setSelectedTab] = useState<'rooms' | 'bookings' | 'equipment'>('rooms');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRooms(MOCK_ROOMS);
    setBookings(MOCK_BOOKINGS);
    setEquipment(MOCK_EQUIPMENT);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingRevenue = pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalRevenue = bookings.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.totalPrice, 0);

  const handleApproveBooking = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'approved' as const } : b));
  };

  const handleRejectBooking = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'rejected' as const } : b));
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return COLORS.success;
      case 'good': return COLORS.primary;
      case 'fair': return COLORS.warning;
      case 'needs_repair': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const renderRoomsTab = () => (
    <View>
      {rooms.map(room => (
        <GlassCard key={room.id} style={styles.roomCard}>
          <View style={styles.roomHeader}>
            <View style={styles.roomIcon}>
              <MaterialCommunityIcons name="door-open" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomCapacity}>Capacity: {room.capacity} people</Text>
            </View>
          </View>
          <View style={styles.roomPricing}>
            <View style={styles.priceItem}>
              <Text style={styles.priceValue}>${room.hourlyRate}/hr</Text>
              <Text style={styles.priceLabel}>Hourly</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceValue}>${room.dailyRate}/day</Text>
              <Text style={styles.priceLabel}>Daily</Text>
            </View>
          </View>
          <View style={styles.amenitiesRow}>
            {room.amenities.map(amenity => (
              <View key={amenity} style={styles.amenityChip}>
                <MaterialCommunityIcons name={AMENITY_ICONS[amenity] as any || 'check'} size={12} color={COLORS.primary} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ))}
    </View>
  );

  const renderBookingsTab = () => (
    <View>
      <View style={styles.bookingStats}>
        <GlassCard style={styles.bookingStatCard}>
          <Text style={styles.bookingStatValue}>{pendingBookings.length}</Text>
          <Text style={styles.bookingStatLabel}>Pending</Text>
        </GlassCard>
        <GlassCard style={styles.bookingStatCard}>
          <Text style={styles.bookingStatValue}>${pendingRevenue}</Text>
          <Text style={styles.bookingStatLabel}>Pending Revenue</Text>
        </GlassCard>
        <GlassCard style={styles.bookingStatCard}>
          <Text style={styles.bookingStatValue}>${totalRevenue}</Text>
          <Text style={styles.bookingStatLabel}>Approved</Text>
        </GlassCard>
      </View>

      {bookings.map(booking => (
        <GlassCard key={booking.id} style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingRoom}>{booking.roomName}</Text>
              <Text style={styles.bookingEvent}>{booking.eventName}</Text>
            </View>
            <View style={[styles.bookingStatus, { 
              backgroundColor: booking.status === 'approved' ? COLORS.success + '15' : booking.status === 'rejected' ? COLORS.error + '15' : COLORS.warning + '15' 
            }]}>
              <Text style={[styles.bookingStatusText, { color: booking.status === 'approved' ? COLORS.success : booking.status === 'rejected' ? COLORS.error : COLORS.warning }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.bookingMeta}>
            <Text style={styles.bookingRequester}>by {booking.requesterName}</Text>
            <Text style={styles.bookingDate}>{booking.date} • {booking.time}</Text>
          </View>
          <View style={styles.bookingFooter}>
            <Text style={styles.bookingPrice}>${booking.totalPrice}</Text>
            {booking.status === 'pending' && (
              <View style={styles.bookingActions}>
                <TouchableOpacity 
                  style={[styles.bookingAction, styles.approveAction]}
                  onPress={() => handleApproveBooking(booking.id)}
                >
                  <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.bookingAction, styles.rejectAction]}
                  onPress={() => handleRejectBooking(booking.id)}
                >
                  <MaterialCommunityIcons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassCard>
      ))}
    </View>
  );

  const renderEquipmentTab = () => (
    <View>
      {equipment.map(item => (
        <GlassCard key={item.id} style={styles.equipmentCard}>
          <View style={styles.equipmentHeader}>
            <View style={styles.equipmentIcon}>
              <MaterialCommunityIcons name="toolbox" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.equipmentInfo}>
              <Text style={styles.equipmentName}>{item.name}</Text>
              <Text style={styles.equipmentCategory}>{item.category}</Text>
            </View>
            <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(item.condition) + '15' }]}>
              <Text style={[styles.conditionText, { color: getConditionColor(item.condition) }]}>
                {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.equipmentStats}>
            <View style={styles.equipmentStat}>
              <Text style={styles.equipmentStatValue}>{item.quantity}</Text>
              <Text style={styles.equipmentStatLabel}>Total</Text>
            </View>
            <View style={styles.equipmentStat}>
              <Text style={[styles.equipmentStatValue, { color: item.available > 0 ? COLORS.success : COLORS.error }]}>
                {item.available}
              </Text>
              <Text style={styles.equipmentStatLabel}>Available</Text>
            </View>
            <View style={styles.equipmentStat}>
              <Text style={styles.equipmentStatValue}>{item.quantity - item.available}</Text>
              <Text style={styles.equipmentStatLabel}>In Use</Text>
            </View>
          </View>
          <View style={styles.equipmentProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((item.quantity - item.available) / item.quantity) * 100}%`, backgroundColor: item.available > 0 ? COLORS.primary : COLORS.error }]} />
            </View>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Facility Management</Text>
          <Text style={styles.subtitle}>Rooms, equipment & bookings</Text>
        </View>

        <View style={styles.tabs}>
          {(['rooms', 'bookings', 'equipment'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <MaterialCommunityIcons 
                name={tab === 'rooms' ? 'door' : tab === 'bookings' ? 'calendar-check' : 'toolbox'} 
                size={16} 
                color={selectedTab === tab ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {selectedTab === 'rooms' && renderRoomsTab()}
          {selectedTab === 'bookings' && renderBookingsTab()}
          {selectedTab === 'equipment' && renderEquipmentTab()}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  content: { paddingHorizontal: SPACING.md, paddingBottom: 100 },

  roomCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  roomHeader: { flexDirection: 'row', alignItems: 'center' },
  roomIcon: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  roomInfo: { flex: 1, marginLeft: SPACING.sm },
  roomName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  roomCapacity: { fontSize: 13, color: COLORS.textSecondary },
  roomPricing: { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  priceItem: { flex: 1 },
  priceValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  priceLabel: { fontSize: 11, color: COLORS.textSecondary },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  amenityText: { fontSize: 11, color: COLORS.primary },

  bookingStats: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  bookingStatCard: { flex: 1, alignItems: 'center', padding: SPACING.sm },
  bookingStatValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  bookingStatLabel: { fontSize: 10, color: COLORS.textSecondary },

  bookingCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingInfo: { flex: 1 },
  bookingRoom: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bookingEvent: { fontSize: 13, color: COLORS.textSecondary },
  bookingStatus: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  bookingStatusText: { fontSize: 11, fontWeight: '700' },
  bookingMeta: { marginTop: SPACING.xs },
  bookingRequester: { fontSize: 12, color: COLORS.primary },
  bookingDate: { fontSize: 12, color: COLORS.textSecondary },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  bookingPrice: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  bookingActions: { flexDirection: 'row', gap: SPACING.xs },
  bookingAction: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  approveAction: { backgroundColor: COLORS.success },
  rejectAction: { backgroundColor: COLORS.error },

  equipmentCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  equipmentHeader: { flexDirection: 'row', alignItems: 'center' },
  equipmentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  equipmentInfo: { flex: 1, marginLeft: SPACING.sm },
  equipmentName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  equipmentCategory: { fontSize: 12, color: COLORS.textSecondary },
  conditionBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  conditionText: { fontSize: 11, fontWeight: '600' },
  equipmentStats: { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  equipmentStat: { flex: 1, alignItems: 'center' },
  equipmentStatValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  equipmentStatLabel: { fontSize: 10, color: COLORS.textSecondary },
  equipmentProgress: { marginTop: SPACING.sm },
  progressBar: { height: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
});
