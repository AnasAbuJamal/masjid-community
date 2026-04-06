import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, Skeleton } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { BlogPost } from '../../services/api-service';

interface FeaturedPost extends BlogPost {
  isFeatured?: boolean;
}

export default function BlogScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await apiService.blog.getAll();
      setPosts(data);
      const featured = data.filter(p => p.isFeatured || p.tags.includes('featured')).slice(0, 3);
      setFeaturedPosts(featured);
    } catch {
      setPosts([]);
      setFeaturedPosts([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags))).slice(0, 8);
  
  const filteredPosts = posts.filter(post => {
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
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
      <TouchableOpacity style={styles.searchToggle} onPress={() => setShowSearch(!showSearch)}>
        <MaterialCommunityIcons name={showSearch ? 'magnify-minus' : 'magnify-plus'} size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderFeatured = () => {
    if (featuredPosts.length === 0) return null;
    return (
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <FlatList
          horizontal
          data={featuredPosts}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => router.push({ pathname: '/blog/[id]' as any, params: { id: item.slug } })}
            >
              <View style={styles.featuredImage}>
                <View style={styles.featuredGradient}>
                  <View style={styles.featuredBadge}>
                    <MaterialCommunityIcons name="star" size={12} color={COLORS.warning} />
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </View>
                </View>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.featuredMeta}>{formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>News & Articles</Text>
        <Text style={styles.pageSubtitle}>Updates from our community</Text>
      </View>

      {renderSearchBar()}

      {!showSearch && renderFeatured()}

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

      {(searchQuery || selectedTag) && (
        <Text style={styles.resultsText}>
          {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} found
        </Text>
      )}
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
      <View style={styles.headerSection}>
        <Skeleton style={{ height: 30, width: 200, marginBottom: 8 }} />
        <Skeleton style={{ height: 20, width: 150 }} />
      </View>
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
                  <Text style={styles.emptyTitle}>
                    {searchQuery || selectedTag ? 'No articles found' : 'No articles yet'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery || selectedTag ? 'Try different search terms or filters' : 'Check back soon for news and updates'}
                  </Text>
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

  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, gap: SPACING.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  searchToggle: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },

  featuredSection: { marginTop: SPACING.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginLeft: SPACING.md },
  featuredList: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  featuredCard: { width: 260, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden' },
  featuredImage: { height: 140, backgroundColor: COLORS.primary + '20' },
  featuredGradient: { flex: 1, justifyContent: 'flex-start', padding: SPACING.sm },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warning + '20', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start', gap: 4 },
  featuredBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.warning },
  featuredContent: { padding: SPACING.sm },
  featuredTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 20 },
  featuredMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },

  tagSection: { paddingBottom: SPACING.sm, marginTop: SPACING.sm },
  tagList: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  tagChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  tagChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tagTextActive: { color: COLORS.white },

  resultsText: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },

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
