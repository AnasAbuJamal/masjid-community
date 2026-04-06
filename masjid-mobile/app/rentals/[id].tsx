import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, Button } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { RentalItem } from '../../services/api-service';

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await apiService.rentals.getAll();
      const found = data.find((i) => i.id === id);
      setItem(found || null);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!item) {
    return (
      <ScreenWrapper>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.loadingContainer}>
          <Text>Item not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: COLORS.primary + '20' }]}>
            <MaterialCommunityIcons name="package-variant" size={60} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          {item.description && (
            <GlassCard style={styles.descriptionCard}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </GlassCard>
          )}

          <GlassCard style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Pricing</Text>
            <View style={styles.pricingRow}>
              {item.priceHourly ? (
                <View style={styles.priceItem}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.priceValue}>${item.priceHourly}</Text>
                  <Text style={styles.priceLabel}>per hour</Text>
                </View>
              ) : null}
              {item.priceDaily ? (
                <View style={styles.priceItem}>
                  <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
                  <Text style={styles.priceValue}>${item.priceDaily}</Text>
                  <Text style={styles.priceLabel}>per day</Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>Free cancellation up to 24 hours before booking</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>Secure payment processing</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Book Now"
          onPress={() => router.push(`/rentals/book?id=${item.id}` as any)}
          icon={<MaterialCommunityIcons name="calendar-check" size={18} color={COLORS.white} />}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: 250, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md, gap: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, flex: 1 },
  categoryBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  categoryText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  descriptionCard: { padding: SPACING.md },
  descriptionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  descriptionText: { fontSize: 14, color: COLORS.textSecondary },
  pricingCard: { padding: SPACING.md },
  pricingTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  pricingRow: { flexDirection: 'row', gap: SPACING.lg },
  priceItem: { alignItems: 'center', gap: 4 },
  priceValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  priceLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoCard: { gap: SPACING.sm },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  infoText: { fontSize: 13, color: COLORS.textSecondary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
});