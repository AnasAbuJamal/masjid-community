import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const SAMPLE_PROPOSALS = [
  {
    id: '1',
    title: 'New Parking Lot Expansion',
    author: 'Ahmad Hassan',
    votes: 24,
    status: 'open',
    description: 'Propose expanding the parking lot to accommodate 50 more vehicles during Jummah prayers.',
    createdAt: '2026-02-15',
  },
  {
    id: '2',
    title: 'Sister\'s Halaqa Program',
    author: 'Fatima Al-Rashid',
    votes: 38,
    status: 'approved',
    description: 'Weekly Islamic study circle for sisters on Saturday mornings.',
    createdAt: '2026-02-10',
  },
];

const STATUS_COLORS: Record<string, string> = {
  open: COLORS.primary,
  approved: COLORS.secondary,
  rejected: COLORS.error,
  pending: COLORS.accent,
};

export default function ProposalsScreen() {
  const [proposals, setProposals] = useState(SAMPLE_PROPOSALS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const handleVote = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votes: p.votes + 1 } : p))
    );
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Incomplete', 'Please fill in all fields.');
      return;
    }
    const newProposal = {
      id: Date.now().toString(),
      title: form.title.trim(),
      author: 'You',
      votes: 0,
      status: 'pending',
      description: form.description.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProposals([newProposal, ...proposals]);
    setForm({ title: '', description: '' });
    setShowForm(false);
    Alert.alert('Submitted!', 'Your proposal has been submitted for review.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setShowForm(!showForm)}
        >
          <MaterialCommunityIcons
            name={showForm ? 'close' : 'plus'}
            size={20}
            color={COLORS.white}
          />
          <Text style={styles.newButtonText}>
            {showForm ? 'Cancel' : 'New Proposal'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Submit a Proposal</Text>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.formInput}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              placeholder="Proposal title..."
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Describe your proposal..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit Proposal</Text>
            </TouchableOpacity>
          </Card>
        )}

        {proposals.map((p) => {
          const statusColor = STATUS_COLORS[p.status] ?? COLORS.primaryLight;
          return (
            <Card key={p.id}>
              <View style={styles.proposalHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.date}>{p.createdAt}</Text>
              </View>
              <Text style={styles.proposalTitle}>{p.title}</Text>
              <Text style={styles.proposalAuthor}>by {p.author}</Text>
              <Text style={styles.proposalDesc} numberOfLines={3}>
                {p.description}
              </Text>
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.voteButton}
                  onPress={() => handleVote(p.id)}
                >
                  <MaterialCommunityIcons
                    name="arrow-up-bold-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.voteCount}>{p.votes}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  newButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  formCard: { marginBottom: SPACING.md },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 4,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  formTextArea: { minHeight: 100 },
  submitButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  proposalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  proposalAuthor: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  proposalDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  voteCount: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
