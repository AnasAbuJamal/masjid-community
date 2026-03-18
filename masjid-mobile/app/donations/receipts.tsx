import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface TaxReceipt {
  id: string;
  date: string;
  amount: number;
  category: string;
  status: 'completed';
}

const MOCK_RECEIPTS: TaxReceipt[] = [
  { id: '1', date: '2026-01-15', amount: 500, category: 'General Fund', status: 'completed' },
  { id: '2', date: '2026-02-01', amount: 250, category: 'Ramadan Fund', status: 'completed' },
];

export default function TaxReceiptsScreen() {
  const router = useRouter();
  const [receipts] = useState<TaxReceipt[]>(MOCK_RECEIPTS);

  const totalDonated = receipts.reduce((sum, r) => sum + r.amount, 0);

  const generateReceipt = (receipt: TaxReceipt) => {
    const receiptText = `
MASJID AL-MOMINEEN
Tax Receipt

Date: ${new Date(receipt.date).toLocaleDateString()}
Category: ${receipt.category}
Amount: $${receipt.amount.toFixed(2)}
Status: ${receipt.status.toUpperCase()}

This receipt is for income tax purposes.
Masjid Al-Momineen is a 501(c)(3) organization.
Tax ID: XX-XXXXXXX
    `.trim();

    Alert.alert('Tax Receipt', receiptText, [
      { text: 'Share', onPress: () => Share.share({ message: receiptText, title: 'Tax Receipt' }) },
      { text: 'Close' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Receipts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Donated This Year</Text>
          <Text style={styles.summaryAmount}>${totalDonated.toFixed(2)}</Text>
          <Text style={styles.summaryNote}>Tax-deductible donations</Text>
        </View>

        <Text style={styles.sectionTitle}>Receipts</Text>
        
        {receipts.map((receipt) => (
          <TouchableOpacity key={receipt.id} style={styles.receiptCard} onPress={() => generateReceipt(receipt)}>
            <View style={styles.receiptIcon}>
              <MaterialCommunityIcons name="receipt" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptCategory}>{receipt.category}</Text>
              <Text style={styles.receiptDate}>{new Date(receipt.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.receiptRight}>
              <Text style={styles.receiptAmount}>${receipt.amount.toFixed(2)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.taxInfo}>
          <MaterialCommunityIcons name="information" size={20} color={COLORS.textSecondary} />
          <Text style={styles.taxInfoText}>
            Masjid Al-Momineen is a registered 501(c)(3) nonprofit. All donations are tax-deductible.
          </Text>
        </View>
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
  content: { padding: SPACING.md },
  summaryCard: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.lg, ...SHADOWS.lg,
  },
  summaryLabel: { fontSize: 14, color: COLORS.white + '99', marginBottom: SPACING.xs },
  summaryAmount: { fontSize: 36, fontWeight: '700', color: COLORS.white },
  summaryNote: { fontSize: 12, color: COLORS.white + '88', marginTop: SPACING.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.sm },
  receiptCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  receiptIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm,
  },
  receiptInfo: { flex: 1 },
  receiptCategory: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  receiptDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  receiptRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  receiptAmount: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  taxInfo: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface,
    padding: SPACING.md, borderRadius: RADIUS.lg, marginTop: SPACING.lg, gap: SPACING.sm,
  },
  taxInfoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
