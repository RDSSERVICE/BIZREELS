import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
import { useCart, useCartCheckout } from '@/features/cart/queries';
import type { PaymentMethod } from '@/features/orders/types';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: cart } = useCart();
  const checkoutMutation = useCartCheckout();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const groups = cart?.groups || [];
  const totalAmount = cart?.total_amount || 0;

  const handlePlaceOrder = () => {
    if (!address.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your complete delivery address before placing your order.');
      return;
    }

    checkoutMutation.mutate(undefined, {
      onSuccess: (res) => {
        Alert.alert(
          '🎉 Order Placed Successfully!',
          `Your order request with ${res.deals?.length || 1} vendor(s) has been created! You can track your status in My Orders.`,
          [
            {
              text: 'View Orders',
              onPress: () => router.replace('/orders'),
            },
          ]
        );
      },
      onError: (err: any) => {
        Alert.alert('Checkout Failed', err.message || 'Unable to place order. Please try again.');
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <SymbolView name="chevron.left" size={22} tintColor="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SymbolView name="mappin.and.ellipse" size={20} tintColor={BrandColors.primary} />
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
            <SymbolView name="bag.fill" size={20} tintColor={BrandColors.primary} />
            <Text style={styles.cardTitle}>Order Items ({cart?.total_items || 0})</Text>
          </View>

          {groups.map((group) => (
            <View key={group.vendor_id} style={styles.vendorBlock}>
              <Text style={styles.vendorName}>{group.vendor?.name || 'Vendor Partner'}</Text>
              {group.items.map((item) => (
                <View key={item.listing_id} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemTitle} numberOfLines={1}>
                    {item.title} x {item.quantity}
                  </Text>
                  <Text style={styles.summaryItemPrice}>₹{item.line_total}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SymbolView name="creditcard.fill" size={20} tintColor={BrandColors.primary} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}>
            <Text style={styles.paymentText}>Cash on Delivery / Direct Vendor Payment</Text>
            {paymentMethod === 'cod' && (
              <SymbolView name="checkmark.circle.fill" size={20} tintColor={BrandColors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'wallet' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('wallet')}>
            <Text style={styles.paymentText}>BizReels Wallet Balance</Text>
            {paymentMethod === 'wallet' && (
              <SymbolView name="checkmark.circle.fill" size={20} tintColor={BrandColors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: BrandColors.success }]}>FREE</Text>
          </View>
          <View style={[styles.billRow, styles.totalBillRow]}>
            <Text style={styles.totalBillLabel}>To Pay</Text>
            <Text style={styles.totalBillValue}>₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
          disabled={checkoutMutation.isPending}>
          {checkoutMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderBtnText}>Confirm & Place Order (₹{totalAmount})</Text>
          )}
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
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 120,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  addressInput: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 8,
    padding: Spacing.three,
    fontSize: FontSize.sm,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  vendorBlock: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  vendorName: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItemTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    flex: 1,
  },
  summaryItemPrice: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c2c2e',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
  },
  paymentText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  billLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
  },
  billValue: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  totalBillRow: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  totalBillLabel: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  totalBillValue: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  placeOrderBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
