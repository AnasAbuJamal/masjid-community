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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { Proposal } from '../../services/api-service';
import { validateForm, proposalSchema } from '../../utils/validation';

const CATEGORIES = ['Education', 'Youth', 'Community Event', 'Facility', 'Social Services', 'Technology', 'Other'];
const STATUS_OPTIONS = ['all', 'pending', 'approved', 'in_progress', 'completed'];

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

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export default function ProposalsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');
  const [proposalComments, setProposalComments] = useState<Record<string, Comment[]>>({});

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
    const errors = validateForm(proposalSchema, form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
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

  const filteredProposals = proposals
    .filter(p => selectedStatus === 'all' || p.status === selectedStatus)
    .sort((a, b) => sortBy === 'votes' ? b.votes - a.votes : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getCommentsCount = (proposalId: string) => {
    return proposalComments[proposalId]?.length || 0;
  };

  const renderHeader = () => (
    <View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.newButton, showForm && styles.newButtonCancel]}
          onPress={() => { setShowForm(!showForm); if (showForm) setFormErrors({}); }}
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
            style={[styles.formInput, formErrors.title && styles.formInputError]}
            value={form.title}
            onChangeText={v => updateForm('title', v)}
            placeholder="e.g., New Parking Lot Expansion"
            placeholderTextColor={COLORS.textLight}
          />
          {formErrors.title && <Text style={styles.formError}>{formErrors.title}</Text>}

          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, form.category === cat && styles.categoryChipActive]}
                onPress={() => updateForm('category', cat)}
              >
                <Text style={[styles.categoryChipText, form.category === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Description *</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea, formErrors.description && styles.formInputError]}
            value={form.description}
            onChangeText={v => updateForm('description', v)}
            placeholder="Describe your proposal in detail. Include the problem it solves, estimated impact, and any resources needed..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {formErrors.description && <Text style={styles.formError}>{formErrors.description}</Text>}

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

      {/* Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_OPTIONS.map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.filterText, selectedStatus === status && styles.filterTextActive]}>
                {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sortRow}>
          <TouchableOpacity style={[styles.sortButton, sortBy === 'votes' && styles.sortButtonActive]} onPress={() => setSortBy('votes')}>
            <MaterialCommunityIcons name="fire" size={14} color={sortBy === 'votes' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.sortText, sortBy === 'votes' && styles.sortTextActive]}>Top Voted</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]} onPress={() => setSortBy('recent')}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={sortBy === 'recent' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>Recent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProposal = ({ item }: { item: Proposal }) => {
    const statusColor = STATUS_COLORS[item.status] || COLORS.primary;
    const statusLabel = item.status ? item.status.replace(/_/g, ' ') : 'open';
    const commentsCount = getCommentsCount(item.id);
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
            <View style={styles.commentButton}>
              <MaterialCommunityIcons name="comment-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.commentCount}>{commentsCount > 0 ? commentsCount : 'Comments'}</Text>
            </View>
            <View style={styles.detailBtn}>
              <Text style={styles.detailBtnText}>Details</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proposals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {loading ? renderSkeleton() : (
          <>
            {renderHeader()}
            {filteredProposals.length === 0 ? (
              <View style={styles.emptyWrapper}>
                <GlassCard>
                  <View style={styles.centeredContent}>
                    <FloatingIcon icon={<MaterialCommunityIcons name="lightbulb-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No proposals found</Text>
                    <Text style={styles.emptySubtext}>Try changing your filters or submit a new proposal!</Text>
                  </View>
                </GlassCard>
              </View>
            ) : (
              filteredProposals.map((p) => (
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
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
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
  formInputError: { borderColor: COLORS.error, borderWidth: 1.5 },
  formError: { fontSize: 12, color: COLORS.error, marginTop: 4, marginBottom: 4 },
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
  commentButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentCount: { fontSize: 12, color: COLORS.textSecondary },
  
  filterSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  filterChip: { paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, marginRight: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  sortRow: { flexDirection: 'row', gap: SPACING.xs },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: COLORS.surface },
  sortButtonActive: { backgroundColor: COLORS.secondary },
  sortText: { fontSize: 12, color: COLORS.textSecondary },
  sortTextActive: { color: COLORS.white },

  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
