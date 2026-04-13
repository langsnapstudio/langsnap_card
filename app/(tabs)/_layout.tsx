import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import NoInternetScreen from '@/components/OfflineBanner';

const BRAND_PURPLE = '#7D69AB';
const TAB_BG       = '#FFFFFF';
const INACTIVE     = '#AAAAAA';

export default function TabLayout() {
  const { isOnline, recheck } = useNetworkStatus();

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_PURPLE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'albums' : 'albums-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
    {!isOnline && <NoInternetScreen onRetry={recheck} />}
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: TAB_BG,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: 'Volte-Medium',
    fontSize: 11,
  },
});
