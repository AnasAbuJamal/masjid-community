import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { WorkerProfile } from '../../services/api-service';

const AVAILABILITY_COLORS: Record<string, string> = {
  available: COLORS.success,
  open_to_offers: COLORS.warning,
  not_available: COLORS.error,
};

export default function WorkersScreen() {
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await apiService.workers.getAll();
      setWorkers(data.length > 0 ? data : getMockWorkers());
    } catch {
      setWorkers(getMockWorkers());
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkers();
    setRefreshing(false);
  };

  const handleContact = (worker: WorkerProfile) => {
    if (worker.availability === 'not_available') {
      Alert.alert('Not Available', `${worker.fullName} is currently not accepting new work.`);
      return;
    }
    Alert.alert(
      `Contact ${worker.fullName}`,
      'How would you like to reach out?',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(worker.phone ? [{ text: 'Call', onPress: () => Linking.openURL(`tel:${worker.phone}`) }] : []),
        ...(worker.email ? [{ text: 'Email', onPress: () => Linking.openURL(`mailto:${worker.email}`) }] : []),
      ].filter(Boolean) as any
    );
  };

  const renderStars = (count: number = 5) => (
    <View style={styles.stars}>
      {[...Array(count)].map((_, i) => (
        <MaterialCommunityIcons key={i} name="star" size={14} color={COLORS.warning} />
      ))}
    </View>
  );

  const renderWorker = ({ item }: { item: WorkerProfile }) => {
    const availColor = AVAILABILITY_COLORS[item.availability] || AVAILABILITY_COLORS.not_available;
    const availLabel = item.availability === 'available' ? 'Available' : item.availability === 'open_to_offers' ? 'Open to Offers' : 'Not Available';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/workers/[id]' as any, params: { id: item.id } })}
      >
        <GlassCard style={styles.workerCard}>
          <View style={styles.workerHeader}>
            <View style={[styles.avatar, { borderColor: availColor }]}>
              <Text style={styles.avatarText}>
                {item.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{item.fullName}</Text>
              <Text style={styles.workerTrade}>{item.headline}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
                {renderStars()}
              </View>
            </View>
            <View style={[styles.availBadge, { backgroundColor: availColor + '18' }]}>
              <View style={[styles.availDot, { backgroundColor: availColor }]} />
              <Text style={[styles.availText, { color: availColor }]}>{availLabel}</Text>
            </View>
          </View>

          <View style={styles.skillsRow}>
            {item.skills.slice(0, 4).map(skill => (
              <View key={skill} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 4 && (
              <View style={[styles.skillBadge, styles.skillBadgeMore]}>
                <Text style={styles.skillText}>+{item.skills.length - 4}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.contactButton, item.availability === 'not_available' && styles.contactButtonDisabled]}
            onPress={() => handleContact(item)}
          >
            <MaterialCommunityIcons
              name="phone-outline"
              size={16}
              color={item.availability === 'not_available' ? COLORS.textSecondary : COLORS.white}
            />
            <Text style={[styles.contactText, item.availability === 'not_available' && styles.contactTextDisabled]}>
              {item.availability === 'not_available' ? 'Not Available' : 'Contact'}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
      {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 160, borderRadius: RADIUS.lg }} />)}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Workers</Text>
        <Text style={styles.pageSubtitle}>Community-vetted contractors available for hire</Text>
      </View>

      {loading ? renderSkeleton() : (
        <FlatList
          data={workers}
          keyExtractor={item => item.id}
          renderItem={renderWorker}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <GlassCard>
                <View style={styles.centeredContent}>
                  <FloatingIcon icon={<MaterialCommunityIcons name="account-hard-hat-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                  <Text style={styles.emptyTitle}>No workers listed</Text>
                  <Text style={styles.emptySubtext}>Community contractors will appear here</Text>
                </View>
              </GlassCard>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}
    </ScreenWrapper>
  );
}

function getMockWorkers(): WorkerProfile[] {
  return [
    { id: '1', fullName: 'Ahmed Al-Rashid', headline: 'Licensed Electrician', bio: '', skills: ['Electrical', 'Solar Installation', 'Maintenance'], location: 'Atlanta, GA', availability: 'available', status: 'approved', phone: '+1-555-0101', email: 'ahmed@contractor.com' },
    { id: '2', fullName: 'Sarah Johnson', headline: 'Professional Cleaner', bio: '', skills: ['Deep Cleaning', 'Sanitization', 'Event Setup'], location: 'Atlanta, GA', availability: 'available', status: 'approved', phone: '+1-555-0102', email: 'sarah@cleanpro.com' },
    { id: '3', fullName: 'Mohammed Khan', headline: 'HVAC Technician', bio: '', skills: ['HVAC', 'AC Repair', 'Heating Systems'], location: 'Marietta, GA', availability: 'open_to_offers', status: 'approved', phone: '+1-555-0103', email: 'mohammed@hvacpro.com' },
    { id: '4', fullName: 'Yusuf Abdi', headline: 'General Contractor', bio: '', skills: ['Construction', 'Renovation', 'Project Management'], location: 'Atlanta, GA', availability: 'available', status: 'approved', phone: '+1-555-0104', email: 'yusuf@abdicontractors.com' },
  ];
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  workerCard: { overflow: 'hidden' },
  workerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm, borderWidth: 2 },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  workerTrade: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  stars: { flexDirection: 'row', gap: 1 },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 11, fontWeight: '600' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  skillBadge: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  skillBadgeMore: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30' },
  skillText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  contactButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: RADIUS.md, gap: 6 },
  contactButtonDisabled: { backgroundColor: COLORS.border },
  contactText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  contactTextDisabled: { color: COLORS.textSecondary },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
