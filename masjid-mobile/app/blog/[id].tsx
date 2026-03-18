import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { BlogPost } from '../../services/api-service';

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await apiService.blog.getBySlug(id);
      setPost(data);
    } catch {
      setPost(null);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Article not found</Text>
      </View>
    );
  }

  const paragraphs = post.body.split('\n').filter(p => p.trim().length > 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: COLORS.text,
          headerTransparent: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.coverSection}>
          <View style={[styles.coverImage, { width }]}>
            {post.coverImage ? (
              <MaterialCommunityIcons name="image" size={48} color={COLORS.textSecondary} />
            ) : (
              <View style={styles.coverGradient}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color={COLORS.primary} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.articleContent}>
          <View style={styles.tagRow}>
            {post.tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Staff Writer'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>{paragraph}</Text>
          ))}

          {post.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Filed under:</Text>
              <View style={styles.tagsRow}>
                {post.tags.map(tag => (
                  <View key={tag} style={styles.footerTag}>
                    <Text style={styles.footerTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.sm },
  errorText: { fontSize: 15, color: COLORS.error, marginTop: SPACING.sm },
  coverSection: { overflow: 'hidden' },
  coverImage: { height: 240, justifyContent: 'center', alignItems: 'center' },
  coverGradient: { flex: 1, width: '100%', backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  articleContent: { padding: SPACING.md, gap: SPACING.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tagBadge: { backgroundColor: COLORS.primary + '18', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  tagBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, lineHeight: 30, marginTop: SPACING.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDivider: { width: 1, height: 14, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  paragraph: { fontSize: 15, color: COLORS.text, lineHeight: 24, marginBottom: SPACING.md },
  tagsSection: { marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  tagsLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  footerTag: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  footerTagText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
});
