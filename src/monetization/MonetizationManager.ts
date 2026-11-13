import { MonetizationState, SoundPackId, ThemeId } from '../types/calculator';

const MONETIZATION_KEY = 'wacky3d_monetization_v1';
const SESSION_UNLOCK_MS = 60 * 60 * 1000; // 1 hour per rewarded ad preview

/**
 * Placeholder Google Play & AdMob IDs for Android export & test mode clarity.
 * Never ship real production IDs in debug/test builds.
 */
export const ADMOB_TEST_CONFIG = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',
  premiumProductId: 'wacky_3d_calc_premium_lifetime',
};

export const DEFAULT_MONETIZATION: MonetizationState = {
  isPremium: false,
  purchaseToken: null,
  purchasedAt: null,
  rewardedThemeUnlocks: {},
  rewardedSoundUnlocks: {},
  calculationsSinceLastInterstitial: 0,
};

export function loadMonetizationState(): MonetizationState {
  try {
    const raw = localStorage.getItem(MONETIZATION_KEY);
    if (!raw) return DEFAULT_MONETIZATION;
    const parsed = JSON.parse(raw) as Partial<MonetizationState>;
    return {
      ...DEFAULT_MONETIZATION,
      ...parsed,
      rewardedThemeUnlocks: parsed.rewardedThemeUnlocks ?? {},
      rewardedSoundUnlocks: parsed.rewardedSoundUnlocks ?? {},
    };
  } catch {
    return DEFAULT_MONETIZATION;
  }
}

export function saveMonetizationState(state: MonetizationState) {
  try {
    localStorage.setItem(MONETIZATION_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

export function isThemeUnlocked(
  themeId: ThemeId,
  isPremiumTheme: boolean,
  state: MonetizationState
): boolean {
  if (!isPremiumTheme || state.isPremium) return true;
  const expiresAt = state.rewardedThemeUnlocks[themeId];
  return typeof expiresAt === 'number' && expiresAt > Date.now();
}

export function isSoundPackUnlocked(
  packId: SoundPackId,
  isPremiumPack: boolean,
  state: MonetizationState
): boolean {
  if (!isPremiumPack || state.isPremium) return true;
  const expiresAt = state.rewardedSoundUnlocks[packId];
  return typeof expiresAt === 'number' && expiresAt > Date.now();
}

export function grantRewardedThemeUnlock(
  state: MonetizationState,
  themeId: ThemeId
): MonetizationState {
  const next: MonetizationState = {
    ...state,
    rewardedThemeUnlocks: {
      ...state.rewardedThemeUnlocks,
      [themeId]: Date.now() + SESSION_UNLOCK_MS,
    },
  };
  saveMonetizationState(next);
  return next;
}

export function grantRewardedSoundUnlock(
  state: MonetizationState,
  packId: SoundPackId
): MonetizationState {
  const next: MonetizationState = {
    ...state,
    rewardedSoundUnlocks: {
      ...state.rewardedSoundUnlocks,
      [packId]: Date.now() + SESSION_UNLOCK_MS,
    },
  };
  saveMonetizationState(next);
  return next;
}
