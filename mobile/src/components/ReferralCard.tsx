import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import GlassCard from '@/src/components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { referralApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function ReferralCard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    referralApi.mine().then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data) return null;
  const code = data.referral_code;
  const shareText = `Join Emergent using code ${code} and get ₹100 in credits! Discover trusted local vendors, chat & negotiate deals right in India. https://emergent.app`;

  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({ message: shareText, title: 'Join Emergent' });
    } catch {}
  };

  return (
    <GlassCard style={styles.card} testID="referral-card">
      <View style={styles.headerRow}>
        <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.6)" />
        <Text style={styles.headerText}>REFER & EARN</Text>
      </View>
      <View style={styles.bodyRow}>
        <View>
          <Text style={styles.yourCode}>Your code</Text>
          <Text style={styles.code} testID="referral-code">{code}</Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.statLine}><Text style={styles.statBold}>{data.summary?.credited || 0}</Text> credited</Text>
          <Text style={styles.statLine}><Text style={styles.statBold}>{data.summary?.pending || 0}</Text> pending</Text>
          <Text style={styles.earnedLine}>+{data.summary?.credits_earned || 0} credits earned</Text>
        </View>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity testID="referral-copy-btn" onPress={copyCode} style={styles.outlineBtn}>
          <Ionicons name="copy-outline" size={14} color="#fff" />
          <Text style={styles.outlineBtnText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="referral-share-btn" onPress={shareCode}>
          <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradBtn}>
            <Ionicons name="share-social-outline" size={14} color="#fff" />
            <Text style={styles.gradBtnText}>Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>
        You get +200 credits, they get +100, when they post their first listing or complete their first deal.
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headerText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  bodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  yourCode: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  code: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  statsCol: { alignItems: 'flex-end' },
  statLine: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statBold: { fontWeight: '700', color: '#fff' },
  earnedLine: { fontSize: 12, color: '#fde047', marginTop: 4, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 8 },
  outlineBtn: {
    flex: 1, height: 40, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  gradBtn: {
    flex: 1, height: 40, borderRadius: borderRadius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 24,
  },
  gradBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 10, lineHeight: 15 },
});
