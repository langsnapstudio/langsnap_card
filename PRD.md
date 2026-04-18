# Langsnap Card — Product Requirements Document
**Version 12.0 | Front-Office (Mobile App) | MVP**

---

## Overview

Langsnap Card is a mobile application for people who want to learn a new language through flashcards. Users can learn and practice vocabulary through structured flashcard decks organised by themes, textbooks, and language proficiency tests (HSK, TOCFL).

The app is built on React Native + Expo (iOS and Android) and maintained by a solo creator. The product experience should feel personal and supportive, not corporate.

---

## Goals & Success Metrics

### Product goals
- Users can learn vocabulary through flashcards from common themes, textbooks, and language proficiency test levels
- Users build a daily language learning habit through streak mechanics and structured content
- Users progress from free content into premium content as their vocabulary grows
- Users connect with friends to motivate each other through a follow system

### Success metrics
Targets to be revisited and adjusted after the first 1,000 users.

| Metric | Target | Rationale |
|---|---|---|
| D7 Retention | 40% | User returns every day for first 7 days. Signal: content quality and first impression create a daily habit. |
| D30 Retention | 20% | User still active at 30 days. Daily use not required. Signal: content variety keeps users returning. |
| D90 Retention | 10% | User still active at 90 days. Signal: deep product satisfaction and genuine habit formed. |

---

## Users & Personas

### Roles
| Role | Primary needs |
|---|---|
| Learner | Learn vocabulary through flashcards, review learned words, take quizzes, track progress and streaks |
| Admin | CRUD language, CRUD deck album, CRUD word/card list, manage content publishing |

### Persona 1 — Casual beginner
- Age 18–35, student or working adult
- Starting a new language from zero, motivated by travel, culture, or curiosity
- Studies at night in short 10–30 minute sessions
- Wants structured, bite-sized vocabulary starting from common everyday themes

### Persona 2 — Test-prep learner
- Age 18–35, student preparing for HSK or TOCFL exam
- Needs vocabulary organised by test level (HSK 1–6, TOCFL bands)
- Studies at night in focused 10–30 minute sessions
- Motivated by measurable progress toward exam readiness

---

## Problems
- New language learners find it overwhelming to start remembering vocabulary — too many words from too many categories, and most online sources are not well-organised
- Learners who study from physical textbooks must manually create their own flashcards, which takes significant effort
- Learners preparing for language proficiency tests find it difficult to practice vocabulary organised by test level

---

## Scope

### In scope — MVP
Front-office (learner-facing): authentication, learn vocabulary from decks, flashcard review, quiz, streak, challenges (Feats), profile, subscription/premium
Back-office (admin-facing): authentication, CRUD language, CRUD deck, CRUD flashcard pack, CRUD word list

### Out of scope — MVP
- Grammar lessons
- Daily challenges (Phase 2)
- Badges / achievements (Phase 2)
- Offline mode
- Languages beyond Mandarin Chinese (Phase 2: Japanese, Korean, Thai)
- Username change after creation (Phase 2)
- Energy refill notification (Phase 2)
- SRS parameter optimisation — use default weights until ~1,000 active users (Phase 2)

---

## Supported Languages

| Phase | Languages |
|---|---|
| MVP | Mandarin Chinese (Mainland), Mandarin Chinese (Taiwan) |
| Phase 2 | Japanese, Korean, Thai |

---

## Tech Stack

| Component | Detail |
|---|---|
| Framework | React Native + Expo |
| Platforms | iOS + Android |
| Authentication | Google SSO + Apple SSO |
| SRS Library | ts-fsrs (FSRS v5 algorithm) — `npm install ts-fsrs`, MIT licence |
| MVP Language | Mandarin Chinese (Mainland + Taiwan) |

---

## Onboarding Flow

### Step 1 — Sign in
- Splash screen displayed on launch
- Welcome page with animation
- Sign in with Google or Apple SSO

### Step 2 — Profile setup (first-time only)
- User creates a unique username — letters and numbers only, 5–20 characters, no spaces or special characters
- Validated in real time — shows availability as user types
- Cannot be changed after creation in MVP
- Display name is pulled automatically from Google/Apple auth and is editable
- Avatar picker is on this same screen — Netflix-style grid of preset illustrated avatars grouped by category
- Avatar selection is optional — user can skip and change later from Edit Profile screen
- Default avatar assigned if skipped

### Step 3 — Language selection (first-time only)
- User selects their target learning language
- MVP options: Mandarin Chinese Mainland (emoji flag) or Mandarin Chinese Taiwan (emoji flag). All flags are system emoji — no image assets.
- Selection can be changed later from the Profile tab

### Step 4 — Reading system selection (Mandarin Taiwan only)
- Shown only when user selects Mandarin Chinese (Taiwan)
- User chooses: Pinyin or Zhuyin
- Preference saved and applied to all card displays
- Can be changed later in Profile → Settings

### Step 5 — Welcome bottom sheet (first-time only)
- Appears after the user lands on the Learn tab for the first time
- Displays creator photo (avatar-me.png) — no circle crop, no background
- Copy:
  - **Para 1:** "Hey, I'm Septymo 👋🏻 / Designer & Solo creator of this app."
  - **Para 2:** "I hope **500+ crafted illustrated flashcards** I poured into this app could help you learn more effectively — and have more fun doing it. Thank you for your support. 🙏🏻" ("500+ crafted illustrated flashcards" bold)
  - **Para 3:** "Now — pick a deck that catches your eye and dive in. Enjoy the journey! ✨"
  - **Button:** "Let's start learning!"
- Tone: solo-creator, personal — feels like supporting a person, not a company
- No tutorial content — kept warm and brief
- Has X close button top-right; also dismisses via swipe-down or button

### Step 6 — First pack redemption (energy explainer)
- Shown as a bottom sheet on the very first pack redemption ever — not during onboarding
- 3 rows explaining the energy mechanic: (1) Daily refill — you get 1 energy every day, (2) Earn from challenges — complete Feats to earn bonus energy, (3) Free packs cost nothing — Lv.1 and Lv.2 are always free
- "Got it!" button dismisses and marks the explainer as seen — never shown again (AsyncStorage flag)

---

## Key Flows

| Flow | Description |
|---|---|
| Onboarding | Sign in → Profile setup (username + avatar) → Language selection → Reading system (TW only) → Learn tab → Welcome bottom sheet → First pack redemption energy explainer |
| Learn | Browse deck sections → Deck detail → Redeem pack with energy → Flashcard review → Success screen |
| Review | Cards tab → Setup bottom sheet (mode, filters, session size) → Flashcard review with SRS → Results |
| Quiz | Cards tab → Quiz → Multiple choice questions → Results |
| Profile | View stats, manage languages, view challenges, social/friends, settings, account |
| Social | Find friends via search or link → View public profile → Follow → See friends list |
| Upgrade | Tap crown-locked pack or profile subscription section → Upgrade modal → Subscribe |

---

## Front-Office Requirements

### Bottom navigation
- Tab 1: Learn
- Tab 2: Cards
- Tab 3: Profile

Each tab uses a custom SVG icon (active state: brand purple fill, inactive: #262626 fill).

---

## Learn Tab

This tab is where users explore vocabulary themes and learn new words.

### Display
- Active language indicator displayed top left — shows emoji flag and language name (e.g. flag emoji + "Mandarin (Taiwan)"). Tapping navigates to /profile/courses.
- Energy badge displayed top right — shows combined total of time-limited and no-time-limit energy
- Tap energy badge → opens Energy bottom sheet
- Deck sections ordered by back-office (e.g. HSK section, Themes section), each with a section title
- Each section displays a deck carousel — up to 6 decks, sorted by back-office
- If more than 6 decks in a section, a "See all" button navigates to the theme list page
- Theme list page: filter tabs (All, Common, Occasional, Specialise) to browse decks
- Each deck card shows: cover image, deck title, supporting title (e.g. Chinese characters)
- Tap a deck card → navigates to Deck detail page

### Energy bottom sheet — normal state
- Time-limited energy: energy icon + quantity + countdown timer until next refill (shown in user's local time)
- No-time-limit energy: energy icon + quantity
- Both shown side by side

### Energy bottom sheet — empty state
- Message explaining energy is depleted and showing countdown to next refill in local time
- CTA button: "Go to Challenges" — navigates user to Challenges in Profile tab
- Triggered by: tapping energy badge on Learn tab OR tapping a locked pack on Deck detail page

### Deck detail page
- Deck cover image, title, supporting title
- Total word count
- Flashcard pack list: each pack shows thumbnail illustration, level (Lv. 1, Lv. 2...), card count, and energy cost

### Pack locking — two levels
- **Progression lock (lock icon):** User must complete the current level before the next level unlocks. Sequential: Lv.1 → Lv.2 → Lv.3. Applies to all users including premium. Completion = reaching the success screen after viewing all cards in the pack once.
- **Premium lock (crown icon):** Paid content. Requires active subscription. Lv.1 and Lv.2 are free for all users. Lv.3 onwards are premium by default (configurable per deck by admin).
- Tapping a progression-locked pack: shows locked state, no action
- Tapping a premium-locked pack: opens Upgrade modal

### Pack redemption confirmation
- When tapping an unlocked pack: bottom sheet shows pack thumbnail, pack name, card count, energy cost
- Buttons: Cancel and Continue
- Tapping Continue deducts energy and navigates to Flashcard review screen

### Flashcard review screen (Learn flow)
Displayed after a user redeems a pack from the Learn tab.

- Progress bar at top — advances with each card swipe
- Back arrow (top left) to exit
- Card front: illustration (optional), vocabulary (large), part of speech tag, voice button
- Card back: vocabulary (top), part of speech tag with tag pills shown inline (not a separate row), English meaning, voice button
- Illustration (optional): shown top-right, 60×60px, absolutely positioned
- Example sentences (up to 2): Chinese text / Pinyin or Zhuyin / English meaning
- Zhuyin/Pinyin toggle moved out of the card — accessible via the gear icon (settings sheet, top-right nav bar). Toggle labelled "Pinyin 拼音" / "Zhuyin 注音" for learner clarity.
- Card colour: defined per pack by admin
- Tap card to flip front/back
- Swipe left or right to navigate to next/previous card

### Success screen
- Shown after all cards in the pack are reviewed — this also triggers the next progression level unlock
- Animated cards fanning out in background
- "Well Done!" message
- "You have collected X new flashcards" — shows card count from the pack
- "Share to story" button — shares completion as an image to Instagram Stories
- "Done" text button — returns to Deck detail page

---

## Cards Tab

This tab is where users review and practice vocabulary they have already learned.

### Empty state — no packs activated
- Shown when the user has not yet activated any card pack
- Review/Quiz action buttons are hidden
- Displays 🃏 icon, "No decks yet" title, and "Head to the Learn tab and open a card pack to get started." message

### All-words level
- Total learned word count displayed prominently
- Review button (🧠) and Quiz button (🎮) for all learned words — hidden until at least one pack is activated
- Empty state: if no words learned yet, show friendly message "You haven't learned any words yet — go explore a deck!" with a button back to the Learn tab

### Per-deck level
- Shows only decks the user has studied
- Each deck shows Review (🧠) and Quiz (🎮) buttons
- Word list with sub-category filter tabs (e.g. Mammals, Birds, Aquatic) — for browsing only, does not affect Review or Quiz content
- Mark as mastered per word: words marked as mastered are excluded from Review and Quiz by default. Can be toggled back in. SRS state is preserved but card is filtered out at query level.

### Review setup bottom sheet
Appears when user taps Review at either all-words or per-deck level.

**All-words level includes:**
- Mode selector: Manual or Auto-play. Auto-play is Premium only — shown dimmed with a crown badge for free users. Tapping it opens the Upgrade modal directly.
- SRS filter chips: All / Due Today / New Only — defaults to Due Today. Controls which cards are included in the session.
- Session size: 15 / 30 / 50 cards
- Category/deck filter: select which decks to include
- Toggle illustration on/off
- Toggle audio autoplay on/off

**Per-deck level includes:**
- Mode selector: Manual or Auto-play. Auto-play is Premium only — shown dimmed with a crown badge for free users. Tapping it opens the Upgrade modal directly.
- SRS filter chips: All / Due Today / New Only — defaults to Due Today
- Toggle illustration on/off
- Toggle audio autoplay on/off

### Review mode — Manual
- User swipes right = "Got it" → maps to Rating.Good in FSRS
- User swipes left = "Missed it" → maps to Rating.Again in FSRS
- Swipe ratings feed the SRS algorithm — updates due date and stability per card
- Settings icon (top right) available during session: toggle illustration, toggle audio autoplay

### Review mode — Auto-play / ASMR mode (Premium only)
- Premium users only — shown as locked with upgrade prompt for free users
- Cards auto-advance every 3–5 seconds
- Audio plays automatically per card
- Hands-free, passive listening experience — designed for use while doing other activities
- Background audio playback: session continues running (cards advance + audio plays) when user locks their screen or switches to another app — implemented via expo-av with background audio session
- Player controls displayed below the card — Spotify-style layout: Previous, Pause/Play, Next buttons
  - Previous: navigates to the previous card and plays its audio from the start
  - Next: skips immediately to the next card and plays its audio
  - Pause/Play: pauses or resumes auto-advance and audio. When paused, the card holds in place until the user resumes.
- No SRS rating in this mode — does not feed the algorithm, card states unchanged
- Settings icon (top right) available during session: toggle illustration, toggle audio autoplay

### SRS (Spaced Repetition System) algorithm
- Library: ts-fsrs (FSRS v5, TypeScript, MIT licence) — `npm install ts-fsrs`
- Algorithm: FSRS v5 with default weights — no manual tuning required at launch
- Configuration: `request_retention = 0.9` (90% target recall), `maximum_interval = 365` days, `enable_fuzz = true`
- Rating mapping: swipe right (Got it) = Rating.Good, swipe left (Missed it) = Rating.Again
- Per-card data stored: due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review
- Review order: cards sorted by due date ascending — most overdue shown first
- Auto-play mode does not feed SRS — card states unchanged after Auto-play session
- Parameter optimisation: not in MVP — train on real review logs once ~1,000 active users reached

### Quiz mode — multiple choice
- Question types (any combination): vocab → pick meaning, meaning → pick vocab, audio pronunciation → pick vocab or meaning
- 4 answer choices per question
- Illustration shown optionally with question (not all words have illustrations)
- Session size controlled by setup bottom sheet selector (15 / 30 / 50)

### Quiz setup bottom sheet
Quiz reuses the Review setup sheet with a reduced set of controls — no mode selector, no illustration toggle, no audio autoplay toggle.
- Shows: Cards per session (15 / 30) and category filter only
- Does not show: mode selector, illustration toggle, audio autoplay toggle
- Applies at both all-words level and per-deck level — no deck filter shown at per-deck level since context is already a specific deck

---

## Profile Tab

### Profile header
- Instagram-style layout: avatar on the left, info on the right
- Avatar: view-only on the profile tab — tap "Edit profile" to change
- Right side: display name, @username, three stats (Courses | Followers | Following)
- Courses stat shows active language emoji instead of a number — e.g. flag emoji for single language, or flag emoji + '+2' style badge if studying more than one language
- Stats are tappable: Courses → Courses screen, Followers/Following → Friends screen
- Bottom row: two equal-width buttons — "Edit profile" (pencil) and "Share profile" (QR)
- Purple header background bleeds behind status bar (nested SafeAreaView pattern)
- Premium badge: crown emoji pill shown inline with display name in the purple header area when user has an active Premium subscription

### Edit profile screen (`/profile/edit`)
- Avatar at top: tappable, opens avatar picker bottom sheet (Netflix-style grid)
- "Change avatar" text link below avatar — no pencil badge icon
- Fields: Name (editable), Username (read-only, muted), Email (read-only, muted)
- Save button in nav bar: saves display_name to Supabase, refreshProfile, navigates back. Always navigates back regardless of success or error — 6-second timeout prevents infinite loading state.

### Avatar picker
- Netflix-style grid layout — preset illustrated avatars grouped by category
- Category sections (e.g. Classic, etc.) — admin manages avatar packs
- Tap avatar to select, tap confirm to save
- Default avatar assigned during onboarding if user skips

### Courses screen (`/profile/courses`)
- Accessible from own profile and friend profile (Courses stat tap)
- Accepts optional username URL param; if present shows friend's courses
- Nav title: "My Courses" or "[Name]'s Courses"
- Nav bar background: cream (BG_CREAM)
- Separated into two sections: "Now studying" (active language, shown at top with purple border) and "Other courses"
- Course row: emoji flag, language name, words learned
- Active language has purple border and sits at the top of "Now studying" section
- All flags are system emoji — no image-based flags
- Own profile only: "Add new language" button at the bottom → navigates to `/profile/add-language`

### Add new language screen (`/profile/add-language`)
- New screen — accessible from the Courses screen via "Add new language" button
- Shows all available languages with emoji flags
- Filters out languages the user is already studying
- Tapping a language shows a purple selection border
- Confirm button adds the language to the user's courses
- MVP production languages: Mandarin Chinese Mainland, Mandarin Chinese Taiwan
- Japanese (flag emoji) shown as mock/demo only — Phase 2 in production

### Friends screen (`/profile/friends`)
- Two tabs: Following / Followers
- Each row: avatar, display name, @username only (no language flag, no streak emoji)
- Find friends search bar — search by username
- Follow/Unfollow button per row
- Tapping a user navigates to their public profile

### Other user's public profile (`/profile/[username]`)
- Purple header covers status bar (same nested SafeAreaView pattern)
- Avatar fills full circle, no border ring, 88px
- Layout: avatar left, right side: display name, join date, three stats (Courses | Followers | Following) — all tappable
- Courses stat shows active language emoji badge — same display logic as own profile
- No language pill (removed — course stat covers this)
- Mutual followers row (if any)
- Follow button (white bg, purple text) + QR button (semi-transparent white)
- Scrollable section below: Achievements (coming soon in MVP)

### Language switcher
- Shows current active language
- Switch between languages the user has added
- Add new language from the available list
- Switching language updates the Learn tab to show relevant decks

### Stats
- Current streak (days) with streak icon
- Total words learned
- Total cards reviewed

### Streak card
- Streak count + "Keep it up" sub-text
- Streak freeze badge: blue if freeze available, grey if used. Shows count (e.g. 2/2 for Premium, 1/1 for Free)

---

## Energy Mechanic

### Core unit
- 1 energy unit = 1 pack redemption, any level, any deck
- Pack cost: 1 ⚡ flat — all levels cost the same
- Energy badge on Learn tab shows combined total of time-limited + no-time-limit energy
- Spend order: time-limited energy is always consumed first

### Day reset
- Day resets at midnight UTC for all users
- Countdown timers in the UI (energy badge, energy bottom sheet) are displayed in the user's local time

### Time-limited energy
- Both Free and Premium users receive 1 ⚡ time-limited energy per day
- Refills at midnight UTC
- Expires at the next refill — unused time-limited energy is lost, preventing stockpiling across days
- Cap: cannot exceed the daily refill amount (1 ⚡)

### No-time-limit energy
- Earned from Feats/Challenges — never expires, accumulates freely, no cap
- Premium subscribers receive +3 ⚡ no-time-limit energy on each subscription renewal (monthly or yearly billing cycle)
- Yearly subscribers receive 3 ⚡ × 12 = 36 ⚡ no-time-limit energy across the year
- Free users earn no-time-limit energy only through Feats

### Free vs Premium energy summary

| | Free | Premium |
|---|---|---|
| Daily time-limited refill | 1 ⚡ | 1 ⚡ (same as Free) |
| No-time-limit on renewal | — | +3 ⚡ per billing cycle |
| No-time-limit from Feats | +1 ⚡ per feat claimed | +1 ⚡ per feat claimed |
| Max earnable from Feats | 14 ⚡ lifetime | 14 ⚡ lifetime |

---

## Streak Mechanic

### What counts as a valid study session
- Reaching the success screen after redeeming and completing a pack (Learn flow)
- Completing any review session in Manual or Auto-play mode (Cards tab)
- Whichever comes first that day counts — only one qualifying event needed per day
- Day boundary: midnight UTC

### Streak rules
- Streak increments by 1 each UTC day a valid study session is recorded
- Practice reminder push notification is suppressed if a valid session has already been recorded that UTC day

### Streak freeze

| Rule | Free | Premium |
|---|---|---|
| Freeze capacity | 1 auto-freeze | 2 auto-freezes |
| Consecutive days protected | 1 missed day | 2 missed days |
| Recharge | Automatically on next valid study session | Both freezes recharge on next valid study session |
| Reset condition | 2 consecutive missed UTC days → streak resets to 0 | 3 consecutive missed UTC days → streak resets to 0 |

- Freeze activates automatically — no user action needed
- Freeze holds streak in place but does not increment it
- Freeze capacity is permanent for the plan — Premium users always recharge to 2, Free to 1

---

## Challenges (Feats)

### Overview
- One-time milestone achievements — each feat can only be claimed once per user, never repeats
- 14 feats total in MVP — 14 ⚡ maximum no-time-limit energy earnable lifetime from feats
- All feats reward +1 ⚡ no-time-limit energy — flat across all tiers for MVP
- Reward amount hardcoded for MVP — back-office configurability planned for a later phase

### Feats list

| # | Name | Requirement | Reward |
|---|---|---|---|
| 01 | First step | Redeem your first flashcard pack | +1 ⚡ |
| 02 | Word collector | Learn your first 10 words | +1 ⚡ |
| 03 | First review | Complete your first review session | +1 ⚡ |
| 04 | Quiz taker | Complete your first quiz | +1 ⚡ |
| 05 | On a roll | Reach a 7-day streak | +1 ⚡ |
| 06 | Habit formed | Reach a 30-day streak | +1 ⚡ |
| 07 | Going strong | Reach a 60-day streak | +1 ⚡ |
| 08 | Committed learner | Reach a 100-day streak | +1 ⚡ |
| 09 | Growing vocabulary | Learn 50 words total | +1 ⚡ |
| 10 | Century club | Learn 100 words total | +1 ⚡ |
| 11 | Word master | Learn 300 words total | +1 ⚡ |
| 12 | First connection | Follow your first friend | +1 ⚡ |
| 13 | Making an impression | Get your first follower | +1 ⚡ |
| 14 | Share your progress | Share a pack completion to Instagram Stories | +1 ⚡ |

### Challenges screen (`/profile/challenges`)
- Each challenge is its own card (gap: 10 between cards)
- Sort order: ready-to-claim (A–Z) → in-progress (A–Z) → claimed (A–Z)
- Claim button always visible: purple (claimable), disabled (not yet met), "Claimed" (done)
- Claimed cards: opacity 0.45
- On claim: success bottom sheet slides up with confetti + `challenge_claimed.wav` sound
- +{reward} energy earned! message, "Go activate more content" CTA, "Maybe later" dismiss

### Challenges card (own profile)
- No section header above the card
- Card title: "Challenges"
- Subtitle: "X ready to claim ⚡" when claimable > 0; otherwise "Nothing to claim"
- When claimable > 0: animated pulse dot (ripple ring + solid core) appears left of the chevron

---

## Subscription & Premium

### Free vs premium content rule
- Lv. 1 and Lv. 2 of every deck are free for all users
- Lv. 3 onwards require an active subscription (crown lock icon)
- Admin can configure the free/premium split per deck
- Premium does not bypass the progression system — users must still complete each level sequentially

### Premium benefits summary

| Benefit | Detail |
|---|---|
| All levels unlocked | Access to Lv.3+ premium content across all decks |
| Auto-play, games & quizzes | Auto-play / ASMR mode with background playback. Games and quizzes Phase 2. |
| +3 bonus energy on renewal | +3 ⚡ no-time-limit on each subscription renewal cycle |
| 2 streak freezes | 2 auto-freezes instead of 1 — survives 2 consecutive missed days |
| Exclusive decks | Exclusive decks and content, just for Premium |

### Pricing (THB)

| Plan | Price |
|---|---|
| Monthly | ฿289 / month |
| 3 months | ฿747 (฿249/mo) — Save 14% |
| Yearly — Best value | ฿2,508 (฿209/mo) — Save 28% |

### Upgrade modal (UpgradeModal)
- Triggered by: tapping a crown-locked pack OR tapping upgrade prompt in Profile tab OR tapping locked Auto-play mode
- Subtitle: "Full access to every deck, pack, and level"
- 5 benefit bullets: "All levels unlocked" / "Auto-play, games & quizzes" / "+3 bonus energy on renewal" / "2 streak freezes" / "Exclusive decks"
- Plans: horizontal 3-column layout, equal width, equal height (alignItems: stretch)
- X close button top-right. All bottom sheets across the app have an X close button top-right and support swipe-down-to-dismiss via a shared `useSheetDismiss` gesture hook. Swipe-down is recognised on the **entire sheet area** (not just the handle bar) and animates the sheet sliding off the bottom of the screen.
- Legal: "Terms of Service • Privacy Policy" as purple text links

### Subscription status (Profile tab)
- Free users: "Go Premium" card with an Upgrade button — tapping opens the Upgrade modal
- Premium users: shows plan name, next renewal date, and a "Manage" link
- "Manage" link deep-links to platform subscription settings — iOS: Settings > Apple ID > Subscriptions, Android: Google Play > Subscriptions
- No in-app cancel flow — cancellation is handled entirely by Apple or Google

### Premium success sheet
- Shown after a user successfully subscribes — slides up over the closed Upgrade modal
- Confetti animation + sound effect on appearance
- Crown icon at top, welcome message
- 5 benefit pills displayed in 2 rows: All levels unlocked / Auto-play, games & quizzes / +3 bonus energy on renewal / 2 streak freezes / Exclusive decks
- CTA button: "Enjoy Premium"

---

## QR Code / Share Profile Modal
- Shows QR code, @username, profile URL
- Two action buttons: "Copy link" and "Share" — white card background, no purple circle behind icon

---

## Notifications

### Notification copy & rules

| Notification | Type | Trigger |
|---|---|---|
| Practice reminder | Push · daily | User-set time. Suppressed if a valid study session has already been recorded that UTC day. |
| Streak freeze activated (1st freeze) | Push + in-app banner | Midnight UTC when user misses a day and freeze activates. |
| Streak freeze activated (2nd freeze — Premium) | Push + in-app banner | Midnight UTC when user misses a second consecutive day and 2nd freeze activates. |
| New follower | Push · event | User gains a follower. Batched: multiple follows within 15-min window → 1 push. |
| Friend milestone | Push · event | Friend hits 7-day streak, 30-day streak, or 50 words learned. |
| Energy refill reminder | — | Not in MVP — Phase 2 only. |

### Notification message copy

**Practice reminder**
| Variant | Copy |
|---|---|
| Default (streak > 0) | Title: "Your {{streak_count}}-day streak is waiting" / Body: "Keep it alive — today's words take just a few minutes." |
| No streak (streak = 0) | Title: "Time to learn something new" / Body: "A few cards a day and the words will stick. Start today." |

**Streak freeze — 1st freeze (Free & Premium)**
| Channel | Copy |
|---|---|
| Push notification | Title: "Your {{streak_count}}-day streak is protected" / Body: "You missed yesterday — your streak freeze kicked in. Come back today to keep it going." |
| In-app banner | Title: "Streak freeze used" / Body: "Your {{streak_count}}-day streak is safe — but today's the last chance to keep it alive." |

**Streak freeze — 2nd freeze (Premium only)**
| Channel | Copy |
|---|---|
| Push notification | Title: "Last freeze used — your {{streak_count}}-day streak is still safe" / Body: "This is your final cover. Come back today or your streak resets." |
| In-app banner | Title: "Last freeze used" / Body: "Today is your final day to keep your streak alive." |

**New follower**
| Variant | Copy |
|---|---|
| Single follower | Title: "{{follower_display_name}} started following you" / Body: "Check out their profile and follow back." |
| Batched (2+ in 15 min) | Title: "{{follower_display_name}} and {{others_count}} others started following you" / Body: "Your learner community is growing." |

**Friend milestone**
| Milestone | Copy |
|---|---|
| 7-day streak | Title: "{{friend_display_name}} is on a 7-day streak" / Body: "They're building a real habit — keep up with them!" |
| 30-day streak | Title: "{{friend_display_name}} just hit a 30-day streak" / Body: "A whole month of learning — amazing. Don't let them get too far ahead!" |
| 50 words learned | Title: "{{friend_display_name}} just learned their 50th word" / Body: "They're on a roll. How many words have you learned this week?" |

### Notification rules
- Practice reminder: max 1 per day. Suppressed if session already recorded that UTC day. Deep link → Learn tab.
- Streak freeze: max 1 per freeze event. In-app banner dismisses when user taps into Learn or Cards tab. Deep link → Learn tab.
- New follower: batching window 15 minutes → 1 push. Max 3 pushes per day. Single → deep link to follower profile. Batched → deep link to Followers tab.
- Friend milestone: one-way follow — you follow them, you get notified (no mutual follow required). Per-friend cooldown: 7 days after a milestone push from that friend. Max 2 pushes per day across all friends. Deep link → friend's public profile.

### Notification settings screen (`/profile/notifications`)
Accessible from Profile → Account → Notifications.

**Reminders section:**
- 🔔 Practice reminder — toggle on/off
  - When on: "Daily reminder time" row appears showing current time (e.g. 8:00 PM) with chevron → opens time picker bottom sheet
  - Time picker: scrollable Hour and Minute columns, live preview, "Set reminder" confirm button

**Activity section:**
- 🧊 Streak freeze alert — toggle on/off
- 👥 New follower — toggle on/off
- 🏆 Friend milestones — toggle on/off (hint: notifies when a friend hits 7-day streak, 30-day streak, or 50 words learned)

---

## Empty & Error States

| State | Behaviour |
|---|---|
| No energy (badge tap or pack redemption) | Energy bottom sheet shows depleted message with countdown to next refill + CTA button to Challenges |
| No packs activated (Cards tab) | Review/Quiz buttons hidden; 🃏 empty state shown with prompt to visit Learn tab |
| No words learned (Cards tab) | Empty state: "You haven't learned any words yet — go explore a deck!" with button to Learn tab |
| No internet connection | Full-screen overlay covering all tabs with no-connection icon, message, and "Try again" button. Screen disappears automatically when connection is restored. |
| Empty deck (zero words) | Prevented on admin side — admin cannot publish a deck with zero words |
| Free user taps Auto-play mode | Mode shown as locked in setup bottom sheet with upgrade prompt |

---

## Social Features

### Follow system
- Public follow system — anyone can follow anyone, no approval needed
- Users are discoverable by username search or shareable profile link/QR code
- Following and follower counts displayed on own profile and public profiles
- Friend milestone notifications are one-way — you follow them, you receive their milestone pushes

### Username & identity

| Field | Rules |
|---|---|
| Display name | Pulled from Google/Apple auth on sign-up. Editable anytime from Edit Profile screen. Shown in follower/following lists. |
| Username | Created during onboarding. Letters and numbers only. 5–20 characters. Unique, validated in real time. Cannot be changed in MVP. |
| Avatar | Selected from preset illustrated avatar packs. Optional during onboarding. Editable from Edit Profile screen anytime. |

### Phase 2 social features
- Badges/achievements displayed on public profile — earned by completing Feats challenges
- Daily challenges for social engagement
- Username change capability

---

## Multi-Language Behaviour

Each language the user adds is treated as an independent course with its own isolated context.

| Data | Scope |
|---|---|
| Streak | Per-language — each language has its own streak counter and freeze state |
| Energy | Per-language — time-limited refill and no-time-limit reserve are separate per language. Pools are lazily initialised per languageId — all energy functions take languageId as their first parameter. |
| Word stats | Per-language — words learned and cards reviewed tracked independently |
| Feats progress | Global — feat progress counts across all languages (e.g. 50 total words across any language) |
| Subscription | Global — one subscription unlocks premium content across all languages |
| Avatar, display name, username | Global — shared across all languages |

- Switching active language in the profile tab switches the full context — streak, energy, learn tab content, and review queue all reflect the active language
- The Courses screen shows all languages the user has added, each with its own words learned count and Active badge
- Practice reminder notification fires per active language — one push per language the user has enabled reminders for

---

## Subscription Lapse Behaviour

When a user cancels their subscription, access continues until the end of the paid period. No early cutoff.

| Feature | Behaviour on lapse |
|---|---|
| Premium content access | Retained until end of paid period. Lost immediately after. |
| No-time-limit energy already granted | Kept forever — no clawback regardless of lapse. |
| Daily energy refill | Drops back to Free (1 per day) at the start of the next UTC day after lapse. |
| Renewal energy bonus | No +3 granted on next billing cycle since subscription is cancelled. |
| Streak freeze capacity | Drops from 2 to 1 at the next freeze event after lapse. |
| Auto-play mode | Locked immediately on lapse — shown as Premium-locked in setup bottom sheet. |
| Premium cards in word list | Remain visible but dimmed with a crown icon. Tapping opens the Upgrade modal. |
| Premium cards in SRS queue | Silently excluded from review sessions on lapse. SRS state preserved in database. |
| Review session with mixed cards | Works normally — premium cards excluded silently, no banner or message shown. |
| Resubscribe | Premium cards return to SRS queue with existing state intact. +3 no-time-limit energy granted on new renewal. |

---

## Report a Bug

Accessible from Profile → Account → Report a bug, and also from the scrollable section on a friend's public profile page.

### Flow
- Opens as a bottom sheet
- Required: description text field — user describes the issue
- Optional: feature dropdown — which area does this relate to (e.g. Flashcard review, Cards tab, Profile, Energy, Streak, Other)
- Submit button — sends report
- Success state: checkmark icon + confirmation message "Thanks for the report — we'll look into it!"
- Report is logged for manual review by the creator — no automated action

*Report user is out of scope for MVP — can be added in Phase 2.*

---

## Delete Account Flow

### Steps
1. User taps Delete account in Account management (Profile > Settings > Account)
2. Confirmation screen shown: explains what will be deleted and that recovery is possible within 30 days
3. User must confirm by tapping Delete my account — no password re-entry required (auth is SSO)
4. Account is deactivated immediately — user is signed out and cannot log back in

### 30-day soft delete window
- Account is deactivated immediately but not permanently deleted
- Profile is no longer visible to other users
- Followers are removed immediately — follower/following relationships are severed
- User can recover their account within 30 days by contacting support via email
- After 30 days: all data is permanently deleted — profile, SRS data, streak, energy, word history
- If user had active Premium at time of deletion: subscription lapses immediately, no refund

---

## Instagram Stories Share Spec

Triggered by the "Share to story" button on the pack success screen.

| Property | Spec |
|---|---|
| Format | Static image — no video or animation |
| Dimensions | 1080 × 1920px (9:16 — Instagram Stories standard) |
| Content | Deck name, pack level (e.g. Lv. 1), number of cards collected, Langsnap Card branding |
| Background | Uses the pack card colour as the background |
| Generated | Client-side at moment of tapping — no server-side rendering needed |
| Share method | Native Instagram Stories share API |
| Fallback — Instagram not installed | System share sheet opens with the image as a shareable file |
| Fallback — share fails | Silent failure — no error shown to user |

---

## Data Model

### Content structure hierarchy
Language → Section → Deck → Pack → Card

### Pack fields

| Field | Notes |
|---|---|
| packTitle | e.g. Lv. 1 |
| cardCount | Number of cards in the pack (10–15) |
| energyCost | Always 1 — flat cost across all levels |
| isFree | true = free for all users, false = premium (crown lock). Lv.1 and Lv.2 default to true, Lv.3+ default to false. Admin can override per pack. |
| cardColor | Hex colour for card background, defined per pack |
| thumbnailIllustration | Representative image shown on pack card UI |
| isPublished | Admin toggle — draft vs live |

### Card fields

| Field | Required | Notes |
|---|---|---|
| word | Yes | The vocabulary (Chinese character) |
| pinyin | Yes | Romanization |
| zhuyin | Taiwan only | Phonetic symbols (ㄅㄆㄇ) |
| meaning | Yes | Primary English translation |
| partOfSpeech | Yes | Primary part of speech: n. / v. / adj. etc. |
| audioUrl | Yes | For voice button playback |
| illustration | No | Optional image per card |
| cardColor | Yes | Inherited from Pack, can be overridden per card |
| tags | No | Array of strings e.g. ["HSK 1", "TOCFL Band A"]. Shown as label pills on card back. |
| exampleSentence1 | No | First example sentence (Chinese) |
| exampleSentence1Pinyin | No | Pinyin of first sentence |
| exampleSentence1Zhuyin | No | Zhuyin of first sentence (Taiwan only) |
| exampleSentence1Meaning | No | English translation of first sentence |
| exampleSentence1PartOfSpeech | No | Part of speech role in first sentence e.g. v. |
| exampleSentence2 | No | Second example sentence (Chinese) |
| exampleSentence2Pinyin | No | Pinyin of second sentence |
| exampleSentence2Zhuyin | No | Zhuyin of second sentence (Taiwan only) |
| exampleSentence2Meaning | No | English translation of second sentence |
| exampleSentence2PartOfSpeech | No | Part of speech role in second sentence e.g. n. |

Words with multiple pronunciations (e.g. 行 xíng vs háng) are created as separate cards. Cap of 2 example sentences per card for MVP.

### SRS card state fields (per user per card)

| Field | Notes |
|---|---|
| due | Date the card is next due for review — managed by ts-fsrs |
| stability | Memory stability — how long recall holds |
| difficulty | Inherent difficulty of the card for this user |
| elapsed_days | Days since last review |
| scheduled_days | Interval set at last review |
| reps | Total number of reviews |
| lapses | Number of times card was forgotten (Rating.Again) |
| state | New / Learning / Review / Relearning — managed by ts-fsrs |
| last_review | Timestamp of most recent review |

### SocialUser fields (mock)

| Field | Notes |
|---|---|
| id | Unique identifier |
| username | Unique username |
| displayName | Editable display name |
| avatarId | Selected preset avatar |
| language | Active learning language |
| joinedDate | Account creation date |
| followersCount | Number of followers |
| followingCount | Number of accounts followed |
| coursesCount | Number of languages/courses active |
| wordsLearned | Total words learned |
| streak | Current streak in days |

### Reading system preference

| Where | Behaviour |
|---|---|
| Onboarding (step 4) | After language selection, user chooses Pinyin or Zhuyin. Shown only when Mandarin Chinese (Taiwan) is selected. |
| Profile → Settings | User can change reading system preference at any time. |
| Mandarin Chinese (Mainland) | Pinyin only — no Zhuyin option shown. |

---

## Design System

- Figma Design System: https://www.figma.com/design/Pvb8HvrqVYouicM4EQ7hAZ/LSC.-Foundation--1.0
- 531 variables, 7 collections: Semantic Color, Primitives Color, Primitive Typo, Primitive Sizing, Semantic Typo, Semantic Sizing, Semantic Motion
- UI Screens Figma: https://www.figma.com/design/apw5hkgZunV6Nzfhs6Syjn/-WS--Langsnap-Card

---

## Open Questions & Next Steps

### Back-office requirements
The admin-facing system (content management) has not yet been fully specified. To be defined separately, including:
- Screen-by-screen requirements for admin dashboard
- Content publishing workflow: draft vs published states
- Bulk import: CSV or spreadsheet upload for word lists
- Admin validation rules: cannot publish a deck/pack with zero cards
- Feat reward amount field — currently hardcoded at +1 ⚡, back-office configurability planned for a later phase

### Technical requirements
To be defined:
- Authentication provider spec: session management, token expiry
- TTS provider for voice buttons: language support, fallback behaviour
- Analytics: event tracking spec and analytics platform
- Performance targets: animation fps, API response time, load times
- Accessibility: font size support, screen reader compatibility, colour contrast
- Background audio implementation: expo-av configuration for backgrounded session continuity in Auto-play mode
- Subscription management: confirm deep-link URLs for iOS (Settings > Apple ID > Subscriptions) and Android (Google Play > Subscriptions) and test on both platforms before launch

---

*This PRD covers the Front-Office (learner-facing mobile app), Social Features, and Data Model for Langsnap Card MVP. Back-office (admin) requirements and technical architecture to be documented separately.*
