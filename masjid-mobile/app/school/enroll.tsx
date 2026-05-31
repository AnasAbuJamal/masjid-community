import React, { useState, useRef } from 'react';
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
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenHeader, DatePicker } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService from '../../services/api-service';

const { width } = Dimensions.get('window');

const GRADE_LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade',
];

const PROGRAMS = [
  { id: 'quran', label: 'Quran Classes (Weekend)', icon: 'book-open-variant', desc: 'Weekly Quran recitation & tajweed' },
  { id: 'islamic', label: 'Islamic Studies', icon: 'school', desc: 'Fiqh, Aqeedah, Seerah' },
  { id: 'youth', label: 'Youth Program', icon: 'account-group', desc: 'Activities & learning for ages 8-17' },
  { id: 'arabic', label: 'Arabic Language', icon: 'translate', desc: 'Modern Standard & Classical Arabic' },
  { id: 'full', label: 'Full Program (All Subjects)', icon: 'star', desc: 'Comprehensive Islamic education' },
];

const STEPS = [
  { key: 'student', label: 'Student', icon: 'account' },
  { key: 'parent', label: 'Parent', icon: 'account-group' },
  { key: 'program', label: 'Program', icon: 'bookmark' },
  { key: 'emergency', label: 'Emergency', icon: 'shield-account' },
  { key: 'review', label: 'Review', icon: 'clipboard-text' },
];

type StepKey = 'student' | 'parent' | 'program' | 'emergency' | 'review';

export default function EnrollScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepKey>('student');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [form, setForm] = useState({
    studentName: '',
    dateOfBirth: '',
    gradeLevel: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    programName: '',
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyRelation: '',
    parentPreferredContact: 'email' as string,
  });

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  const animateTransition = (next: StepKey) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setCurrentStep(next);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 'student') {
      if (!form.studentName.trim()) newErrors.studentName = 'Student name is required';
      if (!form.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) newErrors.dateOfBirth = 'Use YYYY-MM-DD format';
      if (!form.gradeLevel) newErrors.gradeLevel = 'Select a grade level';
    } else if (currentStep === 'parent') {
      if (!form.parentName.trim()) newErrors.parentName = 'Parent name is required';
      if (!form.parentEmail.trim()) newErrors.parentEmail = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.parentEmail)) newErrors.parentEmail = 'Invalid email format';
      if (!form.parentPhone.trim()) newErrors.parentPhone = 'Phone number is required';
    } else if (currentStep === 'program') {
      if (!form.programName) newErrors.programName = 'Select a program';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) animateTransition(STEPS[idx + 1].key as StepKey);
  };

  const prevStep = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) animateTransition(STEPS[idx - 1].key as StepKey);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await apiService.school.submitApplication({
        studentName: form.studentName.trim(),
        dateOfBirth: form.dateOfBirth,
        gradeLevel: form.gradeLevel,
        parentName: form.parentName.trim(),
        parentEmail: form.parentEmail.trim(),
        parentPhone: form.parentPhone.trim(),
        programName: form.programName,
        notes: form.notes.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        emergencyRelation: form.emergencyRelation.trim() || undefined,
        parentPreferredContact: form.parentPreferredContact,
      });
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to submit application. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <MaterialCommunityIcons name="check-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSubtext}>
            Your enrollment application for {form.studentName} has been received. The school will review it and contact you at {form.parentEmail}.
          </Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.successButton} onPress={() => router.push('/school/applications' as any)}>
              <MaterialCommunityIcons name="clipboard-text" size={20} color={COLORS.white} />
              <Text style={styles.successButtonText}>View My Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successSecondary} onPress={() => router.back()}>
              <Text style={styles.successSecondaryText}>Back to School</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'student':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="account" size={22} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Student Information</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Student Full Name *</Text>
                <TextInput
                  style={[styles.input, errors.studentName && styles.inputError]}
                  value={form.studentName}
                  onChangeText={v => updateField('studentName', v)}
                  placeholder="Enter student's full name"
                  placeholderTextColor={COLORS.textLight}
                />
                {errors.studentName && <Text style={styles.error}>{errors.studentName}</Text>}
              </View>
              <View style={styles.field}>
                <DatePicker
                  label="Date of Birth *"
                  value={form.dateOfBirth}
                  onChange={(v) => updateField('dateOfBirth', v)}
                  error={errors.dateOfBirth}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Grade Level *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {GRADE_LEVELS.map(grade => (
                    <TouchableOpacity
                      key={grade}
                      style={[styles.chip, form.gradeLevel === grade && styles.chipSelected]}
                      onPress={() => updateField('gradeLevel', grade)}
                    >
                      <Text style={[styles.chipText, form.gradeLevel === grade && styles.chipTextSelected]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {errors.gradeLevel && <Text style={styles.error}>{errors.gradeLevel}</Text>}
              </View>
            </GlassCard>
          </Animated.View>
        );

      case 'parent':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="account-group" size={22} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Parent / Guardian</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, errors.parentName && styles.inputError]}
                  value={form.parentName}
                  onChangeText={v => updateField('parentName', v)}
                  placeholder="Your full name"
                  placeholderTextColor={COLORS.textLight}
                />
                {errors.parentName && <Text style={styles.error}>{errors.parentName}</Text>}
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, errors.parentEmail && styles.inputError]}
                  value={form.parentEmail}
                  onChangeText={v => updateField('parentEmail', v)}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.parentEmail && <Text style={styles.error}>{errors.parentEmail}</Text>}
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, errors.parentPhone && styles.inputError]}
                  value={form.parentPhone}
                  onChangeText={v => updateField('parentPhone', v)}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                />
                {errors.parentPhone && <Text style={styles.error}>{errors.parentPhone}</Text>}
              </View>
            </GlassCard>
          </Animated.View>
        );

      case 'program':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="bookmark" size={22} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Program Selection</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Select Program *</Text>
                {PROGRAMS.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.programOption, form.programName === p.label && styles.programOptionSelected]}
                    onPress={() => updateField('programName', p.label)}
                  >
                    <View style={[styles.programIcon, form.programName === p.label && { backgroundColor: COLORS.primary + '25' }]}>
                      <MaterialCommunityIcons name={p.icon as any} size={24} color={form.programName === p.label ? COLORS.primary : COLORS.textSecondary} />
                    </View>
                    <View style={styles.programInfo}>
                      <Text style={[styles.programLabel, form.programName === p.label && { color: COLORS.primary }]}>{p.label}</Text>
                      <Text style={styles.programDesc}>{p.desc}</Text>
                    </View>
                    {form.programName === p.label && (
                      <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {errors.programName && <Text style={styles.error}>{errors.programName}</Text>}
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Preferred Contact Method</Text>
                <View style={styles.contactRow}>
                  {['email', 'phone', 'both'].map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.contactChip, form.parentPreferredContact === method && styles.contactChipSelected]}
                      onPress={() => updateField('parentPreferredContact', method)}
                    >
                      <MaterialCommunityIcons
                        name={form.parentPreferredContact === method ? 'radiobox-marked' : 'radiobox-blank'}
                        size={16}
                        color={form.parentPreferredContact === method ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={[styles.contactText, form.parentPreferredContact === method && { color: COLORS.primary }]}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        );

      case 'emergency':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Emergency Contact</Text>
              </View>
              <Text style={styles.hint}>Person authorized to pick up your child if you are unavailable</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.emergencyContactName}
                  onChangeText={v => updateField('emergencyContactName', v)}
                  placeholder="Emergency contact name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={form.emergencyContactPhone}
                  onChangeText={v => updateField('emergencyContactPhone', v)}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Relationship to Student</Text>
                <TextInput
                  style={styles.input}
                  value={form.emergencyRelation}
                  onChangeText={v => updateField('emergencyRelation', v)}
                  placeholder="e.g., Grandmother, Uncle, Neighbor"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </GlassCard>
            <GlassCard style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="note-text" size={22} color={COLORS.textSecondary} />
                <Text style={styles.cardTitle}>Additional Notes</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.notes}
                onChangeText={v => updateField('notes', v)}
                placeholder="Any special requirements, medical conditions, or other information..."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={4}
              />
            </GlassCard>
          </Animated.View>
        );

      case 'review':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="clipboard-text" size={22} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Review Application</Text>
              </View>
              <Text style={styles.hint}>Please verify all information before submitting.</Text>
              {[
                { section: 'Student', icon: 'account', items: [
                  { label: 'Name', value: form.studentName },
                  { label: 'Date of Birth', value: form.dateOfBirth },
                  { label: 'Grade', value: form.gradeLevel },
                ]},
                { section: 'Parent', icon: 'account-group', items: [
                  { label: 'Name', value: form.parentName },
                  { label: 'Email', value: form.parentEmail },
                  { label: 'Phone', value: form.parentPhone },
                ]},
                { section: 'Program', icon: 'bookmark', items: [
                  { label: 'Program', value: form.programName },
                  { label: 'Contact', value: form.parentPreferredContact.charAt(0).toUpperCase() + form.parentPreferredContact.slice(1) },
                ]},
              ].map(group => (
                <View key={group.section} style={styles.reviewGroup}>
                  <View style={styles.reviewGroupHeader}>
                    <MaterialCommunityIcons name={group.icon as any} size={16} color={COLORS.primary} />
                    <Text style={styles.reviewGroupTitle}>{group.section}</Text>
                  </View>
                  {group.items.map(item => (
                    <View key={item.label} style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{item.label}</Text>
                      <Text style={styles.reviewValue}>{item.value || '—'}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Enrollment" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Progress Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((step, idx) => (
            <TouchableOpacity
              key={step.key}
              style={styles.stepItem}
              onPress={() => idx < stepIndex ? animateTransition(step.key as StepKey) : null}
              disabled={idx > stepIndex}
            >
              <View style={[
                styles.stepDot,
                idx < stepIndex && styles.stepCompleted,
                idx === stepIndex && styles.stepActive,
              ]}>
                {idx < stepIndex ? (
                  <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                ) : (
                  <MaterialCommunityIcons name={step.icon as any} size={14} color={idx === stepIndex ? COLORS.white : COLORS.textSecondary} />
                )}
              </View>
              <Text style={[styles.stepLabel, idx === stepIndex && styles.stepLabelActive]}>{step.label}</Text>
              {idx < STEPS.length - 1 && <View style={[styles.stepLine, idx < stepIndex && styles.stepLineActive]} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navBar}>
          {currentStep !== 'student' ? (
            <TouchableOpacity style={styles.navButton} onPress={prevStep}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textSecondary} />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          ) : <View style={styles.navButton} />}
          {currentStep === 'review' ? (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: COLORS.primary },
  stepCompleted: { backgroundColor: COLORS.success },
  stepLabel: { fontSize: 10, color: COLORS.textSecondary, marginLeft: 4, fontWeight: '500' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.success },

  // Form
  formCard: { marginBottom: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: COLORS.error },
  error: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  // Chips
  chipScroll: { marginBottom: SPACING.xs },
  chip: { paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: COLORS.background, marginRight: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.white, fontWeight: '600' },

  // Programs
  programOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm + 2, borderRadius: RADIUS.lg, backgroundColor: COLORS.background, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  programOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  programIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  programInfo: { flex: 1 },
  programLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  programDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Contact method
  contactRow: { flexDirection: 'row', gap: SPACING.sm },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  contactChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  contactText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },

  // Review
  reviewGroup: { marginBottom: SPACING.md },
  reviewGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.xs },
  reviewGroupTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reviewLabel: { fontSize: 13, color: COLORS.textSecondary },
  reviewValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: '60%', textAlign: 'right' },

  // Navigation
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, minWidth: 80 },
  navButtonText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, paddingVertical: SPACING.sm + 4, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, flex: 1 },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  successIconWrap: { marginBottom: SPACING.lg },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
  successSubtext: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  successActions: { gap: SPACING.sm, width: '100%' },
  successButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg },
  successButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  successSecondary: { alignItems: 'center', paddingVertical: SPACING.sm },
  successSecondaryText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
});
