import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import apiService from '../../services/api-service';
import { Job } from '../../services/api-service';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    if (!id) return;
    const data = await apiService.jobs.getById(id);
    setJob(data);
  };

  const handleApply = () => {
    if (!job) return;
    router.push({ pathname: '/jobs/apply/[id]' as any, params: { id: job.id } });
  };

  const handleEmail = () => {
    if (job?.contactEmail) {
      Linking.openURL(`mailto:${job.contactEmail}?subject=Application for ${job.title}`);
    }
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full-time';
      case 'part_time': return 'Part-time';
      case 'contract': return 'Contract';
      case 'volunteer': return 'Volunteer';
      default: return type;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title & Company */}
        <View style={styles.titleSection}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          
          <View style={styles.tags}>
            <View style={styles.tag}>
              <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.primary} />
              <Text style={styles.tagText}>{job.location}</Text>
            </View>
            <View style={styles.tag}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
              <Text style={styles.tagText}>{getEmploymentTypeLabel(job.employmentType)}</Text>
            </View>
            {job.isUrgent && (
              <View style={[styles.tag, styles.tagUrgent]}>
                <MaterialCommunityIcons name="alert" size={14} color="#fff" />
                <Text style={[styles.tagText, styles.tagTextUrgent]}>Urgent</Text>
              </View>
            )}
          </View>
        </View>

        {/* Salary */}
        {job.salaryMin && job.salaryMax && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Range</Text>
            <Text style={styles.salary}>
              ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} /year
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Contact */}
        {job.contactEmail && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactEmail}>{job.contactEmail}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Posted Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted</Text>
          <Text style={styles.postedDate}>
            {new Date(job.postedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, job.status === 'closed' && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={job.status === 'closed' || applying}
        >
          <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
          <Text style={styles.applyButtonText}>
            {applying ? 'Applying...' : job.status === 'closed' ? 'Position Closed' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  company: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
  tagUrgent: {
    backgroundColor: COLORS.error,
  },
  tagTextUrgent: {
    color: COLORS.white,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  salary: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.success,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  contactEmail: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  postedDate: {
    fontSize: 15,
    color: COLORS.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  applyButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
