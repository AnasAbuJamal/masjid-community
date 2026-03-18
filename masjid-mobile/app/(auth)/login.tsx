import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassButton, GlassCard, FloatingIcon, ScreenWrapper } from '../../components/common';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Input } from '../../components/common/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const success = await login(email.trim(), password);
    setLoading(false);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
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
            {/* Logo */}
            <View style={styles.logoWrap}>
              <GlassCard style={styles.logoCircle} variant="floating">
                <MaterialCommunityIcons name="mosque" size={44} color={COLORS.primary} />
              </GlassCard>
              <Text style={styles.brandName}>Masjid Al-Momineen</Text>
              <Text style={styles.brandTagline}>Community App</Text>
            </View>

            {/* Form */}
            <GlassCard style={styles.card}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to your account</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <Input
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  containerStyle={styles.input}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <Input
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Enter your password"
                  secureTextEntry
                  containerStyle={styles.input}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <GlassButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.signInButton}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.footerLink}>Sign Up</Text>
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
    justifyContent: 'center',
  },

  logoWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  brandTagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },

  card: {
    padding: SPACING.lg,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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
  input: {
    backgroundColor: COLORS.surfaceGlassLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: SPACING.xs,
  },

  signInButton: {
    marginTop: SPACING.md,
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
