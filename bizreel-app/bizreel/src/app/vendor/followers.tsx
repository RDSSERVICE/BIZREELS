/**
 * Vendor Followers Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function VendorFollowersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const followers = [
    { id: '1', name: 'Rajesh Nair', location: 'Bengaluru' },
    { id: '2', name: 'Sneh Lata', location: 'Mumbai' },
    { id: '3', name: 'Karan Patel', location: 'Delhi' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Followers ({followers.length})</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.followerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.location}>{item.location}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
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
    justify.content: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  listContent: { padding: Spacing.four, gap: Spacing.three },
  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justify.content: 'center',
  },
  avatarText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  info: { gap: 2 },
  name: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  location: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
});
