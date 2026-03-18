import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  showBackground?: boolean;
  style?: ViewStyle;
  contentPadding?: boolean;
  bottomPadding?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 70;

export function ScreenWrapper({
  children,
  showBackground = true,
  style,
  contentPadding = true,
  bottomPadding = true,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const contentStyle = [
    styles.content,
    contentPadding && styles.contentPadding,
    bottomPadding && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + SPACING.md },
    style,
  ];

  if (!showBackground) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#D6EEFF']}
        locations={[0, 0.5, 1]}
        style={styles.background}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />
      <View style={styles.overlay} />
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  background: { ...StyleSheet.absoluteFillObject },
  orb1: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 144, 217, 0.12)',
    transform: [{ scaleX: 1.5 }],
  },
  orb2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
  },
  orb3: {
    position: 'absolute',
    bottom: -50,
    left: '30%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(109, 213, 237, 0.1)',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 250, 252, 0.85)' },
  contentContainer: { flex: 1, zIndex: 1 },
  content: { flex: 1 },
  contentPadding: { padding: SPACING.md },
});

export { TAB_BAR_HEIGHT, SPACING };
