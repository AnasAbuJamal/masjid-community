import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) return;
    setLoading(true);
    await login(form.email, form.password);
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.row}>
          <Input label="First Name" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} containerStyle={{ flex: 1, marginRight: 8 }} />
          <Input label="Last Name" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} containerStyle={{ flex: 1 }} />
        </View>
        <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} placeholder="Create password" secureTextEntry />
        <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.button} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.signUp}>Sign In</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  row: { flexDirection: 'row' },
  button: { marginTop: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.textSecondary },
  signUp: { color: COLORS.primary, fontWeight: '600' },
});
