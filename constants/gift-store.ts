import { supabase } from '@/lib/supabase';
import { addBonusEnergy } from './energy-store';
import { getLocalLanguageId } from './language-id-map';

export type GiftReason =
  | 'maintenance_compensation'
  | 'sharing_reward'
  | 'survey_completion'
  | 'rate_app'
  | 'refund_favor';

export const GIFT_REASON_ICON: Record<GiftReason, string> = {
  maintenance_compensation: '🛠️',
  sharing_reward:           '📢',
  survey_completion:        '📝',
  rate_app:                 '⭐',
  refund_favor:             '🎁',
};

export type Gift = {
  id: string;
  language_id: string;
  reason: GiftReason;
  title: string;
  body: string;
  energy_amount: number;
  status: 'unclaimed' | 'claimed';
  claimed_at: string | null;
  expires_at: string | null;
  created_at: string;
};

/** Fetch all gifts for the current user, newest first. */
export async function getGifts(): Promise<Gift[]> {
  const { data, error } = await supabase
    .from('gifts')
    .select('id, language_id, reason, title, body, energy_amount, status, claimed_at, expires_at, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Gift[];
}

/** Number of unclaimed, unexpired gifts — for the Mail card badge/subtitle. */
export async function getClaimableGiftCount(): Promise<number> {
  const gifts = await getGifts();
  const now = Date.now();
  return gifts.filter(g => g.status === 'unclaimed' && (!g.expires_at || new Date(g.expires_at).getTime() > now)).length;
}

export function isGiftExpired(gift: Gift): boolean {
  return !!gift.expires_at && new Date(gift.expires_at).getTime() < Date.now();
}

/**
 * Claim a gift: atomically marks it claimed and credits `user_energy` server-side
 * (see claim_gift() Postgres function), then mirrors the credit into this app's
 * local per-language energy pool so the UI reflects it immediately.
 * Returns the energy amount claimed, or 0 if the gift wasn't claimable (already
 * claimed, expired, or not found).
 */
export async function claimGift(giftId: string): Promise<number> {
  const { data, error } = await supabase.rpc('claim_gift', { p_gift_id: giftId });
  if (error || !data || !data.length) return 0;

  const { energy_amount: energyAmount, language_id: supabaseLanguageId } = data[0];
  const localLanguageId = getLocalLanguageId(supabaseLanguageId);
  if (localLanguageId) {
    addBonusEnergy(localLanguageId, energyAmount);
  }
  return energyAmount;
}
