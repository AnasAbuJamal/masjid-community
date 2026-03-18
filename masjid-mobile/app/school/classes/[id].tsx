import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';

interface ClassSession {
  id: string;
  name: string;
  teacher: string;
  teacherBio: string;
  teacherPhone: string;
  teacherEmail: string;
  level: string;
  schedule: string;
  room: string;
  enrolled: number;
  maxCapacity: number;
  type: 'quran' | 'arabic' | 'islamic_studies' | 'youth';
  description: string;
  requirements: string[];
  materials: string[];
}

const MOCK_CLASS: ClassSession = {
  id: '1',
  name: 'Quran Recitation - Beginner',
  teacher: 'Ustad Ahmad',
  teacherBio: 'Memorized the entire Quran at age 12. Certified in Tajweed with 15 years of teaching experience.',
  teacherPhone: '+1 (555) 123-4567',
  teacherEmail: 'ustad.ahmad@masjid.com',
  level: 'Beginner',
  schedule: 'Saturday & Sunday, 9:00 AM - 10:00 AM',
  room: 'Room 1',
  enrolled: 12,
  maxCapacity: 15,
  type: 'quran',
  description: 'Learn the fundamentals of Quran recitation including proper pronunciation (makharij),基本的字母发音,以及基础 Tajweed 规则。This class is perfect for those who are new to reading Arabic or want to improve their recitation.',
  requirements: ['Quran with Arabic text', 'Notebook', 'Pencil'],
  materials: ['Quran Flashcards (provided)', 'Tajweed Guidelines sheet'],
};

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const classData = MOCK_CLASS;
  const spotsLeft = classData.maxCapacity - classData.enrolled;
  const isFull = spotsLeft === 0;
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = () => {
    if (isFull) {
      Alert.alert('Class Full', 'This class is currently at maximum capacity. You can join the waitlist.');
      return;
    }

    Alert.alert(
      'Enroll in Class',
      `Would you like to enroll in "${classData.name}"?\n\nSchedule: ${classData.schedule}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: () => {
            setEnrolling(true);
            setTimeout(() => {
              setEnrolling(false);
              Alert.alert('Success!', 'You have been enrolled in this class. Check your email for confirmation.');
            }, 1000);
          },
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quran': return COLORS.primary;
      case 'arabic': return COLORS.secondary;
      case 'islamic_studies': return COLORS.success;
      case 'youth': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const typeColor = getTypeColor(classData.type);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Class Info Card */}
        <View style={styles.classCard}>
          <View style={styles.classHeader}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                {classData.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: COLORS.surface }]}>
              <Text style={styles.levelText}>{classData.level}</Text>
            </View>
          </View>

          <Text style={styles.className}>{classData.name}</Text>

          <View style={styles.enrollmentRow}>
            <View style={styles.enrollmentBar}>
              <View style={[styles.enrollmentFill, { width: `${(classData.enrolled / classData.maxCapacity) * 100}%`, backgroundColor: isFull ? COLORS.error : typeColor }]} />
            </View>
            <Text style={[styles.enrollmentText, isFull && styles.enrollmentFull]}>
              {classData.enrolled}/{classData.maxCapacity} enrolled {isFull ? '(Full)' : `• ${spotsLeft} spots left`}
            </Text>
          </View>
        </View>

        {/* Schedule & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Days</Text>
                <Text style={styles.detailValue}>Saturday & Sunday</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>9:00 AM - 10:00 AM</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="door" size={20} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{classData.room}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Class</Text>
          <View style={styles.detailCard}>
            <Text style={styles.description}>{classData.description}</Text>
          </View>
        </View>

        {/* Teacher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructor</Text>
          <View style={styles.detailCard}>
            <View style={styles.teacherHeader}>
              <View style={styles.teacherAvatar}>
                <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{classData.teacher}</Text>
                <Text style={styles.teacherLabel}>Lead Instructor</Text>
              </View>
            </View>
            <Text style={styles.teacherBio}>{classData.teacherBio}</Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton}>
                <MaterialCommunityIcons name="phone" size={18} color={COLORS.primary} />
                <Text style={styles.contactText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton}>
                <MaterialCommunityIcons name="email" size={18} color={COLORS.primary} />
                <Text style={styles.contactText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Bring</Text>
          <View style={styles.detailCard}>
            {classData.requirements.map((req, index) => (
              <View key={index} style={styles.reqRow}>
                <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                <Text style={styles.reqText}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Materials Provided */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials Provided</Text>
          <View style={styles.detailCard}>
            {classData.materials.map((mat, index) => (
              <View key={index} style={styles.reqRow}>
                <MaterialCommunityIcons name="gift" size={16} color={COLORS.secondary} />
                <Text style={styles.reqText}>{mat}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Enroll Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.enrollButton, isFull && styles.enrollButtonDisabled]}
          onPress={handleEnroll}
          disabled={enrolling}
        >
          <MaterialCommunityIcons 
            name={isFull ? 'account-clock' : 'plus-circle'} 
            size={20} 
            color={COLORS.white} 
          />
          <Text style={styles.enrollText}>
            {enrolling ? 'Enrolling...' : isFull ? 'Join Waitlist' : 'Enroll Now'}
          </Text>
        </TouchableOpacity>
      </View>
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { padding: SPACING.md, paddingBottom: 100 },

  classCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  typeBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  typeBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  levelBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  levelText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  className: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  enrollmentRow: {},
  enrollmentBar: { height: 6, backgroundColor: COLORS.background, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  enrollmentFill: { height: '100%', borderRadius: 3 },
  enrollmentText: { fontSize: 12, color: COLORS.textSecondary },
  enrollmentFull: { color: COLORS.error },

  section: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailContent: { marginLeft: SPACING.sm },
  detailLabel: { fontSize: 12, color: COLORS.textSecondary },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  description: { fontSize: 14, color: COLORS.text, lineHeight: 22 },

  teacherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  teacherAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  teacherLabel: { fontSize: 12, color: COLORS.textSecondary },
  teacherBio: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  contactButtons: { flexDirection: 'row', gap: SPACING.sm },
  contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '12', paddingVertical: SPACING.sm, borderRadius: RADIUS.md, gap: 4 },
  contactText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  reqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs, gap: SPACING.sm },
  reqText: { fontSize: 14, color: COLORS.text },

  bottomSpacer: { height: SPACING.lg },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  enrollButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, gap: SPACING.sm, ...SHADOWS.md },
  enrollButtonDisabled: { backgroundColor: COLORS.textSecondary },
  enrollText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});