/**
 * Vendor Dynamic Offers & Coupons Engine Screen — Mobile Application
 * Complete 19-Type Offer Engine parity with Web Frontend OfferFormModal.jsx & OffersTab.jsx
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Shadows, Spacing } from '@/constants/theme';
import {
  CATEGORY_GROUPS,
  CATEGORY_KEYS,
  getCategoriesByGroup,
  OFFER_CATEGORIES,
  OfferCategoryMeta,
} from '@/constants/offerCategories';
import { useVendorListings } from '@/features/vendor-listings/queries';
import {
  useCreateVendorOffer,
  useDeleteVendorOffer,
  useDuplicateVendorOffer,
  useToggleVendorOfferStatus,
  useUpdateVendorOffer,
  useVendorOffers,
} from '@/features/vendor-offers/queries';

const YELLOW = '#D99A3D';
const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BLACK = '#F8FAFC';
const DARK_CARD = '#FFFFFF';
const BORDER = '#E2E8F0';

const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BIZ';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const getNowDate = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const getNextWeekDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

export default function VendorOffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: offers = [], isLoading, isRefetching, refetch } = useVendorOffers();
  const { data: listings = [] } = useVendorListings();

  const createOfferMutation = useCreateVendorOffer();
  const updateOfferMutation = useUpdateVendorOffer();
  const toggleStatusMutation = useToggleVendorOfferStatus();
  const duplicateOfferMutation = useDuplicateVendorOffer();
  const deleteOfferMutation = useDeleteVendorOffer();

  // Editing State
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Group Filter state: 'ALL' | 'Discounts' | 'Rewards & Loyalty' | 'Service & Package' | 'Marketing & Campaigns'
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Wizard Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [category, setCategory] = useState<string>('discount');
  const [offerName, setOfferName] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [couponCode, setCouponCode] = useState(generateCouponCode());
  const [startDate, setStartDate] = useState(getNowDate());
  const [endDate, setEndDate] = useState(getNextWeekDate());
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Config state
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('15');
  const [buyQty, setBuyQty] = useState('1');
  const [getQty, setGetQty] = useState('1');
  const [minOrderVal, setMinOrderVal] = useState('0');
  const [maxDiscountLimit, setMaxDiscountLimit] = useState('');

  const currentCategoryMeta = OFFER_CATEGORIES[category] || OFFER_CATEGORIES.discount;

  const filteredOffers = offers.filter((o) => {
    if (selectedGroup === 'ALL') return true;
    const catKey = o.category || 'discount';
    const catGroup = OFFER_CATEGORIES[catKey]?.group || 'Discounts';
    return catGroup === selectedGroup;
  });

  const handleOpenCreateModal = () => {
    setEditingOfferId(null);
    setCategory('discount');
    setOfferName(OFFER_CATEGORIES.discount.offerNames[0]);
    setTitle('');
    setDescription('');
    setCouponCode(generateCouponCode());
    setStartDate(getNowDate());
    setEndDate(getNextWeekDate());
    setSelectedProductIds([]);
    setDiscountType('percent');
    setDiscountValue('15');
    setBuyQty('1');
    setGetQty('1');
    setMinOrderVal('0');
    setMaxDiscountLimit('');
    setStep(1);
    setModalVisible(true);
  };

  const handleOpenEditModal = (item: any) => {
    const offerId = item._id || item.id;
    setEditingOfferId(offerId);
    const catKey = item.category || 'discount';
    setCategory(catKey);
    setOfferName(item.offerName || OFFER_CATEGORIES[catKey]?.offerNames[0] || '');
    setTitle(item.title || '');
    setDescription(item.description || '');
    setCouponCode(item.code || item.couponCode || generateCouponCode());
    setStartDate(item.startTime ? new Date(item.startTime).toISOString().slice(0, 10) : getNowDate());
    setEndDate(item.endTime ? new Date(item.endTime).toISOString().slice(0, 10) : getNextWeekDate());
    setSelectedProductIds(item.applicableProducts || item.applicableServices || []);

    const cfg = item.config || {};
    setDiscountType(item.discountType || cfg.discountType || 'percent');
    setDiscountValue(String(item.discountValue || item.discountPct || cfg.discountValue || '15'));
    setBuyQty(String(cfg.buyQuantity || '1'));
    setGetQty(String(cfg.getQuantity || '1'));
    setMinOrderVal(String(cfg.minOrderAmount || item.minOrderAmount || '0'));
    setMaxDiscountLimit(String(cfg.maxDiscountLimit || item.maxDiscountLimit || ''));
    setStep(2);
    setModalVisible(true);
  };

  const handleSelectCategory = (catKey: string) => {
    const meta = OFFER_CATEGORIES[catKey] || OFFER_CATEGORIES.discount;
    setCategory(catKey);
    setOfferName(meta.offerNames[0] || '');
    setStep(2);
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreateSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter an offer title.');
      setStep(2);
      return;
    }

    const val = parseFloat(discountValue) || 0;
    const payload = {
      category,
      offerName: offerName || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      code: couponCode.trim().toUpperCase(),
      couponCode: couponCode.trim().toUpperCase(),
      discountPct: discountType === 'percent' ? val : undefined,
      discountValue: val,
      discountType,
      startTime: startDate,
      endTime: endDate,
      validTill: endDate,
      applicableProducts: selectedProductIds,
      config: {
        discountType,
        discountValue: val,
        buyQuantity: parseInt(buyQty || '1', 10),
        getQuantity: parseInt(getQty || '1', 10),
        minOrderAmount: parseFloat(minOrderVal) || 0,
        maxDiscountLimit: parseFloat(maxDiscountLimit) || undefined,
      },
      status: 'Active',
    };

    if (editingOfferId) {
      updateOfferMutation.mutate(
        { id: editingOfferId, ...payload },
        {
          onSuccess: () => {
            Alert.alert('🎉 Offer Updated!', `Offer "${title}" has been updated successfully!`);
            setModalVisible(false);
            setEditingOfferId(null);
          },
          onError: (err: any) =>
            Alert.alert('Update Error', err?.response?.data?.message || err?.message || 'Failed to update offer.'),
        }
      );
    } else {
      createOfferMutation.mutate(payload, {
        onSuccess: () => {
          Alert.alert('🚀 Offer Created!', `Offer "${title}" has been activated successfully!`);
          setModalVisible(false);
        },
        onError: (err: any) =>
          Alert.alert('Creation Error', err?.response?.data?.message || err?.message || 'Failed to create offer.'),
      });
    }
  };

  const handleToggleStatus = (offerId: string) => {
    toggleStatusMutation.mutate(offerId);
  };

  const handleDuplicateOffer = (offerId: string, title: string) => {
    duplicateOfferMutation.mutate(offerId, {
      onSuccess: () => Alert.alert('Offer Duplicated', `Duplicated "${title}" as a draft offer!`),
    });
  };

  const handleDeleteOffer = (offerId: string, offerTitle: string) => {
    Alert.alert('Revoke Offer', `Are you sure you want to delete offer "${offerTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteOfferMutation.mutate(offerId),
      },
    ]);
  };

  const getOfferHighlightText = (item: any) => {
    const catKey = item.category || 'discount';
    const cfg = item.config || {};
    const val = item.discountValue || item.discountPct || cfg.discountValue || 0;

    switch (catKey) {
      case 'discount':
        return cfg.discountType === 'fixed' ? `₹${val} FLAT OFF` : `${val}% OFF`;
      case 'buy_x_get_y':
        return `BUY ${cfg.buyQuantity || 1} GET ${cfg.getQuantity || 1}`;
      case 'free_product':
        return 'FREE GIFT ITEM';
      case 'combo':
        return `COMBO BUNDLE`;
      case 'coupon':
        return `CODE: ${item.code || item.couponCode || 'PROMO'}`;
      case 'first_order':
        return `FIRST ORDER ${val}% OFF`;
      case 'repeat_customer':
        return `LOYALTY PERK`;
      case 'flash_sale':
        return `⚡ FLASH ${val}% OFF`;
      case 'festival_seasonal':
        return `🎊 FESTIVAL DEAL`;
      case 'free_delivery':
        return `FREE SHIPPING`;
      case 'minimum_order':
        return `MIN ORDER ₹${cfg.minOrderAmount || 0}`;
      default:
        return val > 0 ? `${val}% OFF` : 'PROMO DEAL';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Dynamic Offers Engine (19 Types)
        </Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={handleOpenCreateModal}>
          <Ionicons name="add" size={20} color={BLACK} />
        </TouchableOpacity>
      </View>

      {/* Category Group Filter Scroll */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORY_GROUPS.map((group) => {
            const isSelected = selectedGroup === group.key;
            return (
              <TouchableOpacity
                key={group.key}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedGroup(group.key)}>
                <Text style={styles.filterIcon}>{group.icon}</Text>
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>{group.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Offers Dashboard List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={YELLOW} />
        </View>
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={YELLOW}
              colors={[YELLOW]}
            />
          }
          renderItem={({ item }) => {
            const meta = OFFER_CATEGORIES[item.category || 'discount'] || OFFER_CATEGORIES.discount;
            const highlight = getOfferHighlightText(item);
            const isActive = item.is_active !== false && item.status !== 'Disabled';

            return (
              <View style={styles.offerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeIcon}>{meta.icon}</Text>
                    <Text style={styles.catBadgeText}>{meta.label}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, isActive ? styles.statusActive : styles.statusDisabled]}
                      onPress={() => handleToggleStatus(item._id)}>
                      <Text style={styles.statusToggleText}>{isActive ? '● ACTIVE' : '○ DISABLED'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleOpenEditModal(item)}>
                      <Ionicons name="create-outline" size={18} color={YELLOW} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDuplicateOffer(item._id, item.title)}>
                      <Ionicons name="copy-outline" size={18} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteOffer(item._id, item.title)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardMain}>
                  <View style={styles.highlightBadge}>
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                  <Text style={styles.offerTitle}>{item.title}</Text>
                  {item.description && <Text style={styles.offerDesc}>{item.description}</Text>}
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.couponCodePill}>
                    <Ionicons name="pricetag" size={12} color={YELLOW} />
                    <Text style={styles.couponCodeText}>{item.code || item.couponCode || 'BIZPROMO'}</Text>
                  </View>

                  <Text style={styles.validText}>
                    Till: {item.endTime ? new Date(item.endTime).toLocaleDateString('en-IN') : 'Ongoing'}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetags-outline" size={56} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>No Offers Created Yet</Text>
              <Text style={styles.emptySub}>
                Launch high-conversion coupons, BOGO deals, flash sales & cashback rewards in seconds.
              </Text>
              <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreateModal}>
                <Ionicons name="add" size={18} color={BLACK} />
                <Text style={styles.createBtnText}>CREATE NEW OFFER</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── 3-STEP DYNAMIC CREATION WIZARD MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: insets.top + 20 }]}>
            {/* Modal Header Bar */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Create Dynamic Offer</Text>
                <Text style={styles.modalSub}>19 Offer Engine Categories</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Step Wizard Indicator Bar */}
            <View style={styles.wizardPillRow}>
              <TouchableOpacity
                style={[styles.wizardStepBtn, step === 1 && styles.wizardStepBtnActive]}
                onPress={() => setStep(1)}>
                <Text style={[styles.wizardStepText, step === 1 && styles.wizardStepTextActive]}>
                  1. Category ({category})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.wizardStepBtn, step === 2 && styles.wizardStepBtnActive]}
                onPress={() => setStep(2)}>
                <Text style={[styles.wizardStepText, step === 2 && styles.wizardStepTextActive]}>
                  2. General
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.wizardStepBtn, step === 3 && styles.wizardStepBtnActive]}
                onPress={() => setStep(3)}>
                <Text style={[styles.wizardStepText, step === 3 && styles.wizardStepTextActive]}>
                  3. Config
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* ── WIZARD STEP 1: CATEGORY SELECTION (19 Engine Types) ── */}
              {step === 1 && (
                <View style={styles.wizardStepGroup}>
                  <Text style={styles.wizardSectionTitle}>SELECT 1 OF 19 OFFER ENGINE TYPES *</Text>
                  <Text style={styles.wizardSectionSub}>
                    Choose the promotional campaign format for your store:
                  </Text>

                  <View style={styles.categoryGrid}>
                    {CATEGORY_KEYS.map((catKey) => {
                      const meta = OFFER_CATEGORIES[catKey];
                      const isSelected = category === catKey;

                      return (
                        <TouchableOpacity
                          key={catKey}
                          style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                          onPress={() => handleSelectCategory(catKey)}>
                          <View style={styles.categoryCardTop}>
                            <Text style={styles.categoryIcon}>{meta.icon}</Text>
                            {isSelected && <Ionicons name="checkmark-circle" size={18} color={YELLOW} />}
                          </View>

                          <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                            {meta.label}
                          </Text>
                          <Text style={styles.categoryDesc} numberOfLines={2}>
                            {meta.description}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── WIZARD STEP 2: GENERAL & TARGET DETAILS ── */}
              {step === 2 && (
                <View style={styles.wizardStepGroup}>
                  <View style={styles.selectedMetaBox}>
                    <Text style={styles.metaIcon}>{currentCategoryMeta.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metaTitle}>{currentCategoryMeta.label} Offer</Text>
                      <Text style={styles.metaDesc}>{currentCategoryMeta.description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setStep(1)}>
                      <Text style={styles.changeBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFER DISPLAY NAME *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                      {currentCategoryMeta.offerNames.map((name, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.chip, offerName === name && styles.chipActive]}
                          onPress={() => setOfferName(name)}>
                          <Text style={[styles.chipText, offerName === name && styles.chipTextActive]}>
                            {name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFER TITLE *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Mega Weekend 20% Discount"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <View style={styles.labelRow}>
                        <Text style={styles.fieldLabel}>COUPON CODE *</Text>
                        <TouchableOpacity onPress={() => setCouponCode(generateCouponCode())}>
                          <Text style={styles.autoGenBtnText}>⚡ Auto Gen</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="BIZ500"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={couponCode}
                        onChangeText={setCouponCode}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>START DATE (YYYY-MM-DD)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={startDate}
                        onChangeText={setStartDate}
                      />
                    </View>

                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>END DATE (YYYY-MM-DD)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={endDate}
                        onChangeText={setEndDate}
                      />
                    </View>
                  </View>

                  {/* Applicable Products Selection */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>APPLICABLE STORE PRODUCTS ({selectedProductIds.length} Selected)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                      <TouchableOpacity
                        style={[styles.chip, selectedProductIds.length === 0 && styles.chipActive]}
                        onPress={() => setSelectedProductIds([])}>
                        <Text style={[styles.chipText, selectedProductIds.length === 0 && styles.chipTextActive]}>
                          All Products & Services
                        </Text>
                      </TouchableOpacity>

                      {listings.map((item) => {
                        const isSelected = selectedProductIds.includes(item._id);
                        return (
                          <TouchableOpacity
                            key={item._id}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => toggleProductSelection(item._id)}>
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {isSelected ? '✓ ' : ''}{item.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OFFER DESCRIPTION / TERMS</Text>
                    <TextInput
                      style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                      placeholder="e.g. Applicable on purchases above ₹500..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                  </View>

                  <TouchableOpacity style={styles.nextWizardBtn} onPress={() => setStep(3)}>
                    <Text style={styles.nextWizardBtnText}>CONTINUE TO OFFER CONFIG →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── WIZARD STEP 3: ENGINE CONFIGURATION ── */}
              {step === 3 && (
                <View style={styles.wizardStepGroup}>
                  <Text style={styles.wizardSectionTitle}>OFFER RULE & CONFIGURATION</Text>

                  {/* Config Type (Percent vs Fixed) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>DISCOUNT FORMAT</Text>
                    <View style={styles.typeRow}>
                      <TouchableOpacity
                        style={[styles.typeChip, discountType === 'percent' && styles.typeChipActive]}
                        onPress={() => setDiscountType('percent')}>
                        <Text style={[styles.typeChipText, discountType === 'percent' && styles.typeChipTextActive]}>
                          Percentage (% OFF)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.typeChip, discountType === 'fixed' && styles.typeChipActive]}
                        onPress={() => setDiscountType('fixed')}>
                        <Text style={[styles.typeChipText, discountType === 'fixed' && styles.typeChipTextActive]}>
                          Flat Value (₹ FLAT OFF)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>
                        {discountType === 'percent' ? 'DISCOUNT PERCENT (%)' : 'DISCOUNT AMOUNT (₹)'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder={discountType === 'percent' ? '15' : '200'}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={discountValue}
                        onChangeText={setDiscountValue}
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>MIN ORDER CART AMOUNT (₹)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={minOrderVal}
                        onChangeText={setMinOrderVal}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  {category === 'buy_x_get_y' && (
                    <View style={styles.row}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>BUY QUANTITY (X)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="1"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={buyQty}
                          onChangeText={setBuyQty}
                          keyboardType="number-pad"
                        />
                      </View>

                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>GET FREE QUANTITY (Y)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="1"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={getQty}
                          onChangeText={setGetQty}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>MAX DISCOUNT LIMIT CAP (₹ OPTIONAL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 500"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={maxDiscountLimit}
                      onChangeText={setMaxDiscountLimit}
                      keyboardType="number-pad"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitOfferBtn}
                    onPress={handleCreateSubmit}
                    disabled={createOfferMutation.isPending}>
                    {createOfferMutation.isPending ? (
                      <ActivityIndicator color={BLACK} />
                    ) : (
                      <Text style={styles.submitOfferBtnText}>🚀 LAUNCH PROMOTIONAL OFFER</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#241B15',
    borderBottomWidth: 2,
    borderBottomColor: '#D99A3D',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D99A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Shadows.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#241B15',
    borderColor: '#D99A3D',
  },
  filterIcon: {
    fontSize: 12,
  },
  filterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#D99A3D',
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: 12,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catBadgeIcon: {
    fontSize: 11,
  },
  catBadgeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  statusDisabled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  statusToggleText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '900',
  },
  cardMain: {
    gap: 4,
  },
  highlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#D99A3D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  highlightText: {
    color: '#D99A3D',
    fontSize: 10,
    fontWeight: '900',
  },
  offerTitle: {
    color: '#0F172A',
    fontSize: FontSize.sm,
    fontWeight: '900',
    marginTop: 2,
  },
  offerDesc: {
    color: '#64748B',
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  couponCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#D99A3D',
  },
  couponCodeText: {
    color: '#D99A3D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  validText: {
    color: '#64748B',
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptySub: {
    color: '#64748B',
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#241B15',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9999,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D99A3D',
  },
  createBtnText: {
    color: '#D99A3D',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: '#241B15',
    borderBottomWidth: 2,
    borderBottomColor: '#D99A3D',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  modalSub: {
    color: '#D99A3D',
    fontSize: 10,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardPillRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  wizardStepBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wizardStepBtnActive: {
    backgroundColor: '#241B15',
    borderColor: '#D99A3D',
  },
  wizardStepText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  wizardStepTextActive: {
    color: '#D99A3D',
    fontWeight: '900',
  },
  modalScroll: {
    padding: Spacing.four,
    gap: 16,
  },
  wizardStepGroup: {
    gap: 14,
  },
  wizardSectionTitle: {
    color: '#241B15',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  wizardSectionSub: {
    color: '#64748B',
    fontSize: 11,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    ...Shadows.sm,
  },
  categoryCardActive: {
    borderColor: '#D99A3D',
    backgroundColor: '#FFFBEB',
  },
  categoryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  categoryLabelActive: {
    color: '#D99A3D',
  },
  categoryDesc: {
    color: '#64748B',
    fontSize: 9,
  },
  selectedMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D99A3D',
  },
  metaIcon: {
    fontSize: 24,
  },
  metaTitle: {
    color: '#D99A3D',
    fontSize: 12,
    fontWeight: '900',
  },
  metaDesc: {
    color: '#64748B',
    fontSize: 10,
  },
  changeBtnText: {
    color: '#D99A3D',
    fontSize: 10,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipScroll: {
    gap: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#241B15',
    borderColor: '#D99A3D',
  },
  chipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#D99A3D',
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: FontSize.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoGenBtnText: {
    color: '#D99A3D',
    fontSize: 9,
    fontWeight: '900',
  },
  nextWizardBtn: {
    backgroundColor: '#241B15',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D99A3D',
  },
  nextWizardBtnText: {
    color: '#D99A3D',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#241B15',
    borderColor: '#D99A3D',
  },
  typeChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  typeChipTextActive: {
    color: '#D99A3D',
    fontWeight: '900',
  },
  submitOfferBtn: {
    backgroundColor: '#241B15',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D99A3D',
  },
  submitOfferBtnText: {
    color: '#D99A3D',
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
