import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, Button, ScreenWrapper } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { RentalItem } from '../../services/api-service';
import { validateForm, rentalBookingSchema } from '../../utils/validation';

export default function RentalBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    renterName: '',
    renterEmail: '',
    renterPhone: '',
    eventName: '',
    startDate: '',
    endDate: '',
    priceType: 'daily' as 'hourly' | 'daily',
  });

  useEffect(() => {
    if (id) loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await apiService.rentals.getAll();
      const found = data.find((i) => i.id === id);
      setItem(found || null);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const validate = () => {
    const validationErrors = validateForm(rentalBookingSchema, form);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !item) return;

    setSubmitting(true);
    try {
      await apiService.rentals.book({
        itemId: item.id,
        renterName: form.renterName.trim(),
        renterEmail: form.renterEmail.trim(),
        renterPhone: form.renterPhone.trim(),
        eventName: form.eventName.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        priceType: form.priceType,
      });
      Alert.alert(
        'Booking Submitted!',
        'Your rental request has been submitted. We will contact you shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}><Text>Loading...</Text></View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ title: 'Book Rental' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Book {item?.name}</Text>
            <Text style={styles.subtitle}>Fill in the details below to request a rental</Text>
          </View>

          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.renterName && styles.inputError]}
                value={form.renterName}
                onChangeText={(v) => updateField('renterName', v)}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.renterName && <Text style={styles.errorText}>{errors.renterName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, errors.renterEmail && styles.inputError]}
                value={form.renterEmail}
                onChangeText={(v) => updateField('renterEmail', v)}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.renterEmail && <Text style={styles.errorText}>{errors.renterEmail}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={[styles.input, errors.renterPhone && styles.inputError]}
                value={form.renterPhone}
                onChangeText={(v) => updateField('renterPhone', v)}
                placeholder="(555) 123-4567"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
              />
              {errors.renterPhone && <Text style={styles.errorText}>{errors.renterPhone}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Event Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.eventName}
                onChangeText={(v) => updateField('eventName', v)}
                placeholder="e.g., Wedding Reception"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Start Date * (YYYY-MM-DD HH:MM)</Text>
              <TextInput
                style={[styles.input, errors.startDate && styles.inputError]}
                value={form.startDate}
                onChangeText={(v) => updateField('startDate', v)}
                placeholder="2024-12-25 09:00"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>End Date * (YYYY-MM-DD HH:MM)</Text>
              <TextInput
                style={[styles.input, errors.endDate && styles.inputError]}
                value={form.endDate}
                onChangeText={(v) => updateField('endDate', v)}
                placeholder="2024-12-25 17:00"
                placeholderTextColor={COLORS.textLight}
              />
              {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Pricing Type</Text>
              <View style={styles.priceTypeRow}>
                <TouchableOpacity
                  style={[styles.priceTypeOption, form.priceType === 'hourly' && styles.priceTypeOptionSelected]}
                  onPress={() => updateField('priceType', 'hourly')}
                >
                  <MaterialCommunityIcons 
                    name={form.priceType === 'hourly' ? 'radiobox-marked' : 'radiobox-blank'} 
                    size={20} 
                    color={form.priceType === 'hourly' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.priceTypeText, form.priceType === 'hourly' && styles.priceTypeTextSelected]}>
                    Hourly {item?.priceHourly && `($${item.priceHourly}/hr)`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceTypeOption, form.priceType === 'daily' && styles.priceTypeOptionSelected]}
                  onPress={() => updateField('priceType', 'daily')}
                >
                  <MaterialCommunityIcons 
                    name={form.priceType === 'daily' ? 'radiobox-marked' : 'radiobox-blank'} 
                    size={20} 
                    color={form.priceType === 'daily' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.priceTypeText, form.priceType === 'daily' && styles.priceTypeTextSelected]}>
                    Daily {item?.priceDaily && `($${item.priceDaily}/day)`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>

          <View style={styles.buttonContainer}>
            <Button
              title={submitting ? 'Submitting...' : 'Submit Booking Request'}
              onPress={handleSubmit}
              disabled={submitting}
              icon={<MaterialCommunityIcons name="send" size={18} color={COLORS.white} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: SPACING.lg },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  formCard: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  priceTypeRow: { flexDirection: 'row', gap: SPACING.md },
  priceTypeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
  priceTypeOptionSelected: { backgroundColor: COLORS.primary + '15' },
  priceTypeText: { fontSize: 13, color: COLORS.textSecondary },
  priceTypeTextSelected: { color: COLORS.primary, fontWeight: '600' },
  buttonContainer: { marginTop: SPACING.md },
});