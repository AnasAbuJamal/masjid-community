import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Card><Text style={styles.title}>Announcement {id}</Text><Text style={styles.desc}>Announcement details will appear here.</Text></Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 16 },
  back: { fontSize: 16, color: COLORS.primary },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
