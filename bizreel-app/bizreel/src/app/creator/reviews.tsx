import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user?: { name?: string };
  createdAt?: string;
}

export default function CreatorReviewsScreen() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/me');
      const data = res.data?.data || res.data || {};
      const list = data.reviews || (Array.isArray(data) ? data : []);
      setReviews(list);
    } catch (err) {
      console.warn('Failed to load creator reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

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
          <Text style={styles.headerTitle}>CLIENT REVIEWS</Text>
          <Text style={styles.headerSub}>Vendor Ratings & Feedback</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {reviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="star-outline" size={32} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>No client reviews received yet</Text>
          </View>
        ) : (
          reviews.map((rev) => (
            <View key={rev._id} style={styles.reviewCard}>
              <View style={styles.revHeader}>
                <Text style={styles.revUser}>{rev.user?.name || 'Client Vendor'}</Text>
                <Text style={styles.revRating}>{'★'.repeat(rev.rating)} {rev.rating}.0</Text>
              </View>
              <Text style={styles.revComment}>{rev.comment}</Text>
            </View>
          ))
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
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  reviewCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.two },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revUser: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  revRating: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  revComment: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, lineHeight: 18 },
});
