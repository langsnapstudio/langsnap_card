// ── Social store — mock data (replace with real API/Supabase later) ────────────

export type SocialUser = {
  id:             string;
  username:       string;
  displayName:    string;
  avatarId:       string;
  streak:         number;
  language:       'mainland' | 'taiwan';
  wordsLearned:   number;
  joinedDate:     string; // ISO date string
  isFollowing:    boolean; // whether the current user follows this person
  followersCount: number;
  followingCount: number;
  coursesCount:   number;
};

// ── Mock users ─────────────────────────────────────────────────────────────────
const MOCK_USERS: SocialUser[] = [
  { id: 'u1',  username: 'lingolena',    displayName: 'Lena Wu',      avatarId: 'cat',        streak: 21, language: 'taiwan',   wordsLearned: 134, joinedDate: '2025-12-01', isFollowing: true,  followersCount: 48,  followingCount: 31,  coursesCount: 1 },
  { id: 'u2',  username: 'hsk_hunter',   displayName: 'Marco Lee',    avatarId: 'dog',        streak: 5,  language: 'mainland', wordsLearned: 72,  joinedDate: '2026-01-15', isFollowing: true,  followersCount: 12,  followingCount: 20,  coursesCount: 1 },
  { id: 'u3',  username: 'zhuyin_zara',  displayName: 'Zara Chen',    avatarId: 'rabbit',     streak: 44, language: 'taiwan',   wordsLearned: 280, joinedDate: '2025-11-20', isFollowing: true,  followersCount: 103, followingCount: 55,  coursesCount: 2 },
  { id: 'u4',  username: 'tofu_talk',    displayName: 'James Huang',  avatarId: 'hamburger',  streak: 3,  language: 'mainland', wordsLearned: 31,  joinedDate: '2026-02-10', isFollowing: false, followersCount: 7,   followingCount: 14,  coursesCount: 1 },
  { id: 'u5',  username: 'meiyu88',      displayName: 'Mei Yu',       avatarId: 'bubbletea',  streak: 12, language: 'taiwan',   wordsLearned: 96,  joinedDate: '2026-01-03', isFollowing: false, followersCount: 29,  followingCount: 38,  coursesCount: 1 },
  { id: 'u6',  username: 'hanziheroes',  displayName: 'Alex Tan',     avatarId: 'sushi',      streak: 60, language: 'mainland', wordsLearned: 410, joinedDate: '2025-10-05', isFollowing: false, followersCount: 214, followingCount: 76,  coursesCount: 2 },
  { id: 'u7',  username: 'pinyinpanda',  displayName: 'Nina Park',    avatarId: 'pineapple',  streak: 8,  language: 'mainland', wordsLearned: 55,  joinedDate: '2026-02-20', isFollowing: true,  followersCount: 18,  followingCount: 22,  coursesCount: 1 },
  { id: 'u8',  username: 'dumpling_dan', displayName: 'Daniel Kim',   avatarId: 'streamedbun',streak: 33, language: 'taiwan',   wordsLearned: 210, joinedDate: '2025-11-10', isFollowing: true,  followersCount: 67,  followingCount: 43,  coursesCount: 1 },
  { id: 'u9',  username: 'teahouse99',   displayName: 'Sophie Lin',   avatarId: 'hotcocoa',   streak: 17, language: 'taiwan',   wordsLearned: 143, joinedDate: '2026-01-28', isFollowing: true,  followersCount: 34,  followingCount: 29,  coursesCount: 2 },
  { id: 'u10', username: 'strokeorder',  displayName: 'Ryan Cheng',   avatarId: 'corn',       streak: 2,  language: 'mainland', wordsLearned: 18,  joinedDate: '2026-03-05', isFollowing: false, followersCount: 5,   followingCount: 11,  coursesCount: 1 },
  { id: 'u11', username: 'mandarin_max', displayName: 'Max Rivera',   avatarId: 'watermelon', streak: 90, language: 'mainland', wordsLearned: 620, joinedDate: '2025-09-01', isFollowing: false, followersCount: 389, followingCount: 102, coursesCount: 3 },
  { id: 'u12', username: 'tonedeaf_not', displayName: 'Priya Sharma', avatarId: 'dragonfruit',streak: 25, language: 'taiwan',   wordsLearned: 175, joinedDate: '2025-12-15', isFollowing: false, followersCount: 52,  followingCount: 47,  coursesCount: 1 },
  { id: 'u13', username: 'chengyu_chloe',displayName: 'Chloe Wang',   avatarId: 'pizza',      streak: 14, language: 'mainland', wordsLearned: 88,  joinedDate: '2026-02-01', isFollowing: true,  followersCount: 23,  followingCount: 30,  coursesCount: 1 },
  { id: 'u14', username: 'fluent_soon',  displayName: 'Tom Nakamura', avatarId: 'beer',       streak: 6,  language: 'mainland', wordsLearned: 42,  joinedDate: '2026-03-12', isFollowing: false, followersCount: 9,   followingCount: 16,  coursesCount: 1 },
  { id: 'u15', username: 'hao_hao',      displayName: 'Yasmin Aziz',  avatarId: 'sheep',      streak: 51, language: 'taiwan',   wordsLearned: 330, joinedDate: '2025-10-20', isFollowing: false, followersCount: 141, followingCount: 68,  coursesCount: 2 },
  { id: 'u16', username: 'xiaoming88',   displayName: 'Leo Fong',     avatarId: 'elephant',   streak: 39, language: 'mainland', wordsLearned: 260, joinedDate: '2025-11-30', isFollowing: false, followersCount: 88,  followingCount: 54,  coursesCount: 1 },
];

// ── Current user's social counts ───────────────────────────────────────────────
let _followingIds = new Set<string>(['u1', 'u2', 'u3', 'u7', 'u8', 'u9', 'u13']);
let _followerIds  = new Set<string>(['u1', 'u3', 'u4', 'u5', 'u8', 'u10', 'u11', 'u12', 'u15', 'u16']);

// ── Getters ────────────────────────────────────────────────────────────────────
export function getFollowing(): SocialUser[] {
  return MOCK_USERS.filter(u => _followingIds.has(u.id)).map(u => ({ ...u, isFollowing: true }));
}

export function getFollowers(): SocialUser[] {
  return MOCK_USERS.filter(u => _followerIds.has(u.id)).map(u => ({
    ...u,
    isFollowing: _followingIds.has(u.id),
  }));
}

export function getFollowingCount(): number {
  return _followingIds.size;
}

export function getFollowersCount(): number {
  return _followerIds.size;
}

export function getUserByUsername(username: string): SocialUser | undefined {
  return MOCK_USERS.find(u => u.username === username);
}

export function searchUsers(query: string): SocialUser[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return MOCK_USERS.filter(
    u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
  ).map(u => ({ ...u, isFollowing: _followingIds.has(u.id) }));
}

export function getMutualFollowers(userId: string): SocialUser[] {
  // Users who follow both the current user AND the target user
  // For mock: return 1-2 users from followers who also follow the target
  return MOCK_USERS.filter(u => _followerIds.has(u.id) && u.id !== userId).slice(0, 2);
}

// ── Actions ────────────────────────────────────────────────────────────────────
export function followUser(userId: string): void {
  _followingIds.add(userId);
}

export function unfollowUser(userId: string): void {
  _followingIds.delete(userId);
}

export function isFollowing(userId: string): boolean {
  return _followingIds.has(userId);
}

export function isFollowedBy(userId: string): boolean {
  return _followerIds.has(userId);
}
