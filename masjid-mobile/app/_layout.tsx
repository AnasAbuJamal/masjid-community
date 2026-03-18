import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { ThemeProvider, useTheme } from '../constants/theme-provider';
import { COLORS } from '../constants/theme';
import notificationService from '../services/notification-service';

function RootLayoutContent() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { initialize: initSettings } = useSettingsStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initialize();
    initSettings();
    notificationService.initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack 
          screenOptions={{ 
            headerShown: false, 
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          {isAuthenticated ? (
            <Stack.Screen name="(tabs)" />
          ) : (
            <Stack.Screen name="(auth)" />
          )}
          <Stack.Screen
            name="donate"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="announcements/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Announcement',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="jobs/index"
            options={{
              headerShown: true,
              headerTitle: 'Job Board',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="proposals/index"
            options={{
              headerShown: true,
              headerTitle: 'Proposals',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="proposals/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="workers/index"
            options={{
              headerShown: true,
              headerTitle: 'Workers',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              headerTitle: 'Notifications',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="jobs/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Job Details',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="jobs/saved"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="prayers/calendar"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="prayers/qibla"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="events/index"
            options={{
              headerShown: true,
              headerTitle: 'Events',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="events/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="donations/history"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="donations/recurring"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="donations/receipts"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="school/attendance"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="school/grades"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="proposals/voting"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="kiosk"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="blog/index"
            options={{
              headerShown: true,
              headerTitle: 'News',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="blog/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="construction/index"
            options={{
              headerShown: true,
              headerTitle: 'Construction',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="school/leaderboard"
            options={{
              headerShown: true,
              headerTitle: 'Leaderboard',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="school/classes/index"
            options={{
              headerShown: true,
              headerTitle: 'Classes',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="school/classes/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="school/schedule"
            options={{
              headerShown: true,
              headerTitle: 'Class Schedule',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="school/attendance-checkin"
            options={{
              headerShown: true,
              headerTitle: 'Attendance',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/index"
            options={{
              headerShown: true,
              headerTitle: 'Admin Dashboard',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/settings"
            options={{
              headerShown: true,
              headerTitle: 'Admin Settings',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/users"
            options={{
              headerShown: true,
              headerTitle: 'User Management',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/audit-logs"
            options={{
              headerShown: true,
              headerTitle: 'Audit Logs',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/jobs"
            options={{
              headerShown: true,
              headerTitle: 'Job Management',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/announcements"
            options={{
              headerShown: true,
              headerTitle: 'Create Announcement',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="admin/volunteers"
            options={{
              headerShown: true,
              headerTitle: 'Volunteer Applications',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="finances/index"
            options={{
              headerShown: true,
              headerTitle: 'Finances',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="workers/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="applications/index"
            options={{
              headerShown: true,
              headerTitle: 'My Applications',
              headerStyle: { backgroundColor: colors.surfaceGlass },
              headerTintColor: colors.text,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="jobs/apply/[id]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
