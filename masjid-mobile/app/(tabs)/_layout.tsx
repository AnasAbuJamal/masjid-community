import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useTheme } from '../../constants/theme-provider';

const TAB_BAR_HEIGHT = 56;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabConfig {
  name: string;
  icon: IconName;
  iconActive: IconName;
}

const TABS: TabConfig[] = [
  { name: 'index', icon: 'home-outline', iconActive: 'home' },
  { name: 'prayers', icon: 'clock-outline', iconActive: 'clock' },
  { name: 'school', icon: 'school-outline', iconActive: 'school' },
  { name: 'community', icon: 'account-group-outline', iconActive: 'account-group' },
  { name: 'profile', icon: 'account-outline', iconActive: 'account' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {TABS.map(({ name, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={styles.activeIndicator} />}
                <MaterialCommunityIcons name={focused ? iconActive : icon} size={24} color={color} />
              </View>
            ),
          }}
        />
      ))}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
