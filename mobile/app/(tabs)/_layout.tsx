import React, { useEffect, useState, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { chatApi, notifApi } from '@/src/lib/api';
import { getSocket, setupAppStateSocketHandler, cleanupAppStateSocketHandler } from '@/src/lib/socket';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  const refreshCounts = useCallback(async () => {
    if (!user) return;
    chatApi.unreadTotal().then(({ data }) => setUnreadChat(data.unread_total || 0)).catch(() => {});
    notifApi.unreadCount().then(({ data }) => setUnreadNotif(data.unread_count || 0)).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    refreshCounts();
    // Socket setup
    let cleanup: (() => void) | null = null;
    (async () => {
      const s = await getSocket();
      if (!s) return;
      setupAppStateSocketHandler();

      const onNewMsg = () => {
        chatApi.unreadTotal().then(({ data }) => setUnreadChat(data.unread_total || 0)).catch(() => {});
      };
      const onNewNotif = () => {
        notifApi.unreadCount().then(({ data }) => setUnreadNotif(data.unread_count || 0)).catch(() => {});
      };
      s.on('message:new', onNewMsg);
      s.on('notification:new', onNewNotif);
      cleanup = () => {
        s.off('message:new', onNewMsg);
        s.off('notification:new', onNewNotif);
      };
    })();

    return () => {
      cleanup?.();
      cleanupAppStateSocketHandler();
    };
  }, [user?.id, refreshCounts]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarTestID: 'nav-feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarTestID: 'nav-explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarTestID: 'nav-chat',
          tabBarBadge: unreadChat > 0 ? unreadChat : undefined,
          tabBarBadgeStyle: styles.tabBadge,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarTestID: 'nav-profile',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
              {unreadNotif > 0 && <Badge count={unreadNotif} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '500' },
  tabBadge: { backgroundColor: '#ec4899', fontSize: 10, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#ec4899', borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
});
