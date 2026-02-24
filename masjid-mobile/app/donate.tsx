import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Input, Card } from '../../components/common';
import { COLORS } from '../../constants/theme';

const CAMPAIGNS = [
  { id: 'general', name: 'General Fund', color: COLORS.primary },
  { id: 'construction', name: 'Construction', color: COLORS.secondary },
  { id: 'ramadan', name: 'Ramadan', color: COLORS.accent },
];
const AMOUNTS = [25, 50, 100, 250];

export default function DonateScreen() {
  const router = useRouter();
  const [campaign, setCampaign] = useState('general');
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  const handleDonate = () => {
    const total = amount || parseFloat(custom);
    if (!total) { Alert.alert('Error', 'Select or enter an amount'); return; }
    Alert.alert('Thank You!', `You are donating $${total}. This is a demo.`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.close}>✕</Text></TouchableOpacity>
        <Text style={styles.title}>Support the Masjid</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Select Campaign</Text>
        <View style={styles.campaigns}>
          {CAMPAIGNS.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.campaignItem, campaign === c.id && { borderColor: c.color }]} onPress={() => setCampaign(c.id)}>
              <Text style={[styles.campaignName, campaign === c.id && { color: c.color }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Select Amount</Text>
        <View style={styles.amounts}>
          {AMOUNTS.map((a) => (
            <TouchableOpacity key={a} style={[styles.amountItem, amount === a && styles.amountActive]} onPress={() => { setAmount(a); setCustom(''); }}>
              <Text style={[styles.amountText, amount === a && styles.amountTextActive]}>${a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Custom Amount" value={custom} onChangeText={(v) => { setCustom(v); setAmount(null); }} placeholder="Enter amount" keyboardType="numeric" />
        <Button title={`Donate ${amount || custom ? `$${amount || custom}` : ''}`} onPress={handleDonate} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  close: { fontSize: 20, color: COLORS.text },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 12 },
  campaigns: { flexDirection: 'row', gap: 12 },
  campaignItem: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  campaignName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  amounts: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  amountItem: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surface },
  amountActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  amountText: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  amountTextActive: { color: COLORS.white },
  button: { marginTop: 24 },
});
