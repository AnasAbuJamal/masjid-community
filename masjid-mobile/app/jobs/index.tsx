import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';
import { jobService } from '../../services/api';

export default function JobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => { jobService.getAll().then(setJobs); }, []);

  const handleApply = (job: any) => {
    Alert.alert('Apply', `Apply for ${job.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => job.contactEmail && Linking.openURL(`mailto:${job.contactEmail}?subject=Application for ${job.title}`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Card><Text style={styles.empty}>No jobs available</Text></Card>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>{item.title}</Text>
              {item.isUrgent && <View style={styles.urgent}><Text style={styles.urgentText}>Urgent</Text></View>}
            </View>
            <Text style={styles.company}>{item.company}</Text>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(item)}><Text style={styles.applyText}>Apply Now</Text></TouchableOpacity>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1 },
  urgent: { backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  urgentText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  company: { fontSize: 14, color: COLORS.primary, marginTop: 4 },
  location: { fontSize: 12, color: COLORS.textSecondary },
  desc: { fontSize: 14, color: COLORS.text, marginTop: 8 },
  applyButton: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  applyText: { color: COLORS.white, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, paddingVertical: 16 },
});
