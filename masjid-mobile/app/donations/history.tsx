import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import donationService from '../../services/donation-service';
import { Donation } from '../../services/api-service';

export default function DonationHistoryScreen() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDonated, setTotalDonated] = useState(0);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      const data = await donationService.getDonationHistory();
      setDonations(data);
      setTotalDonated(data.reduce((sum, d) => sum + d.amount, 0));
    } catch {
      setDonations([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'zakat': return 'cash';
      case 'sadaqah': return 'heart';
      case 'fitra': return 'star';
      case 'ramadan': return 'star-crescent';
      case 'building': return 'office-building';
      default: return 'gift';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'failed': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Donation }) => (
    <View style={styles.donationCard}>
      <View style={styles.donationIcon}>
        <MaterialCommunityIcons 
          name={getCategoryIcon(item.category) as any} 
          size={24} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.donationInfo}>
        <Text style={styles.donationCategory}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
        <Text style={styles.donationDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.donationRight}>
        <Text style={styles.donationAmount}>${item.amount.toFixed(2)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Total Donated</Text>
      <Text style={styles.summaryAmount}>${totalDonated.toFixed(2)}</Text>
      <Text style={styles.summaryCount}>{donations.length} donations</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Donation History</Text>
      </View>

      <FlatList
        data={donations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={donations.length > 0 ? renderHeader : null}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="heart-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No donations yet</Text>
            <Text style={styles.emptySubtext}>Your generosity makes a difference</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  list: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.white + '99',
    marginBottom: SPACING.xs,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  summaryCount: {
    fontSize: 13,
    color: COLORS.white + '88',
    marginTop: SPACING.xs,
  },
  donationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  donationIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  donationInfo: {
    flex: 1,
  },
  donationCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  donationDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  donationRight: {
    alignItems: 'flex-end',
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
