import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  votes: number;
  userVoted: boolean;
  createdAt: string;
}

const MOCK_PROPOSALS: Proposal[] = [
  { id: '1', title: 'Expand Parking Lot', description: 'Build additional parking spaces to accommodate growing congregation.', author: 'Ahmed M.', status: 'pending', votes: 45, userVoted: false, createdAt: '2026-02-10' },
  { id: '2', title: 'Add Youth Program', description: 'Start a comprehensive youth mentorship program.', author: 'Fatima S.', status: 'approved', votes: 78, userVoted: true, createdAt: '2026-01-15' },
  { id: '3', title: 'Solar Panels', description: 'Install solar panels on roof for energy efficiency.', author: 'Community Board', status: 'pending', votes: 32, userVoted: false, createdAt: '2026-02-18' },
];

export default function VotingScreen() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);

  const handleVote = (id: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, votes: p.userVoted ? p.votes - 1 : p.votes + 1, userVoted: !p.userVoted };
      }
      return p;
    }));
    
    const proposal = proposals.find(p => p.id === id);
    if (proposal && !proposal.userVoted) {
      Alert.alert('Voted!', 'Your vote has been recorded.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const totalVotes = proposals.reduce((sum, p) => sum + p.votes, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Proposals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="vote" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Have Your Say</Text>
            <Text style={styles.infoText}>Vote on proposals to help shape our community.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{proposals.length}</Text>
            <Text style={styles.statLabel}>Proposals</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalVotes}</Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
        </View>

        {proposals.map((proposal) => (
          <View key={proposal.id} style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(proposal.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(proposal.status) }]}>
                  {proposal.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.author}>by {proposal.author}</Text>
            </View>

            <Text style={styles.proposalTitle}>{proposal.title}</Text>
            <Text style={styles.proposalDesc}>{proposal.description}</Text>

            <View style={styles.proposalFooter}>
              <TouchableOpacity style={styles.voteButton} onPress={() => handleVote(proposal.id)}>
                <MaterialCommunityIcons 
                  name={proposal.userVoted ? 'thumb-up' : 'thumb-up-outline'} 
                  size={20} 
                  color={proposal.userVoted ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[styles.voteText, proposal.userVoted && styles.voteTextActive]}>
                  {proposal.votes}
                </Text>
              </TouchableOpacity>
              <Text style={styles.date}>{new Date(proposal.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
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
  infoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '12',
    padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.md, gap: SPACING.sm,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  stat: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  proposalCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  proposalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  author: { fontSize: 12, color: COLORS.textSecondary },
  proposalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  proposalDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  proposalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voteButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  voteText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  voteTextActive: { color: COLORS.primary },
  date: { fontSize: 12, color: COLORS.textLight },
});
