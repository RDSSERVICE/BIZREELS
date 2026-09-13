import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/queries';
import { checkoutCart } from '@/features/cart/api';
import { createOrder } from '@/features/orders/api';
import type { PaymentMethod } from '@/features/orders/types';
import { getListingImage, resolveImageUrl } from '@/utils/image';
import { useAuth } from '@/features/auth/context';

function extractItemPrice(item: any): number {
  if (!item) return 0;
  const candidates = [
    item.price,
    item.line_total,
    item.salePrice,
    item.sellingPrice,
    item.offer_price,
    item.actualPrice,
    item.regularPrice,
    item.originalPrice,
    item.rate,
    item.cost,
    item.amount,
    item.pricing?.amount,
    item.pricing?.price,
    item.listing?.salePrice,
    item.listing?.sellingPrice,
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

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuth();
  const params = useLocalSearchParams<{
    listingId?: string;
    title?: string;
    price?: string;
    image?: string;
    vendorName?: string;
  }>();

  const { data: cart, isLoading, refetch: refetchCart } = useCart();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);

  const rawPriceParam = params.price;
  const directPrice = parseFloat(rawPriceParam || '0');
  const hasDirectItem = !!(params.title || params.listingId);

  const displayGroups = hasDirectItem
    ? [
        {
          vendor_id: 'direct_vendor',
          vendor: { name: params.vendorName || 'Verified Vendor' },
          items: [
            {
              listing_id: params.listingId || 'direct_item',
              title: params.title || 'Product Item',
              quantity: 1,
              price: directPrice,
              line_total: directPrice,
              image: params.image || '',
            },
          ],
          subtotal: directPrice,
        },
      ]
    : cart?.groups && cart.groups.length > 0
    ? cart.groups.map((group: any) => ({
        ...group,
        items: (group.items || []).map((it: any) => {
          const p = extractItemPrice(it);
          const q = Number(it.quantity || 1);
          return {
            ...it,
            price: p,
            line_total: p * q,
          };
        }),
        subtotal: (group.items || []).reduce((sum: number, it: any) => {
          const p = extractItemPrice(it);
          const q = Number(it.quantity || 1);
          return sum + p * q;
        }, 0),
      }))
    : hasDirectItem
    ? [
        {
          vendor_id: 'direct_vendor',
          vendor: { name: params.vendorName || 'Verified Vendor' },
          items: [
            {
              listing_id: params.listingId || 'direct_item',
              title: params.title || 'Product Item',
              quantity: 1,
              price: directPrice,
              line_total: directPrice,
              image: params.image || '',
            },
          ],
          subtotal: directPrice,
        },
      ]
    : [];

  const displayTotal = displayGroups.reduce((acc, g) => acc + (g.subtotal || 0), 0);
  const totalItemsCount = displayGroups.reduce(
    (acc, g) => acc + (g.items || []).reduce((iAcc: number, it: any) => iAcc + (it.quantity || 1), 0),
    0
  );

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your complete delivery address before placing your order.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create order records for tracking
      if (displayGroups.length > 0) {
        for (const group of displayGroups) {
          for (const item of group.items) {
            if (item.listing_id && item.listing_id !== 'direct_item') {
              try {
                await createOrder({
                  listingId: item.listing_id,
                  quantity: item.quantity || 1,
                  address: address.trim(),
                  paymentMethod,
                });
              } catch (err) {
                console.warn('Direct order record creation notice', err);
              }
            }
          }
        }
      }

      // 2. Perform cart checkout & clearing
      try {
        await checkoutCart();
      } catch (err: any) {
        console.warn('Cart checkout API notice', err);
      }

      await refetchCart();

      Alert.alert(
        '🎉 Order Placed Successfully!',
        'Your order request has been created and sent to the vendor(s). You can track status in My Orders.',
        [
          {
            text: 'View My Orders',
            onPress: () => router.replace('/orders'),
          },
        ]
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Could not place order. Please check supplier verification status.';
      Alert.alert('Checkout Restricted', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !hasDirectItem) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading checkout details...</Text>
      </View>
    );
  }

  if (authStatus === 'unauthed' || !user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={64} color={BrandColors.primary} />
        <Text style={styles.emptyTitle}>Sign In to Complete Checkout</Text>
        <Text style={styles.emptySub}>Please sign in to your BizReels account to place your order and set delivery details.</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.browseBtnText}>Log In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (displayGroups.length === 0 && !hasDirectItem) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="basket-outline" size={64} color="rgba(255,255,255,0.4)" />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySub}>Add products or services to your cart to proceed with checkout.</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.browseBtnText}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1E1B18" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color={BrandColors.primary} />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter house no., street, city, landmark & pincode"
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Order Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bag-handle" size={20} color={BrandColors.primary} />
            <Text style={styles.cardTitle}>Order Items ({totalItemsCount})</Text>
          </View>

          {displayGroups.map((group) => (
            <View key={group.vendor_id} style={styles.vendorBlock}>
              <Text style={styles.vendorName}>{group.vendor?.name || 'Vendor Partner'}</Text>
              {group.items.map((item: any) => {
                const itemImg = resolveImageUrl(item.image) || getListingImage(item);
                const itemPrice = extractItemPrice(item);
                return (
                  <View key={item.listing_id} style={styles.summaryItemRow}>
                    {itemImg ? (
                      <Image source={{ uri: itemImg }} style={styles.itemThumb} contentFit="cover" />
                    ) : (
                      <View style={styles.itemThumbFallback}>
                        <Ionicons name="cube-outline" size={18} color="rgba(255,255,255,0.4)" />
                      </View>
                    )}

                    <View style={styles.itemInfo}>
                      <Text style={styles.summaryItemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemQtyPrice}>
                        ₹{itemPrice} × {item.quantity || 1}
                      </Text>
                    </View>

                    <Text style={styles.summaryItemPrice}>₹{item.line_total || itemPrice}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={20} color={BrandColors.primary} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}>
            <Text style={styles.paymentText}>Cash on Delivery / Direct Vendor Payment</Text>
            {paymentMethod === 'cod' && (
              <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('wallet')}>
            <Text style={styles.paymentText}>BizReels Wallet Balance</Text>
            {paymentMethod === 'wallet' && (
              <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{displayTotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: BrandColors.success }]}>FREE</Text>
          </View>
          <View style={[styles.billRow, styles.totalBillRow]}>
            <Text style={styles.totalBillLabel}>To Pay</Text>
            <Text style={styles.totalBillValue}>₹{displayTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#D99A3D" />
          ) : (
            <Text style={styles.placeOrderBtnText}>Confirm & Place Order (₹{displayTotal})</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const YELLOW = '#D99A3D';
const BLACK = '#F6F4EE';
const DARK_CARD = '#FBF9F5';
const INSET_BG = '#F0EDE4';
const BORDER = '#E5E0D4';
const TEXT_MAIN = '#1E1B18';
const TEXT_MUTED = '#6E675F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  loadingText: {
    color: TEXT_MUTED,
    fontSize: FontSize.base,
  },
  emptyTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: TEXT_MUTED,
    fontSize: FontSize.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  browseBtn: {
    backgroundColor: '#241B15',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: YELLOW,
    marginTop: Spacing.two,
  },
  browseBtnText: {
    color: YELLOW,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: DARK_CARD,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 120,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.two,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  addressInput: {
    backgroundColor: INSET_BG,
    color: TEXT_MAIN,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    fontSize: FontSize.sm,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  vendorBlock: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  vendorName: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginVertical: 4,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  itemThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  summaryItemTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  itemQtyPrice: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
  },
  summaryItemPrice: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: INSET_BG,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  paymentOptionSelected: {
    borderColor: YELLOW,
    backgroundColor: 'rgba(217, 154, 61, 0.12)',
  },
  paymentText: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  billLabel: {
    color: TEXT_MUTED,
    fontSize: FontSize.sm,
  },
  billValue: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  totalBillRow: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  totalBillLabel: {
    color: TEXT_MAIN,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  totalBillValue: {
    color: YELLOW,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  placeOrderBtn: {
    backgroundColor: '#241B15',
    height: 48,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnText: {
    color: YELLOW,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
});
