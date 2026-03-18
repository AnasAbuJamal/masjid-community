import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  targetDate: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  status: string;
  votes: number;
  createdAt: string;
  category?: string;
  budget?: number;
  timeline?: string;
  milestones?: Milestone[];
}

const MOCK_PROPOSAL: Proposal = {
  id: '1',
  title: 'New Parking Lot Expansion',
  description: 'Propose expanding the parking lot to accommodate 50 more vehicles during Jummah prayers. This would greatly reduce congestion on adjacent streets and improve accessibility for elderly and disabled community members.\n\nThe expansion would include:\n- 50 new parking spaces\n- LED lighting for evening safety\n- Accessible parking spots near the entrance\n- Stormwater drainage system\n\nTotal estimated cost: $75,000',
  author: 'Ahmad Hassan',
  votes: 24,
  status: 'approved',
  createdAt: '2026-02-15T00:00:00Z',
  category: 'Facility',
  budget: 75000,
  timeline: '6 months',
  milestones: [
    { id: '1', title: 'Planning & Design', description: 'Architectural planning and permitting', status: 'completed', targetDate: '2026-03-01' },
    { id: '2', title: 'Site Preparation', description: 'Clear land and prepare foundation', status: 'in_progress', targetDate: '2026-04-15' },
    { id: '3', title: 'Paving & Lighting', description: 'Asphalt paving and LED installation', status: 'pending', targetDate: '2026-06-01' },
    { id: '4', title: 'Final Inspection', description: 'Safety checks and final approval', status: 'pending', targetDate: '2026-07-15' },
  ],
};

const MOCK_COMMENTS: Comment[] = [
  { id: '1', author: 'Fatima Al-Rashid', content: 'This is much needed! The parking situation on Fridays is really difficult.', createdAt: '2026-02-16T10:30:00Z' },
  { id: '2', author: 'Omar Malik', content: 'Great initiative. Would this also help with the Eid parking?', createdAt: '2026-02-16T14:22:00Z' },
  { id: '3', author: 'Sarah Johnson', content: 'I support this 100%. Can we also add some shade structures?', createdAt: '2026-02-17T09:15:00Z' },
];

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    setLoading(true);
    setTimeout(() => {
      setProposal(MOCK_PROPOSAL);
      setComments(MOCK_COMMENTS);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProposal();
    setRefreshing(false);
  };

  const handleVote = () => {
    if (!proposal) return;
    setProposal(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const comment: Comment = {
        id: Date.now().toString(),
        author: 'You',
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setSubmitting(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'under_review': return COLORS.primary;
      case 'approved': return COLORS.success;
      case 'in_progress': return COLORS.secondary;
      case 'completed': return COLORS.success;
      case 'declined': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'in_progress': return 'progress-clock';
      default: return 'clock-outline';
    }
  };

  if (loading || !proposal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(proposal.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proposal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {proposal.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {proposal.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{proposal.category}</Text>
            </View>
          )}
        </View>

        {/* Title & Author */}
        <Text style={styles.title}>{proposal.title}</Text>
        <View style={styles.authorRow}>
          <MaterialCommunityIcons name="account" size={16} color={COLORS.textSecondary} />
          <Text style={styles.authorText}>by {proposal.author}</Text>
          <Text style={styles.dateText}> • {new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        {/* Vote Section */}
        <TouchableOpacity style={styles.voteCard} onPress={handleVote}>
          <View style={styles.voteContent}>
            <MaterialCommunityIcons name="arrow-up-bold" size={28} color={COLORS.primary} />
            <View>
              <Text style={styles.voteCount}>{proposal.votes}</Text>
              <Text style={styles.voteLabel}>votes</Text>
            </View>
          </View>
          <Text style={styles.voteHint}>Tap to vote</Text>
        </TouchableOpacity>

        {/* Budget & Timeline */}
        {(proposal.budget || proposal.timeline) && (
          <View style={styles.detailsRow}>
            {proposal.budget && (
              <View style={styles.detailCard}>
                <MaterialCommunityIcons name="currency-usd" size={20} color={COLORS.success} />
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>${proposal.budget.toLocaleString()}</Text>
              </View>
            )}
            {proposal.timeline && (
              <View style={styles.detailCard}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.secondary} />
                <Text style={styles.detailLabel}>Timeline</Text>
                <Text style={styles.detailValue}>{proposal.timeline}</Text>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{proposal.description}</Text>
        </GlassCard>

        {/* Milestones */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <View style={styles.milestonesSection}>
            <Text style={styles.sectionTitle}>Milestones & Phases</Text>
            {proposal.milestones.map((milestone, index) => {
              const msColor = getStatusColor(milestone.status);
              return (
                <GlassCard key={milestone.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneHeader}>
                    <View style={[styles.milestoneIcon, { backgroundColor: msColor + '18' }]}>
                      <MaterialCommunityIcons name={getMilestoneStatusIcon(milestone.status) as any} size={18} color={msColor} />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDate}>Target: {new Date(milestone.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                    <View style={[styles.milestoneStatusBadge, { backgroundColor: msColor + '18' }]}>
                      <Text style={[styles.milestoneStatusText, { color: msColor }]}>
                        {milestone.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Discussion ({comments.length})</Text>
          
          <GlassCard>
            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment or question..."
                placeholderTextColor={COLORS.textLight}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                <MaterialCommunityIcons name="send" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {comments.map((comment) => (
            <GlassCard key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{comment.author.charAt(0)}</Text>
                </View>
                <View style={styles.commentInfo}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </GlassCard>
          ))}

          {comments.length === 0 && (
            <GlassCard>
              <View style={styles.emptyComments}>
                <MaterialCommunityIcons name="comment-outline" size={32} color={COLORS.textSecondary} />
                <Text style={styles.emptyCommentText}>No comments yet. Be the first to comment!</Text>
              </View>
            </GlassCard>
          )}
        </View>

        <View style={styles.bottomSpacer} />
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  
  statusRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm + 4, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  categoryBadge: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm + 4, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  categoryText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  authorText: { fontSize: 14, color: COLORS.textSecondary },
  dateText: { fontSize: 13, color: COLORS.textSecondary },
  
  voteCard: { backgroundColor: COLORS.primary + '12', borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '30' },
  voteContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  voteCount: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  voteLabel: { fontSize: 12, color: COLORS.primary },
  voteHint: { fontSize: 12, color: COLORS.textSecondary },
  
  detailsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  detailCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  detailLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  detailValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  description: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  
  milestonesSection: { marginTop: SPACING.md },
  milestoneCard: { marginBottom: SPACING.sm },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  milestoneIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  milestoneDate: { fontSize: 12, color: COLORS.textSecondary },
  milestoneStatusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  milestoneStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  milestoneDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  
  commentsSection: { marginTop: SPACING.md },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  commentTextInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: 14, color: COLORS.text, maxHeight: 80 },
  sendButton: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  
  commentCard: { marginTop: SPACING.sm },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  commentAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  commentInfo: { flex: 1 },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  commentDate: { fontSize: 11, color: COLORS.textSecondary },
  commentContent: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  
  emptyComments: { alignItems: 'center', paddingVertical: SPACING.md },
  emptyCommentText: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  
  bottomSpacer: { height: SPACING.xl },
});