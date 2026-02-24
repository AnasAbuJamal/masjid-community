import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common';
import { COLORS } from '../../constants/theme';
import { communityService } from '../../services/api';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<'volunteers' | 'proposals'>('volunteers');
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => { communityService.getVolunteerOpportunities().then(setOpportunities); }, []);

  const handleApply = (opportunity: any) => {
    Alert.alert('Apply', `Apply for ${opportunity.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => Alert.alert('Success', 'Application submitted!') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.tab, activeTab === 'volunteers' && styles.tabActive]} onPress={() => setActiveTab('volunteers')}><Text style={[styles.tabText, activeTab === 'volunteers' && styles.tabTextActive]}>Volunteers</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'proposals' && styles.tabActive]} onPress={() => setActiveTab('proposals')}><Text style={[styles.tabText, activeTab === 'proposals' && styles.tabTextActive]}>Proposals</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'volunteers' ? (
          opportunities.map((opp) => (
            <Card key={opp.id}>
              <Text style={styles.cardTitle}>{opp.title}</Text>
              <Text style={styles.cardDesc}>{opp.description}</Text>
              <Text style={styles.spots}>{opp.spotsTotal - opp.spotsFilled} spots left</Text>
              <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(opp)}><Text style={styles.applyText}>Apply</Text></TouchableOpacity>
            </Card>
          ))
        ) : (
          <Card><Text style={styles.empty}>No proposals at this time</Text></Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.surface },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  content: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  spots: { fontSize: 14, color: COLORS.secondary, fontWeight: '500', marginTop: 8 },
  applyButton: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  applyText: { color: COLORS.white, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, paddingVertical: 16 },
});
