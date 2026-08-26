import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

const AVAILABILITY_OPTIONS = [
  { status: 'Available', label: '🟢 Available for Shoot', sub: 'Ready to accept brand shoot requests' },
  { status: 'Busy', label: '🟡 Busy with Campaigns', sub: 'Currently working on active brand shoots' },
  { status: 'Unavailable', label: '🔴 Fully Booked / Vacation', sub: 'Not accepting new requests right now' },
];

export default function CreatorAvailabilityScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Available');

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/creator/availability');
      const data = res.data?.data || res.data || {};
      setSelectedStatus(data.status || 'Available');
    } catch (err) {
      console.warn('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleSaveStatus = async (status: string) => {
    setSelectedStatus(status);
    setSaving(true);
    try {
      await api.patch('/creator/availability', { status });
      Alert.alert('Status Updated', `Availability set to "${status}"`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update availability');
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
          <Text style={styles.headerTitle}>AVAILABILITY & SCHEDULE</Text>
          <Text style={styles.headerSub}>Control Your Booking Status</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>SELECT YOUR AVAILABILITY</Text>

        {AVAILABILITY_OPTIONS.map((opt) => {
          const active = selectedStatus === opt.status;
          return (
            <TouchableOpacity
              key={opt.status}
              style={[styles.statusCard, active && styles.statusCardActive]}
              onPress={() => handleSaveStatus(opt.status)}
              disabled={saving}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>{opt.label}</Text>
                <Text style={styles.statusSub}>{opt.sub}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={YELLOW} />}
            </TouchableOpacity>
          );
        })}
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
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  sectionTitle: { color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  statusCardActive: { borderColor: YELLOW, borderWidth: 2 },
  statusLabel: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  statusSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },
});
