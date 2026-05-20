import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export function ScreenHeader({ title, showBack = false, rightAction }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity style={styles.rightButton} onPress={rightAction.onPress}>
            <MaterialCommunityIcons name={rightAction.icon as any} size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  rightButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
