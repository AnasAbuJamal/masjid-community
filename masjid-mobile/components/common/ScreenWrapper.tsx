import React from 'react';
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme-provider';
import { SPACING } from '../../constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  showBackground?: boolean;
  style?: ViewStyle;
  contentPadding?: boolean;
  bottomPadding?: boolean;
}

const TAB_BAR_HEIGHT = 56;

/** Shared responsive container for narrow phones, larger phones and tablets. */
export function ScreenWrapper({
  children,
  style,
  contentPadding = true,
  bottomPadding = true,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const padding = width >= 768 ? SPACING.xl : SPACING.md;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <View style={[
          styles.content,
          contentPadding && { paddingHorizontal: padding, paddingTop: SPACING.sm },
          bottomPadding && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + SPACING.md },
          style,
        ]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 1000, alignSelf: 'center' },
});

export { TAB_BAR_HEIGHT, SPACING };
