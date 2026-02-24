import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('admin@almomineen.org');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) router.replace('/(tabs)');
    else Alert.alert('Error', 'Login failed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Masjid Al-Momineen</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
        <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.button} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}><Text style={styles.signUp}>Sign Up</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary },
  button: { marginTop: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.textSecondary },
  signUp: { color: COLORS.primary, fontWeight: '600' },
});
