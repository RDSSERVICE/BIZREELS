import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function CreatorPricingScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reel1, setReel1] = useState('');
  const [reel3, setReel3] = useState('');
  const [reel10, setReel10] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [dayRate, setDayRate] = useState('');

  const fetchPricing = async () => {
    try {
      const res = await api.get('/creator/pricing');
      const data = res.data?.data || res.data || {};
      setReel1(String(data.reel1 || ''));
      setReel3(String(data.reel3 || ''));
      setReel10(String(data.reel10 || ''));
      setHourlyRate(String(data.hourlyRate || ''));
      setDayRate(String(data.dayRate || ''));
    } catch (err) {
      console.warn('Failed to load pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await api.patch('/creator/pricing', {
        reel1: Number(reel1) || 0,
        reel3: Number(reel3) || 0,
        reel10: Number(reel10) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        dayRate: Number(dayRate) || 0,
      });
      Alert.alert('Success', 'Creator rate packages saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>PRICING & PACKAGES</Text>
          <Text style={styles.headerSub}>Set Your Brand Collaboration Rates</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video Reel Shoot Packages</Text>
          <Text style={styles.cardSub}>Set custom prices for vendors to hire you per video deliverable.</Text>

          <Text style={styles.label}>1 Video Reel Rate (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1500"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            value={reel1}
            onChangeText={setReel1}
          />

          <Text style={styles.label}>3 Video Reels Combo Rate (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4000"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            value={reel3}
            onChangeText={setReel3}
          />

          <Text style={styles.label}>10 Video Reels Campaign Combo (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12000"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            value={reel10}
            onChangeText={setReel10}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>On-Site Shoot Rates</Text>
          <Text style={styles.cardSub}>Set hourly or full-day shoot rates for store visits and event coverage.</Text>

          <Text style={styles.label}>Hourly Shoot Rate (₹/hr)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 800"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            value={hourlyRate}
            onChangeText={setHourlyRate}
          />

          <Text style={styles.label}>Full Day Shoot Rate (₹/day)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5000"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            value={dayRate}
            onChangeText={setDayRate}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePricing} disabled={saving}>
          {saving ? <ActivityIndicator color={BLACK} /> : <Text style={styles.saveBtnText}>Save Creator Rates</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  loadingContainer: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  card: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.two },
  cardTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900' },
  cardSub: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, marginBottom: 4 },
  label: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700', marginTop: 4 },
  input: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
  saveBtn: { backgroundColor: YELLOW, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900' },
});
