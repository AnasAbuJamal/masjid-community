import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const FEATURES = [
  {
    icon: 'book-open-outline',
    title: 'Quran Classes',
    description: 'Weekly Quran recitation & tajweed',
    time: 'Sat & Sun, 9 AM',
    color: COLORS.primary,
  },
  {
    icon: 'school-outline',
    title: 'Islamic Studies',
    description: 'Fiqh, Aqeedah, Seerah',
    time: 'Sat, 11 AM',
    color: COLORS.secondary,
  },
  {
    icon: 'account-group-outline',
    title: 'Youth Program',
    description: 'Ages 8-17, activities & learning',
    time: 'Sun, 10 AM',
    color: '#1976d2',
  },
  {
    icon: 'translate',
    title: 'Arabic Language',
    description: 'Modern Standard & Classical Arabic',
    time: 'Sat, 1 PM',
    color: COLORS.accent,
  },
];

export default function SchoolScreen() {
  const [studentId, setStudentId] = useState('');

  const handleLookup = () => {
    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter a student ID');
      return;
    }
    Alert.alert(
      'Student Lookup',
      `Looking up student ID: ${studentId}`,
      [{ text: 'OK' }]
    );
  };

  const handleEnroll = () => {
    Alert.alert(
      'Enrollment',
      'To enroll your child, please contact the school office or visit during school hours.',
      [{ text: 'Got it' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Programs */}
        <Text style={styles.sectionTitle}>Programs & Classes</Text>
        <View style={styles.programsGrid}>
          {FEATURES.map((f) => (
            <TouchableOpacity
              key={f.title}
              style={styles.programCard}
              onPress={() => Alert.alert(f.title, f.description)}
              activeOpacity={0.75}
            >
              <View
                style={[styles.programIcon, { backgroundColor: f.color + '18' }]}
              >
                <MaterialCommunityIcons name={f.icon as any} size={24} color={f.color} />
              </View>
              <Text style={styles.programTitle}>{f.title}</Text>
              <Text style={styles.programDesc} numberOfLines={2}>
                {f.description}
              </Text>
              <View style={styles.programTimeBadge}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={11}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.programTime}>{f.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Children */}
        <Text style={styles.sectionTitle}>My Children</Text>
        <Card style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="account-child-outline"
            size={40}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>No children linked</Text>
          <Text style={styles.emptySubtext}>
            Contact the school office to link your children to your account.
          </Text>
          <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
            <Text style={styles.enrollText}>Enroll My Child</Text>
          </TouchableOpacity>
        </Card>

        {/* Student lookup */}
        <Text style={styles.sectionTitle}>Student Lookup</Text>
        <Card>
          <Text style={styles.lookupDesc}>
            Enter a student ID to view grades and attendance.
          </Text>
          <View style={styles.lookupRow}>
            <TextInput
              style={styles.lookupInput}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Student ID (e.g. STU-1234)"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="default"
              returnKeyType="search"
              onSubmitEditing={handleLookup}
            />
            <TouchableOpacity style={styles.lookupButton} onPress={handleLookup}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Contact */}
        <Card style={styles.contactCard}>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={20}
              color={COLORS.primary}
            />
            <View>
              <Text style={styles.contactTitle}>School Office</Text>
              <Text style={styles.contactInfo}>(555) 123-4567</Text>
            </View>
          </View>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={COLORS.primary}
            />
            <View>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactInfo}>school@almomineen.org</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm + 4,
    marginTop: SPACING.xs,
  },

  programsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  programCard: {
    width: '47.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  programIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  programDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.xs + 2,
  },
  programTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  programTime: { fontSize: 11, color: COLORS.textSecondary },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: SPACING.md,
  },
  enrollButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  enrollText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  lookupDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm + 4,
    lineHeight: 19,
  },
  lookupRow: { flexDirection: 'row', gap: SPACING.sm },
  lookupInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 4,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
  },
  lookupButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  contactCard: { marginBottom: SPACING.xs, gap: SPACING.md },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  contactTitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  contactInfo: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
});
