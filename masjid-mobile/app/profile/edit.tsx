import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper, Input, Button, GlassCard } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import apiService from '../../services/api-service';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (phone && !/^[\d\s\-+()]{7,20}$/.test(phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const updated = await apiService.auth.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      updateUser(updated);
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
      Alert.alert('Saved', 'Profile updated locally.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
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
          <GlassCard style={styles.avatarCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials || '??'}</Text>
              </View>
              <View style={styles.editAvatarBadge}>
                <MaterialCommunityIcons name="camera" size={14} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.avatarHint}>Profile photo</Text>
          </GlassCard>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          <GlassCard>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              leftIcon="account-outline"
              placeholder="Enter first name"
              autoCapitalize="words"
              autoComplete="name"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              leftIcon="account-outline"
              placeholder="Enter last name"
              autoCapitalize="words"
              autoComplete="name"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              leftIcon="phone-outline"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              hint="Optional — for emergency contact"
            />
          </GlassCard>

          <Text style={styles.sectionTitle}>Account</Text>
          <GlassCard>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialCommunityIcons name="email-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabelText}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user?.email ?? 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialCommunityIcons name="shield-account-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabelText}>Role</Text>
              </View>
              <Text style={styles.infoValue}>{user?.role?.toUpperCase() ?? 'MEMBER'}</Text>
            </View>
          </GlassCard>

          <View style={styles.buttonSection}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
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

import { Stack } from 'expo-router';

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  avatarCard: { alignItems: 'center', padding: SPACING.lg, marginBottom: SPACING.md },
  avatarWrap: { position: 'relative' },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: '700', color: COLORS.white },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  avatarHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginTop: SPACING.lg, marginLeft: SPACING.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoLabelText: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  buttonSection: { marginTop: SPACING.xl },
});
