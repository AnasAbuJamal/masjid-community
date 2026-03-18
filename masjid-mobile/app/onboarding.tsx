import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Masjid Al-Momineen',
    description: 'Stay connected with your community, track prayer times, and access Islamic education resources all in one place.',
    icon: 'mosque',
    iconColor: COLORS.primary,
  },
  {
    id: '2',
    title: 'Prayer Times',
    description: 'Never miss a prayer. Get accurate prayer times and daily notifications for all five daily prayers.',
    icon: 'clock-outline',
    iconColor: COLORS.secondary,
  },
  {
    id: '3',
    title: 'Community & Volunteers',
    description: 'Join our community events, sign up to volunteer, and participate in making a difference.',
    icon: 'account-group-outline',
    iconColor: COLORS.accent,
  },
  {
    id: '4',
    title: 'Donate Easily',
    description: 'Support the mosque with secure online donations. Track your giving and see the impact.',
    icon: 'heart-outline',
    iconColor: COLORS.error,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@masjid:onboarding_complete', 'true');
    router.replace('/(auth)/login');
  };

  const renderItem = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
        <MaterialCommunityIcons name={item.icon as any} size={80} color={item.iconColor} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {renderDots()}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <MaterialCommunityIcons 
            name={currentIndex === SLIDES.length - 1 ? 'arrow-right' : 'arrow-right'} 
            size={20} 
            color={COLORS.white} 
          />
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
  skipButton: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.md,
    zIndex: 10,
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl * 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});
