import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { COLORS } from '../../constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
      <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileSkeleton}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width="50%" height={20} style={{ marginTop: 16 }} />
      <Skeleton width="30%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
  },
  cardSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  profileSkeleton: {
    alignItems: 'center',
    padding: 24,
  },
});
