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
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'religious' | 'educational' | 'community' | 'youth' | 'family';
  attendees: number;
  isRegistered: boolean;
}

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Ramadan Iftar Program',
    description: 'Join us for a blessed iftar experience with complete iftar meals, Quran recitation, and community bonding.',
    date: '2026-03-18',
    time: '6:30 PM',
    location: 'Main Prayer Hall',
    category: 'religious',
    attendees: 85,
    isRegistered: false,
  },
  {
    id: '2',
    title: 'Youth Islamic Quiz Night',
    description: 'Test your knowledge of Islamic history and Quran in a fun competitive environment. Prizes for winners!',
    date: '2026-03-20',
    time: '7:00 PM',
    location: 'Youth Center',
    category: 'youth',
    attendees: 45,
    isRegistered: false,
  },
  {
    id: '3',
    title: "Women's Circle: Ramadan Reflections",
    description: 'A spiritual gathering for sisters to discuss the benefits of Ramadan and share meaningful experiences.',
    date: '2026-03-21',
    time: '10:00 AM',
    location: "Women's Lounge",
    category: 'family',
    attendees: 30,
    isRegistered: false,
  },
  {
    id: '4',
    title: 'Quran Memorization Workshop',
    description: 'Learn effective techniques for memorizing and retaining Quranic verses. Open to all ages.',
    date: '2026-03-22',
    time: '9:00 AM',
    location: 'Islamic School Rooms',
    category: 'educational',
    attendees: 25,
    isRegistered: false,
  },
  {
    id: '5',
    title: 'Community Cleanup Day',
    description: 'Help maintain our mosque grounds and surrounding area. Refreshments provided for all volunteers.',
    date: '2026-03-25',
    time: '8:00 AM',
    location: 'Masjid Grounds',
    category: 'community',
    attendees: 40,
    isRegistered: false,
  },
  {
    id: '6',
    title: 'Eid al-Fitr Preparation Meeting',
    description: 'Organizing committee meeting for Eid celebrations. All volunteers welcome to attend.',
    date: '2026-03-28',
    time: '6:00 PM',
    location: 'Conference Room',
    category: 'religious',
    attendees: 20,
    isRegistered: false,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Events', icon: 'calendar-multiple' },
  { key: 'religious', label: 'Religious', icon: 'mosque' },
  { key: 'educational', label: 'Education', icon: 'school' },
  { key: 'community', label: 'Community', icon: 'account-group' },
  { key: 'youth', label: 'Youth', icon: 'account-star' },
  { key: 'family', label: 'Family', icon: 'home-heart' },
];

export default function EventsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setTimeout(() => {
      setEvents(MOCK_EVENTS);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(e => e.category === selectedCategory);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'religious': return COLORS.primary;
      case 'educational': return COLORS.secondary;
      case 'community': return COLORS.success;
      case 'youth': return COLORS.accent;
      case 'family': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Events</Text>
        <Text style={styles.pageSubtitle}>Upcoming activities & programs</Text>
      </View>

      <View style={styles.categorySection}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item.key && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <MaterialCommunityIcons 
                name={item.icon as any} 
                size={16} 
                color={selectedCategory === item.key ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.categoryText, selectedCategory === item.key && styles.categoryTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  const renderEvent = ({ item }: { item: Event }) => {
    const catColor = getCategoryColor(item.category);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/events/[id]' as any, params: { id: item.id } })}
      >
        <GlassCard style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
              <MaterialCommunityIcons name={(
                item.category === 'religious' ? 'mosque' :
                item.category === 'educational' ? 'school' :
                item.category === 'community' ? 'account-group' :
                item.category === 'youth' ? 'account-star' : 'home-heart'
              ) as any} size={12} color={catColor} />
              <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            {item.isRegistered && (
              <View style={styles.registeredBadge}>
                <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} />
                <Text style={styles.registeredText}>Registered</Text>
              </View>
            )}
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>

          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
            <View style={styles.attendeesRow}>
              <MaterialCommunityIcons name="account-group-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.attendeesText}>{item.attendees} attending</Text>
            </View>
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
            icon={<MaterialCommunityIcons name="calendar-blank" size={32} color={COLORS.textSecondary} />} 
            size="lg" 
            color={COLORS.textSecondary} 
          />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptySubtext}>Check back soon for upcoming events</Text>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <ScreenWrapper contentPadding={false} bottomPadding={false}>
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  pageSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  categorySection: { paddingBottom: SPACING.sm },
  categoryList: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  categoryChip: { 
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
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  categoryTextActive: { color: COLORS.white },

  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },

  eventCard: { padding: SPACING.md, gap: SPACING.sm },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, gap: 4 },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  registeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  registeredText: { fontSize: 11, fontWeight: '600', color: COLORS.success },

  eventTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  eventDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  
  eventMeta: { flexDirection: 'row', gap: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },

  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: COLORS.textSecondary },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeesText: { fontSize: 12, color: COLORS.textSecondary },

  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  centeredContent: { alignItems: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});