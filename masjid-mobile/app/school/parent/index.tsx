import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../../components/common';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  avatar?: string;
  attendance: { present: number; total: number };
  averageGrade: number;
}

interface Payment {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
}

const MOCK_CHILDREN: Child[] = [
  { id: '1', firstName: 'Ahmed', lastName: 'Ali', gradeLevel: '4th Grade', attendance: { present: 18, total: 20 }, averageGrade: 92 },
  { id: '2', firstName: 'Fatima', lastName: 'Ali', gradeLevel: '1st Grade', attendance: { present: 15, total: 16 }, averageGrade: 88 },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', description: 'Quran Class - Monthly Tuition', amount: 75, status: 'pending', dueDate: '2024-04-01' },
  { id: '2', description: 'Arabic Language - Materials Fee', amount: 25, status: 'paid', dueDate: '2024-03-01' },
];

const QUICK_ACTIONS = [
  { id: 'attendance', icon: 'clipboard-check', label: 'Attendance', color: COLORS.primary, route: '/school/parent/attendance' },
  { id: 'grades', icon: 'grade', label: 'Grades', color: COLORS.success, route: '/school/parent/grades' },
  { id: 'payments', icon: 'credit-card', label: 'Payments', color: COLORS.secondary, route: '/school/parent/payments' },
  { id: 'report', icon: 'file-document', label: 'Report Card', color: COLORS.warning, route: '/school/parent/report-card' },
  { id: 'resources', icon: 'library', label: 'Resources', color: '#9C27B0', route: '/school/resources' },
  { id: 'contact', icon: 'message', label: 'Contact Teacher', color: '#FF9800', route: '/school/parent/contact' },
];

export default function ParentPortalScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setChildren(MOCK_CHILDREN);
    setPayments(MOCK_PAYMENTS);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Parent Portal</Text>
          <Text style={styles.subtitle}>Monitor your children's progress</Text>
        </View>

        {totalPending > 0 && (
          <TouchableOpacity style={styles.paymentAlert} onPress={() => router.push('/school/parent/payments' as any)}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.white} />
            <Text style={styles.paymentAlertText}>
              {pendingPayments.length} pending payment{totalPending > 1 ? 's' : ''} totaling ${totalPending}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Children</Text>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => router.push({ pathname: '/school/parent/child/[id]', params: { id: child.id } } as any)}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.childCard}>
                <View style={styles.childHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{child.firstName[0]}{child.lastName[0]}</Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
                    <Text style={styles.childGrade}>{child.gradeLevel}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                </View>
                <View style={styles.childStats}>
                  <View style={styles.childStat}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.childStatText}>
                      {Math.round((child.attendance.present / child.attendance.total) * 100)}% Attendance
                    </Text>
                  </View>
                  <View style={styles.childStat}>
                    <MaterialCommunityIcons name="star" size={16} color={COLORS.warning} />
                    <Text style={styles.childStatText}>{child.averageGrade}% Average</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.actionCardInner}>
                  <FloatingIcon
                    icon={<MaterialCommunityIcons name={action.icon as any} size={22} color={action.color} />}
                    size="md"
                    color={action.color}
                    glow
                  />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
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

  paymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  paymentAlertText: { flex: 1, color: COLORS.white, fontWeight: '600', fontSize: 14 },

  section: { padding: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },

  childCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  childHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  childInfo: { flex: 1, marginLeft: SPACING.md },
  childName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  childGrade: { fontSize: 13, color: COLORS.textSecondary },
  childStats: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  childStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  childStatText: { fontSize: 13, color: COLORS.textSecondary },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard: { width: '31%' },
  actionCardInner: { alignItems: 'center', padding: SPACING.sm },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs, textAlign: 'center' },

  bottomSpacer: { height: 100 },
});
