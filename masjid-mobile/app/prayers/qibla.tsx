import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const QIBLA_DIRECTION = 45; // Approximate direction to Mecca from Atlanta

export default function QiblaScreen() {
  const router = useRouter();
  const [heading, setHeading] = useState(0);
  const [rotation] = useState(new Animated.Value(0));

  useEffect(() => {
    const timer = setInterval(() => {
      setHeading(prev => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const diff = heading - QIBLA_DIRECTION;
    Animated.timing(rotation, {
      toValue: -diff,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [heading]);

  const rotate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qibla Direction</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>
          Point your phone towards the Kaaba
        </Text>

        <View style={styles.compassContainer}>
          <Animated.View style={[styles.compass, { transform: [{ rotate }] }]}>
            <View style={styles.compassRing}>
              <View style={styles.compassNorth}>
                <Text style={styles.compassLetter}>N</Text>
              </View>
              <View style={[styles.compassEast, styles.compassCardinal]}>
                <Text style={styles.compassLetter}>E</Text>
              </View>
              <View style={[styles.compassSouth, styles.compassCardinal]}>
                <Text style={styles.compassLetter}>S</Text>
              </View>
              <View style={[styles.compassWest, styles.compassCardinal]}>
                <Text style={styles.compassLetter}>W</Text>
              </View>
              
              {/* Kaaba indicator */}
              <View style={styles.kaabaIndicator}>
                <MaterialCommunityIcons name="mosque" size={32} color={COLORS.secondary} />
              </View>
            </View>
          </Animated.View>

          {/* Center info */}
          <View style={styles.centerInfo}>
            <Text style={styles.degreeText}>{heading}°</Text>
            <Text style={styles.directionText}>{getCompassDirection(heading)}</Text>
          </View>
        </View>

        <View style={styles.qiblaInfo}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="compass" size={24} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Qibla</Text>
            <Text style={styles.infoValue}>{QIBLA_DIRECTION}° NE</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.secondary} />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>Atlanta, GA</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Note: Enable location services for accurate direction
        </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { width: 40 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  compassContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compass: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    borderWidth: 8,
    borderColor: COLORS.primary + '30',
  },
  compassRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  compassNorth: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassEast: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
  },
  compassSouth: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -10,
  },
  compassWest: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -10,
  },
  compassCardinal: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  kaabaIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
  },
  centerInfo: {
    position: 'absolute',
    alignItems: 'center',
  },
  degreeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  directionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  qiblaInfo: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    width: 140,
    ...SHADOWS.sm,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
});
