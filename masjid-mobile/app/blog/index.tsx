import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { BlogPost } from '../../services/api-service';

export default function BlogScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await apiService.blog.getAll();
      setPosts(data);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags))).slice(0, 6);
  const filteredPosts = selectedTag ? posts.filter(p => p.tags.includes(selectedTag)) : posts;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>News & Articles</Text>
        <Text style={styles.pageSubtitle}>Updates from our community</Text>
      </View>

      <View style={styles.tagSection}>
        <FlatList
          horizontal
          data={[{ label: 'All', value: null }, ...allTags.map(t => ({ label: t, value: t }))]}
          keyExtractor={item => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tagChip, selectedTag === item.value && styles.tagChipActive]}
              onPress={() => setSelectedTag(item.value)}
            >
              <Text style={[styles.tagText, selectedTag === item.value && styles.tagTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: BlogPost }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/blog/[id]' as any, params: { id: item.slug } })}
    >
      <GlassCard style={styles.postCard}>
        {item.coverImage ? (
          <View style={styles.coverImagePlaceholder}>
            <MaterialCommunityIcons name="image" size={32} color={COLORS.textSecondary} />
          </View>
        ) : (
          <View style={[styles.coverImagePlaceholder, styles.coverGradient]}>
            <View style={styles.coverIconWrap}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={28} color={COLORS.primary} />
            </View>
          </View>
        )}
        <View style={styles.postContent}>
          <View style={styles.tagRow}>
            {item.tags.slice(0, 2).map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text>
          <View style={styles.postMeta}>
            <View style={styles.authorRow}>
              <MaterialCommunityIcons name="account-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                {item.author ? `${item.author.firstName} ${item.author.lastName}` : 'Staff'}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View style={{ padding: SPACING.md }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton style={styles.skeletonCover} />
          <View style={styles.skeletonContent}>
            <Skeleton style={styles.skeletonTag} />
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonBody} />
            <Skeleton style={styles.skeletonMeta} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <GlassCard>
                <View style={styles.centeredContent}>
                  <FloatingIcon icon={<MaterialCommunityIcons name="newspaper-variant-outline" size={32} color={COLORS.textSecondary} />} size="lg" color={COLORS.textSecondary} />
                  <Text style={styles.emptyTitle}>No articles yet</Text>
                  <Text style={styles.emptySubtext}>Check back soon for news and updates</Text>
                </View>
              </GlassCard>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  tagSection: { paddingBottom: SPACING.sm },
  tagList: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  tagChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  tagChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tagTextActive: { color: COLORS.white },
  listContent: { paddingBottom: 100 },
  postCard: { marginHorizontal: SPACING.md, overflow: 'hidden' },
  coverImagePlaceholder: { height: 160, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg },
  coverGradient: { backgroundColor: COLORS.primary + '15' },
  coverIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  postContent: { padding: SPACING.md, gap: SPACING.xs },
  tagRow: { flexDirection: 'row', gap: SPACING.xs },
  tagBadge: { backgroundColor: COLORS.primary + '18', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  tagBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  postTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  postBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  skeletonCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surface },
  skeletonCover: { height: 160, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg },
  skeletonContent: { padding: SPACING.md, gap: SPACING.sm },
  skeletonTag: { height: 20, width: 80, borderRadius: RADIUS.full },
  skeletonTitle: { height: 22, borderRadius: RADIUS.sm },
  skeletonBody: { height: 16, width: '80%', borderRadius: RADIUS.sm },
  skeletonMeta: { height: 14, width: 120, borderRadius: RADIUS.sm },
});
