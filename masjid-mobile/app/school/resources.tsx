import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Resource, ResourceType } from '../../services/resource-service';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Quran', icon: 'book-open-variant', count: 15 },
  { id: '2', name: 'Arabic', icon: 'translate', count: 12 },
  { id: '3', name: 'Islamic Studies', icon: 'school', count: 20 },
  { id: '4', name: 'Seerah', icon: 'history', count: 8 },
  { id: '5', name: 'Duas', icon: 'hands-prayer', count: 10 },
  { id: '6', name: 'Stories', icon: 'book-multiple', count: 6 },
];

const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Learn Tajweed - Basic Rules', description: 'Introduction to Tajweed rules for beginners', type: 'video', category: 'Quran', url: 'https://youtube.com/watch?v=example1', thumbnailUrl: '', duration: 1200, tags: ['tajweed', 'beginner'], gradeLevels: ['all'], createdAt: '2024-03-01', createdBy: 'Ustad Ahmad', viewCount: 150, isFeatured: true },
  { id: '2', title: 'Arabic Alphabet Flashcards', description: 'Printable flashcards for learning Arabic letters', type: 'document', category: 'Arabic', url: 'https://example.com/flashcards.pdf', fileSize: 2500000, tags: ['alphabet', 'printable'], gradeLevels: ['Kindergarten', '1st Grade'], createdAt: '2024-02-15', createdBy: 'Ustadah Sarah', viewCount: 89, isFeatured: false },
  { id: '3', title: 'Prophetic Character Series', description: 'Videos about the beautiful character of Prophet Muhammad', type: 'video', category: 'Islamic Studies', url: 'https://youtube.com/watch?v=example2', thumbnailUrl: '', duration: 1800, tags: ['akhlak', 'character'], gradeLevels: ['all'], createdAt: '2024-03-10', createdBy: 'Ustad Omar', viewCount: 234, isFeatured: true },
  { id: '4', title: 'Daily Duas Collection', description: 'Collection of duas for daily life', type: 'link', category: 'Duas', url: 'https://example.com/duas', tags: ['dua', 'daily'], gradeLevels: ['all'], createdAt: '2024-01-20', createdBy: 'Masjid', viewCount: 456, isFeatured: false },
  { id: '5', title: 'Seerah of the Prophet - Part 1', description: 'The life of Prophet Muhammad (SAW)', type: 'audio', category: 'Seerah', url: 'https://example.com/seerah.mp3', duration: 3600, tags: ['seerah', 'prophet'], gradeLevels: ['5th Grade', '6th Grade'], createdAt: '2024-02-28', createdBy: 'Ustad Omar', viewCount: 67, isFeatured: false },
];

const TYPE_FILTERS = [
  { key: 'all', label: 'All', icon: 'view-grid' },
  { key: 'video', label: 'Videos', icon: 'play-circle' },
  { key: 'document', label: 'Docs', icon: 'file-pdf-box' },
  { key: 'link', label: 'Links', icon: 'link' },
  { key: 'audio', label: 'Audio', icon: 'headphones' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceLibraryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setResources(MOCK_RESOURCES);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    const matchesType = selectedType === 'all' || r.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'video': return 'play-circle';
      case 'document': return 'file-pdf-box';
      case 'link': return 'link';
      case 'audio': return 'headphones';
      case 'image': return 'image';
      default: return 'file';
    }
  };

  const getTypeColor = (type: ResourceType) => {
    switch (type) {
      case 'video': return '#E53935';
      case 'document': return '#1E88E5';
      case 'link': return '#43A047';
      case 'audio': return '#FB8C00';
      case 'image': return '#8E24AA';
      default: return COLORS.textSecondary;
    }
  };

  const handleResourcePress = async (resource: Resource) => {
    if (resource.url) {
      await Linking.openURL(resource.url);
    }
  };

  const renderCategoryChip = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryChip, selectedCategory === item.name && styles.categoryChipActive]}
      onPress={() => setSelectedCategory(selectedCategory === item.name ? null : item.name)}
    >
      <MaterialCommunityIcons
        name={item.icon as any}
        size={16}
        color={selectedCategory === item.name ? COLORS.white : COLORS.textSecondary}
      />
      <Text style={[styles.categoryChipText, selectedCategory === item.name && styles.categoryChipTextActive]}>
        {item.name} ({item.count})
      </Text>
    </TouchableOpacity>
  );

  const renderResource = ({ item }: { item: Resource }) => {
    const typeColor = getTypeColor(item.type);
    return (
      <TouchableOpacity onPress={() => handleResourcePress(item)} activeOpacity={0.7}>
        <GlassCard style={styles.resourceCard}>
          <View style={styles.resourceHeader}>
            <View style={[styles.typeIcon, { backgroundColor: typeColor + '15' }]}>
              <MaterialCommunityIcons name={getTypeIcon(item.type) as any} size={20} color={typeColor} />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>{item.title}</Text>
              <Text style={styles.resourceCategory}>{item.category}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.resourceDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.resourceFooter}>
            <View style={styles.resourceMeta}>
              {item.duration && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
                </View>
              )}
              {item.fileSize && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="file" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{formatFileSize(item.fileSize)}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="eye" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.viewCount} views</Text>
              </View>
            </View>
            {item.tags.slice(0, 2).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Resource Library</Text>
        <Text style={styles.subtitle}>Educational materials for students</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={MOCK_CATEGORIES}
        keyExtractor={item => item.id}
        renderItem={renderCategoryChip}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />

      <View style={styles.typeFilters}>
        {TYPE_FILTERS.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[styles.typeChip, selectedType === type.key && styles.typeChipActive]}
            onPress={() => setSelectedType(type.key)}
          >
            <MaterialCommunityIcons
              name={type.icon as any}
              size={14}
              color={selectedType === type.key ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.typeChipText, selectedType === type.key && styles.typeChipTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultsText}>{filteredResources.length} resources found</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <GlassCard>
        <View style={styles.centeredContent}>
          <FloatingIcon
            icon={<MaterialCommunityIcons name="folder-open" size={32} color={COLORS.textSecondary} />}
            size="lg"
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>No resources found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or search</Text>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <FlatList
        data={filteredResources}
        keyExtractor={item => item.id}
        renderItem={renderResource}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  categoryList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xs },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, gap: 4 },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryChipText: { fontSize: 12, color: COLORS.textSecondary },
  categoryChipTextActive: { color: COLORS.white },

  typeFilters: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.xs, marginBottom: SPACING.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  typeChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  typeChipText: { fontSize: 11, color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.white },

  resultsText: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: SPACING.md, marginBottom: SPACING.xs },

  listContent: { paddingBottom: 100 },

  resourceCard: { padding: SPACING.md },
  resourceHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  resourceInfo: { flex: 1, marginLeft: SPACING.sm },
  resourceTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  resourceCategory: { fontSize: 12, color: COLORS.textSecondary },
  resourceDescription: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  resourceFooter: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.sm },
  resourceMeta: { flex: 1, flexDirection: 'row', gap: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 11, color: COLORS.textSecondary },
  tag: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  tagText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },

  emptyContainer: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
