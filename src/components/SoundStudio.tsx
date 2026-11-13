import React, { useState } from 'react';
import { Lock, Play, Shuffle, Volume2, VolumeX, Check } from 'lucide-react';
import { SOUND_PACKS, SoundManager } from '../audio/SoundManager';
import {
  MonetizationState,
  SoundPackId,
  SoundPackMeta,
  UserPreferences,
} from '../types/calculator';
import { isSoundPackUnlocked } from '../monetization/MonetizationManager';

interface SoundStudioProps {
  prefs: UserPreferences;
  monetization: MonetizationState;
  onUpdatePrefs: (patch: Partial<UserPreferences>) => void;
  onRequestRewardedSound: (pack: SoundPackMeta) => void;
  onOpenPremium: () => void;
}

const CATEGORIES: Array<'All' | SoundPackMeta['category']> = [
  'All',
  'Tactile',
  'Playful',
  'Nature',
  'Arcade',
  'Quiet',
];

export const SoundStudio: React.FC<SoundStudioProps> = ({
  prefs,
  monetization,
  onUpdatePrefs,
  onRequestRewardedSound,
  onOpenPremium,
}) => {
  const [filter, setFilter] = useState<'All' | SoundPackMeta['category']>('All');
  const [lastPreviewId, setLastPreviewId] = useState<SoundPackId | null>(null);

  const filteredPacks =
    filter === 'All'
      ? SOUND_PACKS
      : SOUND_PACKS.filter((p) => p.category === filter);

  const handlePreview = (pack: SoundPackMeta) => {
    SoundManager.prewarm();
    SoundManager.play(pack.id, Math.max(0.3, prefs.soundVolume), 'number');
    setLastPreviewId(pack.id);
  };

  const handleSelectPack = (pack: SoundPackMeta) => {
    const unlocked = isSoundPackUnlocked(pack.id, pack.isPremium, monetization);
    if (!unlocked) {
      onRequestRewardedSound(pack);
      return;
    }
    SoundManager.prewarm();
    SoundManager.play(pack.id, prefs.soundVolume, 'number');
    onUpdatePrefs({
      soundPack: pack.id,
      soundEnabled: pack.id !== 'silent',
    });
  };

  const unlockedPacksForRoles = SOUND_PACKS.filter((p) =>
    isSoundPackUnlocked(p.id, p.isPremium, monetization)
  );

  return (
    <div className="space-y-6">
      {/* Master Sound Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Sound Studio & Sound Test
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Preview all 15 tactile sound packs, adjust volume, or enable Random Mode.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdatePrefs({ soundEnabled: !prefs.soundEnabled })}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              prefs.soundEnabled
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {prefs.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Muted</span>
              </>
            )}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-4 pt-1">
          <label
            htmlFor="sound-volume-slider"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
          >
            Volume
          </label>
          <input
            id="sound-volume-slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(prefs.soundVolume * 100)}
            onChange={(e) =>
              onUpdatePrefs({ soundVolume: Number(e.target.value) / 100 })
            }
            className="w-full accent-rose-500 cursor-pointer"
          />
          <span className="font-mono-tabular text-sm font-semibold text-slate-700 dark:text-slate-300 w-11 text-right">
            {Math.round(prefs.soundVolume * 100)}%
          </span>
        </div>

        {/* Random Mode & Per-Button Sound Role toggles */}
        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              onUpdatePrefs({ randomSoundMode: !prefs.randomSoundMode })
            }
            className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
              prefs.randomSoundMode
                ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shuffle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Random Mode</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Different sound on every key tap
              </p>
            </div>
            <span className="text-xs font-semibold shrink-0">
              {prefs.randomSoundMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdatePrefs({
                roleSoundOverrides: {
                  ...prefs.roleSoundOverrides,
                  enabled: !prefs.roleSoundOverrides.enabled,
                },
              })
            }
            className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
              prefs.roleSoundOverrides.enabled
                ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold">Custom Key Roles</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Assign sounds to Numbers, Ops, AC & =
              </p>
            </div>
            <span className="text-xs font-semibold shrink-0">
              {prefs.roleSoundOverrides.enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Per-button-role sound selectors when enabled */}
        {prefs.roleSoundOverrides.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {(
              [
                ['number', 'Number Buttons (0–9, .)'],
                ['operator', 'Operator Buttons (+, −, ×, ÷)'],
                ['clear', 'Clear Button (AC)'],
                ['equal', 'Equal Button (=)'],
              ] as const
            ).map(([roleKey, label]) => (
              <label key={roleKey} className="block space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {label}
                </span>
                <select
                  value={prefs.roleSoundOverrides[roleKey]}
                  onChange={(e) => {
                    const nextId = e.target.value as SoundPackId;
                    SoundManager.play(nextId, prefs.soundVolume, roleKey);
                    onUpdatePrefs({
                      roleSoundOverrides: {
                        ...prefs.roleSoundOverrides,
                        [roleKey]: nextId,
                      },
                    });
                  }}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100"
                >
                  {unlockedPacksForRoles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 overflow-x-auto max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {!monetization.isPremium && (
          <button
            type="button"
            onClick={onOpenPremium}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap cursor-pointer"
          >
            Unlock all 15 packs with Premium
          </button>
        )}
      </div>

      {/* Sound Pack Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredPacks.map((pack) => {
          const unlocked = isSoundPackUnlocked(
            pack.id,
            pack.isPremium,
            monetization
          );
          const isSelected = prefs.soundPack === pack.id;

          return (
            <div
              key={pack.id}
              className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                isSelected
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/70'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectPack(pack)}
                className="min-w-0 flex-1 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {pack.name}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {!unlocked && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {pack.category} · {pack.isPremium ? (unlocked ? 'Unlocked' : 'Premium / Watch Ad') : 'Free'}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate">
                  {pack.description}
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePreview(pack)}
                aria-label={`Preview ${pack.name}`}
                title={`Preview ${pack.name}`}
                className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer ${
                  lastPreviewId === pack.id
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
