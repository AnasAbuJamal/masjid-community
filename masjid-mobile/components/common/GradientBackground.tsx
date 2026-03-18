import React from 'react';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, DIMENSIONS } from '../../constants/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  showPattern?: boolean;
}

export function GradientBackground({ 
  children, 
  showPattern = true,
}: GradientBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={[
          COLORS.backgroundGradientStart,
          COLORS.backgroundGradientEnd,
          '#D6EEFF',
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
      
      {/* Soft background pattern/blur */}
      {showPattern && (
        <>
          <View style={styles.orb1} />
          <View style={styles.orb2} />
          <View style={styles.orb3} />
        </>
      )}
      
      {/* Gradient overlay for readability */}
      <LinearGradient
        colors={[
          'rgba(248, 250, 252, 0.85)',
          'rgba(232, 244, 253, 0.9)',
          'rgba(214, 238, 255, 0.95)',
        ]}
        locations={[0, 0.6, 1]}
        style={styles.overlay}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orb1: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    transform: [{ scaleX: 1.5 }],
  },
  orb2: {
    position: 'absolute',
    top: 100,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  orb3: {
    position: 'absolute',
    bottom: -50,
    left: width * 0.3,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(109, 213, 237, 0.12)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
