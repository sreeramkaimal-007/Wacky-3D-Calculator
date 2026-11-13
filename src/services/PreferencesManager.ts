import { HistoryEntry, UserPreferences } from '../types/calculator';

const PREFS_KEY = 'wacky3d_prefs_v1';
const HISTORY_KEY = 'wacky3d_history_v1';
const MEMORY_KEY = 'wacky3d_memory_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  soundPack: 'cartoon_pop',
  soundVolume: 0.75,
  randomSoundMode: false,
  roleSoundOverrides: {
    enabled: false,
    number: 'cartoon_pop',
    operator: 'bubble_pop',
    clear: 'rubber_duck',
    equal: 'magical_sparkle',
  },
  vibrationEnabled: true,
  hapticIntensity: 'medium',
  animationsEnabled: true,
  animationStyle: 'jelly',
  funnyReactionsEnabled: true,
  shakeToClearEnabled: false,
  themeId: 'candy_world',
  appearanceMode: 'light',
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      roleSoundOverrides: {
        ...DEFAULT_PREFERENCES.roleSoundOverrides,
        ...(parsed.roleSoundOverrides ?? {}),
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota issues
  }
}

export function resetPreferences(): UserPreferences {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    // Ignore
  }
  return DEFAULT_PREFERENCES;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 100)));
  } catch {
    // Ignore
  }
}

export function loadMemory(): number {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return 0;
    const val = Number(raw);
    return Number.isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

export function saveMemory(val: number) {
  try {
    localStorage.setItem(MEMORY_KEY, String(val));
  } catch {
    // Ignore
  }
}
