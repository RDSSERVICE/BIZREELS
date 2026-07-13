import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import GradientButton from '@/src/components/GradientButton';
import GlassCard from '@/src/components/GlassCard';
import { colors, spacing, borderRadius } from '@/src/lib/theme';
import api from '@/src/lib/api';

export default function Landing() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/v1/listings/?limit=1').then(({ data }) => {
      const total = data?.total ?? data?.items?.length ?? 0;
      setStats({ listings: total, cities: 10, vendors: 20 });
    }).catch(() => {});
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1634484675974-d3d30cdc0fc7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzdHJlZXQlMjB2ZW5kb3IlMjBjaW5lbWF0aWMlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODM4ODUxODN8MA&ixlib=rb-4.1.0&q=85' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
            style={styles.heroGradient}
          />
          <SafeAreaView style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Ionicons name="sparkles" size={12} color="#f0abfc" />
              <Text style={styles.heroTagText}>India-first · Reels-first · Local</Text>
            </View>

            <Text style={styles.heroTitle}>
              <Text>Discover{'\n'}</Text>
              <Text style={styles.heroTitleAccent}>local.{'\n'}</Text>
              <Text>Deal fair.</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              Shop from nearby vendors, watch product reels, chat directly, and negotiate deals — all in one app.
            </Text>

            {stats && stats.listings > 0 && (
              <View style={styles.statsRow} testID="landing-stats">
                <StatItem icon="storefront-outline" value={`${stats.vendors}+`} label="Vendors" color="#f0abfc" />
                <StatItem icon="people-outline" value={`${stats.listings}+`} label="Listings" color="#c084fc" />
                <StatItem icon="location-outline" value={`${stats.cities}`} label="Cities" color="#fb923c" />
              </View>
            )}

            <View style={styles.ctaWrap}>
              <GradientButton
                testID="landing-get-started-btn"
                title="Get Started"
                onPress={() => router.push(user ? '/(tabs)/feed' : '/login')}
              />
              {!user && (
                <TouchableOpacity
                  testID="landing-login-link"
                  onPress={() => router.push('/login')}
                  style={styles.secondaryLink}
                >
                  <Text style={styles.secondaryLinkText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureCard
            icon="sparkles"
            title="Reels-first discovery"
            body="Scroll through short product videos from local vendors. Like what you see? Chat instantly."
            color="#c084fc"
            testID="feature-card-purple"
          />
          <FeatureCard
            icon="chatbubbles-outline"
            title="Chat direct"
            body="No middlemen. Talk to the vendor, negotiate price, and close deals — all within the app."
            color="#f472b6"
            testID="feature-card-pink"
          />
          <FeatureCard
            icon="shield-checkmark-outline"
            title="Trust built in"
            body="Verified vendors, real reviews, and a trust score system so you know who you're dealing with."
            color="#fb923c"
            testID="feature-card-orange"
          />
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCta} testID="landing-bottom-cta">
          <GradientButton
            testID="bottom-cta-primary"
            title="Explore Listings"
            onPress={() => router.push(user ? '/(tabs)/feed' : '/login')}
          />
          <TouchableOpacity
            testID="bottom-cta-secondary"
            onPress={() => router.push(user ? '/dashboard' : '/login')}
            style={styles.outlineBtn}
          >
            <Text style={styles.outlineBtnText}>Start selling in 2 minutes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function StatItem({ icon, value, label, color }: any) {
  return (
    <GlassCard style={styles.statCard}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function FeatureCard({ icon, title, body, color, testID }: any) {
  return (
    <GlassCard style={styles.featureCard}>
      <View testID={testID} style={styles.featureRow}>
        <View style={[styles.featureIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureBody}>{body}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  hero: { position: 'relative', minHeight: 600 },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 },
  heroContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16, justifyContent: 'flex-end', paddingBottom: 24 },
  heroTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full,
  },
  heroTagText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroTitle: { fontSize: 44, fontWeight: '800', color: '#fff', marginTop: 20, lineHeight: 46 },
  heroTitleAccent: { color: '#ec4899' },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 16, lineHeight: 22, maxWidth: 320 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  ctaWrap: { marginTop: 32, gap: 12 },
  secondaryLink: { alignItems: 'center', paddingVertical: 8 },
  secondaryLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  features: { paddingHorizontal: 24, gap: 12, paddingTop: 8 },
  featureCard: { marginBottom: 0 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIcon: {
    height: 44, width: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  featureBody: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 19 },
  bottomCta: { paddingHorizontal: 24, paddingVertical: 32, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 24 },
  outlineBtn: {
    height: 48, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
