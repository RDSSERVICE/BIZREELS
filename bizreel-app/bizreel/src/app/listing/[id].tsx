import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAddToCart } from '@/features/cart/queries';
import { useCreateInquiry } from '@/features/inquiries/queries';
import { useCreateReview, useListingReviews } from '@/features/reviews/queries';
import { api } from '@/lib/api';

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inquiry modal state
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');

  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const addToCartMutation = useAddToCart();
  const createInquiryMutation = useCreateInquiry();
  const createReviewMutation = useCreateReview();
  const { data: reviews, isLoading: reviewsLoading } = useListingReviews(id || '');

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

  const handleSendInquiry = () => {
    if (!inquiryMsg.trim()) return;
    createInquiryMutation.mutate(
      {
        vendorId: listing.vendor?._id || listing.vendor,
        listingId: listing._id,
        subject: `Inquiry for ${listing.title}`,
        message: inquiryMsg.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('Inquiry Sent', 'Your message has been sent to the seller.');
          setInquiryMsg('');
          setInquiryModalVisible(false);
          router.push('/inquiries' as any);
        },
        onError: (err: any) => {
          Alert.alert('Failed to send inquiry', err.message || 'Could not send message.');
        },
      }
    );
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) return;
    createReviewMutation.mutate(
      {
        listing_id: listing._id,
        rating: selectedRating,
        comment: reviewComment.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('Review Posted', 'Thank you for your rating!');
          setReviewComment('');
          setReviewModalVisible(false);
        },
        onError: (err: any) => {
          Alert.alert('Review Failed', err.message || 'Could not post review.');
        },
      }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Image */}
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="bag" size={48} color="rgba(255,255,255,0.4)" />
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

              <TouchableOpacity
                style={styles.inquireBtn}
                onPress={() => setInquiryModalVisible(true)}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#fff" />
                <Text style={styles.inquireBtnText}>Inquire</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          {!!listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Reviews & Ratings Section */}
          <View style={styles.section}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Customer Ratings & Reviews</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(true)}>
                <Text style={styles.writeReviewText}>+ Write Review</Text>
              </TouchableOpacity>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color={BrandColors.primary} />
            ) : !reviews || reviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>No reviews yet. Be the first to rate!</Text>
            ) : (
              reviews.map((rev) => (
                <View key={rev._id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <Text style={styles.reviewUserName}>{rev.user?.name || 'Customer'}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= rev.rating ? 'star' : 'star-outline'}
                          size={14}
                          color="#FFB800"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))
            )}
          </View>
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

      {/* Inquiry Quote Modal */}
      <Modal
        visible={inquiryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInquiryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setInquiryModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Quote / Direct Inquiry</Text>
              <TouchableOpacity onPress={() => setInquiryModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Your message or requirements for seller</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={4}
              placeholder="Ask about bulk pricing, custom specifications, or availability..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inquiryMsg}
              onChangeText={setInquiryMsg}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSendInquiry}
              disabled={createInquiryMutation.isPending}>
              {createInquiryMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Send Message to Vendor</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Write Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setReviewModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate & Review Product</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Rating</Text>
            <View style={styles.starSelectRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#FFB800"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Review Comment</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience with this item..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSubmitReview}
              disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Submit Rating & Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  inquireBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  section: {
    gap: Spacing.two,
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
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  writeReviewText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  emptyReviewText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  reviewCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: Spacing.three,
    gap: 4,
  },
  reviewUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUserName: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  starSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  textAreaInput: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: Spacing.three,
    color: '#fff',
    fontSize: FontSize.xs,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    backgroundColor: BrandColors.primary,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
