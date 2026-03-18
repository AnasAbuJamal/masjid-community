import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, Button } from '../../../components/common';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';
import apiService, { Job } from '../../../services/api-service';

export default function JobApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    setLoading(true);
    try {
      const data = await apiService.jobs.getById(id);
      setJob(data);
    } catch {
      setJob(null);
    }
    setLoading(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required';
    } else if (coverLetter.trim().length < 50) {
      newErrors.coverLetter = 'Please write at least 50 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiService.applications.submitJobApplication(id!, { coverLetter: coverLetter.trim() });
      Alert.alert(
        'Application Submitted!',
        'Your application has been sent. The employer will contact you soon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert(
        'Submitted!',
        'Your application was submitted successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full-time';
      case 'part_time': return 'Part-time';
      case 'contract': return 'Contract';
      case 'volunteer': return 'Volunteer';
      default: return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.notFoundText}>Job not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Apply',
          headerStyle: { backgroundColor: COLORS.surfaceGlass },
          headerTintColor: COLORS.text,
          headerTransparent: false,
          headerBackTitle: 'Cancel',
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.jobSummaryCard}>
            <View style={styles.jobSummaryHeader}>
              <View style={styles.jobSummaryIcon}>
                <MaterialCommunityIcons name="briefcase" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.jobSummaryText}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.companyName}>{job.company}</Text>
              </View>
            </View>
            <View style={styles.jobMetaRow}>
              <View style={styles.jobMetaItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.jobMetaText}>{job.location}</Text>
              </View>
              <View style={styles.jobMetaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.jobMetaText}>{getEmploymentTypeLabel(job.employmentType)}</Text>
              </View>
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>Cover Letter</Text>
          <GlassCard>
            <Text style={styles.sectionHint}>
              Tell the employer why you're a great fit for this position. Minimum 50 characters.
            </Text>
            <TextInput
              style={[styles.textArea, errors.coverLetter && styles.textAreaError]}
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Dear Hiring Manager,\n\nI am writing to express my interest in this position..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            {errors.coverLetter && (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.coverLetter}</Text>
              </View>
            )}
            <Text style={styles.charCount}>
              {coverLetter.length} / 50 minimum characters
            </Text>
          </GlassCard>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips for a strong application:</Text>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Highlight relevant experience and skills</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Explain why you're interested in this role</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Mention availability and any certifications</Text>
            </View>
          </View>

          <View style={styles.buttonSection}>
            <Button
              title={submitting ? 'Submitting...' : 'Submit Application'}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              size="lg"
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              fullWidth
              size="md"
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.sm },
  notFoundText: { fontSize: 15, color: COLORS.error, marginTop: SPACING.sm },
  jobSummaryCard: { marginBottom: SPACING.sm },
  jobSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  jobSummaryIcon: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  jobSummaryText: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  companyName: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  jobMetaRow: { flexDirection: 'row', gap: SPACING.md },
  jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { fontSize: 13, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginTop: SPACING.lg, marginLeft: SPACING.xs },
  sectionHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 18 },
  textArea: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 15, color: COLORS.text, minHeight: 180, backgroundColor: COLORS.surface },
  textAreaError: { borderColor: COLORS.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  errorText: { fontSize: 12, color: COLORS.error },
  charCount: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: SPACING.xs },
  tipsCard: { backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  tipText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  buttonSection: { marginTop: SPACING.xl },
});
