import React, { useState, useCallback } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { incrementFeat } from '@/constants/feat-store';
import {
  getFollowing,
  getFollowers,
  searchUsers,
  followUser,
  unfollowUser,
  isFollowing,
  isFollowedBy,
  type SocialUser,
} from '@/constants/social-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const BORDER       = '#E8E5DF';

type Tab = 'following' | 'followers';

// ── Avatar map ─────────────────────────────────────────────────────────────────
const AVATAR_IMAGES: Record<string, any> = {
  dog:         require('@/assets/images/avatar-dog.png'),
  cat:         require('@/assets/images/avatar-cat.png'),
  sheep:       require('@/assets/images/avatar-sheep.png'),
  elephant:    require('@/assets/images/avatar-elephant.png'),
  rabbit:      require('@/assets/images/avatar-rabbit.png'),
  watermelon:  require('@/assets/images/avatar-watermelon.png'),
  dragonfruit: require('@/assets/images/avatar-dragonfruit.png'),
  pineapple:   require('@/assets/images/avatar-pineapple.png'),
  corn:        require('@/assets/images/avatar-corn.png'),
  hamburger:   require('@/assets/images/avatar-hamburger.png'),
  sushi:       require('@/assets/images/avatar-sushi.png'),
  pizza:       require('@/assets/images/avatar-pizza.png'),
  streamedbun: require('@/assets/images/avatar-streamedbun.png'),
  bubbletea:   require('@/assets/images/avatar-bubbletea.png'),
  hotcocoa:    require('@/assets/images/avatar-hotcocoa.png'),
  beer:        require('@/assets/images/avatar-beer.png'),
};

function languageFlag(lang: string) {
  return lang === 'taiwan' ? '🇹🇼' : '🇨🇳';
}

// ── User row ───────────────────────────────────────────────────────────────────
function UserRow({ user, onPress, onFollowToggle }: {
  user: SocialUser;
  onPress: () => void;
  onFollowToggle: (user: SocialUser) => void;
}) {
  const avatarSrc  = AVATAR_IMAGES[user.avatarId];
  const following  = isFollowing(user.id);
  const followsMe  = isFollowedBy(user.id);

  const followLabel = following ? 'Following' : followsMe ? 'Follow back' : 'Follow';

  return (
    <TouchableOpacity style={styles.userRow} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {avatarSrc
          ? <Image source={avatarSrc} style={styles.avatarImg} resizeMode="cover" />
          : <View style={[styles.avatarImg, { backgroundColor: PURPLE_LIGHT }]} />
        }
      </View>

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      {/* Follow button */}
      <TouchableOpacity
        style={[styles.followBtn, following && styles.followingBtn]}
        activeOpacity={0.8}
        onPress={() => onFollowToggle(user)}
      >
        <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
          {followLabel}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function FriendsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<Tab>(
    params.tab === 'followers' ? 'followers' : 'following'
  );
  const [searchQuery, setSearchQuery]   = useState('');
  const [, forceUpdate]                 = useState(0);

  const following = getFollowing();
  const followers = getFollowers();

  const isSearching    = searchQuery.trim().length > 0;
  const searchResults  = isSearching ? searchUsers(searchQuery) : [];

  const displayList = isSearching
    ? searchResults
    : activeTab === 'following' ? following : followers;

  function handleFollowToggle(user: SocialUser) {
    if (isFollowing(user.id)) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
      incrementFeat('first_connection');
    }
    forceUpdate(n => n + 1); // re-render to reflect change
  }

  function handleUserPress(username: string) {
    router.push(`/profile/${username}`);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Friends</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={TEXT_MUTED} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor={TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Tabs (hidden during search) ───────────────────────────────────── */}
      {!isSearching && (
        <View style={styles.tabs}>
          {(['following', 'followers'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'following'
                  ? `Following ${following.length}`
                  : `Followers ${followers.length}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {displayList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{isSearching ? '🔍' : '👥'}</Text>
            <Text style={styles.emptyTitle}>
              {isSearching ? 'No users found' : activeTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isSearching ? 'Try a different username' : 'Find friends by searching above'}
            </Text>
          </View>
        ) : (
          displayList.map(user => (
            <UserRow
              key={user.id}
              user={user}
              onPress={() => handleUserPress(user.username)}
              onFollowToggle={handleFollowToggle}
            />
          ))
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:  { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: BG_CREAM,
    borderRadius: 12, paddingHorizontal: 12, height: 44,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: BORDER,
    marginBottom: 4,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: BRAND_PURPLE },
  tabText:       { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_MUTED },
  tabTextActive: { color: BRAND_PURPLE },

  // List
  list:        { flex: 1 },
  listContent: { paddingBottom: 24 },

  // User row
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    gap: 12,
  },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: PURPLE_LIGHT },
  avatarImg:  { width: 48, height: 48 },
  userInfo:   { flex: 1 },
  userNameRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  displayName:{ fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  langFlag:   { fontSize: 14, fontFamily: 'System' },
  userMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username:   { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  dot:        { fontSize: 13, color: TEXT_MUTED },
  streak:     { fontSize: 13, color: TEXT_MUTED },

  // Follow button
  followBtn: {
    backgroundColor: BRAND_PURPLE,
    borderRadius: 20, paddingVertical: 7, paddingHorizontal: 16,
  },
  followingBtn:     { backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER },
  followBtnText:    { fontSize: 13, fontFamily: 'Volte-Semibold', color: WHITE },
  followingBtnText: { color: TEXT_MUTED },

  // Empty state
  emptyState:   { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon:    { fontSize: 40, marginBottom: 4 },
  emptyTitle:   { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  emptySubtitle:{ fontSize: 14, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },
});
