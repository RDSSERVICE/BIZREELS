/**
 * Customer Feed Interest Onboarding & Preferences Screen
 * Next-Gen Modern Dark Aesthetic with Real-time Feed Personalization, 
 * Category Progress Tracker, Interactive Chip Selectors & Smooth Animations.
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

const GOLD = '#F59E0B';
const AMBER_LIGHT = '#FBBF24';
const BLACK = '#0D0D11';
const DARK_CARD = '#16161D';
const DARK_SURFACE = '#1E1E26';
const BORDER = '#2A2A36';
const BORDER_GOLD = '#D99A3D';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';

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
    icon: 'code-slash-outline',
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

const getCategoryIconName = (name: string, fallback?: string): keyof typeof Ionicons.glyphMap => {
  const n = (name || '').toLowerCase();
  if (n.includes('electronic') || n.includes('laptop') || n.includes('tech')) return 'laptop-outline';
  if (n.includes('fashion') || n.includes('apparel') || n.includes('cloth')) return 'shirt-outline';
  if (n.includes('ai') || n.includes('smart') || n.includes('robot')) return 'sparkles-outline';
  if (n.includes('home') || n.includes('furniture') || n.includes('decor')) return 'home-outline';
  if (n.includes('vehicle') || n.includes('car') || n.includes('bike')) return 'car-outline';
  if (n.includes('beauty') || n.includes('salon') || n.includes('spa')) return 'color-palette-outline';
  if (n.includes('it') || n.includes('design') || n.includes('code') || n.includes('web')) return 'code-slash-outline';
  if (n.includes('real estate') || n.includes('property') || n.includes('rent')) return 'business-outline';
  if (n.includes('food') || n.includes('restaurant') || n.includes('cafe')) return 'restaurant-outline';
  if (n.includes('repair') || n.includes('plumb') || n.includes('maintenance')) return 'construct-outline';
  if (n.includes('event') || n.includes('wedding') || n.includes('cater')) return 'calendar-outline';
  if (n.includes('education') || n.includes('school') || n.includes('course')) return 'school-outline';
  return (fallback as any) || 'grid-outline';
};

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

  // Load user initial interests & backend category tree
  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await api.get('/v1/categories?tree=true').catch(() => null);
        const rawItems = catRes?.data?.items || catRes?.data?.data || [];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const topLevel = rawItems.filter((c: any) => !c.parent_id);
          const formatted: CategoryTreeItem[] = topLevel.map((c: any) => ({
            id: c._id || c.id,
            name: c.name,
            icon: getCategoryIconName(c.name),
            subcategories: Array.isArray(c.children) ? c.children.map((sub: any) => sub.name) : [],
          }));
          if (formatted.length > 0) {
            setCategories(formatted);
          }
        }

        const userRes = await api.get('/v1/users/me/interests').catch(() => null);
        const uInterests =
          userRes?.data?.interests ||
          userRes?.data?.data?.interests ||
          (user as any)?.customerProfile?.interests ||
          (user as any)?.interests ||
          [];

        if (Array.isArray(uInterests) && uInterests.length > 0) {
          const parsed: SelectedInterest[] = uInterests.map((item: any) => {
            if (typeof item === 'string') return { category: item, subcategory: null };
            return { category: item.category || item.name, subcategory: item.subcategory || null };
          });
          setSelectedInterests(parsed);
        } else {
          // Default selection
          setSelectedInterests([
            { category: 'Electronics & Tech', subcategory: null },
            { category: 'Fashion & Apparel', subcategory: null },
            { category: 'AI & Technology Services', subcategory: null },
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

  const toggleSelectAllSubcategories = (cat: CategoryTreeItem) => {
    const allSubsSelected = cat.subcategories.every((sub) => isSelected(cat.name, sub));
    if (allSubsSelected) {
      // Remove all subcategories for this category
      setSelectedInterests((prev) => prev.filter((s) => s.category !== cat.name));
    } else {
      // Add category + all subcategories
      const nonCatOthers = selectedInterests.filter((s) => s.category !== cat.name);
      const newCatItems: SelectedInterest[] = [
        { category: cat.name, subcategory: null },
        ...cat.subcategories.map((sub) => ({ category: cat.name, subcategory: sub })),
      ];
      setSelectedInterests([...nonCatOthers, ...newCatItems]);
    }
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length < 3) {
      Alert.alert(
        'Select More Interests',
        'Please select at least 3 categories or subcategories to personalize your video reels feed.'
      );
      return;
    }

    setSaving(true);
    try {
      const res = await api
        .patch('/v1/users/me/interests', { interests: selectedInterests })
        .catch(() =>
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

      Alert.alert(
        '✨ Feed Personalization Updated!',
        'Your custom video reels, trending products, and local vendor deals have been tailored to your interests.'
      );
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

  const targetRequirementCount = 3;
  const progressRatio = Math.min(1, selectedInterests.length / targetRequirementCount);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 1. HEADER HERO BAR ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={11} color={BLACK} />
              <Text style={styles.sparkleBadgeText}>PERSONALIZED FEED</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Feed Preferences</Text>
          <Text style={styles.headerSub}>Customize Reels, Local Deals & Recommendations</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          onPress={handleSaveInterests}
          disabled={saving}
          activeOpacity={0.8}>
          {saving ? (
            <ActivityIndicator size="small" color={BLACK} />
          ) : (
            <View style={styles.saveHeaderContent}>
              <Ionicons name="checkmark-done" size={15} color={BLACK} />
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── 2. PROGRESS BANNER CARD ── */}
      <View style={styles.progressCard}>
        <View style={styles.progressTopRow}>
          <View style={styles.progressIconWrap}>
            <Ionicons name="options-outline" size={18} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>
              {selectedInterests.length >= targetRequirementCount
                ? '🎉 Perfect! Minimum Goal Reached'
                : `Select ${targetRequirementCount - selectedInterests.length} More Interest${
                    targetRequirementCount - selectedInterests.length > 1 ? 's' : ''
                  }`}
            </Text>
            <Text style={styles.progressDesc}>
              {selectedInterests.length} item{selectedInterests.length !== 1 ? 's' : ''} chosen for your recommendation engine
            </Text>
          </View>
          <View style={styles.progressCounterPill}>
            <Text style={styles.progressCounterText}>
              {selectedInterests.length} / {targetRequirementCount}
            </Text>
          </View>
        </View>

        {/* Progress Bar Line */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
        </View>
      </View>

      {/* ── 3. SEARCH & FILTER TABS ── */}
      <View style={styles.searchFilterSection}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={GOLD} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories (e.g. AI, Electronics, Fashion)..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'all' && styles.filterPillActive]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.8}>
            <Ionicons
              name="grid-outline"
              size={12}
              color={filterMode === 'all' ? BLACK : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.filterPillText, filterMode === 'all' && styles.filterPillTextActive]}>
              All ({categories.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterMode === 'selected' && styles.filterPillActive]}
            onPress={() => setFilterMode('selected')}
            activeOpacity={0.8}>
            <Ionicons
              name="checkmark-circle-outline"
              size={12}
              color={filterMode === 'selected' ? BLACK : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.filterPillText, filterMode === 'selected' && styles.filterPillTextActive]}>
              Selected ({selectedInterests.length})
            </Text>
          </TouchableOpacity>

          {selectedInterests.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={() => setSelectedInterests([])}
              activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={13} color="#EF4444" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 4. CATEGORY & SUBCATEGORY CARDS FEED ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={styles.loadingText}>Fetching Category Catalog...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="search" size={40} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No matching categories found</Text>
            <Text style={styles.emptySub}>Try searching for another term like "AI", "Mobile" or "Services"</Text>
            <TouchableOpacity style={styles.resetSearchBtn} onPress={() => { setSearchQuery(''); setFilterMode('all'); }}>
              <Text style={styles.resetSearchText}>Clear Search Filter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoriesWrap}>
            {filteredCategories.map((cat) => {
              const catSelected = isSelected(cat.name, null);
              const isExpanded = expandedCategory === cat.name;
              const selectedSubCount = selectedInterests.filter(
                (s) => s.category === cat.name && s.subcategory
              ).length;
              const catIconName = getCategoryIconName(cat.name, cat.icon);
              const allSubsSelected =
                cat.subcategories.length > 0 &&
                cat.subcategories.every((sub) => isSelected(cat.name, sub));

              return (
                <View
                  key={cat.name}
                  style={[styles.categoryCard, (catSelected || selectedSubCount > 0) && styles.categoryCardActive]}>
                  {/* Top Main Category Header */}
                  <View style={styles.categoryHeaderRow}>
                    <TouchableOpacity
                      style={styles.categorySelectBtn}
                      onPress={() => toggleInterest(cat.name)}
                      activeOpacity={0.7}>
                      <View style={[styles.iconCircle, (catSelected || selectedSubCount > 0) && styles.iconCircleActive]}>
                        <Ionicons
                          name={catIconName}
                          size={18}
                          color={catSelected || selectedSubCount > 0 ? BLACK : GOLD}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryTitle, catSelected && styles.categoryTitleActive]}>
                          {cat.name}
                        </Text>
                        <Text style={styles.subCountText}>
                          {cat.subcategories.length} subcategories
                          {selectedSubCount > 0 ? ` • ${selectedSubCount} selected` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.actionHeaderRight}>
                      {/* Checkbox Icon for main category */}
                      <TouchableOpacity
                        style={[styles.checkboxBtn, catSelected && styles.checkboxBtnActive]}
                        onPress={() => toggleInterest(cat.name)}
                        activeOpacity={0.7}>
                        <Ionicons
                          name={catSelected ? 'checkmark' : 'add'}
                          size={16}
                          color={catSelected ? BLACK : GOLD}
                        />
                      </TouchableOpacity>

                      {/* Expand / Collapse Arrow */}
                      {cat.subcategories.length > 0 && (
                        <TouchableOpacity
                          style={styles.expandBtn}
                          onPress={() => setExpandedCategory(isExpanded ? null : cat.name)}
                          activeOpacity={0.7}>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={isExpanded ? GOLD : 'rgba(255,255,255,0.6)'}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Subcategories Box (Accordion) */}
                  {(isExpanded || searchQuery.trim() !== '') && cat.subcategories.length > 0 && (
                    <View style={styles.subcategoriesBox}>
                      <View style={styles.subHeaderRow}>
                        <Text style={styles.subHeaderLabel}>SELECT SUBCATEGORIES:</Text>

                        <TouchableOpacity
                          onPress={() => toggleSelectAllSubcategories(cat)}
                          style={styles.selectAllSubsBtn}
                          activeOpacity={0.7}>
                          <Ionicons
                            name={allSubsSelected ? 'checkmark-circle' : 'checkmark-circle-outline'}
                            size={13}
                            color={GOLD}
                          />
                          <Text style={styles.selectAllSubsText}>
                            {allSubsSelected ? 'Deselect All' : 'Select All'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.subWrap}>
                        {cat.subcategories.map((sub) => {
                          const subSelected = isSelected(cat.name, sub);
                          return (
                            <TouchableOpacity
                              key={sub}
                              style={[styles.subChip, subSelected && styles.subChipActive]}
                              onPress={() => toggleInterest(cat.name, sub)}
                              activeOpacity={0.8}>
                              <Ionicons
                                name={subSelected ? 'checkmark-circle' : 'add-circle-outline'}
                                size={14}
                                color={subSelected ? BLACK : GOLD}
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

      {/* ── 5. FLOATING BOTTOM ACTION BAR ── */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerCountText}>
            {selectedInterests.length} Preference{selectedInterests.length !== 1 ? 's' : ''} Picked
          </Text>
          <Text style={styles.footerMinText}>
            {selectedInterests.length >= targetRequirementCount
              ? 'Ready to fine-tune your algorithm!'
              : `Pick ${targetRequirementCount - selectedInterests.length} more for optimal feed tuning`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, selectedInterests.length < targetRequirementCount && styles.submitBtnDisabled]}
          onPress={handleSaveInterests}
          disabled={saving}
          activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color={BLACK} />
          ) : (
            <View style={styles.submitBtnContent}>
              <Text style={styles.submitBtnText}>Save & Apply</Text>
              <Ionicons name="arrow-forward" size={16} color={BLACK} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },

  /* Header Bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: DARK_SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', marginBottom: 2 },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sparkleBadgeText: { color: BLACK, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.4 },
  headerSub: { color: TEXT_MUTED, fontSize: 11, fontWeight: '500', marginTop: 1 },

  saveHeaderBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveHeaderBtnText: { color: BLACK, fontSize: 12, fontWeight: '900' },

  /* Progress Banner Card */
  progressCard: {
    backgroundColor: DARK_SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    gap: 10,
  },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  progressDesc: { color: TEXT_MUTED, fontSize: 10, marginTop: 1 },
  progressCounterPill: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: BORDER_GOLD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressCounterText: { color: GOLD, fontSize: 11, fontWeight: '900' },

  progressBarTrack: {
    height: 5,
    backgroundColor: BLACK,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 3,
  },

  /* Search & Filter Section */
  searchFilterSection: {
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 12, fontWeight: '600' },
  filterPillsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillActive: { backgroundColor: GOLD, borderColor: GOLD },
  filterPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  filterPillTextActive: { color: BLACK, fontWeight: '900' },
  clearAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  clearAllText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },

  /* Main Scroll Content */
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingBottom: 110 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#FFF', fontSize: 12, marginTop: 12, fontWeight: '700' },

  emptyWrap: { paddingVertical: 50, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptySub: { color: TEXT_MUTED, fontSize: 11, textAlign: 'center', maxWidth: 260 },
  resetSearchBtn: { marginTop: 12, backgroundColor: DARK_SURFACE, borderWidth: 1, borderColor: BORDER_GOLD, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  resetSearchText: { color: GOLD, fontSize: 11, fontWeight: '800' },

  categoriesWrap: { gap: 12 },
  categoryCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  categoryCardActive: { borderColor: BORDER_GOLD, backgroundColor: DARK_SURFACE },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categorySelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: { backgroundColor: GOLD, borderColor: GOLD },
  categoryTitle: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  categoryTitleActive: { color: GOLD, fontWeight: '900' },
  subCountText: { color: TEXT_MUTED, fontSize: 10, marginTop: 2, fontWeight: '600' },

  actionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBtnActive: { backgroundColor: GOLD },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subcategoriesBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subHeaderLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  selectAllSubsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2 },
  selectAllSubsText: { color: GOLD, fontSize: 10, fontWeight: '800' },
  subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  subChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  subChipText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  subChipTextActive: { color: BLACK, fontWeight: '900' },

  /* Floating Bottom Footer */
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DARK_CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: Spacing.four,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLeft: { flex: 1 },
  footerCountText: { color: GOLD, fontSize: 13, fontWeight: '900' },
  footerMinText: { color: TEXT_MUTED, fontSize: 10, marginTop: 2, fontWeight: '500' },
  submitBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  submitBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
});
