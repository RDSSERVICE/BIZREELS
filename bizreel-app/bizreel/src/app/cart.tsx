import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from '@/features/cart/queries';
import { getListingImage, resolveImageUrl } from '@/utils/image';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: cart, isLoading } = useCart();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeItemMutation = useRemoveFromCart();

  const groups = cart?.groups || [];
  const totalAmount = cart?.total_amount || 0;
  const totalItems = cart?.total_items || 0;

  const handleUpdateQuantity = (listingId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemoveItem(listingId);
    } else {
      updateQuantityMutation.mutate({ listingId, quantity: newQty });
    }
  };

  const handleRemoveItem = (listingId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this product from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItemMutation.mutate(listingId),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart ({totalItems})</Text>
        <View style={{ width: 36 }} />
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>Explore products and services on BizReels to start adding!</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.exploreBtnText}>Explore Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.vendor_id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: group }) => (
              <View style={styles.vendorGroupCard}>
                {/* Vendor Header */}
                <View style={styles.vendorHeader}>
                  <Ionicons name="storefront-outline" size={16} color={YELLOW} />
                  <Text style={styles.vendorName}>{group.vendor?.name || 'Vendor Partner'}</Text>
                </View>

                {/* Items List */}
                {group.items.map((item: any) => {
                  const itemImg = resolveImageUrl(item.image) || getListingImage(item);
                  const priceVal = Number(item.price || item.line_total || 0);
                  const itemTotal = priceVal * (item.quantity || 1);

                  return (
                    <View key={item.listing_id} style={styles.itemRow}>
                      {/* Product Thumbnail (Clickable) */}
                      <TouchableOpacity onPress={() => router.push(`/listing/${item.listing_id}`)}>
                        {itemImg ? (
                          <Image source={{ uri: itemImg }} style={styles.itemImage} contentFit="cover" />
                        ) : (
                          <View style={styles.itemImageFallback}>
                            <Ionicons name="bag-outline" size={20} color="rgba(255,255,255,0.4)" />
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Product Details (Clickable) */}
                      <TouchableOpacity
                        style={styles.itemDetails}
                        onPress={() => router.push(`/listing/${item.listing_id}`)}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.itemPrice}>₹{priceVal.toLocaleString('en-IN')}</Text>
                        <Text style={styles.lineTotalText}>Subtotal: ₹{itemTotal.toLocaleString('en-IN')}</Text>
                      </TouchableOpacity>

                      {/* Quantity Stepper & Remove Trash Button */}
                      <View style={styles.actionsColumn}>
                        {/* Remove Trash Button */}
                        <TouchableOpacity
                          style={styles.trashBtn}
                          onPress={() => handleRemoveItem(item.listing_id)}
                          disabled={removeItemMutation.isPending}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>

                        {/* Quantity Stepper */}
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleUpdateQuantity(item.listing_id, item.quantity, -1)}
                            disabled={updateQuantityMutation.isPending}>
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>

                          <Text style={styles.qtyText}>{item.quantity}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleUpdateQuantity(item.listing_id, item.quantity, 1)}
                            disabled={updateQuantityMutation.isPending}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.vendorSubtotalRow}>
                  <Text style={styles.subtotalLabel}>Vendor Subtotal:</Text>
                  <Text style={styles.subtotalValue}>₹{group.subtotal.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}
          />

          {/* Bottom Checkout Footer */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalPrice}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout')}>
              <Ionicons name="flash-outline" size={18} color={BLACK} />
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BLACK },
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
  iconBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  listContent: { padding: Spacing.four, paddingBottom: 120, gap: Spacing.three },

  vendorGroupCard: {
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.two,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.two,
  },
  vendorName: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemImage: { width: 64, height: 64, backgroundColor: BLACK },
  itemImageFallback: {
    width: 64,
    height: 64,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: { flex: 1, gap: 2 },
  itemTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900', lineHeight: 18 },
  itemPrice: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  lineTotalText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },

  actionsColumn: { alignItems: 'flex-end', gap: 6 },
  trashBtn: { padding: 4 },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
  },
  qtyBtnText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900' },
  qtyText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900', minWidth: 16, textAlign: 'center' },

  vendorSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  subtotalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs },
  subtotalValue: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900' },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  emptyTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '900' },
  emptySub: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.sm, textAlign: 'center' },
  exploreBtn: { backgroundColor: YELLOW, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, marginTop: Spacing.two },
  exploreBtnText: { color: BLACK, fontWeight: '900', fontSize: FontSize.base },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    gap: Spacing.three,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#fff', fontSize: FontSize.base, fontWeight: '900' },
  totalPrice: { color: YELLOW, fontSize: FontSize.xl, fontWeight: '900' },
  checkoutBtn: {
    flexDirection: 'row',
    backgroundColor: YELLOW,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnText: { color: BLACK, fontSize: FontSize.base, fontWeight: '900' },
});
