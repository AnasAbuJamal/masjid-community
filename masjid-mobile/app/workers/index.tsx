import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const WORKERS = [
  {
    id: '1',
    name: 'Muhammad Al-Farsi',
    trade: 'Electrician',
    rating: 4.8,
    jobsDone: 12,
    phone: '+1-555-0101',
    available: true,
    location: 'Atlanta, GA',
  },
  {
    id: '2',
    name: 'Ibrahim Khalil',
    trade: 'Plumber',
    rating: 4.6,
    jobsDone: 8,
    phone: '+1-555-0102',
    available: true,
    location: 'Marietta, GA',
  },
  {
    id: '3',
    name: 'Yusuf Osman',
    trade: 'Carpenter',
    rating: 5.0,
    jobsDone: 20,
    phone: '+1-555-0103',
    available: false,
    location: 'Smyrna, GA',
  },
];

export default function WorkersScreen() {
  const [workers] = useState(WORKERS);

  const handleContact = (worker: (typeof WORKERS)[0]) => {
    Alert.alert(
      `Contact ${worker.name}`,
      'How would you like to reach out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${worker.phone}`),
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <View style={styles.stars}>
        {[...Array(full)].map((_, i) => (
          <MaterialCommunityIcons key={i} name="star" size={14} color={COLORS.accent} />
        ))}
        {half && (
          <MaterialCommunityIcons name="star-half-full" size={14} color={COLORS.accent} />
        )}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            Community-vetted contractors available for hire
          </Text>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.workerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{item.name}</Text>
                <Text style={styles.workerTrade}>{item.trade}</Text>
                {renderStars(item.rating)}
              </View>
              <View
                style={[
                  styles.availBadge,
                  {
                    backgroundColor: item.available
                      ? COLORS.secondary + '18'
                      : COLORS.error + '18',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.availText,
                    { color: item.available ? COLORS.secondary : COLORS.error },
                  ]}
                >
                  {item.available ? 'Available' : 'Busy'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="briefcase-check-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.statText}>{item.jobsDone} jobs done</Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.statText}>{item.location}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.contactButton,
                !item.available && styles.contactButtonDisabled,
              ]}
              onPress={() => handleContact(item)}
              disabled={!item.available}
            >
              <MaterialCommunityIcons
                name="phone-outline"
                size={16}
                color={item.available ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.contactText,
                  !item.available && styles.contactTextDisabled,
                ]}
              >
                Contact
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  workerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  workerTrade: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginBottom: 4 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  availBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  availText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm + 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: COLORS.textSecondary },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
    ...SHADOWS.sm,
  },
  contactButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  contactText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  contactTextDisabled: { color: COLORS.textSecondary },
});
