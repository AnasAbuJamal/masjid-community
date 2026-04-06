import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper } from '../../../components/common';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';

interface ReportCard {
  id: string;
  term: string;
  year: number;
  overallGrade: string;
  gpa: number;
  totalPoints: number;
  maxPoints: number;
  issuedDate: string;
  classes: {
    name: string;
    grade: string;
    percentage: number;
    teacher: string;
    letterGrade: string;
  }[];
}

interface Child {
  id: string;
  name: string;
  gradeLevel: string;
}

const MOCK_CHILDREN: Child[] = [
  { id: '1', name: 'Ahmed Ali', gradeLevel: '4th Grade' },
  { id: '2', name: 'Fatima Ali', gradeLevel: '1st Grade' },
];

const MOCK_REPORT_CARDS: Record<string, ReportCard[]> = {
  '1': [
    {
      id: '1',
      term: 'Spring 2024',
      year: 2024,
      overallGrade: 'A',
      gpa: 3.8,
      totalPoints: 920,
      maxPoints: 1000,
      issuedDate: '2024-03-15',
      classes: [
        { name: 'Quran Recitation', grade: '95%', percentage: 95, teacher: 'Ustad Ahmad', letterGrade: 'A' },
        { name: 'Arabic Language', grade: '88%', percentage: 88, teacher: 'Ustadah Sarah', letterGrade: 'B+' },
        { name: 'Islamic Studies', grade: '92%', percentage: 92, teacher: 'Ustad Omar', letterGrade: 'A-' },
        { name: 'Seerah & History', grade: '90%', percentage: 90, teacher: 'Ustad Omar', letterGrade: 'A-' },
      ],
    },
    {
      id: '2',
      term: 'Fall 2023',
      year: 2023,
      overallGrade: 'A-',
      gpa: 3.7,
      totalPoints: 890,
      maxPoints: 1000,
      issuedDate: '2023-12-15',
      classes: [
        { name: 'Quran Recitation', grade: '93%', percentage: 93, teacher: 'Ustad Ahmad', letterGrade: 'A' },
        { name: 'Arabic Language', grade: '85%', percentage: 85, teacher: 'Ustadah Sarah', letterGrade: 'B' },
        { name: 'Islamic Studies', grade: '90%', percentage: 90, teacher: 'Ustad Omar', letterGrade: 'A-' },
        { name: 'Seerah & History', grade: '88%', percentage: 88, teacher: 'Ustad Omar', letterGrade: 'B+' },
      ],
    },
  ],
  '2': [
    {
      id: '3',
      term: 'Spring 2024',
      year: 2024,
      overallGrade: 'A',
      gpa: 4.0,
      totalPoints: 480,
      maxPoints: 500,
      issuedDate: '2024-03-15',
      classes: [
        { name: 'Quran Basics', grade: '96%', percentage: 96, teacher: 'Ustadah Fatima', letterGrade: 'A' },
        { name: 'Arabic - Level 1', grade: '95%', percentage: 95, teacher: 'Ustadah Sarah', letterGrade: 'A' },
        { name: 'Islamic Studies', grade: '98%', percentage: 98, teacher: 'Ustad Omar', letterGrade: 'A+' },
      ],
    },
  ],
};

export default function ReportCardScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);

  useEffect(() => {
    setChildren(MOCK_CHILDREN);
    if (MOCK_CHILDREN.length > 0) {
      setSelectedChild(MOCK_CHILDREN[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedChild) {
      setReportCards(MOCK_REPORT_CARDS[selectedChild.id] || []);
    }
  }, [selectedChild]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return COLORS.success;
    if (percentage >= 80) return COLORS.primary;
    if (percentage >= 70) return COLORS.warning;
    return COLORS.error;
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScreenWrapper contentPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Report Cards</Text>
          <Text style={styles.subtitle}>View academic progress</Text>
        </View>

        <View style={styles.childSelector}>
          <Text style={styles.selectorLabel}>Select Child</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {children.map(child => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChild?.id === child.id && styles.childChipActive]}
                onPress={() => setSelectedChild(child)}
              >
                <View style={[styles.childAvatar, selectedChild?.id === child.id && styles.childAvatarActive]}>
                  <Text style={[styles.childAvatarText, selectedChild?.id === child.id && styles.childAvatarTextActive]}>
                    {child.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Text style={[styles.childName, selectedChild?.id === child.id && styles.childNameActive]}>
                  {child.name}
                </Text>
                <Text style={styles.childGrade}>{child.gradeLevel}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {reportCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <GlassCard>
              <View style={styles.centeredContent}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No Report Cards</Text>
                <Text style={styles.emptySubtext}>Report cards will appear here once issued</Text>
              </View>
            </GlassCard>
          </View>
        ) : (
          reportCards.map(reportCard => (
            <View key={reportCard.id} style={styles.section}>
              <GlassCard style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={styles.termText}>{reportCard.term} {reportCard.year}</Text>
                    <Text style={styles.issuedText}>Issued: {formatDate(reportCard.issuedDate)}</Text>
                  </View>
                  <View style={styles.overallGrade}>
                    <Text style={styles.overallGradeText}>{reportCard.overallGrade}</Text>
                    <Text style={styles.gpaText}>GPA: {reportCard.gpa.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(reportCard.totalPoints / reportCard.maxPoints) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {reportCard.totalPoints}/{reportCard.maxPoints} points
                  </Text>
                </View>
              </GlassCard>

              <Text style={styles.classTitle}>Class Grades</Text>
              {reportCard.classes.map((classItem, index) => (
                <GlassCard key={index} style={styles.classCard}>
                  <View style={styles.classHeader}>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{classItem.name}</Text>
                      <Text style={styles.classTeacher}>{classItem.teacher}</Text>
                    </View>
                    <View style={styles.classGrade}>
                      <Text style={[styles.percentageText, { color: getGradeColor(classItem.percentage) }]}>
                        {classItem.percentage}%
                      </Text>
                      <View style={[styles.letterBadge, { backgroundColor: getGradeColor(classItem.percentage) + '15' }]}>
                        <Text style={[styles.letterText, { color: getGradeColor(classItem.percentage) }]}>
                          {classItem.letterGrade}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.gradeBar}>
                    <View
                      style={[
                        styles.gradeFill,
                        { width: `${classItem.percentage}%`, backgroundColor: getGradeColor(classItem.percentage) },
                      ]}
                    />
                  </View>
                </GlassCard>
              ))}
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  childSelector: { padding: SPACING.md },
  selectorLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  childChip: { alignItems: 'center', marginRight: SPACING.md, padding: SPACING.sm, borderRadius: RADIUS.md },
  childChipActive: { backgroundColor: COLORS.primary + '10' },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  childAvatarActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  childAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  childAvatarTextActive: { color: COLORS.white },
  childName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs },
  childNameActive: { color: COLORS.primary },
  childGrade: { fontSize: 11, color: COLORS.textSecondary },

  emptyContainer: { padding: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm, padding: SPACING.lg },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  section: { padding: SPACING.md, paddingTop: 0 },
  reportCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  termText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  issuedText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  overallGrade: { alignItems: 'flex-end' },
  overallGradeText: { fontSize: 32, fontWeight: '800', color: COLORS.success },
  gpaText: { fontSize: 13, color: COLORS.textSecondary },

  progressContainer: { marginTop: SPACING.md },
  progressBar: { height: 8, backgroundColor: COLORS.background, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.success },
  progressText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },

  classTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  classCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  classInfo: { flex: 1 },
  className: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  classTeacher: { fontSize: 12, color: COLORS.textSecondary },
  classGrade: { alignItems: 'flex-end' },
  percentageText: { fontSize: 16, fontWeight: '700' },
  letterBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 2 },
  letterText: { fontSize: 12, fontWeight: '600' },
  gradeBar: { height: 4, backgroundColor: COLORS.background, borderRadius: 2, marginTop: SPACING.sm, overflow: 'hidden' },
  gradeFill: { height: '100%', borderRadius: 2 },

  bottomSpacer: { height: 100 },
});
