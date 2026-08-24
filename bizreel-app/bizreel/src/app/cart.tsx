import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
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
      removeItemMutation.mutate(listingId);
    } else {
      updateQuantityMutation.mutate({ listingId, quantity: newQty });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
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
                  <Text style={styles.vendorName}>{group.vendor?.name || 'Vendor Partner'}</Text>
                </View>

                {/* Items List */}
                {group.items.map((item) => {
                  const itemImg = resolveImageUrl(item.image) || getListingImage(item);
                  return (
                    <View key={item.listing_id} style={styles.itemRow}>
                      {itemImg ? (
                        <Image source={{ uri: itemImg }} style={styles.itemImage} />
                      ) : (
                        <View style={styles.itemImageFallback}>
                          <Ionicons name="bag-outline" size={20} color="#fff" />
                        </View>
                      )}

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                      </View>

                      {/* Quantity Controls */}
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQuantity(item.listing_id, item.quantity, -1)}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQuantity(item.listing_id, item.quantity, 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.vendorSubtotalRow}>
                  <Text style={styles.subtotalLabel}>Vendor Subtotal:</Text>
                  <Text style={styles.subtotalValue}>₹{group.subtotal}</Text>
                </View>
              </View>
            )}
          />

          {/* Bottom Checkout Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalPrice}>₹{totalAmount}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: BLACK,
    borderBottomWidth: 2,
    borderBottomColor: YELLOW,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 120,
    gap: Spacing.three,
  },
  vendorGroupCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.two,
  },
  vendorHeader: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.two,
  },
  vendorName: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 0,
  },
  itemImageFallback: {
    width: 56,
    height: 56,
    borderRadius: 0,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  itemPrice: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    gap: Spacing.two,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
  },
  qtyBtnText: {
    color: BLACK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  qtyText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  vendorSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  subtotalLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  subtotalValue: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginHorizontal: Spacing.four,
  },
  exploreBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 0,
    marginTop: Spacing.two,
  },
  exploreBtnText: {
    color: BLACK,
    fontWeight: '900',
    fontSize: FontSize.base,
  },
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  totalPrice: {
    color: YELLOW,
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  checkoutBtn: {
    backgroundColor: YELLOW,
    height: 48,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: BLACK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
});
