import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, Linking, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../services/api-client';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface SchoolInvoice {
  id: string;
  studentId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate: string | null;
  childName: string;
  status: 'pending' | 'paid' | 'refunded' | 'void';
}

const money = (amount: number) => `$${amount.toFixed(2)}`;
const readableDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
});

export default function ParentPaymentsScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SchoolInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.instance.get<{ invoices: SchoolInvoice[] }>('/school/invoices');
      setInvoices(response.data.invoices);
      setError('');
    } catch (failure: unknown) {
      const code = (failure as { response?: { status?: number } })?.response?.status;
      setError(code === 403 ? 'Verify your email in Profile to view family billing.'
        : 'Unable to load invoices. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void load();
    });
    return () => subscription.remove();
  }, []);

  const refresh = () => { setRefreshing(true); void load(); };

  const pay = (invoice: SchoolInvoice) => {
    if (paying) return;
    Alert.alert('Secure checkout',
      `Pay ${money(invoice.amount)} for ${invoice.description}? Payments are only confirmed after Stripe processes them.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Continue', onPress: async () => {
          setPaying(invoice.id);
          try {
            const response = await api.instance.post<{ url: string }>(
              `/school/invoices/${encodeURIComponent(invoice.id)}/checkout`
            );
            if (!response.data.url?.startsWith('https://checkout.stripe.com/')) {
              throw new Error('Unexpected checkout URL');
            }
            await Linking.openURL(response.data.url);
          } catch {
            Alert.alert('Checkout unavailable', 'Could not start secure payment. No charge was made from this action.');
          } finally { setPaying(null); }
        } },
      ]);
  };

  const outstanding = invoices.filter(i => i.status === 'pending');
  const balance = outstanding.reduce((sum, i) => sum + i.amount, 0);
  const completed = invoices.filter(i => i.status === 'paid');
  const paidTotal = completed.reduce((sum, i) => sum + i.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"
          style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Payments</Text>
        <View style={styles.back} />
      </View>
      {loading ? <ActivityIndicator size="large" style={styles.loader} color={COLORS.primary} /> : (
        <ScrollView contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          {error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity onPress={refresh} accessibilityRole="button" style={styles.retry}>
                <Text style={styles.actionText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.summary}>
                <View style={styles.summaryPart}>
                  <Text style={styles.summaryLabel}>Outstanding</Text>
                  <Text style={styles.summaryValue}>{money(balance)}</Text>
                  <Text style={styles.summaryNote}>{outstanding.length} unpaid invoices</Text>
                </View>
                <View style={styles.summaryPart}>
                  <Text style={styles.summaryLabel}>Paid</Text>
                  <Text style={styles.summaryValue}>{money(paidTotal)}</Text>
                  <Text style={styles.summaryNote}>{completed.length} confirmed payments</Text>
                </View>
              </View>
              {invoices.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={46} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No school invoices are associated with your account.</Text>
                </View>
              ) : invoices.map(invoice => {
                const overdue = invoice.status === 'pending' && new Date(invoice.dueDate).getTime() < Date.now();
                const statusText = overdue ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
                return (
                  <View key={invoice.id} style={styles.card}>
                    <View style={styles.line}>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{invoice.description}</Text>
                        <Text style={styles.secondary}>{invoice.childName}</Text>
                      </View>
                      <Text style={styles.amount}>{money(invoice.amount)}</Text>
                    </View>
                    <View style={styles.line}>
                      <Text style={styles.secondary}>Due {readableDate(invoice.dueDate)}</Text>
                      <Text style={[styles.status, {
                        color: invoice.status === 'paid' ? COLORS.success
                          : overdue ? COLORS.error : COLORS.textSecondary,
                      }]}>{statusText}</Text>
                    </View>
                    {invoice.paidDate && (
                      <Text style={styles.secondary}>Paid {readableDate(invoice.paidDate)}</Text>
                    )}
                    {invoice.status === 'pending' && (
                      <TouchableOpacity style={styles.payButton} accessibilityRole="button"
                        accessibilityLabel={`Pay ${money(invoice.amount)} for ${invoice.description}`}
                        disabled={paying !== null} onPress={() => pay(invoice)}>
                        <Text style={styles.payText}>{paying === invoice.id ? 'Opening checkout…' : 'Pay securely'}</Text>
                        <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.white} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}
          <Text style={styles.footerNote}>
            This page shows invoices issued by the masjid office. Payment status updates only after verified provider confirmation.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  loader: { flex: 1 },
  content: { maxWidth: 800, width: '100%', alignSelf: 'center',
    padding: SPACING.md, paddingBottom: SPACING.xxl },
  summary: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  summaryPart: { flex: 1, minWidth: 0, borderRadius: RADIUS.lg, borderColor: COLORS.border,
    borderWidth: 1, backgroundColor: COLORS.surface, padding: SPACING.md },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 13 },
  summaryValue: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginVertical: SPACING.xs },
  summaryNote: { color: COLORS.textSecondary, fontSize: 11 },
  card: { padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm, gap: SPACING.sm },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    justifyContent: 'space-between' },
  cardBody: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  amount: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  status: { fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  payButton: { flexDirection: 'row', minHeight: 48, justifyContent: 'center', alignItems: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, marginTop: SPACING.xs },
  payText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xxl },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md },
  actionText: { color: COLORS.primary, fontWeight: '600' },
  footerNote: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 19, marginTop: SPACING.lg },
});
