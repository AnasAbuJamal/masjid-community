import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="donate"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="announcements/[id]"
                options={{
                  headerShown: true,
                  headerTitle: 'Announcement',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white,
                }}
              />
              <Stack.Screen
                name="jobs/index"
                options={{
                  headerShown: true,
                  headerTitle: 'Job Board',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white,
                }}
              />
              <Stack.Screen
                name="proposals/index"
                options={{
                  headerShown: true,
                  headerTitle: 'Proposals',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white,
                }}
              />
              <Stack.Screen
                name="workers/index"
                options={{
                  headerShown: true,
                  headerTitle: 'Workers',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white,
                }}
              />
            </>
          ) : (
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
