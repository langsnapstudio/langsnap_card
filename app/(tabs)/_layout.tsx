import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import NoInternetScreen from '@/components/OfflineBanner';

const BRAND_PURPLE = '#7D69AB';
const TAB_BG       = '#FFFFFF';
const INACTIVE     = '#262626';

function LearnIcon({ focused }: { focused: boolean }) {
  return focused ? (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10.6562 3.4375L12.5312 7.46875L16.5625 9.34375C16.8125 9.46875 17 9.71875 17 10C17 10.3125 16.8125 10.5625 16.5625 10.6875L12.5312 12.5625L10.6562 16.5938C10.5312 16.8438 10.2812 17 10 17C9.6875 17 9.4375 16.8438 9.3125 16.5938L7.4375 12.5625L3.40625 10.6875C3.15625 10.5625 3 10.3125 3 10C3 9.71875 3.15625 9.46875 3.40625 9.34375L7.4375 7.46875L9.3125 3.4375C9.4375 3.1875 9.6875 3 10 3C10.2812 3 10.5312 3.1875 10.6562 3.4375Z" fill={BRAND_PURPLE} />
    </Svg>
  ) : (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10 3C10.2812 3 10.5312 3.1875 10.6562 3.4375L12.5312 7.46875L16.5625 9.34375C16.8125 9.46875 17 9.71875 17 10C17 10.3125 16.8125 10.5625 16.5625 10.6875L12.5312 12.5625L10.6562 16.5938C10.5312 16.8438 10.2812 17 10 17C9.6875 17 9.4375 16.8438 9.3125 16.5938L7.4375 12.5625L3.40625 10.6875C3.15625 10.5625 3 10.3125 3 10C3 9.71875 3.15625 9.46875 3.40625 9.34375L7.4375 7.46875L9.3125 3.4375C9.4375 3.1875 9.6875 3 10 3ZM10 5.5625L8.6875 8.34375C8.625 8.5 8.5 8.65625 8.3125 8.71875L5.53125 10L8.3125 11.3125C8.5 11.375 8.625 11.5 8.6875 11.6875L10 14.4688L11.2812 11.6875C11.3438 11.5 11.4688 11.375 11.6562 11.3125L14.4375 10L11.6562 8.71875C11.5 8.65625 11.3438 8.53125 11.2812 8.34375L10 5.5625Z" fill={INACTIVE} />
    </Svg>
  );
}

function CardsIcon({ focused }: { focused: boolean }) {
  return focused ? (
    <Svg width={21} height={20} viewBox="0 0 21 20" fill="none">
      <Path d="M1.09375 5.71875L7.125 2.25C7.96875 1.78125 9.03125 2.0625 9.5 2.875L14.7188 11.9375C15.2188 12.75 14.9375 13.8125 14.0938 14.3125L8.0625 17.7812C7.21875 18.25 6.15625 17.9688 5.6875 17.1562L0.46875 8.09375C0 7.28125 0.28125 6.21875 1.09375 5.71875ZM14.5938 15.1562C15.9062 14.4062 16.3438 12.7188 15.5938 11.4375L11.3125 4.03125C11.375 4.03125 11.4375 4 11.5 4H18.5C19.4375 4 20.25 4.8125 20.25 5.75V16.25C20.25 17.2188 19.4375 18 18.5 18H11.5C11.0625 18 10.6562 17.875 10.375 17.5938L14.5938 15.1562Z" fill={BRAND_PURPLE} />
    </Svg>
  ) : (
    <Svg width={21} height={20} viewBox="0 0 21 20" fill="none">
      <Path d="M1.84375 7.03125C1.75 7.09375 1.6875 7.25 1.78125 7.34375L7 16.4062C7.0625 16.5 7.1875 16.5625 7.3125 16.4688L13.3438 13C13.4688 12.9375 13.5 12.7812 13.4375 12.6875L8.21875 3.625C8.15625 3.53125 8 3.46875 7.875 3.53125L1.84375 7.03125ZM0.46875 8.09375C0 7.28125 0.28125 6.21875 1.09375 5.71875L7.125 2.25C7.96875 1.78125 9.03125 2.0625 9.5 2.875L14.7188 11.9375C15.2188 12.75 14.9375 13.8125 14.0938 14.3125L8.0625 17.7812C7.21875 18.25 6.15625 17.9688 5.6875 17.1562L0.46875 8.09375ZM14.5938 15.1562C15.9062 14.4062 16.3438 12.75 15.5938 11.4375L11.3125 4.03125C11.375 4 11.4375 4 11.5 4H18.5C19.4375 4 20.25 4.8125 20.25 5.75V16.25C20.25 17.2188 19.4375 18 18.5 18H11.5C11.0625 18 10.6562 17.875 10.375 17.5938L14.5938 15.1562Z" fill={INACTIVE} />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  return focused ? (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10 10C8.5625 10 7.25 9.25 6.53125 8C5.8125 6.78125 5.8125 5.25 6.53125 4C7.25 2.78125 8.5625 2 10 2C11.4062 2 12.7188 2.78125 13.4375 4C14.1562 5.25 14.1562 6.78125 13.4375 8C12.7188 9.25 11.4062 10 10 10ZM8.5625 11.5H11.4062C14.5 11.5 17 14 17 17.0938C17 17.5938 16.5625 18 16.0625 18H3.90625C3.40625 18 3 17.5938 3 17.0938C3 14 5.46875 11.5 8.5625 11.5Z" fill={BRAND_PURPLE} />
    </Svg>
  ) : (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M12.5 6C12.5 5.125 12 4.3125 11.25 3.84375C10.4688 3.40625 9.5 3.40625 8.75 3.84375C7.96875 4.3125 7.5 5.125 7.5 6C7.5 6.90625 7.96875 7.71875 8.75 8.1875C9.5 8.625 10.4688 8.625 11.25 8.1875C12 7.71875 12.5 6.90625 12.5 6ZM6 6C6 4.59375 6.75 3.28125 8 2.5625C9.21875 1.84375 10.75 1.84375 12 2.5625C13.2188 3.28125 14 4.59375 14 6C14 7.4375 13.2188 8.75 12 9.46875C10.75 10.1875 9.21875 10.1875 8 9.46875C6.75 8.75 6 7.4375 6 6ZM4.53125 16.5H15.4375C15.1562 14.5312 13.4688 13 11.4062 13H8.5625C6.5 13 4.8125 14.5312 4.53125 16.5ZM3 17.0938C3 14 5.46875 11.5 8.5625 11.5H11.4062C14.5 11.5 17 14 17 17.0938C17 17.5938 16.5625 18 16.0625 18H3.90625C3.40625 18 3 17.5938 3 17.0938Z" fill={INACTIVE} />
    </Svg>
  );
}

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
            tabBarIcon: ({ focused }) => <LearnIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: 'Cards',
            tabBarIcon: ({ focused }) => <CardsIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
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
