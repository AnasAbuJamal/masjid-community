import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/common';
import api from '../../services/api-client';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface ApprovedVolunteer {
  name: string;
  email: string;
  skills: string[];
  approvedApplications: number;
  upcomingEvents: string[];
}
interface Opportunity {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  spotsTotal: number;
  spotsFilled: number;
  status: 'open' | 'closed';
}
interface Overview {
  volunteers: ApprovedVolunteer[];
  opportunities: Opportunity[];
  counts: { pendingApplications: number; approvedApplications: number };
}
type Tab = 'volunteers' | 'opportunities';

export default function VolunteersCrmScreen() {
  const router = useRouter();
  const role = useAuthStore(state => state.user?.role);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>('volunteers');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<Overview>('/mobile/admin/volunteer-overview');
      setData(response.data);
      setError('');
    } catch {
      setError('Volunteer records could not be retrieved.');
    } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => {
    if (role === 'admin') void load();
    else setLoading(false);
  }, [role]);
  const refresh = () => { setRefreshing(true); void load(); };

  return (
    <ScreenWrapper contentPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Volunteers CRM</Text>
          <Text style={styles.subtitle}>Approved members and published opportunities</Text>
        </View>
      </View>
      {role !== 'admin' ? <View style={styles.empty}>
        <Text style={styles.muted}>Administrator access is required.</Text>
      </View> : <>
        <View style={styles.tabs}>
          {([
            ['volunteers', 'Approved Volunteers'],
            ['opportunities', 'Opportunities'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity key={key} accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
              style={[styles.tab, tab === key && styles.selected]}
              onPress={() => setTab(key)}>
              <Text style={[styles.tabLabel, tab === key && styles.selectedLabel]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loading} />
          : <ScrollView contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
            {error ? <View style={styles.empty}>
              <Text style={styles.muted}>{error}</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={refresh}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View> : data ? <>
              <View style={styles.summary}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{data.counts.approvedApplications}</Text>
                  <Text style={styles.metricLabel}>Approved assignments</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{data.counts.pendingApplications}</Text>
                  <Text style={styles.metricLabel}>Pending reviews</Text>
                </View>
              </View>
              <TouchableOpacity accessibilityRole="button"
                onPress={() => router.push('/admin/volunteers')}
                style={styles.review}>
                <Text style={styles.reviewText}>Review volunteer applications</Text>
                <MaterialCommunityIcons name="chevron-right" size={21} color={COLORS.primary} />
              </TouchableOpacity>
              {tab === 'volunteers' ? (
                data.volunteers.length === 0 ?
                  <Text style={styles.emptyText}>No approved volunteer applications have been recorded.</Text>
                  : data.volunteers.map(volunteer => (
                    <View key={volunteer.email} style={styles.card}>
                      <Text style={styles.itemName}>{volunteer.name}</Text>
                      <Text style={styles.muted}>{volunteer.email}</Text>
                      <Text style={styles.info}>{volunteer.approvedApplications} approved assignments</Text>
                      {volunteer.skills.length > 0 &&
                        <Text style={styles.muted}>Skills: {volunteer.skills.join(', ')}</Text>}
                      {volunteer.upcomingEvents.length > 0 &&
                        <Text style={styles.muted}>Upcoming: {volunteer.upcomingEvents.join(', ')}</Text>}
                    </View>
                  ))
              ) : (
                data.opportunities.length === 0 ?
                  <Text style={styles.emptyText}>No volunteer opportunities have been published.</Text>
                  : data.opportunities.map(opportunity => (
                    <View key={opportunity.id} style={styles.card}>
                      <View style={styles.row}>
                        <Text style={styles.itemName}>{opportunity.title}</Text>
                        <Text style={styles.status}>{opportunity.status}</Text>
                      </View>
                      <Text style={styles.muted}>{new Date(opportunity.eventDate).toLocaleDateString()}</Text>
                      <Text style={styles.muted}>{opportunity.description}</Text>
                      <Text style={styles.info}>
                        {opportunity.spotsFilled} of {opportunity.spotsTotal} places filled
                      </Text>
                    </View>
                  ))
              )}
              <Text style={styles.note}>
                This register reflects applications and available opportunities.
                Volunteer hours and informal teams are not recorded by the current system.
              </Text>
            </> : null}
          </ScrollView>}
      </>}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, padding: SPACING.sm,
    borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 21, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  tabs: { flexDirection: 'row', padding: SPACING.sm, gap: SPACING.sm },
  tab: { flex: 1, minHeight: 44, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
  selected: { backgroundColor: COLORS.primaryFaded },
  tabLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  selectedLabel: { color: COLORS.primary },
  loading: { flex: 1 },
  content: { width: '100%', maxWidth: 860, alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  summary: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  metric: { flex: 1, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderColor: COLORS.border, borderWidth: 1,
    padding: SPACING.md },
  metricValue: { color: COLORS.text, fontSize: 23, fontWeight: '700' },
  metricLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.xs },
  review: { minHeight: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryFaded, marginBottom: SPACING.lg },
  reviewText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border,
    borderWidth: 1, borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  itemName: { color: COLORS.text, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  muted: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  info: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', gap: SPACING.sm, justifyContent: 'space-between' },
  status: { color: COLORS.primary, fontSize: 13, textTransform: 'capitalize' },
  note: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 20, marginTop: SPACING.lg },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center',
    marginVertical: SPACING.xxl },
  empty: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  retry: { minHeight: 44, paddingHorizontal: SPACING.md, justifyContent: 'center' },
  retryText: { color: COLORS.primary, fontWeight: '700' },
});
