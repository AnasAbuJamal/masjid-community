import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon, EmptyState, Button } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { RentalItem } from '../../services/api-service';

const categoryIcons: Record<string, string> = {
  hall: 'door',
  furniture: 'chair-rolling',
  equipment: 'wrench',
  other: 'package-variant',
};

const categoryColors: Record<string, string> = {
  hall: COLORS.primary,
  furniture: COLORS.secondary,
  equipment: COLORS.accent,
  other: COLORS.textSecondary,
};

export default function RentalsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await apiService.rentals.getAll();
      setItems(data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter((i) => i.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const renderItem = (item: RentalItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => router.push(`/rentals/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <GlassCard style={styles.itemCard}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImagePlaceholder, { backgroundColor: categoryColors[item.category] + '20' }]}>
            <MaterialCommunityIcons name={categoryIcons[item.category] as any} size={40} color={categoryColors[item.category]} />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <View style={styles.priceRow}>
            {item.priceHourly && (
              <Text style={styles.priceText}>${item.priceHourly}/hr</Text>
            )}
            {item.priceDaily && (
              <Text style={styles.priceText}>${item.priceDaily}/day</Text>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
      </GlassCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading rentals...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ title: 'Rentals' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Equipment & Hall Rentals</Text>
          <Text style={styles.subtitle}>Book halls, tables, chairs, and more for your events</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filteredItems.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={<MaterialCommunityIcons name="package-variant" size={48} color={COLORS.textSecondary} />}
              title="No items available"
              message="Check back later for rental options."
            />
          </GlassCard>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map(renderItem)}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  header: { marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  categoryScroll: { marginBottom: SPACING.md },
  categoryRow: { flexDirection: 'row', gap: SPACING.sm },
  categoryChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: COLORS.surface },
  categoryChipSelected: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryTextSelected: { color: COLORS.white },
  itemsList: { gap: SPACING.sm },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm },
  itemImage: { width: 70, height: 70, borderRadius: RADIUS.md },
  itemImagePlaceholder: { width: 70, height: 70, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: SPACING.sm },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  itemCategory: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  priceText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});