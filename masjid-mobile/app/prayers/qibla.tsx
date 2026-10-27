import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { qiblaBearing, cardinalDirection } from '../../utils/qibla';

const SAVED_COORDINATES = '@masjid:qibla:observer-coordinates';
interface Coordinates { latitude: number; longitude: number }

export default function QiblaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SAVED_COORDINATES).then(saved => {
      if (!active || !saved) return;
      const coords = JSON.parse(saved) as Coordinates;
      qiblaBearing(coords.latitude, coords.longitude);
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
      setLocation(coords);
    }).catch(() => undefined).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const saveLocation = async () => {
    const lat = Number(latitude.trim());
    const lon = Number(longitude.trim());
    if (!latitude.trim() || !longitude.trim()) {
      Alert.alert('Enter your coordinates', 'Enter your latitude and longitude from your device maps.');
      return;
    }
    try {
      qiblaBearing(lat, lon);
      const coords = { latitude: lat, longitude: lon };
      setLocation(coords);
      await AsyncStorage.setItem(SAVED_COORDINATES, JSON.stringify(coords));
    } catch {
      Alert.alert('Invalid coordinates', 'Latitude must be between −90° and 90°; longitude between −180° and 180°.');
    }
  };

  let bearing: number | null = null;
  if (location) {
    try { bearing = qiblaBearing(location.latitude, location.longitude); }
    catch { bearing = null; }
  }
  const compassSize = Math.min(300, Math.max(210, width - 90));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qibla Direction</Text>
        <View style={styles.back} />
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} size="large" /> : (
        <ScrollView contentContainerStyle={styles.content}>
          <MaterialCommunityIcons name="compass-outline" size={38} color={COLORS.primary} />
          <Text style={styles.title}>Find the Qibla</Text>
          <Text style={styles.description}>
            Enter your current latitude and longitude to calculate the direction of the Kaaba.
            Your coordinates stay on this device.
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Latitude (degrees)</Text>
              <TextInput accessibilityLabel="Latitude" style={styles.input}
                value={latitude} onChangeText={setLatitude}
                keyboardType="numbers-and-punctuation" autoCapitalize="none"
                placeholder="e.g. 40.7128" placeholderTextColor={COLORS.textSecondary} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Longitude (degrees)</Text>
              <TextInput accessibilityLabel="Longitude" style={styles.input}
                value={longitude} onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation" autoCapitalize="none"
                placeholder="e.g. −74.0060" placeholderTextColor={COLORS.textSecondary} />
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.calculate}
              onPress={() => { void saveLocation(); }}>
              <Text style={styles.calculateText}>Calculate Qibla</Text>
            </TouchableOpacity>
          </View>

          {bearing !== null ? (
            <View style={styles.result}>
              <Text style={styles.resultTitle}>Qibla from geographic north</Text>
              <Text style={styles.degrees}>{bearing.toFixed(1)}°</Text>
              <Text style={styles.cardinal}>{cardinalDirection(bearing)}</Text>
              <View style={[styles.compass, { width: compassSize, height: compassSize,
                borderRadius: compassSize / 2 }]}>
                <Text style={styles.north}>N</Text>
                <Text style={styles.south}>S</Text>
                <Text style={styles.east}>E</Text>
                <Text style={styles.west}>W</Text>
                <View style={{ transform: [{ rotate: `${bearing}deg` }] }}>
                  <MaterialCommunityIcons name="arrow-up-bold" size={96} color={COLORS.primary} />
                </View>
              </View>
              <Text style={styles.note}>
                The arrow is fixed relative to true north; it is not a live compass. Use a physical
                compass, map, or your device compass (adjusted for true north) to orient yourself.
                This app does not have access to live location or compass sensors.
              </Text>
            </View>
          ) : <Text style={styles.note}>
            You can find your coordinates in a map app by selecting your current location.
            No location permission or continuous tracking is required.
          </Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.sm, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border, borderBottomWidth: 1 },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontWeight: '700', fontSize: 18 },
  loader: { flex: 1 },
  content: { alignItems: 'center', maxWidth: 680, width: '100%',
    alignSelf: 'center', padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  description: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.lg },
  form: { width: '100%', backgroundColor: COLORS.surface, padding: SPACING.md,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.md },
  field: { gap: 6 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  input: { minHeight: 48, borderColor: COLORS.border, borderWidth: 1,
    paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.background,
    fontSize: 16, color: COLORS.text },
  calculate: { minHeight: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center' },
  calculateText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  result: { alignItems: 'center', width: '100%', marginTop: SPACING.xl },
  resultTitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  degrees: { fontSize: 46, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  cardinal: { fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.lg },
  compass: { backgroundColor: COLORS.surface, borderWidth: 4,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  north: { position: 'absolute', top: 10, fontSize: 17, fontWeight: '700', color: COLORS.text },
  south: { position: 'absolute', bottom: 10, fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  east: { position: 'absolute', right: 12, fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  west: { position: 'absolute', left: 12, fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  note: { fontSize: 13, lineHeight: 21, textAlign: 'center', color: COLORS.textSecondary,
    marginTop: SPACING.lg, maxWidth: 550 },
});
