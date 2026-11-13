import React from 'react';
import { Check, Lock, Moon, Sun } from 'lucide-react';
import { THEMES } from '../themes/ThemeRegistry';
import {
  CalculatorTheme,
  MonetizationState,
  UserPreferences,
} from '../types/calculator';
import { isThemeUnlocked } from '../monetization/MonetizationManager';

interface ThemeStoreProps {
  prefs: UserPreferences;
  monetization: MonetizationState;
  onUpdatePrefs: (patch: Partial<UserPreferences>) => void;
  onRequestRewardedTheme: (theme: CalculatorTheme) => void;
  onOpenPremium: () => void;
}

export const ThemeStore: React.FC<ThemeStoreProps> = ({
  prefs,
  monetization,
  onUpdatePrefs,
  onRequestRewardedTheme,
  onOpenPremium,
}) => {
  const handleSelectTheme = (theme: CalculatorTheme) => {
    const unlocked = isThemeUnlocked(theme.id, theme.isPremium, monetization);
    if (!unlocked) {
      onRequestRewardedTheme(theme);
      return;
    }
    onUpdatePrefs({ themeId: theme.id });
  };

  return (
    <div className="space-y-6">
      {/* Header + Appearance Switch */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Theme Store
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            4 free toy themes + 4 premium editions unlockable via Premium or rewarded preview.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onUpdatePrefs({ appearanceMode: 'light' })}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              prefs.appearanceMode === 'light'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdatePrefs({ appearanceMode: 'dark' })}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              prefs.appearanceMode === 'dark'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* 8 Themes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {THEMES.map((theme) => {
          const unlocked = isThemeUnlocked(
            theme.id,
            theme.isPremium,
            monetization
          );
          const isSelected = prefs.themeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelectTheme(theme)}
              className={`rounded-2xl border p-4 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900/10 dark:ring-white/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    {!unlocked && (
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {theme.isPremium
                      ? unlocked
                        ? 'Premium · Unlocked'
                        : 'Premium · Tap for Rewarded Preview'
                      : 'Free Theme'}
                  </p>
                </div>

                {/* Mini 3D Keycap Swatches */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {theme.previewSwatches.map((hex, i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-md border border-black/10"
                      style={{
                        backgroundColor: hex,
                        boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {theme.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {!monetization.isPremium && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            Unlock Neon Cyber, Lava Fire, Galaxy Space & Chocolate World permanently.
          </div>
          <button
            type="button"
            onClick={onOpenPremium}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            Upgrade to Premium
          </button>
        </div>
      )}
    </div>
  );
};
