import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { Donation } from '../../services/api-service';

export default function PaymentReceiptsScreen() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const donations = await apiService.donations.getHistory();
      setReceipts(donations.filter((d) => d.status === 'completed'));
      setError('');
    } catch {
      setError('Could not retrieve your payment history.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const currentYear = new Date().getFullYear();
  const yearTotal = receipts
    .filter((r) => new Date(r.date).getFullYear() === currentYear)
    .reduce((total, receipt) => total + receipt.amount, 0);

  const viewReceipt = async (receipt: Donation) => {
    const url = receipt.receiptUrl;
    if (!url || !/^https:\/\/(?:pay\.stripe\.com|invoice\.stripe\.com)\//.test(url)) {
      Alert.alert('Receipt unavailable', 'Contact the masjid office for an official donation acknowledgement.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open receipt', 'Please try again later.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Receipts</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Confirmed contributions in {currentYear}</Text>
          <Text style={styles.summaryAmount}>$${yearTotal.toFixed(2)}</Text>
          <Text style={styles.summarySub}>Based on completed payments associated with your account.</Text>
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={load} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : receipts.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No completed payments yet</Text>
          </View>
        ) : receipts.map((receipt) => (
          <TouchableOpacity
            key={receipt.id}
            style={styles.item}
            onPress={() => void viewReceipt(receipt)}
            accessibilityRole="button"
            accessibilityLabel={`Payment of $${receipt.amount.toFixed(2)} on ${new Date(receipt.date).toLocaleDateString()}`}
          >
            <View style={styles.icon}>
              <MaterialCommunityIcons name="receipt" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{receipt.category.replace(/_/g, ' ')}</Text>
              <Text style={styles.itemDate}>{new Date(receipt.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.itemAmount}>$${receipt.amount.toFixed(2)}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
        <Text style={styles.note}>
          This screen shows payment records, not an official tax document. Contact the masjid office for any required tax acknowledgement.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, color: COLORS.text, fontWeight: '700' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, maxWidth: 760, width: '100%', alignSelf: 'center' },
  summary: { backgroundColor: COLORS.primary, padding: SPACING.xl, borderRadius: RADIUS.xl, marginBottom: SPACING.lg },
  summaryLabel: { color: COLORS.white, fontSize: 15 },
  summaryAmount: { color: COLORS.white, fontSize: 34, fontWeight: '700', marginVertical: SPACING.sm },
  summarySub: { color: COLORS.white, fontSize: 12, lineHeight: 19, opacity: 0.85 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    minHeight: 72, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
  },
  icon: { width: 44, height: 44, backgroundColor: COLORS.primaryFaded, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { textTransform: 'capitalize', color: COLORS.text, fontWeight: '600', fontSize: 15 },
  itemDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  itemAmount: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  empty: { paddingVertical: SPACING.xxl, alignItems: 'center', gap: SPACING.md },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 15 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.lg },
  retryText: { fontWeight: '600', color: COLORS.primary },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: SPACING.md },
});
