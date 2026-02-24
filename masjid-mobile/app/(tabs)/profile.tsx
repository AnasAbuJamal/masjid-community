import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [prayerNotif, setPrayerNotif] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const menuItems = [
    { icon: 'account', title: 'My Profile', onPress: () => Alert.alert('My Profile', 'Coming soon!') },
    { icon: 'bell', title: 'Notifications', onPress: () => Alert.alert('Notifications', 'Coming soon!') },
    { icon: 'heart', title: 'Donation History', onPress: () => Alert.alert('Donations', 'Coming soon!') },
    { icon: 'clipboard-list', title: 'My Applications', onPress: () => Alert.alert('Applications', 'Coming soon!') },
    { icon: 'cog', title: 'Settings', onPress: () => Alert.alert('Settings', 'Coming soon!') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}><MaterialCommunityIcons name="account" size={48} color={COLORS.primary} /></View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </Card>
        <Card>
          <View style={styles.switchRow}><View style={styles.switchInfo}><MaterialCommunityIcons name="clock-alert" size={20} color={COLORS.primary} /><Text style={styles.switchLabel}>Prayer Reminders</Text></View><Switch value={prayerNotif} onValueChange={setPrayerNotif} /></View>
        </Card>
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={COLORS.primary} />
              <Text style={styles.menuText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><MaterialCommunityIcons name="logout" size={20} color={COLORS.error} /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  profileCard: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  userName: { fontSize: 22, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchInfo: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: 14, color: COLORS.text, marginLeft: 12 },
  menu: { backgroundColor: COLORS.surface, borderRadius: 12, marginTop: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  menuText: { flex: 1, fontSize: 16, color: COLORS.text, marginLeft: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: COLORS.error + '10', borderRadius: 12, marginTop: 16 },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error, marginLeft: 8 },
});
