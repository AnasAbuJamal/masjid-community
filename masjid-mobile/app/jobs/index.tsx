import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { jobService, Job } from '../../services/api';

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  volunteer: 'Volunteer',
};

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    jobService.getAll().then(setJobs);
  }, []);

  const handleApply = (job: Job) => {
    Alert.alert(
      `Apply for "${job.title}"`,
      `Position at ${job.company} in ${job.location}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply via Email',
          onPress: () => {
            if (job.contactEmail) {
              Linking.openURL(
                `mailto:${job.contactEmail}?subject=Application for ${job.title}`
              );
            } else {
              Alert.alert('No contact info', 'Please visit the masjid office.');
            }
          },
        },
      ]
    );
  };

  const formatSalary = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    if (job.salaryMin && job.salaryMax) {
      if (job.salaryMin < 1000) {
        return `$${job.salaryMin}–$${job.salaryMax}/hr`;
      }
      return `$${(job.salaryMin / 1000).toFixed(0)}K–$${(job.salaryMax / 1000).toFixed(0)}K/yr`;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={40}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No jobs posted yet</Text>
            <Text style={styles.emptySubtext}>
              Check back soon for community job listings
            </Text>
          </Card>
        }
        renderItem={({ item }) => {
          const salary = formatSalary(item);
          return (
            <Card>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrap}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  {item.isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.company}>{item.company}</Text>
              </View>

              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.tagText}>{item.location}</Text>
                </View>
                <View style={styles.tag}>
                  <MaterialCommunityIcons
                    name="briefcase-clock-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.tagText}>
                    {EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}
                  </Text>
                </View>
                {salary && (
                  <View style={[styles.tag, styles.salaryTag]}>
                    <MaterialCommunityIcons
                      name="currency-usd"
                      size={13}
                      color={COLORS.secondary}
                    />
                    <Text style={[styles.tagText, { color: COLORS.secondary }]}>
                      {salary}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => handleApply(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyText}>Apply Now</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={16}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  cardHeader: { marginBottom: SPACING.xs },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  urgentBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    flexShrink: 0,
  },
  urgentText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  company: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  salaryTag: { backgroundColor: COLORS.secondary + '15' },
  tagText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },

  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  applyText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
