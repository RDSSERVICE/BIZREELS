/**
 * Customer Interest Onboarding & Management Screen
 * Full Feature Parity with Web InterestSelectionPage.jsx & InterestSelector.jsx
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
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

import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

interface SubCategoryItem {
  id?: string;
  name: string;
}

interface CategoryTreeItem {
  id?: string;
  _id?: string;
  name: string;
  icon?: string;
  subcategories: string[];
}

interface SelectedInterest {
  category: string;
  subcategory?: string | null;
}

const DEFAULT_TREE_CATEGORIES: CategoryTreeItem[] = [
  {
    name: 'Electronics & Tech',
    icon: 'laptop-outline',
    subcategories: ['Mobile Phones', 'Laptops & Computers', 'TV & Audio', 'Home Appliances', 'Cameras & Accessories'],
  },
  {
    name: 'Fashion & Apparel',
    icon: 'shirt-outline',
    subcategories: ['Men Clothing', 'Women Clothing', 'Kids Wear', 'Footwear', 'Jewelry & Watches'],
  },
  {
    name: 'AI & Technology Services',
    icon: 'sparkles-outline',
    subcategories: ['AI Video Generation & Editing', 'AI Content Writing & Copywriting', 'AI Graphic Design & Logos', 'AI Chatbot & Automation Setup', 'AI Voiceover & Audio'],
  },
  {
    name: 'Home & Furniture',
    icon: 'home-outline',
    subcategories: ['Living Room Furniture', 'Bedroom Furniture', 'Kitchen & Dining', 'Home Decor', 'Bedding & Furnishings'],
  },
  {
    name: 'Vehicles & Automotive',
    icon: 'car-outline',
    subcategories: ['Cars', 'Bikes & Scooters', 'Commercial Vehicles', 'Auto Parts & Accessories'],
  },
  {
    name: 'Beauty & Salon',
    icon: 'color-palette-outline',
    subcategories: ['Men Salon & Grooming', 'Women Beauty & Makeup', 'Bridal Packages', 'Spa & Wellness'],
  },
  {
    name: 'IT, Design & Marketing',
    icon: 'flash-outline',
    subcategories: ['Website & App Development', 'Graphic & Logo Design', 'Social Media & Digital Marketing', 'Reels & Video Content Shoot'],
  },
  {
    name: 'Real Estate & Property',
    icon: 'business-outline',
    subcategories: ['Property for Rent', 'Property for Sale', 'PG & Shared Hostels', 'Commercial Spaces'],
  },
  {
    name: 'Food & Grocery',
    icon: 'restaurant-outline',
    subcategories: ['Restaurants & Cafes', 'Fresh Grocery', 'Bakery & Sweets', 'Packaged Foods'],
  },
  {
    name: 'Repair & Maintenance',
    icon: 'construct-outline',
    subcategories: ['AC & Appliance Repair', 'Plumbing Services', 'Electrical Repair', 'Carpentry', 'Painting & Cleaning'],
  },
  {
    name: 'Events & Wedding Services',
    icon: 'calendar-outline',
    subcategories: ['Catering & Food Counter', 'Event Photography & Videography', 'Decoration & Stage Setup', 'DJ & Sound System'],
  },
  {
    name: 'Education & Coaching',
    icon: 'school-outline',
    subcategories: ['School & College Tuitions', 'Competitive Exam Coaching', 'Language & Skill Courses', 'Music & Arts'],
  },
];

export default function CustomerChooseInterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [categories, setCategories] = useState<CategoryTreeItem[]>(DEFAULT_TREE_CATEGORIES);
  const [selectedInterests, setSelectedInterests] = useState<SelectedInterest[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');

  // Load user initial interests and system category tree
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch categories tree from API
        const catRes = await api.get('/v1/categories?tree=true').catch(() => null);
        const rawItems = catRes?.data?.items || catRes?.data?.data || [];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const topLevel = rawItems.filter((c: any) => !c.parent_id);
          const formatted: CategoryTreeItem[] = topLevel.map((c: any) => ({
            id: c._id || c.id,
            name: c.name,
            icon: 'grid-outline',
            subcategories: Array.isArray(c.children) ? c.children.map((sub: any) => sub.name) : [],
          }));
          if (formatted.length > 0) {
            setCategories(formatted);
          }
        }

        // Fetch current user selected interests
        const userRes = await api.get('/v1/users/me/interests').catch(() => null);
        const uInterests = userRes?.data?.interests || userRes?.data?.data?.interests || (user as any)?.customerProfile?.interests || (user as any)?.interests || [];
        if (Array.isArray(uInterests) && uInterests.length > 0) {
          const parsed: SelectedInterest[] = uInterests.map((item: any) => {
            if (typeof item === 'string') return { category: item, subcategory: null };
            return { category: item.category || item.name, subcategory: item.subcategory || null };
          });
          setSelectedInterests(parsed);
        } else {
          // Default selection
          setSelectedInterests([
            { category: 'Electronics & Tech' },
            { category: 'Fashion & Apparel' },
            { category: 'AI & Technology Services' },
          ]);
        }
      } catch (err) {
        console.warn('Failed to load categories in InterestChooser:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    initData();
  }, [user]);

  const isSelected = (catName: string, subName: string | null = null) => {
    return selectedInterests.some(
      (s) => s.category === catName && s.subcategory === (subName || null)
    );
  };

  const isCategorySelected = (catName: string) => {
    return selectedInterests.some((s) => s.category === catName);
  };

  const toggleInterest = (catName: string, subName: string | null = null) => {
    if (subName === null) {
      const catAlreadySelected = selectedInterests.some((s) => s.category === catName && !s.subcategory);
      if (catAlreadySelected) {
        // Deselect category and all subcategories
        setSelectedInterests((prev) => prev.filter((s) => s.category !== catName));
      } else {
        // Select category
        setSelectedInterests((prev) => [...prev, { category: catName, subcategory: null }]);
      }
    } else {
      const subAlreadySelected = selectedInterests.some(
        (s) => s.category === catName && s.subcategory === subName
      );
      if (subAlreadySelected) {
        setSelectedInterests((prev) =>
          prev.filter((s) => !(s.category === catName && s.subcategory === subName))
        );
      } else {
        setSelectedInterests((prev) => [...prev, { category: catName, subcategory: subName }]);
      }
    }
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length < 3) {
      Alert.alert('Select Interests', 'Please select at least 3 categories or subcategories to personalize your feed.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/v1/users/me/interests', { interests: selectedInterests }).catch(() =>
        api.patch('/users/me', {
          customerProfile: {
            interests: selectedInterests,
            interestsSelectedAt: new Date().toISOString(),
          },
        })
      );

      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      if (updatedUser) {
        setUser({
          ...user,
          ...updatedUser,
        });
      }

      Alert.alert('🎯 Feed Preferences Saved!', 'Your personalized video reels and product recommendations have been updated.');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not save interest preferences.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = useMemo(() => {
    let result = categories;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subcategories.some((sub) => sub.toLowerCase().includes(q))
      );
    }
    if (filterMode === 'selected') {
      result = result.filter((c) => isCategorySelected(c.name));
    }
    return result;
  }, [categories, searchQuery, filterMode, selectedInterests]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>FEED INTERESTS & PREFERENCES</Text>
          <Text style={styles.headerSub}>Personalize Your Video Reels & Marketplace</Text>
        </View>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveInterests} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={BLACK} />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={YELLOW} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories (e.g. AI, Mobile, Fashion)..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'all' && styles.filterPillActive]}
            onPress={() => setFilterMode('all')}>
            <Text style={[styles.filterPillText, filterMode === 'all' && styles.filterPillTextActive]}>
              All Categories ({categories.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'selected' && styles.filterPillActive]}
            onPress={() => setFilterMode('selected')}>
            <Text style={[styles.filterPillText, filterMode === 'selected' && styles.filterPillTextActive]}>
              Selected ({selectedInterests.length})
            </Text>
          </TouchableOpacity>

          {selectedInterests.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={() => setSelectedInterests([])}>
              <Ionicons name="trash-outline" size={12} color="#EF4444" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={YELLOW} />
            <Text style={styles.loadingText}>Loading Categories Tree...</Text>
          </View>
        ) : (
          <View style={styles.categoriesWrap}>
            {filteredCategories.map((cat) => {
              const catSelected = isSelected(cat.name, null);
              const isExpanded = expandedCategory === cat.name;
              const selectedSubCount = selectedInterests.filter(
                (s) => s.category === cat.name && s.subcategory
              ).length;

              return (
                <View key={cat.name} style={[styles.categoryCard, catSelected && styles.categoryCardActive]}>
                  {/* Top Main Category Row */}
                  <View style={styles.categoryHeaderRow}>
                    <TouchableOpacity
                      style={styles.categorySelectBtn}
                      onPress={() => toggleInterest(cat.name)}>
                      <Ionicons
                        name={catSelected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={YELLOW}
                      />
                      <Text style={[styles.categoryTitle, catSelected && styles.categoryTitleActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>

                    {cat.subcategories.length > 0 && (
                      <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => setExpandedCategory(isExpanded ? null : cat.name)}>
                        {selectedSubCount > 0 && (
                          <View style={styles.subCountBadge}>
                            <Text style={styles.subCountBadgeText}>{selectedSubCount}</Text>
                          </View>
                        )}
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={YELLOW}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Subcategories Collapsible Grid */}
                  {(isExpanded || searchQuery.trim() !== '') && cat.subcategories.length > 0 && (
                    <View style={styles.subcategoriesBox}>
                      <Text style={styles.subHeaderLabel}>Subcategories:</Text>
                      <View style={styles.subWrap}>
                        {cat.subcategories.map((sub) => {
                          const subSelected = isSelected(cat.name, sub);
                          return (
                            <TouchableOpacity
                              key={sub}
                              style={[styles.subChip, subSelected && styles.subChipActive]}
                              onPress={() => toggleInterest(cat.name, sub)}>
                              <Ionicons
                                name={subSelected ? 'checkmark-circle' : 'add-circle-outline'}
                                size={14}
                                color={subSelected ? BLACK : YELLOW}
                              />
                              <Text style={[styles.subChipText, subSelected && styles.subChipTextActive]}>
                                {sub}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Save Action Bar */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerCountText}>
            {selectedInterests.length} Preferences Selected
          </Text>
          <Text style={styles.footerMinText}>Minimum 3 required for optimal feed tuning</Text>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSaveInterests}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color={BLACK} />
          ) : (
            <Text style={styles.submitBtnText}>Save Preferences & View Feed →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
  saveHeaderBtn: { backgroundColor: YELLOW, paddingHorizontal: 14, paddingVertical: 6 },
  saveHeaderBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },

  searchFilterSection: {
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, color: '#fff', fontSize: FontSize.xs },
  filterPillsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterPill: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterPillActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  filterPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
  filterPillTextActive: { color: BLACK, fontWeight: '900' },
  clearAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  clearAllText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingBottom: 100 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontSize: FontSize.xs, marginTop: 10, fontWeight: '700' },

  categoriesWrap: { gap: Spacing.three },
  categoryCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    gap: 8,
  },
  categoryCardActive: { borderColor: YELLOW },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categorySelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  categoryTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  categoryTitleActive: { color: YELLOW, fontWeight: '900' },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 10 },
  subCountBadge: { backgroundColor: YELLOW, paddingHorizontal: 6, paddingVertical: 2 },
  subCountBadgeText: { color: BLACK, fontSize: 9, fontWeight: '900' },

  subcategoriesBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    marginTop: 4,
    gap: 6,
  },
  subHeaderLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  subChipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  subChipText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  subChipTextActive: { color: BLACK, fontWeight: '900' },

  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerCountText: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  footerMinText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1 },
  submitBtn: { backgroundColor: YELLOW, paddingHorizontal: 16, height: 44, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
});
