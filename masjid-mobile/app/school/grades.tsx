import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Grade {
  id: string;
  subject: string;
  grade: string;
  letterGrade: string;
  date: string;
}

interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string;
  phone?: string;
}

const MOCK_GRADES: Grade[] = [
  { id: '1', subject: 'Quran Recitation', grade: '92', letterGrade: 'A', date: '2026-02-15' },
  { id: '2', subject: 'Islamic Studies', grade: '88', letterGrade: 'B+', date: '2026-02-10' },
  { id: '3', subject: 'Arabic Language', grade: '85', letterGrade: 'B', date: '2026-02-08' },
];

const MOCK_TEACHERS: Teacher[] = [
  { id: '1', name: 'Ustad Ahmed', subject: 'Quran', email: 'ahmed@almomineen.org', phone: '+1-555-0101' },
  { id: '2', name: 'Ustad Fatima', subject: 'Islamic Studies', email: 'fatima@almomineen.org', phone: '+1-555-0102' },
  { id: '3', name: 'Sheikh Mahmoud', subject: 'Arabic', email: 'mahmoud@almomineen.org' },
];

export default function GradesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'grades' | 'teachers'>('grades');

  const averageGrade = Math.round(MOCK_GRADES.reduce((sum, g) => sum + parseInt(g.grade), 0) / MOCK_GRADES.length);

  const getGradeColor = (grade: string) => {
    const num = parseInt(grade);
    if (num >= 90) return COLORS.success;
    if (num >= 80) return COLORS.primary;
    if (num >= 70) return COLORS.warning;
    return COLORS.error;
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleCall = (phone: string) => {
    const callUrl = 'tel:' + phone;
    Alert.alert('Call Teacher', 'Call ' + phone + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(callUrl) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress & Grades</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'grades' && styles.tabActive]} onPress={() => setActiveTab('grades')}>
          <Text style={[styles.tabText, activeTab === 'grades' && styles.tabTextActive]}>Grades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'teachers' && styles.tabActive]} onPress={() => setActiveTab('teachers')}>
          <Text style={[styles.tabText, activeTab === 'teachers' && styles.tabTextActive]}>Teachers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'grades' ? (
          <>
            <View style={styles.averageCard}>
              <Text style={styles.averageLabel}>Overall Average</Text>
              <Text style={styles.averageValue}>{averageGrade}%</Text>
              <View style={styles.gradeScale}>
                <Text style={styles.gradeScaleText}>A: 90-100  |  B: 80-89  |  C: 70-79  |  D: 60-69</Text>
              </View>
            </View>

            {MOCK_GRADES.map((grade) => (
              <View key={grade.id} style={styles.gradeCard}>
                <View style={styles.gradeInfo}>
                  <Text style={styles.gradeSubject}>{grade.subject}</Text>
                  <Text style={styles.gradeDate}>{new Date(grade.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.gradeRight}>
                  <Text style={[styles.gradeValue, { color: getGradeColor(grade.grade) }]}>{grade.grade}%</Text>
                  <Text style={[styles.letterGrade, { color: getGradeColor(grade.grade) }]}>{grade.letterGrade}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          MOCK_TEACHERS.map((teacher) => (
            <View key={teacher.id} style={styles.teacherCard}>
              <View style={styles.teacherAvatar}>
                <MaterialCommunityIcons name="account" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <Text style={styles.teacherSubject}>{teacher.subject}</Text>
                <View style={styles.teacherContact}>
                  <TouchableOpacity style={styles.contactButton} onPress={() => handleEmail(teacher.email)}>
                    <MaterialCommunityIcons name="email-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  {teacher.phone && (
                    <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(teacher.phone!)}>
                      <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: SPACING.xs, marginHorizontal: SPACING.md, marginTop: SPACING.sm, borderRadius: RADIUS.lg },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  content: { padding: SPACING.md },
  averageCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg, ...SHADOWS.lg },
  averageLabel: { fontSize: 14, color: COLORS.white + '99' },
  averageValue: { fontSize: 48, fontWeight: '700', color: COLORS.white },
  gradeScale: { marginTop: SPACING.sm },
  gradeScaleText: { fontSize: 11, color: COLORS.white + '88' },
  gradeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  gradeInfo: { flex: 1 },
  gradeSubject: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  gradeDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  gradeRight: { alignItems: 'flex-end' },
  gradeValue: { fontSize: 20, fontWeight: '700' },
  letterGrade: { fontSize: 14, fontWeight: '600' },
  teacherCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  teacherAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  teacherSubject: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  teacherContact: { flexDirection: 'row', gap: SPACING.sm },
  contactButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
});
