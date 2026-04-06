import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
}

interface FollowUp {
  id: string;
  title: string;
  relatedType: string;
  dueDate: string;
  completed: boolean;
}

interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  requester: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Prepare Ramadan Iftar Menu', description: 'Plan and order food for 100 people', assignedTo: 'Fatima Zaidi', dueDate: '2026-03-25', priority: 'high', status: 'in_progress', category: 'Events' },
  { id: '2', title: 'Fix AC in Youth Center', description: 'AC unit not cooling properly', assignedTo: 'Omar Hussain', dueDate: '2026-03-26', priority: 'urgent', status: 'pending', category: 'Maintenance' },
  { id: '3', title: 'Send Newsletter', description: 'March newsletter to all members', assignedTo: 'Ahmad Khan', dueDate: '2026-03-28', priority: 'medium', status: 'pending', category: 'Communications' },
  { id: '4', title: 'Order Cleaning Supplies', description: 'Reorder toilet paper and soap', assignedTo: 'Omar Hussain', dueDate: '2026-03-30', priority: 'low', status: 'completed', category: 'Maintenance' },
];

const MOCK_FOLLOWUPS: FollowUp[] = [
  { id: '1', title: 'Follow up on Pledge Payment', relatedType: 'Donation', dueDate: '2026-03-28', completed: false },
  { id: '2', title: 'Confirm Speaker for Jumuah', relatedType: 'Event', dueDate: '2026-03-27', completed: false },
  { id: '3', title: 'Review Volunteer Hours', relatedType: 'Volunteer', dueDate: '2026-03-29', completed: true },
];

const MOCK_APPROVALS: ApprovalRequest[] = [
  { id: '1', type: 'Expense', title: 'New Sound System - $2,500', requester: 'Omar Hussain', amount: 2500, status: 'pending', date: '2026-03-25' },
  { id: '2', type: 'Booking', title: 'Community Hall - Wedding', requester: 'Ahmed Ali', status: 'pending', date: '2026-03-26' },
  { id: '3', type: 'Content', title: 'Blog Post - Ramadan Guide', requester: 'Sarah Ahmed', status: 'pending', date: '2026-03-27' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: COLORS.textSecondary,
  medium: COLORS.primary,
  high: COLORS.warning,
  urgent: COLORS.error,
};

export default function TasksCrmScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'tasks' | 'followups' | 'approvals'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTasks(MOCK_TASKS);
    setFollowUps(MOCK_FOLLOWUPS);
    setApprovals(MOCK_APPROVALS);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t));
  };

  const handleCompleteFollowUp = (id: string) => {
    setFollowUps(followUps.map(f => f.id === id ? { ...f, completed: true } : f));
  };

  const handleApproval = (id: string, action: 'approved' | 'rejected') => {
    setApprovals(approvals.map(a => a.id === id ? { ...a, status: action as any } : a));
    Alert.alert(action === 'approved' ? 'Approved' : 'Rejected', `Request has been ${action}`);
  };

  const renderTasksTab = () => (
    <View>
      {tasks.map(task => (
        <GlassCard key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
              <View style={styles.taskMeta}>
                <Text style={styles.taskAssignee}>{task.assignedTo}</Text>
                <Text style={styles.taskDate}>Due: {task.dueDate}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: task.status === 'completed' ? COLORS.success + '15' : task.status === 'in_progress' ? COLORS.primary + '15' : COLORS.warning + '15' 
            }]}>
              <Text style={[styles.statusText, { color: task.status === 'completed' ? COLORS.success : task.status === 'in_progress' ? COLORS.primary : COLORS.warning }]}>
                {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.taskActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => task.status !== 'completed' && handleCompleteTask(task.id)}
            >
              <MaterialCommunityIcons 
                name={task.status === 'completed' ? 'check-circle' : 'checkbox-blank-circle-outline'} 
                size={18} 
                color={task.status === 'completed' ? COLORS.success : COLORS.primary} 
              />
              <Text style={[styles.actionText, { color: task.status === 'completed' ? COLORS.success : COLORS.primary }]}>
                {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  const renderFollowUpsTab = () => (
    <View>
      {followUps.map(followUp => (
        <GlassCard key={followUp.id} style={styles.followUpCard}>
          <TouchableOpacity 
            style={styles.followUpRow}
            onPress={() => !followUp.completed && handleCompleteFollowUp(followUp.id)}
          >
            <MaterialCommunityIcons 
              name={followUp.completed ? 'check-circle' : 'checkbox-blank-circle-outline'} 
              size={22} 
              color={followUp.completed ? COLORS.success : COLORS.primary} 
            />
            <View style={styles.followUpInfo}>
              <Text style={[styles.followUpTitle, followUp.completed && styles.completedText]}>{followUp.title}</Text>
              <View style={styles.followUpMeta}>
                <Text style={styles.followUpType}>{followUp.relatedType}</Text>
                <Text style={styles.followUpDate}>Due: {followUp.dueDate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </GlassCard>
      ))}
    </View>
  );

  const renderApprovalsTab = () => (
    <View>
      {approvals.filter(a => a.status === 'pending').map(approval => (
        <GlassCard key={approval.id} style={styles.approvalCard}>
          <View style={styles.approvalHeader}>
            <View style={styles.approvalTypeBadge}>
              <Text style={styles.approvalTypeText}>{approval.type}</Text>
            </View>
            <Text style={styles.approvalDate}>{approval.date}</Text>
          </View>
          <Text style={styles.approvalTitle}>{approval.title}</Text>
          <Text style={styles.approvalRequester}>Requested by: {approval.requester}</Text>
          {approval.amount && (
            <Text style={styles.approvalAmount}>${approval.amount.toLocaleString()}</Text>
          )}
          <View style={styles.approvalActions}>
            <TouchableOpacity 
              style={[styles.approvalButton, styles.approveButton]}
              onPress={() => handleApproval(approval.id, 'approved')}
            >
              <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
              <Text style={styles.approvalButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.approvalButton, styles.rejectButton]}
              onPress={() => handleApproval(approval.id, 'rejected')}
            >
              <MaterialCommunityIcons name="close" size={18} color={COLORS.white} />
              <Text style={styles.approvalButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}
      {approvals.filter(a => a.status !== 'pending').length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>History</Text>
          {approvals.filter(a => a.status !== 'pending').map(approval => (
            <GlassCard key={approval.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <MaterialCommunityIcons 
                  name={approval.status === 'approved' ? 'check-circle' : 'close-circle'} 
                  size={18} 
                  color={approval.status === 'approved' ? COLORS.success : COLORS.error} 
                />
                <Text style={styles.historyTitle}>{approval.title}</Text>
                <Text style={[styles.historyStatus, { color: approval.status === 'approved' ? COLORS.success : COLORS.error }]}>
                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                </Text>
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Tasks & Workflows</Text>
          <Text style={styles.subtitle}>Manage tasks, follow-ups & approvals</Text>
        </View>

        <View style={styles.tabs}>
          {(['tasks', 'followups', 'approvals'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab === 'followups' ? 'Follow-ups' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {tab === 'tasks' && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{tasks.filter(t => t.status !== 'completed').length}</Text></View>}
              {tab === 'followups' && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{followUps.filter(f => !f.completed).length}</Text></View>}
              {tab === 'approvals' && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{approvals.filter(a => a.status === 'pending').length}</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {selectedTab === 'tasks' && renderTasksTab()}
          {selectedTab === 'followups' && renderFollowUpsTab()}
          {selectedTab === 'approvals' && renderApprovalsTab()}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  tabBadge: { backgroundColor: COLORS.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },

  content: { paddingHorizontal: SPACING.md, paddingBottom: 100 },

  taskCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: SPACING.sm },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  taskDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  taskMeta: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  taskAssignee: { fontSize: 12, color: COLORS.primary },
  taskDate: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },

  taskActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },
  categoryBadge: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  categoryText: { fontSize: 11, color: COLORS.textSecondary },

  followUpCard: { marginBottom: SPACING.sm },
  followUpRow: { flexDirection: 'row', alignItems: 'center' },
  followUpInfo: { flex: 1, marginLeft: SPACING.sm },
  followUpTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  completedText: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  followUpMeta: { flexDirection: 'row', gap: SPACING.sm, marginTop: 2 },
  followUpType: { fontSize: 12, color: COLORS.primary },
  followUpDate: { fontSize: 12, color: COLORS.textSecondary },

  approvalCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  approvalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  approvalTypeBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  approvalTypeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  approvalDate: { fontSize: 12, color: COLORS.textSecondary },
  approvalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  approvalRequester: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  approvalAmount: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  approvalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  approvalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: SPACING.sm, borderRadius: RADIUS.md },
  approveButton: { backgroundColor: COLORS.success },
  rejectButton: { backgroundColor: COLORS.error },
  approvalButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  sectionSubtitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.sm },
  historyCard: { marginBottom: SPACING.xs, padding: SPACING.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  historyTitle: { flex: 1, fontSize: 13, color: COLORS.text },
  historyStatus: { fontSize: 12, fontWeight: '600' },
});
