import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl?: string;
  organizer: string;
  category: string;
  attendees: number;
  isRegistered: boolean;
}

const MOCK_EVENT: Event = {
  id: '1',
  title: 'Ramadan Iftar Program',
  description: 'Join us for a blessed iftar experience. We will be serving iftar meals to the community. All are welcome to attend and participate in this spiritual gathering.\n\nHighlights:\n- Complete iftar meal\n- Quran recitation\n- Spiritual reflection\n- Community bonding',
  date: '2026-03-15',
  time: '6:30 PM',
  location: 'Masjid Al-Momineen Main Hall',
  organizer: 'Masjid Committee',
  category: 'religious',
  attendees: 85,
  isRegistered: false,
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    setEvent(MOCK_EVENT);
  }, [id]);

  const handleRegister = () => {
    if (!event) return;
    
    Alert.alert(
      'Register for Event',
      `Would you like to register for "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: () => {
            setRegistering(true);
            setTimeout(() => {
              setEvent(prev => prev ? { ...prev, isRegistered: true, attendees: prev.attendees + 1 } : null);
              setRegistering(false);
              Alert.alert('Success!', 'You have registered for this event.');
            }, 1000);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Join us for "${event.title}" on ${event.date} at ${event.time} at ${event.location}`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Image Placeholder */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="calendar-star" size={64} color={COLORS.primary} />
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.infoSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{formatDate(event.date)}</Text>
          </View>
          
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{event.time}</Text>
          </View>
          
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{event.location}</Text>
          </View>
          
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="account-group" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{event.attendees} attending</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Organizer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar}>
              <MaterialCommunityIcons name="account-tie" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.organizerName}>{event.organizer}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Register Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, event.isRegistered && styles.registeredButton]}
          onPress={handleRegister}
          disabled={event.isRegistered || registering}
        >
          <MaterialCommunityIcons 
            name={event.isRegistered ? 'check' : 'calendar-plus'} 
            size={20} 
            color={COLORS.white} 
          />
          <Text style={styles.registerText}>
            {registering 
              ? 'Registering...' 
              : event.isRegistered 
                ? 'Registered' 
                : 'Register for Event'}
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 200,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
  },
  categoryBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  infoSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  metaText: {
    fontSize: 15,
    color: COLORS.text,
  },
  section: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  registeredButton: {
    backgroundColor: COLORS.success,
  },
  registerText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
