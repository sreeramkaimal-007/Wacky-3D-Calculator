import React, { useState } from 'react';
import {
  Code2,
  Crown,
  RotateCcw,
  Share2,
  Shield,
  Smartphone,
  Star,
} from 'lucide-react';
import {
  AnimationStyle,
  HapticIntensity,
  MonetizationState,
  UserPreferences,
} from '../types/calculator';
import { AppIcon } from './AppIcon';
import { PWAInstallButton } from './PWAInstallButton';
import { PRIVACY_POLICY_TEXT } from '../data/AndroidProjectExport';

interface SettingsScreenProps {
  prefs: UserPreferences;
  monetization: MonetizationState;
  onUpdatePrefs: (patch: Partial<UserPreferences>) => void;
  onResetPrefs: () => void;
  onTestShakeClear: () => void;
  onOpenPremium: () => void;
  onOpenAndroidExport: () => void;
  onOpenSoundStudio: () => void;
  onOpenThemeStore: () => void;
}

const ANIMATION_STYLES: Array<{
  id: AnimationStyle;
  label: string;
  desc: string;
}> = [
  { id: 'jelly', label: 'Jelly', desc: 'Squash & wobbly rebound' },
  { id: 'squishy', label: 'Squishy', desc: 'Soft foam compression' },
  { id: 'bouncy', label: 'Bouncy', desc: 'Springy upward hop' },
  { id: 'rubber', label: 'Rubber', desc: 'Elastic stretch & snap' },
  { id: 'pop', label: 'Pop', desc: 'Snappy bubble burst' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  prefs,
  monetization,
  onUpdatePrefs,
  onResetPrefs,
  onTestShakeClear,
  onOpenPremium,
  onOpenAndroidExport,
  onOpenSoundStudio,
  onOpenThemeStore,
}) => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 2600);
  };

  const handleShare = async () => {
    const shareText =
      'Check out Wacky 3D Calculator — a tactile 3D toy calculator with 15 sound packs and squishy button physics!';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wacky 3D Calculator',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      flashNotice('Share link copied to clipboard.');
    } catch {
      flashNotice('Ready to share from your browser menu.');
    }
  };

  const handleRate = () => {
    flashNotice(
      'On Google Play, this opens the Play Store listing for Wacky 3D Calculator.'
    );
  };

  return (
    <div className="space-y-5">
      {statusNotice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {statusNotice}
        </div>
      )}

      {/* 3D Button Interaction Style */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              3D Button Physics & Animations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose how every keycap squishes and rebounds on tap.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdatePrefs({ animationsEnabled: !prefs.animationsEnabled })
            }
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              prefs.animationsEnabled
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {prefs.animationsEnabled ? 'Enabled' : 'Off'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ANIMATION_STYLES.map((style) => {
            const active = prefs.animationStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                disabled={!prefs.animationsEnabled}
                onClick={() => onUpdatePrefs({ animationStyle: style.id })}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-50 ${
                  active
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {style.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {style.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Haptics, Funny Reactions, Shake-to-Clear */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {/* Vibration */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Vibration & Haptic Feedback
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Tactile pulse on Android devices supporting Vibration API
            </div>
          </div>
          <div className="flex items-center gap-2">
            {prefs.vibrationEnabled && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(['light', 'medium', 'strong'] as HapticIntensity[]).map(
                  (lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onUpdatePrefs({ hapticIntensity: lvl })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                        prefs.hapticIntensity === lvl
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  )
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                onUpdatePrefs({ vibrationEnabled: !prefs.vibrationEnabled })
              }
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold cursor-pointer ${
                prefs.vibrationEnabled
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {prefs.vibrationEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Funny Result Reactions */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Funny Result Reactions
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Playful messages for 100, 777, 1234, zero & negative results
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdatePrefs({
                funnyReactionsEnabled: !prefs.funnyReactionsEnabled,
              })
            }
            className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              prefs.funnyReactionsEnabled
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {prefs.funnyReactionsEnabled ? 'On' : 'Off'}
          </button>
        </div>

        {/* Shake to Clear */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Shake to Clear
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Shake smartphone to reset calculation (off by default)
            </div>
          </div>
          <div className="flex items-center gap-2">
            {prefs.shakeToClearEnabled && (
              <button
                type="button"
                onClick={onTestShakeClear}
                className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Test Shake
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onUpdatePrefs({
                  shakeToClearEnabled: !prefs.shakeToClearEnabled,
                })
              }
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold cursor-pointer ${
                prefs.shakeToClearEnabled
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {prefs.shakeToClearEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts & Android Project Export */}
      <PWAInstallButton variant="card" />
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenSoundStudio}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
          >
            Configure Sounds & Volume
          </button>
          <button
            type="button"
            onClick={onOpenThemeStore}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
          >
            Browse 8 Themes & Dark Mode
          </button>
          <button
            type="button"
            onClick={onOpenPremium}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4 shrink-0" />
            <span>
              {monetization.isPremium ? 'Premium Active' : 'Upgrade to Premium'}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenAndroidExport}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <Code2 className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>Android Kotlin & AAB Guide</span>
          </button>
        </div>
      </div>

      {/* About, Privacy, Rate, Share, Reset */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <AppIcon size={44} />
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Wacky 3D Calculator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Offline-ready tactile calculator · Portrait & responsive desktop studio
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPrivacy((v) => !v)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={handleRate}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Rate the App</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share the App</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onResetPrefs();
              flashNotice('Preferences reset to defaults.');
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preferences</span>
          </button>
        </div>

        {showPrivacy && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {PRIVACY_POLICY_TEXT}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>
            Target Android 8.0+ (API 26) · Minimum permissions: VIBRATE & INTERNET
          </span>
        </div>
      </div>
    </div>
  );
};
