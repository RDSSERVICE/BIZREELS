import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  score: number | null | undefined;
  tier?: string | null;
  size?: 'xs' | 'sm';
  testID?: string;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  elite: { bg: 'rgba(250,204,21,0.2)', text: '#fde047', border: 'rgba(250,204,21,0.4)' },
  'top-rated': { bg: 'rgba(34,197,94,0.2)', text: '#86efac', border: 'rgba(34,197,94,0.4)' },
  trusted: { bg: 'rgba(59,130,246,0.2)', text: '#93c5fd', border: 'rgba(59,130,246,0.4)' },
  default: { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.2)' },
};

export default function TrustBadge({ score, tier, size = 'sm', testID }: Props) {
  if (score == null) return null;
  const s = Number(score);
  const c = TIER_COLORS[tier || ''] || TIER_COLORS.default;
  const isXs = size === 'xs';

  return (
    <View
      testID={testID || 'trust-badge'}
      style={[
        styles.container,
        { backgroundColor: c.bg, borderColor: c.border },
        isXs ? styles.xs : styles.sm,
      ]}
    >
      <Ionicons name="shield-checkmark" size={isXs ? 8 : 10} color={c.text} />
      <Text style={[styles.text, { color: c.text }, isXs && styles.textXs]}>{s}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  xs: { height: 18, paddingHorizontal: 5 },
  sm: { height: 22, paddingHorizontal: 7 },
  text: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  textXs: { fontSize: 8 },
});
