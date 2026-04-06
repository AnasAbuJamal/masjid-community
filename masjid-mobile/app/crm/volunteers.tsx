import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  totalHours: number;
  assignments: number;
  status: 'active' | 'inactive';
}

interface Shift {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  required: number;
  signedUp: number;
  status: 'open' | 'filled' | 'completed';
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
  leader: string;
}

const MOCK_VOLUNTEERS: Volunteer[] = [
  { id: '1', firstName: 'Ahmad', lastName: 'Khan', email: 'ahmad@example.com', phone: '555-1111', skills: ['Teaching', 'IT', 'Events'], totalHours: 156, assignments: 24, status: 'active' },
  { id: '2', firstName: 'Fatima', lastName: 'Zaidi', email: 'fatima@example.com', phone: '555-2222', skills: ['Cooking', 'Events'], totalHours: 89, assignments: 15, status: 'active' },
  { id: '3', firstName: 'Omar', lastName: 'Hussain', email: 'omar@example.com', phone: '555-3333', skills: ['Driving', 'Maintenance'], totalHours: 234, assignments: 45, status: 'active' },
  { id: '4', firstName: 'Aisha', lastName: 'Rahman', email: 'aisha@example.com', phone: '555-4444', skills: ['Teaching', 'Youth'], totalHours: 67, assignments: 12, status: 'active' },
];

const MOCK_SHIFTS: Shift[] = [
  { id: '1', title: 'Friday Prayer Setup', date: '2026-03-28', time: '12:00 PM - 2:00 PM', location: 'Main Hall', required: 8, signedUp: 5, status: 'open' },
  { id: '2', title: 'Youth Program Helper', date: '2026-03-29', time: '9:00 AM - 12:00 PM', location: 'Youth Center', required: 4, signedUp: 4, status: 'filled' },
  { id: '3', title: ' Ramadan Iftar Prep', date: '2026-03-30', time: '4:00 PM - 7:00 PM', location: 'Kitchen', required: 10, signedUp: 7, status: 'open' },
  { id: '4', title: 'Community Cleanup', date: '2026-04-05', time: '8:00 AM - 11:00 AM', location: 'Grounds', required: 15, signedUp: 12, status: 'open' },
];

const MOCK_TEAMS: Team[] = [
  { id: '1', name: 'Events Team', memberCount: 12, leader: 'Ahmad Khan' },
  { id: '2', name: 'Youth Squad', memberCount: 8, leader: 'Aisha Rahman' },
  { id: '3', name: 'Maintenance', memberCount: 6, leader: 'Omar Hussain' },
  { id: '4', name: 'Outreach', memberCount: 10, leader: 'Fatima Zaidi' },
];

const SKILL_COLORS: Record<string, string> = {
  Teaching: '#4CAF50',
  IT: '#2196F3',
  Events: '#9C27B0',
  Cooking: '#FF9800',
  Driving: '#607D8B',
  Maintenance: '#795548',
  Youth: '#E91E63',
};

export default function VolunteersCrmScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTab, setSelectedTab] = useState<'volunteers' | 'shifts' | 'teams'>('volunteers');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setVolunteers(MOCK_VOLUNTEERS);
    setShifts(MOCK_SHIFTS);
    setTeams(MOCK_TEAMS);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const totalHours = volunteers.reduce((sum, v) => sum + v.totalHours, 0);
  const openShifts = shifts.filter(s => s.status === 'open').length;

  const renderVolunteersTab = () => (
    <View>
      <View style={styles.statsRow}>
        <GlassCard style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{volunteers.length}</Text>
          <Text style={styles.miniStatLabel}>Total</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{totalHours}</Text>
          <Text style={styles.miniStatLabel}>Hours</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{openShifts}</Text>
          <Text style={styles.miniStatLabel}>Open Shifts</Text>
        </GlassCard>
      </View>

      {volunteers.map(volunteer => (
        <GlassCard key={volunteer.id} style={styles.volunteerCard}>
          <View style={styles.volunteerHeader}>
            <View style={styles.volunteerAvatar}>
              <Text style={styles.volunteerAvatarText}>{volunteer.firstName[0]}{volunteer.lastName[0]}</Text>
            </View>
            <View style={styles.volunteerInfo}>
              <Text style={styles.volunteerName}>{volunteer.firstName} {volunteer.lastName}</Text>
              <Text style={styles.volunteerContact}>{volunteer.email}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: volunteer.status === 'active' ? COLORS.success + '15' : COLORS.textSecondary + '15' }]}>
              <Text style={[styles.statusText, { color: volunteer.status === 'active' ? COLORS.success : COLORS.textSecondary }]}>{volunteer.status}</Text>
            </View>
          </View>
          <View style={styles.skillsRow}>
            {volunteer.skills.map(skill => (
              <View key={skill} style={[styles.skillChip, { backgroundColor: (SKILL_COLORS[skill] || COLORS.primary) + '15' }]}>
                <Text style={[styles.skillText, { color: SKILL_COLORS[skill] || COLORS.primary }]}>{skill}</Text>
              </View>
            ))}
          </View>
          <View style={styles.volunteerFooter}>
            <View style={styles.volunteerStat}>
              <MaterialCommunityIcons name="clock" size={14} color={COLORS.textSecondary} />
              <Text style={styles.volunteerStatText}>{volunteer.totalHours} hours</Text>
            </View>
            <View style={styles.volunteerStat}>
              <MaterialCommunityIcons name="clipboard-check" size={14} color={COLORS.textSecondary} />
              <Text style={styles.volunteerStatText}>{volunteer.assignments} assignments</Text>
            </View>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  const renderShiftsTab = () => (
    <View>
      {shifts.map(shift => (
        <GlassCard key={shift.id} style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftTitle}>{shift.title}</Text>
              <Text style={styles.shiftMeta}>{shift.date} • {shift.time}</Text>
              <Text style={styles.shiftLocation}>{shift.location}</Text>
            </View>
            <View style={[styles.shiftStatus, { backgroundColor: shift.status === 'open' ? COLORS.warning + '15' : shift.status === 'filled' ? COLORS.success + '15' : COLORS.textSecondary + '15' }]}>
              <Text style={[styles.shiftStatusText, { color: shift.status === 'open' ? COLORS.warning : shift.status === 'filled' ? COLORS.success : COLORS.textSecondary }]}>
                {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.shiftProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(shift.signedUp / shift.required) * 100}%`, backgroundColor: shift.status === 'filled' ? COLORS.success : COLORS.primary }]} />
            </View>
            <Text style={styles.progressText}>{shift.signedUp}/{shift.required} volunteers</Text>
          </View>
          {shift.status === 'open' && (
            <TouchableOpacity style={styles.signUpButton}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      ))}
    </View>
  );

  const renderTeamsTab = () => (
    <View>
      {teams.map(team => (
        <GlassCard key={team.id} style={styles.teamCard}>
          <View style={styles.teamHeader}>
            <View style={styles.teamIcon}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamLeader}>Lead: {team.leader}</Text>
            </View>
            <View style={styles.teamStats}>
              <Text style={styles.teamMemberCount}>{team.memberCount}</Text>
              <Text style={styles.teamMemberLabel}>members</Text>
            </View>
          </View>
        </GlassCard>
      ))}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Volunteer Management</Text>
          <Text style={styles.subtitle}>Track volunteers, shifts & teams</Text>
        </View>

        <View style={styles.tabs}>
          {(['volunteers', 'shifts', 'teams'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {selectedTab === 'volunteers' && renderVolunteersTab()}
          {selectedTab === 'shifts' && renderShiftsTab()}
          {selectedTab === 'teams' && renderTeamsTab()}
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
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  content: { paddingHorizontal: SPACING.md, paddingBottom: 100 },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  miniStat: { flex: 1, alignItems: 'center', padding: SPACING.sm },
  miniStatValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  miniStatLabel: { fontSize: 10, color: COLORS.textSecondary },

  volunteerCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  volunteerHeader: { flexDirection: 'row', alignItems: 'center' },
  volunteerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  volunteerAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  volunteerInfo: { flex: 1, marginLeft: SPACING.sm },
  volunteerName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  volunteerContact: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  skillChip: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  skillText: { fontSize: 11, fontWeight: '600' },

  volunteerFooter: { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.md },
  volunteerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  volunteerStatText: { fontSize: 12, color: COLORS.textSecondary },

  shiftCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  shiftInfo: { flex: 1 },
  shiftTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  shiftMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  shiftLocation: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  shiftStatus: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  shiftStatusText: { fontSize: 11, fontWeight: '700' },

  shiftProgress: { marginTop: SPACING.sm },
  progressBar: { height: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  progressText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  signUpButton: { marginTop: SPACING.sm, backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  signUpText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  teamCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  teamHeader: { flexDirection: 'row', alignItems: 'center' },
  teamIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  teamInfo: { flex: 1, marginLeft: SPACING.sm },
  teamName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  teamLeader: { fontSize: 12, color: COLORS.textSecondary },
  teamStats: { alignItems: 'center' },
  teamMemberCount: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  teamMemberLabel: { fontSize: 10, color: COLORS.textSecondary },
});
