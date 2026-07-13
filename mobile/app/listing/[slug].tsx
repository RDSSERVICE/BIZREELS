import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/src/components/GlassCard';
import GradientButton from '@/src/components/GradientButton';
import ListingCard from '@/src/components/ListingCard';
import { listingApi, interactionApi, followApi, chatApi, resolveMediaUrl, trackApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

function fmtPrice(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export default function ListingDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [related, setRelated] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [saves, setSaves] = useState(0);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    listingApi.bySlug(slug!).then(({ data }) => {
      setListing(data);
      setLikes(data.likes_count || 0);
      setSaves(data.saves_count || 0);
      setLiked(data.viewer_state?.liked || false);
      setSaved(data.viewer_state?.saved || false);
      if (data.category_id) {
        listingApi.list({ category_id: data.category_id, limit: 7 })
          .then(({ data: rel }) => setRelated((rel.items || []).filter((x: any) => x.id !== data.id).slice(0, 4)));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const shareAction = async () => {
    if (listing?.id) trackApi.listing(listing.id, 'share').catch(() => {});
    try { await Share.share({ message: listing?.title || 'Check this out!' }); } catch {}
  };

  const toggleLike = async () => {
    if (!user) return router.push('/login');
    setLiked(v => !v); setLikes(n => n + (liked ? -1 : 1));
    try {
      const { data } = await interactionApi.toggleLike(listing.id);
      setLiked(data.active); setLikes(data.count);
    } catch { setLiked(liked); }
  };

  const toggleSave = async () => {
    if (!user) return router.push('/login');
    setSaved(v => !v); setSaves(n => n + (saved ? -1 : 1));
    try {
      const { data } = await interactionApi.toggleSave(listing.id);
      setSaved(data.active); setSaves(data.count);
    } catch { setSaved(saved); }
  };

  const toggleFollow = async () => {
    if (!user) return router.push('/login');
    try {
      if (following) { await followApi.unfollow(listing.vendor.id); setFollowing(false); }
      else { await followApi.follow(listing.vendor.id); setFollowing(true); }
    } catch { Alert.alert('Error', 'Failed'); }
  };

  const openChat = async () => {
    if (!user) return router.push('/login');
    try {
      const { data } = await chatApi.createThread({
        peer_user_id: listing.vendor.id,
        context_type: 'listing',
        context_id: listing.id,
      });
      router.push(`/chat-thread/${data.id}`);
    } catch { Alert.alert('Error', 'Could not open chat'); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap} testID="listing-detail-loading">
          <ActivityIndicator color="#ec4899" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorWrap} testID="listing-detail-error">
          <Text style={styles.errorEmoji}>🕳️</Text>
          <Text style={styles.errorText}>Listing not found</Text>
          <GradientButton title="Browse listings" onPress={() => router.push('/(tabs)/explore')} />
        </View>
      </SafeAreaView>
    );
  }

  const hasOffer = listing.offer_price != null && listing.offer_price < listing.price;
  const activeImg = listing.images?.[imgIdx];
  const isBoosted = listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity testID="listing-back-btn" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity testID="listing-share-btn" onPress={shareAction} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.mediaSection} testID="listing-media">
          {activeImg ? (
            <Image source={{ uri: resolveMediaUrl(activeImg.url) }} style={styles.mainImage} contentFit="cover" />
          ) : (
            <View style={styles.noImage}><Text style={styles.noImageText}>📦</Text></View>
          )}
          {listing.images?.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={styles.thumbContent}>
              {listing.images.map((im: any, i: number) => (
                <TouchableOpacity key={i} onPress={() => setImgIdx(i)} style={[styles.thumb, i === imgIdx && styles.thumbActive]}>
                  <Image source={{ uri: resolveMediaUrl(im.url) }} style={styles.thumbImg} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Content */}
        <View style={styles.body}>
          {isBoosted && (
            <View style={styles.sponsoredTag} testID="sponsored-badge">
              <Ionicons name="sparkles" size={12} color="#000" />
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>
          )}

          <Text style={styles.listingTitle} testID="listing-title">{listing.title}</Text>

          <View style={styles.priceRow}>
            {hasOffer ? (
              <>
                <Text style={styles.price} testID="listing-price">₹{fmtPrice(listing.offer_price)}</Text>
                <Text style={styles.oldPrice}>₹{fmtPrice(listing.price)}</Text>
              </>
            ) : (
              <Text style={styles.price} testID="listing-price">₹{fmtPrice(listing.price)}</Text>
            )}
            {listing.is_negotiable && (
              <View style={styles.negBadge}><Text style={styles.negText}>Negotiable</Text></View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.metaText}>{listing.views_count || 0} views</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{listing.category?.name}</Text>
          </View>

          {/* Action bar */}
          <View style={styles.actionBar} testID="listing-action-bar">
            <TouchableOpacity testID="listing-like-btn" onPress={toggleLike} style={[styles.actionBtn, liked && styles.actionBtnActive]}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#ec4899' : '#fff'} />
              <Text style={styles.actionBtnText}>{likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="listing-save-btn" onPress={toggleSave} style={[styles.actionBtn, saved && styles.actionBtnActive]}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{saves}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="listing-share-inline-btn" onPress={shareAction} style={styles.actionBtn}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Vendor */}
          {listing.vendor && (
            <GlassCard style={styles.vendorCard}>
              <View testID="vendor-card" style={styles.vendorRow}>
                <TouchableOpacity onPress={() => router.push(`/vendor/${listing.vendor.id}`)} style={styles.vendorAvatar}>
                  <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.vendorAvatarGrad}>
                    <Text style={styles.vendorAvatarText}>{(listing.vendor.name || '?').charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorLabel}>Posted by</Text>
                  <TouchableOpacity onPress={() => router.push(`/vendor/${listing.vendor.id}`)}>
                    <Text style={styles.vendorName}>{listing.vendor.name || 'Vendor'}</Text>
                  </TouchableOpacity>
                </View>
                {user && user.id !== listing.vendor.id && (
                  <TouchableOpacity testID="follow-vendor-btn" onPress={toggleFollow} style={[styles.followBtn, following && styles.followBtnActive]}>
                    <Text style={styles.followBtnText}>{following ? 'Following' : 'Follow'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity testID="chat-vendor-btn" onPress={openChat} style={styles.chatBtn}>
                <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chatBtnGrad}>
                  <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                  <Text style={styles.chatBtnText}>Chat with Vendor</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
              <Text style={styles.description} testID="listing-description">{listing.description}</Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DETAILS</Text>
            <View style={styles.specsGrid} testID="listing-specs">
              {listing.condition && <SpecItem label="Condition" value={listing.condition} />}
              {listing.warranty && <SpecItem label="Warranty" value={listing.warranty} />}
              {listing.stock != null && <SpecItem label="Stock" value={String(listing.stock)} />}
              {listing.service_charges_type && <SpecItem label="Charges" value={listing.service_charges_type} />}
            </View>
          </View>

          {/* Location */}
          {listing.location && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOCATION</Text>
              <GlassCard style={styles.locationCard}>
                <Ionicons name="location" size={16} color="#ec4899" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationMain}>{listing.location.area}, {listing.location.city}</Text>
                  {listing.location.state && <Text style={styles.locationSub}>{listing.location.state} · {listing.location.pincode}</Text>}
                </View>
              </GlassCard>
            </View>
          )}

          {/* Related */}
          {related.length > 0 && (
            <View style={styles.section} testID="related-section">
              <Text style={styles.sectionLabel}>YOU MAY ALSO LIKE</Text>
              <View style={styles.relatedGrid}>
                {related.map((l) => (
                  <View key={l.id} style={styles.relatedItem}>
                    <ListingCard listing={l} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard style={styles.specItem}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value.replace(/_/g, ' ')}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: {
    height: 40, width: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  mediaSection: { paddingHorizontal: 16 },
  mainImage: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.xl },
  noImage: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.xl, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  noImageText: { fontSize: 48, opacity: 0.2 },
  thumbScroll: { marginTop: 12 },
  thumbContent: { gap: 8 },
  thumb: { height: 56, width: 56, borderRadius: borderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  thumbActive: { borderColor: '#ec4899', borderWidth: 2 },
  thumbImg: { width: '100%', height: '100%' },
  body: { paddingHorizontal: 24, marginTop: 20, gap: 16 },
  sponsoredTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(250,204,21,0.2)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)',
  },
  sponsoredText: { fontSize: 10, fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 },
  listingTitle: { fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 28 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  price: { fontSize: 24, fontWeight: '700', color: '#fff' },
  oldPrice: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' },
  negBadge: { backgroundColor: 'rgba(236,72,153,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)' },
  negText: { fontSize: 10, fontWeight: '700', color: '#f472b6', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  metaDot: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  actionBar: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnActive: { backgroundColor: 'rgba(236,72,153,0.15)' },
  actionBtnText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  vendorCard: { gap: 12 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorAvatar: {},
  vendorAvatarGrad: { height: 48, width: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  vendorAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  vendorInfo: { flex: 1 },
  vendorLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  vendorName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  followBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  followBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  chatBtn: { borderRadius: borderRadius.full, overflow: 'hidden' },
  chatBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: borderRadius.full },
  chatBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  description: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specItem: { width: '47%', padding: 12 },
  specLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  specValue: { fontSize: 13, fontWeight: '500', color: '#fff', marginTop: 4, textTransform: 'capitalize' },
  locationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  locationMain: { fontSize: 14, color: '#fff' },
  locationSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relatedItem: { width: '48%' },
});
