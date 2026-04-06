import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalDonated: number;
  donationCount: number;
  lastDonationDate: string;
  donorLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface Pledge {
  id: string;
  campaignName: string;
  amount: number;
  pledgeDate: string;
  status: 'active' | 'fulfilled' | 'cancelled';
}

const MOCK_DONORS: Donor[] = [
  { id: '1', firstName: 'Ahmad', lastName: 'Ali', email: 'ahmad@example.com', phone: '555-1234', totalDonated: 15000, donationCount: 24, lastDonationDate: '2026-03-15', donorLevel: 'platinum' },
  { id: '2', firstName: 'Fatima', lastName: 'Hassan', email: 'fatima@example.com', phone: '555-2345', totalDonated: 8500, donationCount: 12, lastDonationDate: '2026-03-10', donorLevel: 'gold' },
  { id: '3', firstName: 'Omar', lastName: 'Malik', email: 'omar@example.com', phone: '555-3456', totalDonated: 5200, donationCount: 8, lastDonationDate: '2026-03-01', donorLevel: 'silver' },
  { id: '4', firstName: 'Sarah', lastName: 'Ahmed', email: 'sarah@example.com', phone: '555-4567', totalDonated: 2100, donationCount: 6, lastDonationDate: '2026-02-28', donorLevel: 'bronze' },
  { id: '5', firstName: 'Yusuf', lastName: 'Rahman', email: 'yusuf@example.com', phone: '555-5678', totalDonated: 1200, donationCount: 3, lastDonationDate: '2026-02-15', donorLevel: 'bronze' },
];

const MOCK_PLEDGES: Pledge[] = [
  { id: '1', campaignName: 'Expansion Project', amount: 10000, pledgeDate: '2026-01-15', status: 'active' },
  { id: '2', campaignName: 'Ramadan Fund', amount: 2500, pledgeDate: '2026-02-01', status: 'fulfilled' },
  { id: '3', campaignName: 'Youth Program', amount: 5000, pledgeDate: '2026-02-20', status: 'active' },
];

const LEVEL_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const LEVEL_THRESHOLDS = [
  { level: 'platinum', min: 10000, label: 'Platinum', benefits: ['VIP Seating', 'Name Recognition', 'Private Events'] },
  { level: 'gold', min: 5000, label: 'Gold', benefits: ['Priority Seating', 'Quarterly Reports'] },
  { level: 'silver', min: 2500, label: 'Silver', benefits: ['Monthly Newsletter'] },
  { level: 'bronze', min: 0, label: 'Bronze', benefits: ['Tax Receipts'] },
];

export default function DonationsCrmScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [selectedTab, setSelectedTab] = useState<'donors' | 'pledges' | 'levels'>('donors');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDonors(MOCK_DONORS);
    setPledges(MOCK_PLEDGES);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const filteredDonors = donors.filter(d => 
    !searchQuery || 
    `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPledged = pledges.filter(p => p.status === 'active').reduce((sum, p) => sum + p.amount, 0);
  const fulfilledPledges = pledges.filter(p => p.status === 'fulfilled').reduce((sum, p) => sum + p.amount, 0);

  const renderDonorsTab = () => (
    <View>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search donors..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredDonors.map(donor => (
        <TouchableOpacity key={donor.id} onPress={() => {}}>
          <GlassCard style={styles.donorCard}>
            <View style={styles.donorHeader}>
              <View style={styles.donorAvatar}>
                <Text style={styles.donorAvatarText}>{donor.firstName[0]}{donor.lastName[0]}</Text>
              </View>
              <View style={styles.donorInfo}>
                <Text style={styles.donorName}>{donor.firstName} {donor.lastName}</Text>
                <Text style={styles.donorEmail}>{donor.email}</Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[donor.donorLevel] + '20' }]}>
                <MaterialCommunityIcons name="star" size={12} color={LEVEL_COLORS[donor.donorLevel]} />
                <Text style={[styles.levelText, { color: LEVEL_COLORS[donor.donorLevel] }]}>{donor.donorLevel}</Text>
              </View>
            </View>
            <View style={styles.donorStats}>
              <View style={styles.donorStat}>
                <Text style={styles.donorStatValue}>${donor.totalDonated.toLocaleString()}</Text>
                <Text style={styles.donorStatLabel}>Total Given</Text>
              </View>
              <View style={styles.donorStat}>
                <Text style={styles.donorStatValue}>{donor.donationCount}</Text>
                <Text style={styles.donorStatLabel}>Donations</Text>
              </View>
              <View style={styles.donorStat}>
                <Text style={styles.donorStatValue}>{donor.lastDonationDate}</Text>
                <Text style={styles.donorStatLabel}>Last Date</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPledgesTab = () => (
    <View>
      <View style={styles.pledgeSummary}>
        <GlassCard style={styles.pledgeSummaryCard}>
          <Text style={styles.pledgeSummaryLabel}>Active Pledges</Text>
          <Text style={styles.pledgeSummaryValue}>${totalPledged.toLocaleString()}</Text>
        </GlassCard>
        <GlassCard style={styles.pledgeSummaryCard}>
          <Text style={styles.pledgeSummaryLabel}>Fulfilled</Text>
          <Text style={[styles.pledgeSummaryValue, { color: COLORS.success }]}>${fulfilledPledges.toLocaleString()}</Text>
        </GlassCard>
      </View>

      {pledges.map(pledge => (
        <GlassCard key={pledge.id} style={styles.pledgeCard}>
          <View style={styles.pledgeHeader}>
            <Text style={styles.pledgeCampaign}>{pledge.campaignName}</Text>
            <View style={[styles.pledgeStatus, { backgroundColor: pledge.status === 'active' ? COLORS.warning + '15' : COLORS.success + '15' }]}>
              <Text style={[styles.pledgeStatusText, { color: pledge.status === 'active' ? COLORS.warning : COLORS.success }]}>
                {pledge.status.charAt(0).toUpperCase() + pledge.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.pledgeAmount}>${pledge.amount.toLocaleString()}</Text>
          <Text style={styles.pledgeDate}>Pledged: {pledge.pledgeDate}</Text>
        </GlassCard>
      ))}
    </View>
  );

  const renderLevelsTab = () => (
    <View>
      {LEVEL_THRESHOLDS.map(level => (
        <GlassCard key={level.level} style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={[styles.levelIcon, { backgroundColor: LEVEL_COLORS[level.level] + '20' }]}>
              <MaterialCommunityIcons name="star" size={20} color={LEVEL_COLORS[level.level]} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>{level.label}</Text>
              <Text style={styles.levelMin}>${level.min.toLocaleString()}+</Text>
            </View>
          </View>
          <View style={styles.levelBenefits}>
            {level.benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <MaterialCommunityIcons name="check" size={14} color={COLORS.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
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
          <Text style={styles.welcomeText}>Donations CRM</Text>
          <Text style={styles.subtitle}>Manage donors, pledges & recognition</Text>
        </View>

        <View style={styles.tabs}>
          {(['donors', 'pledges', 'levels'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {selectedTab === 'donors' && renderDonorsTab()}
          {selectedTab === 'pledges' && renderPledgesTab()}
          {selectedTab === 'levels' && renderLevelsTab()}
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
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  content: { paddingHorizontal: SPACING.md },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  donorCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  donorHeader: { flexDirection: 'row', alignItems: 'center' },
  donorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  donorAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  donorInfo: { flex: 1, marginLeft: SPACING.sm },
  donorName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  donorEmail: { fontSize: 12, color: COLORS.textSecondary },
  levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, gap: 4 },
  levelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  donorStats: { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  donorStat: { flex: 1, alignItems: 'center' },
  donorStatValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  donorStatLabel: { fontSize: 10, color: COLORS.textSecondary },

  pledgeSummary: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  pledgeSummaryCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  pledgeSummaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  pledgeSummaryValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 4 },

  pledgeCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  pledgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pledgeCampaign: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pledgeStatus: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  pledgeStatusText: { fontSize: 11, fontWeight: '700' },
  pledgeAmount: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginVertical: SPACING.xs },
  pledgeDate: { fontSize: 12, color: COLORS.textSecondary },

  levelCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  levelHeader: { flexDirection: 'row', alignItems: 'center' },
  levelIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  levelInfo: { flex: 1, marginLeft: SPACING.sm },
  levelName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  levelMin: { fontSize: 13, color: COLORS.textSecondary },
  levelBenefits: { marginTop: SPACING.sm, gap: SPACING.xs },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  benefitText: { fontSize: 13, color: COLORS.textSecondary },
});
