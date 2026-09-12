/**
 * Vendor Analytics & Insights Screen — Mobile Application
 * Complete parity with web dashboard at /vendor/analytics.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { api } from '@/lib/api';

type RangeOption = '7d' | '30d' | '90d' | 'all';
type MetricOption = 'views' | 'chats' | 'wa_clicks' | 'deals' | 'saves' | 'shares';
type SortOption = 'views' | 'chats' | 'deals' | 'shares' | 'saves';

export default function VendorAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listingId } = useLocalSearchParams<any>();

  const [range, setRange] = useState<RangeOption>('30d');
  const [metric, setMetric] = useState<MetricOption>('views');
  const [listingSort, setListingSort] = useState<SortOption>('views');
  const [searchTerm, setSearchTerm] = useState('');

  const [overview, setOverview] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [timeseries, setTimeseries] = useState<any[]>([]);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Boost ROI modal state
  const [selectedRoiListing, setSelectedRoiListing] = useState<any>(null);
  const [roiData, setRoiData] = useState<any>(null);
  const [loadingRoi, setLoadingRoi] = useState(false);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.get(`/vendor/analytics/overview?range=${range}`);
      setOverview(res.data?.data || res.data || {});
    } catch (e) {
      console.log('Overview fetch error:', e);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.get(`/vendor/analytics/listings?range=${range}&sort=${listingSort}&limit=50`);
      const items = res.data?.data?.items || res.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setListings(items);
    } catch (e) {
      console.log('Listings fetch error:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchTimeseries = async () => {
    setLoadingTimeseries(true);
    try {
      const res = await api.get(`/vendor/analytics/timeseries?range=${range}&metric=${metric}`);
      const items = res.data?.data?.items || res.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setTimeseries(items);
    } catch (e) {
      console.log('Timeseries fetch error:', e);
    } finally {
      setLoadingTimeseries(false);
    }
  };

  const refreshAll = () => {
    fetchOverview();
    fetchListings();
    fetchTimeseries();
  };

  useEffect(() => {
    fetchOverview();
  }, [range]);

  useEffect(() => {
    fetchListings();
  }, [range, listingSort]);

  useEffect(() => {
    fetchTimeseries();
  }, [range, metric]);

  useEffect(() => {
    if (listingId && listings.length > 0) {
      const matched = listings.find(
        (l) => (l.listing_id || l._id || l.id)?.toString() === listingId.toString()
      );
      if (matched) {
        openRoiModal(matched);
      }
    }
  }, [listingId, listings]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await api.post('/vendor/analytics/simulate');
      refreshAll();
    } catch (e) {
      console.log('Simulation error:', e);
    } finally {
      setSimulating(false);
    }
  };

  const openRoiModal = async (listingItem: any) => {
    setSelectedRoiListing(listingItem);
    setLoadingRoi(true);
    try {
      const res = await api.get(`/vendor/analytics/boost-roi?listing_id=${listingItem.listing_id || listingItem._id}`);
      setRoiData(res.data?.data || res.data || {});
    } catch (e) {
      console.log('ROI fetch error:', e);
      setRoiData(null);
    } finally {
      setLoadingRoi(false);
    }
  };

  const kpis = overview?.kpis || {};
  const conversion = overview?.conversion || {};
  const reviews = overview?.reviews || {};

  const formatVal = (val: number | undefined) => (val || 0).toLocaleString('en-IN');

  const filteredListings = listings.filter((l) =>
    (l.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ranges: { key: RangeOption; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' },
  ];

  const metricsList: { key: MetricOption; label: string }[] = [
    { key: 'views', label: 'Views' },
    { key: 'chats', label: 'Inquiries' },
    { key: 'wa_clicks', label: 'WhatsApp' },
    { key: 'deals', label: 'Orders' },
    { key: 'saves', label: 'Saves' },
    { key: 'shares', label: 'Shares' },
  ];

  // KPI cards definition
  const kpiCards = [
    {
      label: 'TOTAL REVENUE',
      value: `₹${formatVal(kpis.total_revenue || kpis.revenue || 0)}`,
      desc: 'Gross sales from orders & deals',
      icon: 'cash-outline',
      iconColor: '#F59E0B',
    },
    {
      label: 'TOTAL CUSTOMERS',
      value: formatVal(kpis.total_customers || kpis.unique_chatters),
      desc: 'Unique buyers & inquirers',
      icon: 'people-outline',
      iconColor: '#38BDF8',
    },
    {
      label: 'TOTAL ORDERS',
      value: formatVal(kpis.total_orders || kpis.deals_started),
      desc: 'Fulfillable orders & deals',
      icon: 'bag-handle-outline',
      iconColor: '#10B981',
    },
    {
      label: 'TOTAL OFFERS',
      value: formatVal(kpis.total_offers || kpis.deals_completed),
      desc: 'Bids, quotes & price deals',
      icon: 'pricetag-outline',
      iconColor: '#EC4899',
    },
    {
      label: 'CATALOG VIEWS',
      value: formatVal(kpis.views),
      desc: 'Product, service & reel views',
      icon: 'eye-outline',
      iconColor: '#6366F1',
    },
    {
      label: 'ACTIVE LISTINGS',
      value: `${kpis.listings_active || 0}/${kpis.listings_total || 0}`,
      desc: 'Active vs total listed catalog items',
      icon: 'cube-outline',
      iconColor: '#F59E0B',
    },
    {
      label: 'PRODUCTS & SERVICES',
      value: `${kpis.products_total || 0} Prod / ${kpis.services_total || 0} Serv`,
      desc: 'Catalog type distribution',
      icon: 'construct-outline',
      iconColor: '#38BDF8',
    },
    {
      label: 'REELS & VIDEOS',
      value: formatVal(kpis.reels_total),
      desc: 'Published store video reels',
      icon: 'videocam-outline',
      iconColor: '#EF4444',
    },
    {
      label: 'INQUIRIES & WA',
      value: `${formatVal(kpis.chats_started)} Chat / ${formatVal(kpis.wa_clicks)} WA`,
      desc: 'Direct customer lead touches',
      icon: 'chatbubbles-outline',
      iconColor: '#10B981',
    },
    {
      label: 'TOTAL LEADS & FOLLOWERS',
      value: `${formatVal(kpis.leads)} Leads / ${formatVal(kpis.followers)} Fans`,
      desc: 'Active audience & inquirers',
      icon: 'person-add-outline',
      iconColor: '#8B5CF6',
    },
    {
      label: 'STORE ENGAGEMENT',
      value: `${formatVal(kpis.saves)} Saves / ${formatVal(kpis.shares)} Shares`,
      desc: 'Bookmarks & social shares',
      icon: 'bookmark-outline',
      iconColor: '#F59E0B',
    },
    {
      label: 'SALES DELIVERED',
      value: formatVal(kpis.deals_completed),
      desc: 'Successfully completed orders',
      icon: 'trending-up-outline',
      iconColor: '#10B981',
    },
  ];

  // Helper for max value in timeseries for chart height scaling
  const maxChartVal = Math.max(...timeseries.map((t) => t.value || 0), 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>Vendor Analytics & Insights</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Track revenue, views, phone calls & WhatsApp leads
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshAll}>
          <Ionicons
            name="refresh-outline"
            size={18}
            color="#F59E0B"
            style={loadingOverview || loadingListings ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Live Status & Timeframe Selector Bar */}
        <View style={styles.timeframeBar}>
          <View style={styles.liveStatusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveStatusText}>Live Analytics Active</Text>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.timeframeLabel}>TIMEFRAME:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangePillRow}>
              {ranges.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.rangePill, range === r.key && styles.rangePillActive]}
                  onPress={() => setRange(r.key)}>
                  <Text style={[styles.rangePillText, range === r.key && styles.rangePillTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {(!kpis.views || kpis.views === 0) && (
            <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulate} disabled={simulating}>
              {simulating ? (
                <ActivityIndicator size="small" color="#F59E0B" />
              ) : (
                <Ionicons name="flash-outline" size={14} color="#F59E0B" />
              )}
              <Text style={styles.simulateBtnText}>Populate Demo Traffic</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 12 KPI Grid Cards */}
        <Text style={styles.sectionHeaderTitle}>BUSINESS OVERVIEW & KPIS</Text>
        <View style={styles.kpiGrid}>
          {kpiCards.map((c, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <View style={styles.kpiCardHeader}>
                <Text style={styles.kpiLabel}>{c.label}</Text>
                <View style={[styles.kpiIconBox, { backgroundColor: `${c.iconColor}15` }]}>
                  <Ionicons name={c.icon as any} size={16} color={c.iconColor} />
                </View>
              </View>
              {loadingOverview ? (
                <ActivityIndicator size="small" color="#F59E0B" style={{ alignSelf: 'flex-start', marginVertical: 4 }} />
              ) : (
                <Text style={styles.kpiValue}>{c.value}</Text>
              )}
              <Text style={styles.kpiDesc}>{c.desc}</Text>
            </View>
          ))}
        </View>

        {/* Timeseries Plot Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View style={styles.chartTitleBox}>
              <Ionicons name="stats-chart" size={16} color="#F59E0B" />
              <Text style={styles.chartTitle}>METRICS TIMELINE OVER PERIOD</Text>
            </View>
          </View>

          {/* Metric Selector Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricTabsRow}>
            {metricsList.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.metricTab, metric === m.key && styles.metricTabActive]}
                onPress={() => setMetric(m.key)}>
                <Text style={[styles.metricTabText, metric === m.key && styles.metricTabTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Graphical Representation */}
          {loadingTimeseries ? (
            <View style={styles.chartLoadingBox}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.chartLoadingText}>Loading timeline metrics...</Text>
            </View>
          ) : timeseries.length > 0 ? (
            <View style={styles.chartArea}>
              <View style={styles.barsContainer}>
                {timeseries.map((item, index) => {
                  const val = item.value || 0;
                  const heightPct = Math.max((val / maxChartVal) * 100, 6);
                  const dateLabel = item.date?.split('-')?.slice(1)?.join('/') || `${index + 1}`;
                  return (
                    <View key={index} style={styles.barCol}>
                      <Text style={styles.barValueText}>{val > 0 ? val : ''}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                      </View>
                      <Text style={styles.barDateText} numberOfLines={1}>
                        {dateLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChartBox}>
              <Ionicons name="cloud-offline-outline" size={28} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyChartText}>No traffic data recorded in this timeframe</Text>
            </View>
          )}
        </View>

        {/* Customer Conversion Funnel & Rating Card Grid */}
        <View style={styles.funnelCard}>
          <Text style={styles.funnelTitle}>CUSTOMER CONVERSION FUNNEL</Text>

          <View style={styles.funnelSteps}>
            {[
              { name: '1. Impressions / Views', count: kpis.views || 0, pct: 100, color: '#38BDF8' },
              {
                name: '2. Inquiries & WhatsApp',
                count: (kpis.chats_started || 0) + (kpis.wa_clicks || 0),
                pct: conversion.view_to_chat_pct || 0,
                color: '#6366F1',
              },
              {
                name: '3. Orders Initiated',
                count: kpis.deals_started || 0,
                pct: conversion.chat_to_deal_pct || 0,
                color: '#F59E0B',
              },
              {
                name: '4. Orders Completed',
                count: kpis.deals_completed || 0,
                pct: conversion.deal_to_complete_pct || 0,
                color: '#10B981',
              },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepCount}>
                    {formatVal(step.count)} ({i === 0 ? '100%' : `${step.pct}%`})
                  </Text>
                </View>
                <View style={styles.stepBarBg}>
                  <View
                    style={[
                      styles.stepBarFill,
                      { width: `${i === 0 ? 100 : Math.min(step.pct, 100)}%`, backgroundColor: step.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Average Store Rating Card */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>AVERAGE STORE RATING</Text>
            <View style={styles.ratingScoreRow}>
              <Text style={styles.ratingLabel}>Customer Score:</Text>
              <Text style={styles.ratingValue}>
                ★ {reviews.avg_rating || '5.0'} ({reviews.count || 0} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* Listings Performance Breakdown Section */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>LISTINGS PERFORMANCE BREAKDOWN</Text>
            <Text style={styles.breakdownSub}>
              Detailed real-time traffic and inquiry breakdowns across all your products and services
            </Text>
          </View>

          {/* Search & Sort Controls */}
          <View style={styles.controlsRow}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by title..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortPillsRow}>
              {[
                { key: 'views', label: 'Sort by Views' },
                { key: 'chats', label: 'Sort by Inquiries' },
                { key: 'deals', label: 'Sort by Orders' },
                { key: 'shares', label: 'Sort by Shares' },
                { key: 'saves', label: 'Sort by Saves' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sortPill, listingSort === s.key && styles.sortPillActive]}
                  onPress={() => setListingSort(s.key as SortOption)}>
                  <Text style={[styles.sortPillText, listingSort === s.key && styles.sortPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Listings List */}
          {loadingListings ? (
            <View style={styles.listingsLoadingBox}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.listingsLoadingText}>Loading listings metrics...</Text>
            </View>
          ) : filteredListings.length > 0 ? (
            <View style={styles.listingsListContainer}>
              {filteredListings.map((item, idx) => (
                <View key={idx} style={styles.listingItemCard}>
                  <View style={styles.listingItemTop}>
                    <View style={styles.listingTypeBadge}>
                      <Text style={styles.listingTypeBadgeText}>{(item.type || 'Product').toUpperCase()}</Text>
                    </View>
                    <Text style={styles.listingPriceText}>Price: ₹{(item.price || 0).toLocaleString('en-IN')}</Text>
                  </View>

                  <Text style={styles.listingItemTitle} numberOfLines={2}>
                    {item.title || 'Untitled Listing'}
                  </Text>

                  {/* Metrics Badges Row */}
                  <View style={styles.itemMetricsGrid}>
                    <View style={styles.metricPill}>
                      <Ionicons name="eye-outline" size={12} color="#38BDF8" />
                      <Text style={styles.metricPillVal}>{formatVal(item.views)}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="chatbubble-outline" size={12} color="#6366F1" />
                      <Text style={styles.metricPillVal}>{formatVal(item.chats)}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="logo-whatsapp" size={12} color="#10B981" />
                      <Text style={styles.metricPillVal}>{formatVal(item.wa_clicks)}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="bookmark-outline" size={12} color="#F59E0B" />
                      <Text style={styles.metricPillVal}>{formatVal(item.saves)}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="share-social-outline" size={12} color="#EC4899" />
                      <Text style={styles.metricPillVal}>{formatVal(item.shares)}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="cart-outline" size={12} color="#10B981" />
                      <Text style={styles.metricPillVal}>{formatVal(item.deals)}</Text>
                    </View>
                  </View>

                  {/* Boost Action / Status */}
                  <View style={styles.listingItemFooter}>
                    {item.boost_expires_at ? (
                      <TouchableOpacity style={styles.boostRoiBtn} onPress={() => openRoiModal(item)}>
                        <Ionicons name="flash" size={12} color="#F59E0B" />
                        <Text style={styles.boostRoiBtnText}>Boost ROI Performance ⚡</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.organicTag}>
                        <Ionicons name="leaf-outline" size={12} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.organicTagText}>Organic Traffic</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyListingsBox}>
              <Ionicons name="search-outline" size={28} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyListingsText}>No listings found matching search criteria</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Boost ROI Modal */}
      <Modal visible={!!selectedRoiListing} transparent animationType="fade" onRequestClose={() => setSelectedRoiListing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedRoiListing(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalZapBox}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Boost ROI Performance</Text>
                <Text style={styles.modalSubTitle} numberOfLines={1}>
                  {selectedRoiListing?.title}
                </Text>
              </View>
            </View>

            {loadingRoi ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.modalLoadingText}>Analyzing Boost Lift Performance...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.roiDatesCard}>
                  <View style={styles.roiDateRow}>
                    <Text style={styles.roiDateLabel}>Boost Activated:</Text>
                    <Text style={styles.roiDateValue}>
                      {roiData?.boost_start
                        ? new Date(roiData.boost_start).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.roiDateRow}>
                    <Text style={styles.roiDateLabel}>Boost Expires:</Text>
                    <Text style={styles.roiDateValue}>
                      {roiData?.boost_end
                        ? new Date(roiData.boost_end).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.roiDateRow}>
                    <Text style={styles.roiDateLabel}>Boost Duration:</Text>
                    <Text style={[styles.roiDateValue, { color: '#F59E0B', fontWeight: 'bold' }]}>
                      {roiData?.duration_days || 7} Days
                    </Text>
                  </View>
                </View>

                <Text style={styles.liftMetricsHeader}>LIFT METRICS ANALYSIS</Text>

                {[
                  {
                    name: 'Catalog Views',
                    b: roiData?.baseline?.views || 0,
                    d: roiData?.during?.views || 0,
                    l: roiData?.lift_pct?.views || 0,
                    icon: 'eye-outline',
                  },
                  {
                    name: 'Inquiries',
                    b: roiData?.baseline?.chats || 0,
                    d: roiData?.during?.chats || 0,
                    l: roiData?.lift_pct?.chats || 0,
                    icon: 'chatbubbles-outline',
                  },
                  {
                    name: 'Orders Placed',
                    b: roiData?.baseline?.deals || 0,
                    d: roiData?.during?.deals || 0,
                    l: roiData?.lift_pct?.deals || 0,
                    icon: 'cart-outline',
                  },
                ].map((m, idx) => (
                  <View key={idx} style={styles.liftMetricRow}>
                    <View style={styles.liftMetricNameBox}>
                      <Ionicons name={m.icon as any} size={14} color="#F59E0B" />
                      <Text style={styles.liftMetricName}>{m.name}</Text>
                    </View>
                    <View style={styles.liftMetricBaselineBox}>
                      <Text style={styles.liftMetricMicroTag}>BASELINE</Text>
                      <Text style={styles.liftMetricVal}>{m.b}</Text>
                    </View>
                    <View style={styles.liftMetricDuringBox}>
                      <Text style={styles.liftMetricMicroTag}>DURING BOOST</Text>
                      <View style={styles.liftMetricLiftRow}>
                        <Text style={styles.liftMetricVal}>{m.d}</Text>
                        <Text style={[styles.liftBadge, m.l > 0 ? styles.liftBadgePos : styles.liftBadgeNeutral]}>
                          {m.l > 0 ? `+${m.l}%` : `${m.l}%`}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
                  <Text style={styles.infoBoxText}>
                    <Text style={{ fontWeight: 'bold', color: '#fff' }}>How Lift is calculated: </Text>
                    We compare customer engagement during the boost active window against a baseline period of equal duration directly prior to activation.
                  </Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.modalCloseFooterBtn} onPress={() => setSelectedRoiListing(null)}>
              <Text style={styles.modalCloseFooterBtnText}>Close ROI Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D36',
    gap: Spacing.three,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: '#2D2D36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrapper: { flex: 1 },
  headerTitle: { color: '#FFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: '#2D2D36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinning: { opacity: 0.6 },

  scrollContent: { padding: Spacing.four, gap: Spacing.four },

  timeframeBar: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: Spacing.two,
  },
  liveStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  liveStatusText: { color: '#10B981', fontSize: 11, fontWeight: FontWeight.bold },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  timeframeLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  rangePillRow: { gap: 6 },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#26262E',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  rangePillActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  rangePillText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: FontWeight.bold },
  rangePillTextActive: { color: '#0F0F12' },

  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26262E',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  simulateBtnText: { color: '#F59E0B', fontSize: 11, fontWeight: FontWeight.bold },

  sectionHeaderTitle: { color: '#F59E0B', fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  kpiCard: {
    width: '47.5%',
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: 4,
    justifyContent: 'space-between',
  },
  kpiCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5, flex: 1 },
  kpiIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { color: '#FFF', fontSize: FontSize.base, fontWeight: '900', marginTop: 4 },
  kpiDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },

  chartCard: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: Spacing.two,
  },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartTitle: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5 },

  metricTabsRow: { gap: 6, marginVertical: 4 },
  metricTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#26262E',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  metricTabActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  metricTabText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: FontWeight.bold },
  metricTabTextActive: { color: '#0F0F12' },

  chartLoadingBox: { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 },
  chartLoadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  chartArea: { height: 140, paddingTop: 10 },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValueText: { color: '#F59E0B', fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  barTrack: { width: '80%', height: '70%', backgroundColor: '#26262E', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
  barDateText: { color: 'rgba(255,255,255,0.4)', fontSize: 8, marginTop: 4 },

  emptyChartBox: { height: 120, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyChartText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: FontWeight.medium },

  funnelCard: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: Spacing.three,
  },
  funnelTitle: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  funnelSteps: { gap: Spacing.two },
  stepRow: { gap: 4 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepName: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: FontWeight.medium },
  stepCount: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold },
  stepBarBg: { height: 8, borderRadius: 4, backgroundColor: '#26262E', overflow: 'hidden' },
  stepBarFill: { height: '100%', borderRadius: 4 },

  ratingCard: {
    backgroundColor: '#26262E',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#3F3F46',
    gap: 4,
  },
  ratingTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  ratingScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: FontWeight.medium },
  ratingValue: { color: '#F59E0B', fontSize: 12, fontWeight: FontWeight.bold },

  breakdownCard: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: Spacing.three,
  },
  breakdownHeader: { gap: 2 },
  breakdownTitle: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  breakdownSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },

  controlsRow: { gap: 8 },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26262E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 36, color: '#FFF', fontSize: 11 },

  sortPillsRow: { gap: 6 },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#26262E',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  sortPillActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  sortPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: FontWeight.bold },
  sortPillTextActive: { color: '#0F0F12' },

  listingsLoadingBox: { height: 100, alignItems: 'center', justifyContent: 'center', gap: 6 },
  listingsLoadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  listingsListContainer: { gap: Spacing.two },
  listingItemCard: {
    backgroundColor: '#26262E',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#3F3F46',
    gap: 6,
  },
  listingItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listingTypeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingTypeBadgeText: { color: '#0F0F12', fontSize: 8, fontWeight: FontWeight.bold },
  listingPriceText: { color: '#10B981', fontSize: 11, fontWeight: FontWeight.bold },
  listingItemTitle: { color: '#FFF', fontSize: 12, fontWeight: FontWeight.bold },

  itemMetricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  metricPillVal: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: FontWeight.bold },

  listingItemFooter: { marginTop: 4, alignItems: 'flex-start' },
  boostRoiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  boostRoiBtnText: { color: '#F59E0B', fontSize: 10, fontWeight: FontWeight.bold },
  organicTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  organicTagText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontStyle: 'italic' },

  emptyListingsBox: { height: 100, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyListingsText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: FontWeight.medium },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#18181C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D36',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#26262E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D36',
    paddingBottom: 12,
  },
  modalZapBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#26262E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { color: '#FFF', fontSize: 13, fontWeight: FontWeight.bold },
  modalSubTitle: { color: '#F59E0B', fontSize: 11, fontWeight: FontWeight.bold },

  modalLoadingBox: { height: 150, alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalLoadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  modalBody: { gap: Spacing.three },
  roiDatesCard: {
    backgroundColor: '#26262E',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#3F3F46',
    gap: 4,
    marginBottom: Spacing.two,
  },
  roiDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roiDateLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  roiDateValue: { color: '#FFF', fontSize: 10, fontWeight: FontWeight.bold },

  liftMetricsHeader: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5, marginBottom: 4 },
  liftMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#26262E',
  },
  liftMetricNameBox: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  liftMetricName: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: FontWeight.medium },
  liftMetricBaselineBox: { alignItems: 'center', width: 60 },
  liftMetricMicroTag: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: FontWeight.bold },
  liftMetricVal: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold },
  liftMetricDuringBox: { alignItems: 'flex-end', width: 90 },
  liftMetricLiftRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liftBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, fontSize: 9, fontWeight: FontWeight.bold },
  liftBadgePos: { backgroundColor: 'rgba(16,185,129,0.2)', color: '#10B981' },
  liftBadgeNeutral: { backgroundColor: '#26262E', color: 'rgba(255,255,255,0.5)' },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#26262E',
    borderRadius: 10,
    padding: Spacing.three,
    gap: 8,
    marginTop: Spacing.two,
  },
  infoBoxText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, flex: 1, lineHeight: 14 },

  modalCloseFooterBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseFooterBtnText: { color: '#0F0F12', fontSize: 12, fontWeight: FontWeight.bold },
});
