import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassButton, GlassCard, ScreenWrapper } from '../../components/common';
import apiService from '../../services/api-service';
import { useAuthStore, User } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Input } from '../../components/common/Input';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const validate = (): boolean => {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await apiService.auth.register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      const user: User = response.user;
      setUser(user);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      let message = 'Unable to create account. Please try again.';
      if (error instanceof Error && error.message) {
        message = error.message;
      }
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper showBackground={false}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <GlassCard style={styles.backButtonCard}>
                <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
              </GlassCard>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Join the Community</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            <GlassCard style={styles.card}>
              <View style={styles.nameRow}>
                <View style={styles.halfInputWrapper}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <Input
                    value={form.firstName}
                    onChangeText={update('firstName')}
                    placeholder="First"
                    containerStyle={styles.halfInput}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>
                <View style={styles.halfInputWrapper}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <Input
                    value={form.lastName}
                    onChangeText={update('lastName')}
                    placeholder="Last"
                    containerStyle={styles.halfInput}
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <Input
                  value={form.email}
                  onChangeText={update('email')}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={styles.fullInput}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <Input
                  value={form.password}
                  onChangeText={update('password')}
                  placeholder="Create a password"
                  secureTextEntry
                  containerStyle={styles.fullInput}
                />
                <Text style={styles.hintText}>Minimum 6 characters</Text>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <GlassButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.submitButton}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  backButtonCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  card: {
    padding: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  halfInputWrapper: {
    flex: 1,
    marginBottom: SPACING.sm,
  },
  halfInput: {
    backgroundColor: COLORS.surfaceGlassLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fullInput: {
    backgroundColor: COLORS.surfaceGlassLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: SPACING.xs,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: SPACING.xs,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
