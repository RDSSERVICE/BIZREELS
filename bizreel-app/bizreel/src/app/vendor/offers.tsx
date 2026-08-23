/**
 * Vendor Offers & Coupons Screen — Create & Manage Promotional Offers.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCreateVendorOffer, useDeleteVendorOffer, useVendorOffers } from '@/features/vendor-offers/queries';

export default function VendorOffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: offers = [], isLoading, isRefetching, refetch } = useVendorOffers();
  const createOfferMutation = useCreateVendorOffer();
  const deleteOfferMutation = useDeleteVendorOffer();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [validTill, setValidTill] = useState('');
  const [description, setDescription] = useState('');

  function handleCreateOffer() {
    if (!title.trim() || !discountPct.trim() || !couponCode.trim()) {
      Alert.alert('Missing Info', 'Please enter title, discount %, and coupon code.');
      return;
    }

    const pct = parseFloat(discountPct);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      Alert.alert('Invalid Discount', 'Discount % must be between 1 and 100.');
      return;
    }

    createOfferMutation.mutate(
      {
        title: title.trim(),
        discountPct: pct,
        couponCode: couponCode.trim().toUpperCase(),
        validTill: validTill.trim() || undefined,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Offer Created', `Coupon code ${couponCode.toUpperCase()} published!`);
          setModalVisible(false);
          setTitle('');
          setDiscountPct('');
          setCouponCode('');
          setValidTill('');
          setDescription('');
        },
        onError: (err: any) => Alert.alert('Creation Failed', err.message),
      }
    );
  }

  function handleDeleteOffer(id: string, code: string) {
    Alert.alert('Revoke Offer', `Delete coupon ${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteOfferMutation.mutate(id, {
            onSuccess: () => Alert.alert('Deleted', 'Offer deleted successfully.'),
          });
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotional Offers & Coupons</Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.offerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.codeBadge}>
                  <Ionicons name="pricetag" size={14} color="#fff" />
                  <Text style={styles.codeText}>{item.couponCode}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteOffer(item._id, item.couponCode)}>
                  <Ionicons name="trash-outline" size={18} color={BrandColors.error} />
                </TouchableOpacity>
              </View>

              <Text style={styles.offerTitle}>{item.title}</Text>
              {item.description && <Text style={styles.offerSub}>{item.description}</Text>}

              <View style={styles.footerRow}>
                <Text style={styles.discountText}>{item.discountPct}% OFF</Text>
                {item.validTill && <Text style={styles.validText}>Valid till: {item.validTill}</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetags-outline" size={56} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Offers Created</Text>
              <Text style={styles.emptySub}>
                Boost your sales by creating special promotional coupons and discounts.
              </Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.createBtnText}>Create New Offer</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Offer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Special Offer</Text>

            <TextInput
              style={styles.input}
              placeholder="Offer Title (e.g. Festival Special Discount)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Coupon Code (e.g. FESTIVAL20)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Discount Percentage % (e.g. 20)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={discountPct}
              onChangeText={setDiscountPct}
              keyboardType="number-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Valid Till Date (e.g. 2026-12-31)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={validTill}
              onChangeText={setValidTill}
            />

            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Offer description or terms..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateOffer}
              disabled={createOfferMutation.isPending}>
              {createOfferMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Publish Offer</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  offerCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BrandColors.primary + '50',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  codeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  offerTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  offerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  discountText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  validText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    gap: 6,
    marginTop: Spacing.two,
  },
  createBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
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
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.sm,
  },
  submitBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
