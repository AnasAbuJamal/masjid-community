import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { communityService } from '../../services/api';

type TabKey = 'volunteers' | 'proposals';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('volunteers');
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    communityService.getVolunteerOpportunities().then(setOpportunities);
  }, []);

  const handleApply = (opp: any) => {
    Alert.alert(
      `Apply for "${opp.title}"`,
      `${opp.spotsTotal - opp.spotsFilled} spots remaining.\n\nWould you like to sign up?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Up',
          onPress: () =>
            Alert.alert(
              '✓ Success',
              'You have signed up! Check your profile for updates.'
            ),
        },
      ]
    );
  };

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'volunteers', label: 'Volunteer', icon: 'hand-heart-outline' },
    { key: 'proposals', label: 'Proposals', icon: 'lightbulb-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'volunteers' ? (
        <FlatList
          data={opportunities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={40}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>No volunteer opportunities</Text>
              <Text style={styles.emptySubtext}>Check back soon for updates</Text>
            </Card>
          }
          renderItem={({ item }) => {
            const spotsLeft = item.spotsTotal - item.spotsFilled;
            const pct = Math.round((item.spotsFilled / item.spotsTotal) * 100);
            return (
              <Card>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'open'
                            ? COLORS.secondary + '18'
                            : COLORS.error + '18',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.status === 'open' ? COLORS.secondary : COLORS.error,
                        },
                      ]}
                    >
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>{item.description}</Text>
                {item.eventDate && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="calendar-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText}>{item.eventDate}</Text>
                  </View>
                )}
                {/* Progress bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${pct}%` }]}
                    />
                  </View>
                  <Text style={styles.spotsText}>
                    {spotsLeft} of {item.spotsTotal} spots left
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    spotsLeft === 0 && styles.applyButtonFull,
                  ]}
                  onPress={() => handleApply(item)}
                  disabled={spotsLeft === 0}
                >
                  <Text
                    style={[
                      styles.applyText,
                      spotsLeft === 0 && styles.applyTextFull,
                    ]}
                  >
                    {spotsLeft === 0 ? 'Full' : 'Volunteer'}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          }}
        />
      ) : (
        <View style={styles.content}>
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={40}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No proposals yet</Text>
            <TouchableOpacity style={styles.proposeButton}>
              <Text style={styles.proposeText}>Submit a Proposal</Text>
            </TouchableOpacity>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    gap: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: { color: COLORS.white },
  content: { padding: SPACING.md, flex: 1 },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  progressSection: { marginBottom: SPACING.sm },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
  },
  spotsText: { fontSize: 12, color: COLORS.textSecondary },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  applyButtonFull: { backgroundColor: COLORS.border },
  applyText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  applyTextFull: { color: COLORS.textSecondary },
  proposeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  proposeText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
