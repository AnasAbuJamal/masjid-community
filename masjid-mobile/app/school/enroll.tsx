import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, Button, ScreenWrapper, ScreenHeader } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService from '../../services/api-service';
import { validateForm, studentEnrollmentSchema } from '../../utils/validation';

const GRADE_LEVELS = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'
];

const PROGRAMS = [
  'Quran Classes (Weekend)',
  'Islamic Studies',
  'Youth Program',
  'Arabic Language',
  'Full Program (All Subjects)',
];

export default function EnrollScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    parentPreferredContact: 'email' as 'email' | 'phone' | 'text',
  });

  const validate = () => {
    const validationErrors = validateForm(studentEnrollmentSchema, form as any);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

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
      Alert.alert(
        'Application Submitted!',
        'Your enrollment application has been submitted. You will be notified once it is reviewed.',
        [
          {
            text: 'View My Applications',
            onPress: () => router.push('/school/applications' as any),
          },
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Enrollment" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.innerContainer}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialCommunityIcons name="school" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Islamic School Enrollment</Text>
            <Text style={styles.subtitle}>Apply for your child to join our programs</Text>
          </View>

          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Student Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Student Full Name *</Text>
              <TextInput
                style={[styles.input, errors.studentName && styles.inputError]}
                value={form.studentName}
                onChangeText={(v) => updateField('studentName', v)}
                placeholder="Enter student's full name"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.studentName && <Text style={styles.errorText}>{errors.studentName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TextInput
                style={[styles.input, errors.dateOfBirth && styles.inputError]}
                value={form.dateOfBirth}
                onChangeText={(v) => updateField('dateOfBirth', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Grade Level *</Text>
              <View style={styles.optionsRow}>
                {GRADE_LEVELS.slice(0, 6).map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.optionChip, form.gradeLevel === grade && styles.optionChipSelected]}
                    onPress={() => updateField('gradeLevel', grade)}
                  >
                    <Text style={[styles.optionText, form.gradeLevel === grade && styles.optionTextSelected]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.optionsRow}>
                {GRADE_LEVELS.slice(6).map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.optionChip, form.gradeLevel === grade && styles.optionChipSelected]}
                    onPress={() => updateField('gradeLevel', grade)}
                  >
                    <Text style={[styles.optionText, form.gradeLevel === grade && styles.optionTextSelected]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gradeLevel && <Text style={styles.errorText}>{errors.gradeLevel}</Text>}
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Parent / Guardian Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Parent Name *</Text>
              <TextInput
                style={[styles.input, errors.parentName && styles.inputError]}
                value={form.parentName}
                onChangeText={(v) => updateField('parentName', v)}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.parentName && <Text style={styles.errorText}>{errors.parentName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.parentEmail && styles.inputError]}
                value={form.parentEmail}
                onChangeText={(v) => updateField('parentEmail', v)}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.parentEmail && <Text style={styles.errorText}>{errors.parentEmail}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.parentPhone && styles.inputError]}
                value={form.parentPhone}
                onChangeText={(v) => updateField('parentPhone', v)}
                placeholder="(555) 123-4567"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
              />
              {errors.parentPhone && <Text style={styles.errorText}>{errors.parentPhone}</Text>}
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Program Selection</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Select Program *</Text>
              <View style={styles.programOptions}>
                {PROGRAMS.map((program) => (
                  <TouchableOpacity
                    key={program}
                    style={[styles.programOption, form.programName === program && styles.programOptionSelected]}
                    onPress={() => updateField('programName', program)}
                  >
                    <MaterialCommunityIcons
                      name={form.programName === program ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={20}
                      color={form.programName === program ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text style={[styles.programText, form.programName === program && styles.programTextSelected]}>
                      {program}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.programName && <Text style={styles.errorText}>{errors.programName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Preferred Contact Method</Text>
              <View style={styles.optionsRow}>
                {['email', 'phone', 'both'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.optionChip, form.parentPreferredContact === method && styles.optionChipSelected]}
                    onPress={() => updateField('parentPreferredContact', method)}
                  >
                    <Text style={[styles.optionText, form.parentPreferredContact === method && styles.optionTextSelected]}>
                      {method === 'both' ? 'Both' : method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <GlassCard style={styles.formCard}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              <Text style={styles.sectionSubtitle}>Person authorized to pick up your child if you cannot</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Emergency Contact Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.emergencyContactName}
                  onChangeText={(v) => updateField('emergencyContactName', v)}
                  placeholder="Full name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Emergency Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  value={form.emergencyContactPhone}
                  onChangeText={(v) => updateField('emergencyContactPhone', v)}
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
                  onChangeText={(v) => updateField('emergencyRelation', v)}
                  placeholder="e.g., Grandmother, Uncle, Neighbor"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </GlassCard>

            <View style={styles.field}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.notes}
                onChangeText={(v) => updateField('notes', v)}
                placeholder="Any special requirements, medical conditions, or other information..."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={4}
              />
            </View>
          </GlassCard>

          <View style={styles.buttonContainer}>
            <Button
              title={submitting ? 'Submitting...' : 'Submit Application'}
              onPress={handleSubmit}
              disabled={submitting}
              icon={<MaterialCommunityIcons name="send" size={18} color={COLORS.white} />}
            />
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>View your applications</Text>
              <TouchableOpacity onPress={() => router.push('/school/applications' as any)}>
                <Text style={styles.linkButton}>Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  innerContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs },
  formCard: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  sectionSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.md, marginTop: -SPACING.xs },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.xs },
  optionChip: { paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs + 1, borderRadius: RADIUS.full, backgroundColor: COLORS.background },
  optionChipSelected: { backgroundColor: COLORS.primary },
  optionText: { fontSize: 12, color: COLORS.textSecondary },
  optionTextSelected: { color: COLORS.white, fontWeight: '600' },
  programOptions: { gap: SPACING.sm },
  programOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
  programOptionSelected: { backgroundColor: COLORS.primary + '15' },
  programText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  programTextSelected: { color: COLORS.primary, fontWeight: '600' },
  buttonContainer: { marginTop: SPACING.md },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md },
  linkText: { fontSize: 14, color: COLORS.textSecondary },
  linkButton: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});