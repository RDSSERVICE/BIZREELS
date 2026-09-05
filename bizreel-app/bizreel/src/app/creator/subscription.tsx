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

interface Plan {
  id: string;
  name: string;
  price: number;
  boostCredits: number;
  features: string[];
}

export default function CreatorSubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [subscribing, setSubscribing] = useState(false);

  const fetchSubscription = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/subscription/my-subscription').catch(() => ({ data: null })),
        api.get('/subscription/plans?role=creator').catch(() => ({ data: null })),
      ]);

      const subData = subRes.data?.data || subRes.data || {};
      setCurrentPlan(subData.plan || 'free');

      const planItems = plansRes.data?.data?.items || plansRes.data?.items || plansRes.data?.data || [];
      if (Array.isArray(planItems)) {
        setDbPlans(
          planItems.filter((p: any) => {
            if (!p.is_active || p.is_archived) return false;
            const pRole = (p.user_type || p.target_role || '').toLowerCase();
            return pRole === 'creator' || pRole === 'all';
          })
        );
      }
    } catch (err) {
      console.warn('Failed to load creator subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setSubscribing(true);
    try {
      await api.post('/subscription/upgrade', { planId, role: 'creator' });
      Alert.alert('Subscribed!', 'Successfully upgraded your subscription plan.');
      fetchSubscription();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upgrade plan');
    } finally {
      setSubscribing(false);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CREATOR SUBSCRIPTION</Text>
          <Text style={styles.headerSub}>Unlock VIP Features & Boost Credits</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.activePlanCard}>
          <Text style={styles.activePlanTitle}>Active Membership Plan</Text>
          <Text style={styles.activePlanVal}>{currentPlan.toUpperCase()}</Text>
        </View>

        <Text style={styles.sectionTitle}>UPGRADE CREATOR PLAN</Text>

        {dbPlans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={32} color={YELLOW} />
            <Text style={styles.emptyText}>No creator subscription plans configured by Admin yet.</Text>
          </View>
        ) : (
          dbPlans.map((plan) => {
            const planId = plan._id || plan.id;
            const planTitle = plan.title || plan.name || 'CREATOR PLAN';
            const isCurrent = currentPlan.toLowerCase() === planTitle.toLowerCase() || currentPlan === planId;
            const priceVal = plan.price_inr || plan.price || 0;
            const rawFeatures = Array.isArray(plan.features_list) && plan.features_list.length > 0
              ? plan.features_list
              : (typeof plan.features === 'string' ? plan.features.split(',').map((f: string) => f.trim()) : []);

            return (
              <View key={planId} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{planTitle}</Text>
                  <Text style={styles.planPrice}>₹{priceVal.toLocaleString('en-IN')}/mo</Text>
                </View>

                <View style={styles.featuresList}>
                  {rawFeatures.map((feat: string, idx: number) => (
                    <View key={idx} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={14} color={YELLOW} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.upgradeBtn, isCurrent && styles.upgradeBtnActive]}
                  onPress={() => handleUpgrade(planId)}
                  disabled={isCurrent || subscribing}>
                  <Text style={styles.upgradeBtnText}>
                    {isCurrent ? 'Current Active Plan' : `Upgrade to ${planTitle}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
  activePlanCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: YELLOW, padding: Spacing.four, gap: 4 },
  activePlanTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  activePlanVal: { color: YELLOW, fontSize: FontSize.lg, fontWeight: '900' },
  sectionTitle: { color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  planCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.three },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { color: '#fff', fontSize: FontSize.base, fontWeight: '900' },
  planPrice: { color: YELLOW, fontSize: FontSize.base, fontWeight: '900' },
  featuresList: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, fontWeight: '700' },
  upgradeBtn: { backgroundColor: YELLOW, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  upgradeBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  upgradeBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.six, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' },
});
