import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 70;

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
  { name: 'settings', icon: 'cog-outline', iconActive: 'cog' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          height: TAB_BAR_HEIGHT + (insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 0)),
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 28 : 8),
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
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
