import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { VolunteerOpportunity } from '../../services/api-service';
import { useAuthStore } from '../../stores/authStore';

type TabKey = 'volunteers' | 'proposals' | 'myvolunteers' | 'rentals';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function CommunityScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('volunteers');
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [myOpportunities, setMyOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'volunteers') {
      loadOpportunities();
    } else if (activeTab === 'myvolunteers') {
      loadMyOpportunities();
    } else if (activeTab === 'proposals') {
      loadProposals();
    }
  }, [activeTab]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await apiService.volunteers.getOpportunities();
      setOpportunities(data);
    } catch {
      setOpportunities([]);
    }
    setLoading(false);
  };

  const loadMyOpportunities = async () => {
    setLoading(true);
    try {
      const data = await apiService.volunteers.getMyOpportunities();
      setMyOpportunities(data);
    } catch {
      setMyOpportunities([]);
    }
    setLoading(false);
  };

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await apiService.proposals.getAll();
      setProposals(data);
    } catch {
      setProposals([]);
    }
    setLoading(false);
  };

  const handleSignUp = async (opp: VolunteerOpportunity) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to sign up as a volunteer.');
      return;
    }
    
    const spotsLeft = opp.spotsTotal - opp.spotsFilled;
    Alert.alert(`Sign up for "${opp.title}"`, `${spotsLeft} spots remaining.\n\nWould you like to volunteer?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Up', 
        onPress: async () => {
          try {
            await apiService.volunteers.signUp(opp.id, {
              userName: `${user.firstName} ${user.lastName}`,
              userEmail: user.email,
              userPhone: user.phone,
            });
            Alert.alert('✓ Success', 'Thank you for volunteering!');
            loadOpportunities();
          } catch {
            Alert.alert('Error', 'Failed to sign up. Please try again.');
          }
        }
      },
    ]);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const handleProposalPress = (proposal: Proposal) => {
    Alert.alert(proposal.title, proposal.description || 'No description');
  };

  const handleSubmitProposal = () => {
    Alert.alert('Submit Proposal', 'This feature is coming soon!');
  };

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'volunteers', label: 'Volunteer', icon: 'hand-heart-outline' },
    { key: 'myvolunteers', label: 'My Events', icon: 'calendar-check-outline' },
    { key: 'proposals', label: 'Proposals', icon: 'lightbulb-outline' },
    { key: 'rentals', label: 'Rentals', icon: 'package-variant' },
  ];

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      {/* Tab Bar Section */}
      <View style={styles.tabBarSection}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
              <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => handleTabChange(tab.key)}
            >
              <MaterialCommunityIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {activeTab === 'volunteers' ? (
          <FlatList
            data={opportunities}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <GlassCard>
                  <View style={styles.centeredContent}>
                    <FloatingIcon icon={<MaterialCommunityIcons name="calendar-blank-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No volunteer opportunities</Text>
                    <Text style={styles.emptySubtext}>Check back soon for updates</Text>
                  </View>
                </GlassCard>
              </View>
            }
            renderItem={({ item }) => {
              const spotsLeft = item.spotsTotal - item.spotsFilled;
              const pct = Math.round((item.spotsFilled / item.spotsTotal) * 100);
              return (
                <View style={styles.cardWrapper}>
                  <GlassCard>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'open' ? COLORS.secondary + '18' : COLORS.error + '18' }]}>
                          <Text style={[styles.statusText, { color: item.status === 'open' ? COLORS.secondary : COLORS.error }]}>{item.status?.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDesc}>{item.description}</Text>
                      <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>{item.eventDate}</Text>
                      </View>
                      <View style={styles.progressSection}>
                        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
                        <Text style={styles.spotsText}>{spotsLeft} of {item.spotsTotal} spots left</Text>
                      </View>
                      <TouchableOpacity style={[styles.applyButton, spotsLeft === 0 && styles.applyButtonFull]} onPress={() => handleSignUp(item)} disabled={spotsLeft === 0}>
                        <Text style={[styles.applyText, spotsLeft === 0 && styles.applyTextFull]}>{spotsLeft === 0 ? 'Full' : 'Volunteer'}</Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                </View>
              );
            }}
          />
        ) : activeTab === 'myvolunteers' ? (
          <FlatList
            data={myOpportunities}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <GlassCard>
                  <View style={styles.centeredContent}>
                    <FloatingIcon icon={<MaterialCommunityIcons name="calendar-check-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No upcoming events</Text>
                    <Text style={styles.emptySubtext}>Sign up for volunteer opportunities to see them here</Text>
                  </View>
                </GlassCard>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <GlassCard>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '18' }]}>
                        <Text style={[styles.statusText, { color: COLORS.success }]}>SIGNED UP</Text>
                      </View>
                    </View>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{item.eventDate}</Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
            )}
          />
        ) : activeTab === 'rentals' ? (
          <FlatList
            data={[] as any[]}
            keyExtractor={(item: any) => item?.id || 'empty'}
            renderItem={() => null}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <GlassCard>
                  <View style={styles.centeredContent}>
                    <FloatingIcon icon={<MaterialCommunityIcons name="package-variant" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>Equipment & Hall Rentals</Text>
                    <Text style={styles.emptySubtext}>Browse and book halls, tables, chairs, and more</Text>
                    <TouchableOpacity style={styles.proposeButton} onPress={() => router.push('/rentals' as any)}>
                      <Text style={styles.proposeText}>Browse Rentals</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </View>
            }
          />
        ) : activeTab === 'proposals' ? (
          <FlatList
            data={proposals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <GlassCard>
                  <View style={styles.centeredContent}>
                    <FloatingIcon icon={<MaterialCommunityIcons name="lightbulb-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No proposals yet</Text>
                    <Text style={styles.emptySubtext}>Submit your ideas to help improve our community</Text>
                    <TouchableOpacity style={styles.proposeButton} onPress={handleSubmitProposal}>
                      <Text style={styles.proposeText}>Submit a Proposal</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <GlassCard>
                  <TouchableOpacity onPress={() => handleProposalPress(item)}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? COLORS.success + '18' : COLORS.warning + '18' }]}>
                          <Text style={[styles.statusText, { color: item.status === 'approved' ? COLORS.success : COLORS.warning }]}>{item.status?.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                      <Text style={styles.metaText}>Submitted: {new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </TouchableOpacity>
                </GlassCard>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyWrapper}>
            <GlassCard>
              <View style={styles.centeredContent}>
                <FloatingIcon icon={<MaterialCommunityIcons name="package-variant" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>Equipment & Hall Rentals</Text>
                <Text style={styles.emptySubtext}>Browse and book halls, tables, chairs, and more</Text>
                <TouchableOpacity style={styles.proposeButton} onPress={() => router.push('/rentals' as any)}>
                  <Text style={styles.proposeText}>Browse Rentals</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },

  tabBarSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: SPACING.xs, gap: SPACING.xs, borderRadius: RADIUS.lg },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.md, gap: 6 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  contentSection: { flex: 1 },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  cardWrapper: { marginBottom: SPACING.sm },
  cardContent: { gap: SPACING.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  progressSection: {},
  progressBar: { height: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: RADIUS.full },
  spotsText: { fontSize: 12, color: COLORS.textSecondary },
  applyButton: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  applyButtonFull: { backgroundColor: COLORS.border },
  applyText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  applyTextFull: { color: COLORS.textSecondary },
  proposeButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 4, borderRadius: RADIUS.md, marginTop: SPACING.sm },
  proposeText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
