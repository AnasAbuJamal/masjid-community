import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenWrapper, FloatingIcon } from '../../components/common';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import apiService, { WorkerProfile } from '../../services/api-service';

const AVAILABILITY_CONFIG = {
  available: { label: 'Available', color: COLORS.success, icon: 'check-circle' },
  open_to_offers: { label: 'Open to Offers', color: COLORS.warning, icon: 'clock-outline' },
  not_available: { label: 'Not Available', color: COLORS.error, icon: 'close-circle' },
};

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadWorker();
  }, [id]);

  const loadWorker = async () => {
    setLoading(true);
    try {
      const data = await apiService.workers.getById(id);
      setWorker(data);
    } catch {
      setWorker(null);
    }
    setLoading(false);
  };

  const handleCall = () => {
    if (worker?.phone) {
      Linking.openURL(`tel:${worker.phone}`);
    }
  };

  const handleEmail = () => {
    if (worker?.email) {
      Linking.openURL(`mailto:${worker.email}?subject=Inquiry from Masjid App`);
    }
  };

  const handlePortfolio = () => {
    if (worker?.portfolioUrl) {
      Linking.openURL(worker.portfolioUrl);
    }
  };

  const handleContact = () => {
    if (!worker) return;
    Alert.alert(
      `Contact ${worker.fullName}`,
      'Choose how to reach out',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(worker.phone ? [{ text: 'Call', onPress: handleCall }] : []),
        ...(worker.email ? [{ text: 'Email', onPress: handleEmail }] : []),
      ].filter(Boolean) as any
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="account-off" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Worker not found</Text>
      </View>
    );
  }

  const avail = AVAILABILITY_CONFIG[worker.availability] || AVAILABILITY_CONFIG.not_available;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Worker Profile',
          headerStyle: { backgroundColor: COLORS.surfaceGlass },
          headerTintColor: COLORS.text,
          headerTransparent: false,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {worker.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{worker.fullName}</Text>
              <Text style={styles.headline}>{worker.headline}</Text>
              <View style={styles.availabilityBadge}>
                <MaterialCommunityIcons name={avail.icon as any} size={14} color={avail.color} />
                <Text style={[styles.availText, { color: avail.color }]}>{avail.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{worker.location}</Text>
            </View>
            <View style={[styles.metaItem, { backgroundColor: worker.status === 'approved' ? COLORS.success + '18' : COLORS.warning + '18' }]}>
              <MaterialCommunityIcons
                name={worker.status === 'approved' ? 'shield-check' : 'shield-outline'}
                size={14}
                color={worker.status === 'approved' ? COLORS.success : COLORS.warning}
              />
              <Text style={[styles.statusText, { color: worker.status === 'approved' ? COLORS.success : COLORS.warning }]}>
                {worker.status === 'approved' ? 'Verified' : worker.status}
              </Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>About</Text>
        <GlassCard>
          <Text style={styles.bio}>{worker.bio}</Text>
        </GlassCard>

        <Text style={styles.sectionTitle}>Skills</Text>
        <GlassCard>
          <View style={styles.skillsWrap}>
            {worker.skills.map(skill => (
              <View key={skill} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {worker.experience && worker.experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            <GlassCard>
              {(worker.experience || []).map((exp, i) => (
                <View key={i} style={[styles.expRow, i < (worker.experience?.length || 0) - 1 && styles.expRowBorder]}>
                  <View style={styles.expIcon}>
                    <MaterialCommunityIcons name="briefcase-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.expContent}>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                    <Text style={styles.expCompany}>{exp.company}</Text>
                    <Text style={styles.expDuration}>{exp.duration}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {worker.education && worker.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            <GlassCard>
              {(worker.education || []).map((edu, i) => (
                <View key={i} style={[styles.expRow, i < (worker.education?.length || 0) - 1 && styles.expRowBorder]}>
                  <View style={styles.expIcon}>
                    <MaterialCommunityIcons name="school-outline" size={18} color={COLORS.secondary} />
                  </View>
                  <View style={styles.expContent}>
                    <Text style={styles.expTitle}>{edu.degree}</Text>
                    <Text style={styles.expCompany}>{edu.institution}</Text>
                    <Text style={styles.expDuration}>{edu.year}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {worker.certifications && worker.certifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <GlassCard>
              {(worker.certifications || []).map((cert, i) => (
                <View key={i} style={[styles.certRow, i < (worker.certifications?.length || 0) - 1 && styles.expRowBorder]}>
                  <MaterialCommunityIcons name="certificate-outline" size={16} color={COLORS.warning} />
                  <Text style={styles.certText}>{cert}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <MaterialCommunityIcons name="phone" size={20} color={COLORS.white} />
            <Text style={styles.contactBtnText}>Contact Worker</Text>
          </TouchableOpacity>

          <View style={styles.contactActions}>
            {worker.phone && (
              <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
                <MaterialCommunityIcons name="phone-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            {worker.email && (
              <TouchableOpacity style={styles.iconBtn} onPress={handleEmail}>
                <MaterialCommunityIcons name="email-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            {worker.portfolioUrl && (
              <TouchableOpacity style={styles.iconBtn} onPress={handlePortfolio}>
                <MaterialCommunityIcons name="web" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.sm },
  errorText: { fontSize: 15, color: COLORS.error, marginTop: SPACING.sm },
  profileCard: { marginBottom: SPACING.sm },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  profileInfo: { flex: 1 },
  fullName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  headline: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginBottom: SPACING.xs },
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availText: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.sm, marginTop: SPACING.lg, marginLeft: SPACING.xs },
  bio: { fontSize: 15, color: COLORS.text, lineHeight: 24 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  skillBadge: { backgroundColor: COLORS.primary + '18', paddingHorizontal: SPACING.sm + 4, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full },
  skillText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  expRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.sm },
  expRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  expIcon: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  expContent: { flex: 1 },
  expTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  expCompany: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  expDuration: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  certText: { fontSize: 14, color: COLORS.text },
  contactSection: { marginTop: SPACING.xl, gap: SPACING.md },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, gap: SPACING.sm },
  contactBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  contactActions: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  iconBtn: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
});
