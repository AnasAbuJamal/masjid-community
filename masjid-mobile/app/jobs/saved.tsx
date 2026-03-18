import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import apiService, { Job } from '../../services/api-service';
import useBookmarkStore from '../../stores/bookmarkStore';

export default function SavedJobsScreen() {
  const router = useRouter();
  const { savedJobs, initialize, isLoading } = useBookmarkStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    loadSavedJobs();
  }, [savedJobs]);

  const loadSavedJobs = async () => {
    if (savedJobs.length === 0) {
      setJobs([]);
      return;
    }
    
    const allJobs = await apiService.jobs.getAll();
    const filtered = allJobs.filter(job => savedJobs.includes(job.id));
    setJobs(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedJobs();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => router.push(`/jobs/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.company}>{item.company}</Text>
        </View>
        <MaterialCommunityIcons name="bookmark" size={24} color={COLORS.primary} />
      </View>
      
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{item.employmentType.replace('_', '-')}</Text>
        </View>
      </View>

      {item.salaryMin && item.salaryMax && (
        <Text style={styles.salary}>
          ${item.salaryMin.toLocaleString()} - ${item.salaryMax.toLocaleString()}/yr
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Jobs</Text>
        <Text style={styles.count}>{jobs.length} saved</Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bookmark-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No saved jobs</Text>
            <Text style={styles.emptySubtext}>Bookmark jobs to view them here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  list: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  company: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  salary: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
