import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Setup ─────────────────────────────────────────────────────────────────────
// Controls how notifications are displayed while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  false,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ── Permission ────────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:       'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Practice reminder ─────────────────────────────────────────────────────────
const REMINDER_ID_KEY = 'practice_reminder';

/**
 * Schedule (or reschedule) the daily practice reminder at a given local time.
 * Default: 9:00 AM local time.
 * Suppression (when user has already studied) is handled by cancelling + rescheduling.
 */
export async function schedulePracticeReminder(
  streak: number,
  hour   = 9,
  minute = 0,
): Promise<void> {
  try {
    // Cancel any existing reminder first
    await cancelPracticeReminder();

    const title = streak > 0
      ? `Your ${streak}-day streak is waiting`
      : 'Time to learn something new';
    const body = streak > 0
      ? "Keep it alive — today's words take just a few minutes."
      : "A few cards a day and the words will stick. Start today.";

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID_KEY,
      content: { title, body, data: { screen: 'learn' } },
      trigger: {
        type:   Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {}
}

/** Cancel the practice reminder (call when user has already studied today). */
export async function cancelPracticeReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID_KEY);
  } catch {}
}

// ── Streak freeze in-app banner notification ──────────────────────────────────
/**
 * Schedule a local notification to fire at midnight UTC + 1 min to alert
 * the user that their streak freeze has activated.
 * (Best-effort — fires at ~00:01 UTC the day after a missed day.)
 */
export async function scheduleStreakFreezeNotification(
  streakCount: number,
  freezeNumber: 1 | 2,
): Promise<void> {
  try {
    const isLast  = freezeNumber === 2;
    const title   = isLast
      ? `Last freeze used — your ${streakCount}-day streak is still safe`
      : `Your ${streakCount}-day streak is protected`;
    const body    = isLast
      ? 'This is your final cover. Come back today or your streak resets.'
      : "You missed yesterday — your streak freeze kicked in. Come back today to keep it going.";

    // Fire once — 1 minute from now (approximate "missed day" trigger)
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { screen: 'learn' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 },
    });
  } catch {}
}

// ── Deep-link handler ─────────────────────────────────────────────────────────
/**
 * Returns the target screen from a notification response, or null.
 * Caller is responsible for routing.
 */
export function getNotificationScreen(
  response: Notifications.NotificationResponse,
): string | null {
  return (response.notification.request.content.data?.screen as string) ?? null;
}
