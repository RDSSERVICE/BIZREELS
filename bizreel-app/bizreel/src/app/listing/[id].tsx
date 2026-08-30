import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import DirectBuyModal from '@/components/DirectBuyModal';
import { useAddToCart } from '@/features/cart/queries';
import { useCreateInquiry } from '@/features/inquiries/queries';
import { useCreateReview, useListingReviews } from '@/features/reviews/queries';
import { api } from '@/lib/api';
import { getListingImage, resolveImageUrl } from '@/utils/image';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distanceStr, setDistanceStr] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  // Inquiry modal state
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');

  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [directBuyModalOpen, setDirectBuyModalOpen] = useState(false);

  const addToCartMutation = useAddToCart();
  const createInquiryMutation = useCreateInquiry();
  const createReviewMutation = useCreateReview();
  const { data: reviews, isLoading: reviewsLoading } = useListingReviews(id || '');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/v1/listings/${id}`)
      .catch(() => api.get(`/listings/${id}`))
      .then(({ data }) => {
        const itemData = data.data?.listing || data.listing || data.data || data;
        setListing(itemData);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Calculate distance if coordinates available
  useEffect(() => {
    if (!listing) return;

    const coords = listing.location?.coordinates || listing.vendor?.location?.coordinates || listing.vendorId?.location?.coordinates;
    if (coords && Array.isArray(coords) && coords.length === 2) {
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((loc) => {
          const lat1 = loc.coords.latitude;
          const lon1 = loc.coords.longitude;
          const lat2 = coords[1];
          const lon2 = coords[0];

          if (lat1 && lon1 && lat2 && lon2) {
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const dist = R * c;
            if (dist !== null && !isNaN(dist)) {
              setDistanceStr(`${dist.toFixed(1)} km away`);
            }
          }
        })
        .catch(() => null);
    }
  }, [listing]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={YELLOW} />
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

  const mainImage = getListingImage(listing);
  const vendorObj = listing.vendor || listing.vendorId || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || listing.vendorName || 'Verified Supplier';
  const vendorAvatar = resolveImageUrl(vendorObj.avatarUrl || vendorObj.logo || vendorObj.profile_pic);
  const vendorId = vendorObj._id || vendorObj.id;
  const vendorPhone = vendorObj.phone || vendorObj.whatsapp || vendorObj.vendorProfile?.whatsapp || vendorObj.vendorProfile?.phone || '';
  const isService = listing.type === 'service';

  const priceCandidates = [
    listing.sellingPrice,
    listing.salePrice,
    listing.offer_price,
    listing.price,
    listing.rate,
    listing.pricing?.amount,
    listing.pricing?.price,
    listing.actualPrice,
    listing.regularPrice,
    listing.originalPrice,
    listing.cost,
  ];
  const validPrice = priceCandidates.map((p) => Number(p)).find((p) => !isNaN(p) && p > 0);
  const price = validPrice || 0;
  const originalPrice = Number(listing.actualPrice || listing.regularPrice || listing.originalPrice || 0);
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAddToCart = () => {
    addToCartMutation.mutate(
      { listing_id: listing._id, quantity: 1 },
      {
        onSuccess: () => {
          Alert.alert('🎉 Added to Cart!', `"${listing.title}" has been added to your cart.`, [
            { text: 'View Cart', onPress: () => router.push('/cart') },
            { text: 'Continue Shopping' },
          ]);
        },
        onError: (err: any) => {
          Alert.alert('Cart Notice', err.message || 'Unable to update online cart.');
        },
      }
    );
  };

  const handleBuyNow = () => {
    setDirectBuyModalOpen(true);
  };

  const handleWhatsApp = () => {
    let cleanPhone = String(vendorPhone).replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Contact Notice', 'WhatsApp number is not provided for this seller.');
      return;
    }
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const text = encodeURIComponent(
      `Hello ${vendorName}!\nI found your listing "${listing.title}" on BizReels (₹${price}).\nI would like to inquire about availability and details.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp app.');
    });
  };

  const handleCall = () => {
    let cleanPhone = String(vendorPhone).replace(/\D/g, '');
    if (!cleanPhone) {
      Alert.alert('Contact Notice', 'Phone number is not available for this seller.');
      return;
    }
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Could not initiate phone call.');
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: listing.title,
        message: `Check out "${listing.title}" (₹${price}) on BizReels!`,
      });
    } catch {}
  };

  const handleToggleSave = async () => {
    setIsSaved(!isSaved);
    try {
      if (!isSaved) {
        await api.post(`/v1/listings/${listing._id}/save`);
        Alert.alert('Saved 🔖', 'Listing added to your bookmarks!');
      } else {
        await api.post(`/v1/listings/${listing._id}/unsave`);
        Alert.alert('Bookmark Removed', 'Listing removed from bookmarks.');
      }
    } catch {}
  };

  const handleSendInquiry = () => {
    if (!inquiryMsg.trim()) return;
    createInquiryMutation.mutate(
      {
        vendorId: vendorId || listing.vendor,
        listingId: listing._id,
        subject: `Inquiry for ${listing.title}`,
        message: inquiryMsg.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('Inquiry Sent ✉️', 'Your message has been sent to the seller.');
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
          Alert.alert('Review Posted ⭐', 'Thank you for your review!');
          setReviewComment('');
          setReviewModalVisible(false);
        },
        onError: (err: any) => {
          Alert.alert('Review Failed', err.message || 'Could not post review.');
        },
      }
    );
  };

  const vp = vendorObj.vendorProfile || {};
  const vendorPayment = vp.paymentDetails || vp.payoutDetails || vendorObj.paymentDetails || {};

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleSave}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={YELLOW} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="bag" size={48} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Content Container */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{listing.title}</Text>

          {/* Pricing & Discount Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              </>
            )}
            {listing.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{listing.category}</Text>
              </View>
            )}
          </View>

          {/* Calculated Distance Banner */}
          {!!distanceStr && (
            <View style={styles.distanceBanner}>
              <Ionicons name="navigate" size={14} color={BLACK} />
              <Text style={styles.distanceBannerText}>📍 {distanceStr} from your location</Text>
            </View>
          )}

          {/* Quick Action Contact Pills Strip */}
          <View style={styles.actionPillsStrip}>
            <TouchableOpacity style={styles.actionPillWhatsApp} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={styles.actionPillTextWhite}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPillCall} onPress={handleCall}>
              <Ionicons name="call" size={16} color={BLACK} />
              <Text style={styles.actionPillTextBlack}>Call Seller</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPillInquire} onPress={() => setInquiryModalVisible(true)}>
              <Ionicons name="chatbubble-ellipses" size={16} color={YELLOW} />
              <Text style={styles.actionPillTextYellow}>Inquire</Text>
            </TouchableOpacity>
          </View>

          {/* Clickable Vendor Store Card */}
          {vendorObj && (
            <TouchableOpacity
              style={styles.vendorCard}
              onPress={() => vendorId && router.push(`/vendor/${vendorId}` as any)}>
              {vendorAvatar ? (
                <Image source={{ uri: vendorAvatar }} style={styles.vendorAvatarImg} contentFit="cover" />
              ) : (
                <View style={[styles.vendorAvatarImg, { backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="storefront-outline" size={20} color={YELLOW} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.vendorName}>{vendorName}</Text>
                  <Ionicons name="checkmark-circle" size={14} color={YELLOW} />
                </View>
                <Text style={styles.vendorRole}>
                  Verified Supplier • {listing.city || vendorObj.city || 'Local Store'}
                </Text>
              </View>

              <View style={styles.viewStoreBtn}>
                <Text style={styles.viewStoreText}>Store ›</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Specifications Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Specifications & Details</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specCell}>
                <Text style={styles.specLabel}>Category:</Text>
                <Text style={styles.specValue}>{listing.category || 'General'}</Text>
              </View>
              {listing.subcategory && (
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Subcategory:</Text>
                  <Text style={styles.specValue}>{listing.subcategory}</Text>
                </View>
              )}
              {listing.brand && (
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Brand:</Text>
                  <Text style={styles.specValue}>{listing.brand}</Text>
                </View>
              )}
              {listing.sku && (
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>SKU / Model:</Text>
                  <Text style={styles.specValue}>{listing.sku}</Text>
                </View>
              )}
              <View style={styles.specCell}>
                <Text style={styles.specLabel}>Listing Type:</Text>
                <Text style={styles.specValue}>{isService ? 'Service' : 'Product'}</Text>
              </View>
              <View style={styles.specCell}>
                <Text style={styles.specLabel}>Stock Status:</Text>
                <Text style={[styles.specValue, { color: '#22C55E' }]}>
                  {listing.stock > 0 ? `In Stock (${listing.stock} items)` : 'Available on Order'}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment & Bank Details Card */}
          {(vendorPayment.upiId || vendorPayment.bankAccount) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vendor Verified Payment Credentials</Text>
              <View style={styles.paymentCard}>
                {vendorPayment.upiId && (
                  <View style={styles.paymentRow}>
                    <Ionicons name="card-outline" size={16} color={YELLOW} />
                    <Text style={styles.paymentLabel}>Verified UPI ID:</Text>
                    <Text style={styles.paymentVal}>{vendorPayment.upiId}</Text>
                  </View>
                )}
                {vendorPayment.bankAccount && (
                  <View style={styles.paymentRow}>
                    <Ionicons name="business-outline" size={16} color={YELLOW} />
                    <Text style={styles.paymentLabel}>Bank Account:</Text>
                    <Text style={styles.paymentVal}>{vendorPayment.bankAccount} ({vendorPayment.bankName || 'Verified'})</Text>
                  </View>
                )}
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

          {/* Reviews & Ratings Section */}
          <View style={styles.section}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Customer Ratings & Reviews</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(true)}>
                <Text style={styles.writeReviewText}>+ Write Review</Text>
              </TouchableOpacity>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color={YELLOW} />
            ) : !reviews || reviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>No reviews yet. Be the first to rate!</Text>
            ) : (
              reviews.map((rev: any) => (
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
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.cartBtn]}
          onPress={handleAddToCart}
          disabled={addToCartMutation.isPending}>
          {addToCartMutation.isPending ? (
            <ActivityIndicator color={BLACK} />
          ) : (
            <>
              <Ionicons name="cart-outline" size={16} color={BLACK} />
              <Text style={styles.cartBtnText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.buyBtn]}
          onPress={handleBuyNow}
          disabled={addToCartMutation.isPending}>
          <Ionicons name="flash-outline" size={16} color={BLACK} />
          <Text style={styles.buyBtnText}>{isService ? 'Book Service Now' : 'Buy Now'}</Text>
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

            <Text style={styles.inputLabel}>Your message or custom specs for seller</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={4}
              placeholder="Ask about bulk pricing, custom specifications, or delivery timeline..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={inquiryMsg}
              onChangeText={setInquiryMsg}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSendInquiry}
              disabled={createInquiryMutation.isPending}>
              {createInquiryMutation.isPending ? (
                <ActivityIndicator color={BLACK} />
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
                <ActivityIndicator color={BLACK} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Submit Rating & Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Direct Buy Modal */}
      <DirectBuyModal
        visible={directBuyModalOpen}
        onClose={() => setDirectBuyModalOpen(false)}
        item={listing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BLACK },
  errorText: { color: '#EF4444', fontSize: FontSize.sm, fontWeight: '700' },
  retryBtn: { marginTop: 12, backgroundColor: YELLOW, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: FontSize.sm, fontWeight: '900', marginHorizontal: 10 },

  scrollContent: { paddingBottom: 100 },
  heroImage: { width: '100%', height: 300 },
  heroPlaceholder: { width: '100%', height: 260, backgroundColor: DARK_CARD, alignItems: 'center', justifyContent: 'center' },

  detailsContainer: { padding: Spacing.four, gap: Spacing.three },
  title: { color: '#fff', fontSize: FontSize.base, fontWeight: '900', lineHeight: 24 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  price: { color: YELLOW, fontSize: FontSize.lg, fontWeight: '900' },
  originalPrice: { color: 'rgba(255,255,255,0.4)', fontSize: FontSize.sm, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#22C55E', paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: BLACK, fontSize: 9, fontWeight: '900' },
  categoryBadge: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 4 },
  categoryText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700' },

  distanceBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: YELLOW, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  distanceBannerText: { color: BLACK, fontSize: 11, fontWeight: '900' },

  actionPillsStrip: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionPillWhatsApp: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25D366', height: 38 },
  actionPillTextWhite: { color: '#fff', fontSize: 11, fontWeight: '900' },
  actionPillCall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: YELLOW, height: 38 },
  actionPillTextBlack: { color: BLACK, fontSize: 11, fontWeight: '900' },
  actionPillInquire: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: BLACK, borderWidth: 1, borderColor: YELLOW, height: 38 },
  actionPillTextYellow: { color: YELLOW, fontSize: 11, fontWeight: '900' },

  vendorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.three },
  vendorAvatarImg: { width: 40, height: 40, backgroundColor: BLACK },
  vendorName: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  vendorRole: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  viewStoreBtn: { backgroundColor: YELLOW, paddingHorizontal: 10, paddingVertical: 5 },
  viewStoreText: { color: BLACK, fontSize: 10, fontWeight: '900' },

  section: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.three, gap: 8 },
  sectionTitle: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900', letterSpacing: 0.5 },
  description: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, lineHeight: 20 },

  specsGrid: { gap: 6 },
  specCell: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6 },
  specLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  specValue: { color: '#fff', fontSize: 11, fontWeight: '800' },

  paymentCard: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, padding: 10, gap: 6 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  paymentVal: { color: YELLOW, fontSize: 11, fontWeight: '900' },

  reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  writeReviewText: { color: YELLOW, fontSize: 11, fontWeight: '900' },
  emptyReviewText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  reviewCard: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, padding: 10, gap: 4 },
  reviewUserRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUserName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DARK_CARD, borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: Spacing.four, paddingTop: Spacing.two, flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46 },
  cartBtn: { backgroundColor: YELLOW },
  cartBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  buyBtn: { backgroundColor: YELLOW },
  buyBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: DARK_CARD, borderTopWidth: 2, borderTopColor: YELLOW, padding: Spacing.four, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 8 },
  modalTitle: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  inputLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  textAreaInput: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', padding: 10, fontSize: FontSize.xs, height: 90, textAlignVertical: 'top' },
  starSelectRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 4 },
  modalSubmitBtn: { backgroundColor: YELLOW, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  modalSubmitBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
});
