import React from 'react';
import { View, StyleSheet } from 'react-native';
import { borderRadius, colors } from '@/src/lib/theme';

export default function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borders.subtle,
    padding: 16,
  },
});
