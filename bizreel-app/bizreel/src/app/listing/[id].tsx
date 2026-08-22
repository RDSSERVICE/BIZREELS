import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAddToCart } from '@/features/cart/queries';
import { api } from '@/lib/api';

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addToCartMutation = useAddToCart();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/listings/${id}`)
      .then(({ data }) => {
        setListing(data.data || data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = listing.images || [];
  const mainImage = images[0]?.url || listing.image;
  const price = listing.salePrice || listing.sellingPrice || listing.price || 0;
  const originalPrice = listing.actualPrice || listing.price;
  const hasDiscount = originalPrice > price;

  const handleAddToCart = () => {
    addToCartMutation.mutate(
      { listing_id: listing._id, quantity: 1 },
      {
        onSuccess: () => {
          router.push('/cart');
        },
      }
    );
  };

  const handleBuyNow = () => {
    addToCartMutation.mutate(
      { listing_id: listing._id, quantity: 1 },
      {
        onSuccess: () => {
          router.push('/checkout');
        },
      }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <SymbolView name="chevron.left" size={22} tintColor="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart')}>
          <SymbolView name="cart.fill" size={22} tintColor="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Image */}
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <SymbolView name="bag.fill" size={48} tintColor="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Content Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{listing.title}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
            )}
            {listing.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{listing.category}</Text>
              </View>
            )}
          </View>

          {/* Vendor Card */}
          {listing.vendor && (
            <View style={styles.vendorCard}>
              <View style={styles.vendorAvatar}>
                <Text style={styles.vendorAvatarText}>
                  {listing.vendor.name?.charAt(0)?.toUpperCase() || 'V'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vendorName}>
                  {listing.vendor.businessName || listing.vendor.name}
                </Text>
                <Text style={styles.vendorRole}>Verified Business Partner</Text>
              </View>
            </View>
          )}

          {/* Description */}
          {!!listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.cartBtn]}
          onPress={handleAddToCart}
          disabled={addToCartMutation.isPending}>
          {addToCartMutation.isPending ? (
            <ActivityIndicator color={BrandColors.primary} />
          ) : (
            <Text style={styles.cartBtnText}>Add to Cart</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.buyBtn]}
          onPress={handleBuyNow}
          disabled={addToCartMutation.isPending}>
          <Text style={styles.buyBtnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  iconBtn: {
    padding: Spacing.two,
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.two,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  heroPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  price: {
    color: BrandColors.primaryLight,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.md,
    textDecorationLine: 'line-through',
  },
  categoryBadge: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  categoryText: {
    color: BrandColors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
    marginVertical: Spacing.two,
  },
  vendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorAvatarText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  vendorName: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  vendorRole: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  section: {
    gap: Spacing.one,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  errorText: {
    color: BrandColors.error,
    fontSize: FontSize.base,
    marginBottom: Spacing.three,
  },
  retryBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    gap: Spacing.three,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
  },
  cartBtnText: {
    color: BrandColors.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  buyBtn: {
    backgroundColor: BrandColors.primary,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
