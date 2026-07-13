import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resolveMediaUrl } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

function fmtPrice(n: number | null | undefined) {
  if (n == null) return '';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export default function ListingCard({ listing }: { listing: any }) {
  const router = useRouter();
  const cover = listing.images?.[0]?.url;
  const hasOffer = listing.offer_price != null && listing.offer_price < listing.price;
  const isBoosted = listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date();

  return (
    <TouchableOpacity
      testID={`listing-card-${listing.slug}`}
      style={styles.container}
      onPress={() => router.push(`/listing/${listing.slug}`)}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrap}>
        {cover ? (
          <Image source={{ uri: resolveMediaUrl(cover) }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        {isBoosted && (
          <View style={styles.sponsoredBadge}>
            <Ionicons name="sparkles" size={10} color="#000" />
            <Text style={styles.sponsoredText}>Sponsored</Text>
          </View>
        )}
        {listing.is_negotiable && !isBoosted && (
          <View style={styles.negotiableBadge}>
            <Text style={styles.negotiableText}>Negotiable</Text>
          </View>
        )}
        <View style={styles.gradient} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.priceRow}>
          {hasOffer ? (
            <>
              <Text style={styles.price}>₹{fmtPrice(listing.offer_price)}</Text>
              <Text style={styles.oldPrice}>₹{fmtPrice(listing.price)}</Text>
            </>
          ) : (
            <Text style={styles.price}>₹{fmtPrice(listing.price)}</Text>
          )}
        </View>
        {listing.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.locationText} numberOfLines={1}>
              {listing.location.area}, {listing.location.city}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 12 },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 32, opacity: 0.2 },
  gradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'transparent',
  },
  sponsoredBadge: {
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(250,204,21,0.9)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.full, gap: 3,
  },
  sponsoredText: { fontSize: 9, fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 },
  negotiableBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  negotiableText: { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  info: { marginTop: 8, paddingHorizontal: 4 },
  title: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  oldPrice: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', flex: 1 },
});
