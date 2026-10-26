import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiService, { Proposal } from '../../services/api-service';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function VotingScreen() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voted, setVoted] = useState<string[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await apiService.proposals.getAll();
      setProposals(data.filter(p => ['pending', 'approved'].includes(p.status)));
      setError('');
    } catch {
      setError('Could not load community proposals. Pull down to retry.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };
  useEffect(() => { void load(); }, []);
  const refresh = () => { setRefreshing(true); void load(); };
  const vote = async (id: string) => {
    if (votingId) return;
    setVotingId(id);
    try {
      await apiService.proposals.vote(id);
      setVoted(previous => [...new Set([...previous, id])]);
      await load();
      Alert.alert('Vote recorded', 'Your vote was saved on the server. Repeating a vote will not add extra support.');
    } catch {
      Alert.alert('Unable to vote', 'Please sign in and try again. Your vote has not been recorded.');
    } finally { setVotingId(null); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button"
          accessibilityLabel="Go back" style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Community Voting</Text>
        <View style={styles.back} />
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <MaterialCommunityIcons name="vote-outline" size={24} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Help shape our community</Text>
              <Text style={styles.secondary}>
                Support proposals published for voting. You may vote once per proposal.
              </Text>
            </View>
          </View>
          {error ? <View style={styles.empty}>
            <Text style={styles.secondary}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.retry}>
              <Text style={styles.actionText}>Try again</Text>
            </TouchableOpacity>
          </View> : proposals.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="text-box-outline" size={42} color={COLORS.textSecondary} />
              <Text style={styles.secondary}>No proposals are currently open for voting.</Text>
            </View>
          ) : proposals.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.meta}>
                <Text style={[styles.status, { color: item.status === 'approved' ? COLORS.success : COLORS.warning }]}>
                  {item.status === 'approved' ? 'Approved' : 'Awaiting review'}
                </Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.proposalTitle}>{item.title}</Text>
              <Text style={styles.secondary}>{item.description}</Text>
              <Text style={styles.author}>Submitted by {item.author}</Text>
              <View style={styles.actions}>
                <Text style={styles.count}>{item.votes} recorded votes</Text>
                <TouchableOpacity style={styles.vote} disabled={votingId !== null || voted.includes(item.id)}
                  accessibilityRole="button" accessibilityLabel={`Support ${item.title}`}
                  onPress={() => { void vote(item.id); }}>
                  <MaterialCommunityIcons name={voted.includes(item.id) ? 'check-circle' : 'thumb-up-outline'}
                    size={20} color={COLORS.primary} />
                  <Text style={styles.actionText}>{votingId === item.id ? 'Saving…'
                    : voted.includes(item.id) ? 'Recorded' : 'Support proposal'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Text style={styles.note}>Votes reflect stored member support; vote status on this device is refreshed after submission.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  loader: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl,
    width: '100%', maxWidth: 820, alignSelf: 'center' },
  intro: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryFaded,
    marginBottom: SPACING.lg },
  introTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 21 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, gap: SPACING.sm },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  status: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12, color: COLORS.textSecondary },
  proposalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  author: { fontSize: 12, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  count: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  vote: { minHeight: 44, flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.md, backgroundColor: COLORS.primaryFaded,
    paddingHorizontal: SPACING.md, gap: SPACING.sm },
  actionText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  note: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 19, marginTop: SPACING.md },
});
