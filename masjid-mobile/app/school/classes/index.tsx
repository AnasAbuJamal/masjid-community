import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, ScreenHeader } from '../../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';

interface ClassSession {
  id: string;
  name: string;
  teacher: string;
  level: string;
  schedule: string;
  room: string;
  enrolled: number;
  maxCapacity: number;
  type: 'quran' | 'arabic' | 'islamic_studies' | 'youth';
}

const MOCK_CLASSES: ClassSession[] = [
  { id: '1', name: 'Quran Recitation - Beginner', teacher: 'Ustad Ahmad', level: 'Beginner', schedule: 'Sat & Sun, 9:00 AM', room: 'Room 1', enrolled: 12, maxCapacity: 15, type: 'quran' },
  { id: '2', name: 'Quran Tajweed', teacher: 'Ustadah Fatima', level: 'Intermediate', schedule: 'Sat & Sun, 10:30 AM', room: 'Room 2', enrolled: 8, maxCapacity: 12, type: 'quran' },
  { id: '3', name: 'Arabic Language - Level 1', teacher: 'Ustadah Sarah', level: 'Beginner', schedule: 'Sat, 1:00 PM', room: 'Room 3', enrolled: 10, maxCapacity: 15, type: 'arabic' },
  { id: '4', name: 'Arabic Conversation', teacher: 'Ustadah Sarah', level: 'Intermediate', schedule: 'Sun, 1:00 PM', room: 'Room 3', enrolled: 6, maxCapacity: 10, type: 'arabic' },
  { id: '5', name: 'Islamic Studies - Fiqh', teacher: 'Ustad Omar', level: 'All Levels', schedule: 'Sat, 11:00 AM', room: 'Main Hall', enrolled: 20, maxCapacity: 30, type: 'islamic_studies' },
  { id: '6', name: 'Seerah & History', teacher: 'Ustad Omar', level: 'Intermediate', schedule: 'Sun, 11:00 AM', room: 'Room 4', enrolled: 15, maxCapacity: 20, type: 'islamic_studies' },
  { id: '7', name: 'Youth Program - Ages 8-12', teacher: 'Br. Ahmed', level: 'Youth', schedule: 'Sun, 10:00 AM', room: 'Youth Center', enrolled: 18, maxCapacity: 25, type: 'youth' },
  { id: '8', name: 'Youth Program - Ages 13-17', teacher: 'Br. Ali', level: 'Youth', schedule: 'Sun, 12:00 PM', room: 'Youth Center', enrolled: 14, maxCapacity: 20, type: 'youth' },
];

export default function ClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setTimeout(() => {
      setClasses(MOCK_CLASSES);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const filteredClasses = selectedType === 'all' 
    ? classes 
    : classes.filter(c => c.type === selectedType);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quran': return 'book-open-variant';
      case 'arabic': return 'translate';
      case 'islamic_studies': return 'school';
      case 'youth': return 'account-group';
      default: return 'book';
    }
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

  const types = [
    { key: 'all', label: 'All Classes', icon: 'view-grid' },
    { key: 'quran', label: 'Quran', icon: 'book-open-variant' },
    { key: 'arabic', label: 'Arabic', icon: 'translate' },
    { key: 'islamic_studies', label: 'Islamic Studies', icon: 'school' },
    { key: 'youth', label: 'Youth', icon: 'account-group' },
  ];

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Available Classes</Text>
        <Text style={styles.pageSubtitle}>Browse and enroll in our programs</Text>
      </View>

      <View style={styles.typeSection}>
        <FlatList
          horizontal
          data={types}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.typeChip, selectedType === item.key && styles.typeChipActive]}
              onPress={() => setSelectedType(item.key)}
            >
              <MaterialCommunityIcons 
                name={item.icon as any} 
                size={16} 
                color={selectedType === item.key ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.typeText, selectedType === item.key && styles.typeTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  const renderClass = ({ item }: { item: ClassSession }) => {
    const typeColor = getTypeColor(item.type);
    const spotsLeft = item.maxCapacity - item.enrolled;
    const isFull = spotsLeft === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/school/classes/[id]' as any, params: { id: item.id } })}
      >
        <GlassCard style={styles.classCard}>
          <View style={styles.classHeader}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
              <MaterialCommunityIcons name={getTypeIcon(item.type) as any} size={14} color={typeColor} />
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                {item.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: COLORS.surface }]}>
              <Text style={styles.levelText}>{item.level}</Text>
            </View>
          </View>

          <Text style={styles.className}>{item.name}</Text>

          <View style={styles.classInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-tie" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{item.teacher}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{item.schedule}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="door" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{item.room}</Text>
            </View>
          </View>

          <View style={styles.classFooter}>
            <View style={styles.enrollmentInfo}>
              <View style={styles.enrollmentBar}>
                <View style={[styles.enrollmentFill, { width: `${(item.enrolled / item.maxCapacity) * 100}%`, backgroundColor: isFull ? COLORS.error : typeColor }]} />
              </View>
              <Text style={[styles.enrollmentText, isFull && styles.enrollmentFull]}>
                {item.enrolled}/{item.maxCapacity} enrolled {isFull ? '(Full)' : `(${spotsLeft} spots left)`}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrapper}>
      <GlassCard>
        <View style={styles.centeredContent}>
          <FloatingIcon 
            icon={<MaterialCommunityIcons name="school" size={32} color={COLORS.textSecondary} />} 
            size="lg" 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.emptyTitle}>No classes found</Text>
          <Text style={styles.emptySubtext}>Check back soon for new classes</Text>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Classes" showBack />
      <ScreenWrapper contentPadding={false} bottomPadding={false}>
        <FlatList
          data={filteredClasses}
          keyExtractor={item => item.id}
          renderItem={renderClass}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      </ScreenWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  typeSection: { paddingBottom: SPACING.sm },
  typeList: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  typeChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.sm + 4, 
    paddingVertical: SPACING.xs + 2, 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.full, 
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.white },

  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },

  classCard: { padding: SPACING.md, gap: SPACING.sm },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, gap: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  levelBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  levelText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  className: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  classInfo: { gap: SPACING.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  infoText: { fontSize: 13, color: COLORS.textSecondary },

  classFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  enrollmentInfo: { flex: 1 },
  enrollmentBar: { height: 4, backgroundColor: COLORS.background, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  enrollmentFill: { height: '100%', borderRadius: 2 },
  enrollmentText: { fontSize: 11, color: COLORS.textSecondary },
  enrollmentFull: { color: COLORS.error },

  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});