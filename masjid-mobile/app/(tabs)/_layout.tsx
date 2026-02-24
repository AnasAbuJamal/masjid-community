import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { COLORS } from '../../constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IconName;
  iconActive: IconName;
  headerTitle: string;
}

const TABS: TabConfig[] = [
  {
    name: 'index',
    title: 'Home',
    icon: 'home-outline',
    iconActive: 'home',
    headerTitle: 'Masjid Al-Momineen',
  },
  {
    name: 'prayers',
    title: 'Prayers',
    icon: 'clock-outline',
    iconActive: 'clock',
    headerTitle: 'Prayer Times',
  },
  {
    name: 'school',
    title: 'School',
    icon: 'school-outline',
    iconActive: 'school',
    headerTitle: 'Islamic School',
  },
  {
    name: 'community',
    title: 'Community',
    icon: 'account-group-outline',
    iconActive: 'account-group',
    headerTitle: 'Community',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'account-outline',
    iconActive: 'account',
    headerTitle: 'My Profile',
  },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowColor: COLORS.text,
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      {TABS.map(({ name, title, icon, iconActive, headerTitle }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            headerTitle,
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? iconActive : icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
