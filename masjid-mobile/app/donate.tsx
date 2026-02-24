import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface Campaign {
  id: string;
  name: string;
  description: string;
  raised: number;
  goal: number;
  icon: string;
  color: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'general',
    name: 'General Fund',
    description: 'Support daily masjid operations',
    raised: 28400,
    goal: 50000,
    icon: 'mosque',
    color: COLORS.primary,
  },
  {
    id: 'construction',
    name: 'Expansion Project',
    description: 'Phase 2 construction fund',
    raised: 142000,
    goal: 250000,
    icon: 'office-building',
    color: COLORS.secondary,
  },
  {
    id: 'ramadan',
    name: 'Ramadan Fund',
    description: 'Iftars, Tarawih, Zakat al-Fitr',
    raised: 8200,
    goal: 15000,
    icon: 'star-crescent',
    color: COLORS.accent,
  },
];

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function DonateScreen() {
  const router = useRouter();
  const [selectedCampaign, setSelectedCampaign] = useState('general');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');

  const campaign = CAMPAIGNS.find((c) => c.id === selectedCampaign)!;
  const donationAmount = selectedAmount ?? (parseFloat(customAmount) || null);
  const pct = Math.round((campaign.raised / campaign.goal) * 100);

  const handleDonate = () => {
    if (!donationAmount || donationAmount <= 0) {
      Alert.alert('Amount Required', 'Please select or enter a donation amount.');
      return;
    }
    Alert.alert(
      'Jazakallah Khayran!',
      `Your donation of $${donationAmount} to the ${campaign.name} has been received. May Allah bless you abundantly.`,
      [{ text: 'Ameen!', onPress: () => router.back() }]
    );
  };

  const formatCurrency = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support the Masjid</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Campaign selection */}
          <Text style={styles.sectionLabel}>Select Campaign</Text>
          {CAMPAIGNS.map((c) => {
            const cp = Math.round((c.raised / c.goal) * 100);
            const isSelected = selectedCampaign === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.campaignCard, isSelected && styles.campaignCardActive]}
                onPress={() => setSelectedCampaign(c.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.campaignIcon, { backgroundColor: c.color + '20' }]}>
                  <MaterialCommunityIcons name={c.icon as any} size={24} color={c.color} />
                </View>
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignName}>{c.name}</Text>
                  <Text style={styles.campaignDesc}>{c.description}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarWrap}>
                      <View style={[styles.progressFill, { width: `${cp}%`, backgroundColor: c.color }]} />
                    </View>
                    <Text style={styles.progressLabel}>
                      {formatCurrency(c.raised)} / {formatCurrency(c.goal)}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={c.color} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Amount selection */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>
            Select Amount
          </Text>
          <View style={styles.amountsGrid}>
            {PRESET_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[
                  styles.amountChip,
                  selectedAmount === a && styles.amountChipActive,
                ]}
                onPress={() => {
                  setSelectedAmount(a);
                  setCustomAmount('');
                }}
              >
                <Text
                  style={[
                    styles.amountChipText,
                    selectedAmount === a && styles.amountChipTextActive,
                  ]}
                >
                  ${a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customRow}>
            <Text style={styles.customPrefix}>$</Text>
            <TextInput
              style={styles.customInput}
              value={customAmount}
              onChangeText={(v) => {
                setCustomAmount(v);
                setSelectedAmount(null);
              }}
              placeholder="Other amount"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Optional name */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>
            Your Name (optional)
          </Text>
          <TextInput
            style={styles.nameInput}
            value={donorName}
            onChangeText={setDonorName}
            placeholder="Anonymous donation"
            placeholderTextColor={COLORS.textSecondary}
          />

          {/* Donate button */}
          <TouchableOpacity
            style={[
              styles.donateButton,
              !donationAmount && styles.donateButtonDisabled,
            ]}
            onPress={handleDonate}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="heart"
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.donateText}>
              {donationAmount
                ? `Donate $${donationAmount}`
                : 'Select an Amount'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            All donations are processed securely. Tax receipt will be emailed to you.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kav: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },

  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  campaignCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '06',
  },
  campaignIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
    flexShrink: 0,
  },
  campaignInfo: { flex: 1 },
  campaignName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  campaignDesc: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.xs + 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  progressBarWrap: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressLabel: { fontSize: 11, color: COLORS.textSecondary },

  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  amountChip: {
    width: '30%',
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  amountChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  amountChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  amountChipTextActive: { color: COLORS.white },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  customPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  customInput: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    fontSize: 16,
    color: COLORS.text,
  },

  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs + 2,
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  donateButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  donateText: { fontSize: 17, fontWeight: '700', color: COLORS.white },

  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
});
