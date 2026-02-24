import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.textSecondary, tabBarStyle: { backgroundColor: COLORS.surface, height: 60, paddingBottom: 8, paddingTop: 8 }, headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: COLORS.white }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} />, headerTitle: 'Masjid Al-Momineen' }} />
      <Tabs.Screen name="prayers" options={{ title: 'Prayers', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clock-outline" size={size} color={color} />, headerTitle: 'Prayer Times' }} />
      <Tabs.Screen name="school" options={{ title: 'School', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="school" size={size} color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Community', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} /> }} />
    </Tabs>
  );
}
