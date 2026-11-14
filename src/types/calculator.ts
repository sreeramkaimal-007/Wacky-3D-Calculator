export type ButtonRole = 'number' | 'operator' | 'clear' | 'equal' | 'utility';

export type AnimationStyle = 'jelly' | 'squishy' | 'bouncy' | 'rubber' | 'pop';

export type HapticIntensity = 'light' | 'medium' | 'strong';

export type SoundPackId =
  | 'mechanical'
  | 'cartoon_pop'
  | 'bubble_pop'
  | 'rubber_duck'
  | 'water_drop'
  | 'wooden_click'
  | 'soft_keyboard'
  | 'arcade'
  | 'robotic_beep'
  | 'spring_boing'
  | 'magical_sparkle'
  | 'cute_animal'
  | 'retro_game'
  | 'bubble_wrap'
  | 'silent';

export type ThemeId =
  | 'candy_world'
  | 'ocean_blue'
  | 'mint_fresh'
  | 'rainbow_pop'
  | 'neon_cyber'
  | 'lava_fire'
  | 'galaxy_space'
  | 'chocolate_world';

export type AppearanceMode = 'light' | 'dark';

export type StudioTab = 'calculator' | 'sounds' | 'themes' | 'history' | 'settings';

export interface SoundPackMeta {
  id: SoundPackId;
  name: string;
  description: string;
  category: 'Tactile' | 'Playful' | 'Arcade' | 'Nature' | 'Quiet';
}

export interface RoleSoundOverrides {
  enabled: boolean;
  number: SoundPackId;
  operator: SoundPackId;
  clear: SoundPackId;
  equal: SoundPackId;
}

export interface KeyColorStyle {
  face: string;
  edge: string;
  text: string;
  highlight: string;
}

export interface CalculatorTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  previewSwatches: [string, string, string, string];
  chassisBgLight: string;
  chassisBgDark: string;
  chassisEdgeLight: string;
  chassisEdgeDark: string;
  displayBg: string;
  displayText: string;
  displaySubtext: string;
  accentHex: string;
  celebrationColors: string[];
  keys: {
    number: KeyColorStyle;
    rainbowPalette?: KeyColorStyle[];
    operator: KeyColorStyle;
    clear: KeyColorStyle;
    utility: KeyColorStyle;
    equal: KeyColorStyle;
  };
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  rawResult: number;
  timestamp: number;
  reaction?: string;
}

export interface UserPreferences {
  soundEnabled: boolean;
  soundPack: SoundPackId;
  soundVolume: number; // 0 to 1
  randomSoundMode: boolean;
  roleSoundOverrides: RoleSoundOverrides;
  vibrationEnabled: boolean;
  hapticIntensity: HapticIntensity;
  animationsEnabled: boolean;
  animationStyle: AnimationStyle;
  funnyReactionsEnabled: boolean;
  shakeToClearEnabled: boolean;
  themeId: ThemeId;
  appearanceMode: AppearanceMode;
}

export interface CalcButtonSpec {
  id: string;
  label: string;
  value: string;
  role: ButtonRole;
  ariaLabel: string;
}
