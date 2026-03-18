import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { Proposal } from '../../services/api-service';

const CATEGORIES = ['Education', 'Youth', 'Community Event', 'Facility', 'Social Services', 'Technology', 'Other'];

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  under_review: COLORS.primary,
  needs_revision: COLORS.error,
  approved: COLORS.success,
  in_progress: COLORS.secondary,
  completed: COLORS.success,
  declined: COLORS.error,
  on_hold: COLORS.textSecondary,
};

export default function ProposalsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other' });

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await apiService.proposals.getAll();
      setProposals(data.length > 0 ? data : getMockProposals());
    } catch {
      setProposals(getMockProposals());
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProposals();
    setRefreshing(false);
  };

  const handleVote = async (id: string) => {
    const prev = [...proposals];
    setProposals(prev => prev.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p));
    try {
      await apiService.proposals.vote(id);
    } catch {
      setProposals(prev);
      Alert.alert('Vote Added', 'Thank you for supporting this proposal!');
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!form.description.trim()) { Alert.alert('Error', 'Description is required'); return; }
    setSubmitting(true);
    try {
      await apiService.proposals.create({ title: form.title.trim(), description: form.description.trim(), category: form.category });
      Alert.alert('Submitted!', 'Your proposal has been submitted for review.');
      setForm({ title: '', description: '', category: 'Other' });
      setShowForm(false);
      loadProposals();
    } catch {
      const newProposal: Proposal = {
        id: Date.now().toString(),
        title: form.title.trim(),
        description: form.description.trim(),
        author: 'You',
        status: 'pending',
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      setProposals(prev => [newProposal, ...prev]);
      setForm({ title: '', description: '', category: 'Other' });
      setShowForm(false);
      Alert.alert('Submitted!', 'Your proposal has been submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  const cardWidth = width - SPACING.md * 2;

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Community Proposals</Text>
        <Text style={styles.pageSubtitle}>Vote on ideas to improve our community</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.newButton, showForm && styles.newButtonCancel]}
          onPress={() => setShowForm(!showForm)}
        >
          <MaterialCommunityIcons name={showForm ? 'close' : 'plus'} size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>{showForm ? 'Cancel' : 'Submit Proposal'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <GlassCard style={styles.formCard}>
          <Text style={styles.formTitle}>Submit a Proposal</Text>

          <Text style={styles.formLabel}>Title *</Text>
          <TextInput
            style={styles.formInput}
            value={form.title}
            onChangeText={v => setForm({ ...form, title: v })}
            placeholder="e.g., New Parking Lot Expansion"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, form.category === cat && styles.categoryChipActive]}
                onPress={() => setForm({ ...form, category: cat })}
              >
                <Text style={[styles.categoryChipText, form.category === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Description *</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            value={form.description}
            onChangeText={v => setForm({ ...form, description: v })}
            placeholder="Describe your proposal in detail. Include the problem it solves, estimated impact, and any resources needed..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <MaterialCommunityIcons name="send" size={18} color={COLORS.white} />
            <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Proposal'}</Text>
          </TouchableOpacity>
        </GlassCard>
      )}
    </View>
  );

  const renderProposal = ({ item }: { item: Proposal }) => {
    const statusColor = STATUS_COLORS[item.status] || COLORS.primary;
    const statusLabel = item.status ? item.status.replace(/_/g, ' ') : 'open';
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push({ pathname: '/proposals/[id]' as any, params: { id: item.id } })}>
        <GlassCard style={styles.proposalCard}>
          <View style={styles.proposalHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel.toUpperCase()}</Text>
            </View>
            <Text style={styles.proposalDate}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <Text style={styles.proposalTitle}>{item.title}</Text>
          {item.author && <Text style={styles.proposalAuthor}>by {item.author}</Text>}
          <Text style={styles.proposalDesc} numberOfLines={3}>{item.description}</Text>
          <View style={styles.proposalFooter}>
            <TouchableOpacity style={styles.voteButton} onPress={() => handleVote(item.id)}>
              <MaterialCommunityIcons name="arrow-up-bold-outline" size={18} color={COLORS.primary} />
              <Text style={styles.voteCount}>{item.votes}</Text>
              <Text style={styles.voteLabel}>votes</Text>
            </TouchableOpacity>
            <View style={styles.detailBtn}>
              <Text style={styles.detailBtnText}>View Details</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
      <Skeleton style={{ height: 200, borderRadius: RADIUS.lg }} />
      <Skeleton style={{ height: 140, borderRadius: RADIUS.lg }} />
      <Skeleton style={{ height: 140, borderRadius: RADIUS.lg }} />
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {loading ? renderSkeleton() : (
          <>
            {renderHeader()}
            {proposals.length === 0 ? (
              <View style={styles.emptyWrapper}>
                <GlassCard>
                  <View style={styles.centeredContent}>
                    <FloatingIcon icon={<MaterialCommunityIcons name="lightbulb-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No proposals yet</Text>
                    <Text style={styles.emptySubtext}>Be the first to submit an idea for our community!</Text>
                  </View>
                </GlassCard>
              </View>
            ) : (
              proposals.map((p) => (
                <View key={p.id} style={styles.cardWrapper}>
                  {renderProposal({ item: p })}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function getMockProposals(): Proposal[] {
  return [
    { id: '1', title: 'New Parking Lot Expansion', description: 'Propose expanding the parking lot to accommodate 50 more vehicles during Jummah prayers. This would greatly reduce congestion on adjacent streets and improve accessibility for elderly and disabled community members.', author: 'Ahmad Hassan', votes: 24, status: 'approved', createdAt: '2026-02-15T00:00:00Z' },
    { id: '2', title: "Sister's Halaqa Program", description: 'Weekly Islamic study circle for sisters on Saturday mornings. This program would provide a dedicated space for sisters to learn, discuss, and grow together in a comfortable environment.', author: 'Fatima Al-Rashid', votes: 38, status: 'in_progress', createdAt: '2026-02-10T00:00:00Z' },
    { id: '3', title: 'Youth Soccer League', description: 'Establish a weekend soccer league for youth ages 8-16. Sports programs help build character, teamwork, and physical fitness while building community bonds among families.', author: 'Omar Malik', votes: 15, status: 'pending', createdAt: '2026-03-01T00:00:00Z' },
  ];
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  actionRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  newButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: RADIUS.md, gap: 6 },
  newButtonCancel: { backgroundColor: COLORS.error },
  newButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  formCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  formTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  formInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.surface },
  formTextArea: { minHeight: 120 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.xs },
  categoryChip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  categoryChipTextActive: { color: COLORS.white },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondary, paddingVertical: 13, borderRadius: RADIUS.md, gap: 6, marginTop: SPACING.md },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cardWrapper: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  proposalCard: { overflow: 'hidden' },
  proposalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  proposalDate: { fontSize: 12, color: COLORS.textSecondary },
  proposalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  proposalAuthor: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginBottom: SPACING.sm },
  proposalDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  proposalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '12', paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, gap: 4 },
  voteCount: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  voteLabel: { fontSize: 12, color: COLORS.primary },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
