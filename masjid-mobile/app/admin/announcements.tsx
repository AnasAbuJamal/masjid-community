import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const ANNOUNCEMENT_TYPES = [
  { key: 'general', label: 'General', icon: 'bullhorn', color: COLORS.primary },
  { key: 'urgent', label: 'Urgent', icon: 'alert-circle', color: COLORS.error },
  { key: 'event', label: 'Event', icon: 'calendar-star', color: COLORS.success },
  { key: 'ramadan', label: 'Ramadan', icon: 'star-crescent', color: COLORS.secondary },
  { key: 'fundraiser', label: 'Fundraiser', icon: 'heart', color: COLORS.warning },
];

const PRIORITIES = [
  { key: 'low', label: 'Low', color: COLORS.textSecondary },
  { key: 'normal', label: 'Normal', color: COLORS.primary },
  { key: 'high', label: 'High', color: COLORS.error },
];

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [scheduleLater, setScheduleLater] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [saving, setSaving] = useState(false);

  const handlePublish = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        'Success!',
        scheduleLater 
          ? 'Announcement has been scheduled.' 
          : 'Announcement has been published.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1000);
  };

  const selectedTypeData = ANNOUNCEMENT_TYPES.find(t => t.key === type);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Announcement</Text>
        <TouchableOpacity 
          style={[styles.saveButton, (!title.trim() || !message.trim()) && styles.saveButtonDisabled]}
          onPress={handlePublish}
          disabled={!title.trim() || !message.trim() || saving}
        >
          <Text style={styles.saveText}>{saving ? 'Publishing...' : 'Publish'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.typeGrid}>
            {ANNOUNCEMENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeCard,
                  type === t.key && { backgroundColor: t.color + '18', borderColor: t.color }
                ]}
                onPress={() => setType(t.key)}
              >
                <View style={[styles.typeIcon, { backgroundColor: t.color + '18' }]}>
                  <MaterialCommunityIcons name={t.icon as any} size={20} color={t.color} />
                </View>
                <Text style={[styles.typeLabel, type === t.key && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.priorityButton,
                  priority === p.key && { backgroundColor: p.color + '18', borderColor: p.color }
                ]}
                onPress={() => setPriority(p.key)}
              >
                <Text style={[styles.priorityText, priority === p.key && { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter announcement title..."
            placeholderTextColor={COLORS.textSecondary}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Write your announcement message..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={[styles.previewBadge, { backgroundColor: selectedTypeData?.color + '18' }]}>
              <MaterialCommunityIcons name={selectedTypeData?.icon as any} size={14} color={selectedTypeData?.color} />
              <Text style={[styles.previewBadgeText, { color: selectedTypeData?.color }]}>{selectedTypeData?.label}</Text>
            </View>
            <Text style={styles.previewTitle}>{title || 'Title here'}</Text>
            <Text style={styles.previewMessage} numberOfLines={3}>
              {message || 'Your message will appear here...'}
            </Text>
            <View style={styles.previewMeta}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.previewMetaText}>
                {scheduleLater ? 'Scheduled for later' : 'Publishing now'}
              </Text>
            </View>
          </View>
        </View>

        {/* Schedule Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publishing</Text>
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => { setPublishNow(!publishNow); setScheduleLater(false); }}
          >
            <View style={styles.optionContent}>
              <MaterialCommunityIcons name="send" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.optionTitle}>Publish Now</Text>
                <Text style={styles.optionSubtitle}>Immediately visible to all users</Text>
              </View>
            </View>
            <View style={[styles.radio, publishNow && styles.radioSelected]}>
              {publishNow && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => { setScheduleLater(true); setPublishNow(false); }}
          >
            <View style={styles.optionContent}>
              <MaterialCommunityIcons name="clock" size={20} color={COLORS.secondary} />
              <View>
                <Text style={styles.optionTitle}>Schedule for Later</Text>
                <Text style={styles.optionSubtitle}>Choose date and time to publish</Text>
              </View>
            </View>
            <View style={[styles.radio, scheduleLater && styles.radioSelected]}>
              {scheduleLater && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Kiosk Option */}
        <View style={styles.section}>
          <View style={styles.optionRow}>
            <View style={styles.optionContent}>
              <MaterialCommunityIcons name="television-play" size={20} color={COLORS.warning} />
              <View>
                <Text style={styles.optionTitle}>Show on Kiosk/TV</Text>
                <Text style={styles.optionSubtitle}>Display on mosque TV screens</Text>
              </View>
            </View>
            <View style={[styles.radio, styles.radioActive]}>
              <MaterialCommunityIcons name="check" size={12} color={COLORS.white} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  saveButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.md },
  saveButtonDisabled: { backgroundColor: COLORS.border },
  saveText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeCard: { width: '18%', aspectRatio: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent', ...SHADOWS.sm },
  typeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  typeLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },

  priorityRow: { flexDirection: 'row', gap: SPACING.sm },
  priorityButton: { flex: 1, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  priorityText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  titleInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: 16, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  charCount: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'right', marginTop: 4 },

  messageInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border, minHeight: 150 },

  previewCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  previewBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, gap: 4, marginBottom: SPACING.sm },
  previewBadgeText: { fontSize: 11, fontWeight: '700' },
  previewTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  previewMessage: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewMetaText: { fontSize: 11, color: COLORS.textSecondary },

  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  optionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  optionSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  radioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
});