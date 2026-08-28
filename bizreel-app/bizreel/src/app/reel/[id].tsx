import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function SharedSingleReelDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace({
        pathname: '/(tabs)',
        params: { reelId: id },
      } as any);
    } else {
      router.replace('/(tabs)');
    }
  }, [id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F59E0B" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
