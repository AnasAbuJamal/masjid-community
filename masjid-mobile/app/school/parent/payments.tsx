import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, Button } from '../../../components/common';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface Payment {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  childName: string;
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', description: 'Quran Class - Monthly Tuition (April)', amount: 75, status: 'pending', dueDate: '2024-04-01', childName: 'Ahmed Ali' },
  { id: '2', description: 'Arabic Language - Materials Fee', amount: 25, status: 'paid', dueDate: '2024-03-01', paidDate: '2024-03-01', childName: 'Ahmed Ali' },
  { id: '3', description: 'Islamic Studies - Book Purchase', amount: 30, status: 'overdue', dueDate: '2024-02-15', childName: 'Fatima Ali' },
  { id: '4', description: 'Quran Class - Monthly Tuition (March)', amount: 75, status: 'paid', dueDate: '2024-03-01', paidDate: '2024-02-28', childName: 'Fatima Ali' },
];

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    setPayments(MOCK_PAYMENTS);
  }, []);

  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

  const handlePayNow = (payment: Payment) => {
    Alert.alert(
      'Make Payment',
      `Pay $${payment.amount} for ${payment.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: () => {
            setPayments(prev => prev.map(p =>
              p.id === payment.id
                ? { ...p, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] }
                : p
            ));
            Alert.alert('Success', 'Payment processed successfully!');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'overdue': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'check-circle';
      case 'pending': return 'clock-outline';
      case 'overdue': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Payments</Text>
          <Text style={styles.subtitle}>Manage tuition and fees</Text>
        </View>

        <View style={styles.summaryCards}>
          <GlassCard style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.summaryAmount}>${totalPending}</Text>
            <Text style={styles.summaryLabel}>Due / Overdue</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '15' }]}>
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.summaryAmount}>${totalPaid}</Text>
            <Text style={styles.summaryLabel}>Paid This Year</Text>
          </GlassCard>
        </View>

        {totalPending > 0 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.white} />
            <Text style={styles.alertText}>
              You have {pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''} totaling ${totalPending}
            </Text>
          </View>
        )}

        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Due Payments</Text>
            {pendingPayments.map(payment => (
              <GlassCard key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDescription}>{payment.description}</Text>
                    <Text style={styles.paymentChild}>{payment.childName}</Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={styles.amountText}>${payment.amount}</Text>
                  </View>
                </View>
                <View style={styles.paymentMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '15' }]}>
                    <MaterialCommunityIcons name={getStatusIcon(payment.status) as any} size={14} color={getStatusColor(payment.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.dueDate}>Due: {formatDate(payment.dueDate)}</Text>
                </View>
                {payment.status !== 'paid' && (
                  <Button
                    title={payment.status === 'overdue' ? 'Pay Now (Overdue)' : 'Pay Now'}
                    onPress={() => handlePayNow(payment)}
                    style={styles.payButton}
                    textStyle={styles.payButtonText}
                  />
                )}
              </GlassCard>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {paidPayments.length === 0 ? (
            <GlassCard>
              <Text style={styles.emptyText}>No payment history yet</Text>
            </GlassCard>
          ) : (
            paidPayments.map(payment => (
              <GlassCard key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDescription}>{payment.description}</Text>
                    <Text style={styles.paymentChild}>{payment.childName}</Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={[styles.amountText, { color: COLORS.success }]}>${payment.amount}</Text>
                  </View>
                </View>
                <View style={styles.paymentMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '15' }]}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} />
                    <Text style={[styles.statusText, { color: COLORS.success }]}>Paid</Text>
                  </View>
                  <Text style={styles.dueDate}>Paid: {payment.paidDate && formatDate(payment.paidDate)}</Text>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  summaryCards: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm },
  summaryCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  alertText: { flex: 1, color: COLORS.white, fontWeight: '600', fontSize: 14 },

  section: { padding: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },

  paymentCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentInfo: { flex: 1 },
  paymentDescription: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  paymentChild: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  paymentAmount: {},
  amountText: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  paymentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  dueDate: { fontSize: 12, color: COLORS.textSecondary },

  payButton: { marginTop: SPACING.sm, paddingVertical: SPACING.xs },
  payButtonText: { fontSize: 14 },

  emptyText: { color: COLORS.textSecondary, textAlign: 'center' },
  bottomSpacer: { height: 100 },
});
