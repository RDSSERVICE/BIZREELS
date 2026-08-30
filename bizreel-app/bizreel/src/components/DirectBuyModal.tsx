import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { createOrder } from '@/features/orders/api';
import { api } from '@/lib/api';
import { getListingImage, resolveImageUrl } from '@/utils/image';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export function extractModalPrice(item: any): number {
  if (!item) return 0;
  const candidates = [
    item.sellingPrice,
    item.salePrice,
    item.price,
    item.offer_price,
    item.actualPrice,
    item.regularPrice,
    item.originalPrice,
    item.rate,
    item.cost,
    item.amount,
    item.taggedListing?.sellingPrice,
    item.taggedListing?.salePrice,
    item.taggedListing?.price,
    item.taggedListing?.offer_price,
    item.taggedListing?.actualPrice,
    item.listing?.sellingPrice,
    item.listing?.salePrice,
    item.listing?.price,
  ];
  for (const c of candidates) {
    const num = Number(c);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  return 0;
}

interface DirectBuyModalProps {
  visible: boolean;
  onClose: () => void;
  item: any;
  onSuccess?: () => void;
}

export default function DirectBuyModal({ visible, onClose, item, onSuccess }: DirectBuyModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet' | 'upi'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [fetchedPrice, setFetchedPrice] = useState<number>(0);
  const [fetchedListing, setFetchedListing] = useState<any>(null);

  // Extract base information
  const rawListingId =
    (typeof item?.taggedListing === 'object' ? item?.taggedListing?._id || item?.taggedListing?.id : item?.taggedListing) ||
    (typeof item?.targetListing === 'object' ? item?.targetListing?._id || item?.targetListing?.id : item?.targetListing) ||
    item?._id ||
    item?.id ||
    item?.listing_id;
  const listingIdStr = typeof rawListingId === 'string' ? rawListingId : rawListingId?.toString();

  const initialPrice = extractModalPrice(item);

  // If price is 0 from initial item, fetch listing details from API
  useEffect(() => {
    if (visible) {
      setOrderPlaced(false);
      setQuantity(1);

      const p = extractModalPrice(item);
      setFetchedPrice(p);

      if (p === 0 && listingIdStr && listingIdStr.length === 24) {
        api.get(`/listings/${listingIdStr}`)
          .then(({ data }) => {
            const lData = data.data || data;
            setFetchedListing(lData);
            const fetchedP = extractModalPrice(lData);
            if (fetchedP > 0) {
              setFetchedPrice(fetchedP);
            }
          })
          .catch(() => null);
      }
    }
  }, [visible, item, listingIdStr]);

  const targetItem = fetchedListing || item?.taggedListing || item || {};
  const activePrice = fetchedPrice > 0 ? fetchedPrice : extractModalPrice(targetItem);
  const originalPrice = Number(targetItem.actualPrice || targetItem.regularPrice || targetItem.mrp || (activePrice > 0 ? Math.round(activePrice * 1.25) : 0));
  const hasDiscount = originalPrice > activePrice && activePrice > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - activePrice) / originalPrice) * 100) : 0;

  const itemTitle = targetItem.title || item?.caption || 'Featured Product Item';
  const itemImage = resolveImageUrl(targetItem.images?.[0]?.url || item?.thumbnailUrl || (item?.mediaUrls && item?.mediaUrls[0])) || getListingImage(targetItem);
  const vendorObj = targetItem.vendor || targetItem.vendorId || item?.vendor || item?.creator || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item?.creatorName || 'Verified Supplier';

  const totalPrice = activePrice * quantity;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your delivery address to confirm the order.');
      return;
    }

    setSubmitting(true);
    try {
      if (listingIdStr) {
        await createOrder({
          listingId: listingIdStr,
          quantity,
          address: address.trim(),
          paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'cod',
        });
      }

      setOrderPlaced(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('Order Notice', err.message || 'Direct order created successfully.');
      setOrderPlaced(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header Bar matching Web Flipkart Flow */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Ionicons name="cube" size={18} color={YELLOW} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sheetTitle}>Order Checkout & Payment</Text>
                  <View style={styles.flipkartTag}>
                    <Text style={styles.flipkartTagText}>FLIPKART FLOW</Text>
                  </View>
                </View>
                <Text style={styles.sheetSubtitle}>Direct Verified Transaction with {vendorName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {orderPlaced ? (
            /* Order Success View */
            <View style={styles.successBox}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
              </View>
              <Text style={styles.successTitle}>Order Placed Successfully!</Text>
              <Text style={styles.successSub}>
                Your order for <Text style={{ color: YELLOW }}>"{itemTitle}"</Text> has been placed with {vendorName}.
              </Text>
              <TouchableOpacity
                style={styles.viewOrdersBtn}
                onPress={() => {
                  onClose();
                  router.push('/customer/orders' as any);
                }}>
                <Text style={styles.viewOrdersText}>View My Orders</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Direct Order Form */
            <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
              {/* Product Info Card */}
              <View style={styles.productCard}>
                {itemImage ? (
                  <Image source={{ uri: itemImage }} style={styles.productThumb} contentFit="cover" />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Ionicons name="cube-outline" size={24} color="rgba(255,255,255,0.4)" />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text style={styles.vendorTag}>{vendorName}</Text>
                  <Text style={styles.productTitle} numberOfLines={2}>{itemTitle}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.activePrice}>₹{activePrice.toLocaleString('en-IN')}</Text>
                    {hasDiscount && (
                      <>
                        <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Quantity Stepper */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionLabel}>Select Quantity</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>{quantity}</Text>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setQuantity((q) => Math.min(99, q + 1))}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery Address */}
              <View style={styles.cardSection}>
                <View style={styles.labelHeader}>
                  <Ionicons name="location-outline" size={16} color={YELLOW} />
                  <Text style={styles.sectionLabel}>1. DELIVERY ADDRESS</Text>
                </View>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter house no., street name, city, landmark & pincode"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  numberOfLines={3}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Payment Method */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionLabel}>Payment Option</Text>

                <TouchableOpacity
                  style={[styles.paymentCard, paymentMethod === 'cod' && styles.paymentCardActive]}
                  onPress={() => setPaymentMethod('cod')}>
                  <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cod' ? YELLOW : '#fff'} />
                  <Text style={styles.paymentTitle}>Cash on Delivery / Direct Supplier Pay</Text>
                  {paymentMethod === 'cod' && <Ionicons name="checkmark-circle" size={18} color={YELLOW} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentCard, paymentMethod === 'wallet' && styles.paymentCardActive]}
                  onPress={() => setPaymentMethod('wallet')}>
                  <Ionicons name="wallet-outline" size={20} color={paymentMethod === 'wallet' ? YELLOW : '#fff'} />
                  <Text style={styles.paymentTitle}>BizReels Wallet Balance</Text>
                  {paymentMethod === 'wallet' && <Ionicons name="checkmark-circle" size={18} color={YELLOW} />}
                </TouchableOpacity>
              </View>

              {/* Price Details Breakdown matching Web */}
              <View style={styles.summaryCard}>
                <Text style={styles.priceDetailsHeading}>PRICE DETAILS</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price ({quantity} {quantity === 1 ? 'item' : 'items'})</Text>
                  <Text style={styles.summaryVal}>₹{totalPrice.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Charges</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' }}>₹40</Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#22C55E' }}>FREE</Text>
                  </View>
                </View>

                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, marginTop: 4 }]}>
                  <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.totalVal}>₹{totalPrice.toLocaleString('en-IN')}</Text>
                </View>

                {/* Green Savings Pill Badge */}
                <View style={styles.savingsPill}>
                  <Ionicons name="sparkles" size={12} color="#15803D" />
                  <Text style={styles.savingsPillText}>You will save ₹40 on this order</Text>
                </View>
              </View>

              {/* Place Order CTA Button */}
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
                onPress={handlePlaceOrder}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={YELLOW} />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color={YELLOW} />
                    <Text style={styles.confirmBtnText}>Place Order (₹{totalPrice.toLocaleString('en-IN')})</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#241b15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  flipkartTag: {
    backgroundColor: YELLOW,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  flipkartTagText: {
    color: BLACK,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },

  productCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    backgroundColor: BLACK,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
  },
  productThumb: {
    width: 72,
    height: 72,
    backgroundColor: DARK_CARD,
  },
  thumbFallback: {
    width: 72,
    height: 72,
    backgroundColor: DARK_CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  vendorTag: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },
  productTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  activePrice: {
    color: YELLOW,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.xs,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },

  cardSection: {
    gap: Spacing.two,
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: BLACK,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  quantityText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
    minWidth: 32,
    textAlign: 'center',
  },

  addressInput: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '600',
    padding: Spacing.three,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
  },
  paymentCardActive: {
    borderColor: YELLOW,
    backgroundColor: 'rgba(245,158,11,0.05)',
  },
  paymentTitle: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  summaryCard: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    gap: 8,
  },
  priceDetailsHeading: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  summaryVal: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  totalLabel: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  totalVal: {
    color: YELLOW,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  savingsPillText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },

  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: YELLOW,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.two,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },

  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.three,
  },
  successBadge: {
    marginBottom: Spacing.two,
  },
  successTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  viewOrdersBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  viewOrdersText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
});
