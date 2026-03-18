import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface RecurringDonation {
  id: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  nextDate: string;
  active: boolean;
}

const MOCK_RECURRING: RecurringDonation[] = [
  { id: '1', category: 'General Fund', amount: 50, frequency: 'monthly', nextDate: '2026-03-01', active: true },
];

export default function RecurringDonationsScreen() {
  const router = useRouter();
  const [donations, setDonations] = useState<RecurringDonation[]>(MOCK_RECURRING);

  const toggleActive = (id: string) => {
    setDonations(prev => prev.map(d => 
      d.id === id ? { ...d, active: !d.active } : d
    ));
  };

  const deleteDonation = (id: string) => {
    Alert.alert('Cancel Recurring', 'Are you sure you want to cancel this recurring donation?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => setDonations(prev => prev.filter(d => d.id !== id)) },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recurring Donations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="repeat" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Automatic Giving</Text>
            <Text style={styles.infoText}>Set up recurring donations to give automatically on a schedule.</Text>
          </View>
        </View>

        {donations.length > 0 ? (
          donations.map((donation) => (
            <View key={donation.id} style={styles.donationCard}>
              <View style={styles.donationHeader}>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationCategory}>{donation.category}</Text>
                  <Text style={styles.donationAmount}>${donation.amount}/{donation.frequency === 'monthly' ? 'mo' : 'wk'}</Text>
                </View>
                <Switch
                  value={donation.active}
                  onValueChange={() => toggleActive(donation.id)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
              <View style={styles.donationFooter}>
                <Text style={styles.nextDate}>Next: {formatDate(donation.nextDate)}</Text>
                <TouchableOpacity onPress={() => deleteDonation(donation.id)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="repeat-off" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No recurring donations</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/donate')}>
              <Text style={styles.addButtonText}>Set Up Recurring</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md, flexGrow: 1 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '12',
    padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  donationCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  donationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  donationInfo: { flex: 1 },
  donationCategory: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  donationAmount: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  donationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  nextDate: { fontSize: 13, color: COLORS.textSecondary },
  cancelText: { fontSize: 13, color: COLORS.error, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderRadius: RADIUS.md, marginTop: SPACING.md },
  addButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
