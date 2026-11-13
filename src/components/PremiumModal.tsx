import React, { useEffect, useState } from 'react';
import { Check, Crown, Play, RotateCcw, X } from 'lucide-react';
import { ADMOB_TEST_CONFIG } from '../monetization/MonetizationManager';
import {
  CalculatorTheme,
  MonetizationState,
  SoundPackMeta,
} from '../types/calculator';

interface PremiumModalProps {
  open: boolean;
  monetization: MonetizationState;
  rewardTargetTheme: CalculatorTheme | null;
  rewardTargetSound: SoundPackMeta | null;
  onClose: () => void;
  onPurchasePremium: () => void;
  onRestorePurchases: () => void;
  onRevokeDemoPremium: () => void;
  onCompleteRewardedAd: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  open,
  monetization,
  rewardTargetTheme,
  rewardTargetSound,
  onClose,
  onPurchasePremium,
  onRestorePurchases,
  onRevokeDemoPremium,
  onCompleteRewardedAd,
}) => {
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAdCountdown(null);
      setNotice(null);
    }
  }, [open]);

  useEffect(() => {
    if (adCountdown === null) return;
    if (adCountdown === 0) {
      setAdCountdown(null);
      onCompleteRewardedAd();
      return;
    }
    const timer = setTimeout(() => setAdCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [adCountdown, onCompleteRewardedAd]);

  if (!open) return null;

  const rewardLabel = rewardTargetTheme
    ? `${rewardTargetTheme.name} Theme`
    : rewardTargetSound
    ? `${rewardTargetSound.name} Sound`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Premium Upgrade"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Wacky 3D Premium
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                One-time Play Billing unlock · No forced subscriptions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rewarded Ad Preview Option when triggered from a locked theme or sound */}
        {rewardLabel && !monetization.isPremium && (
          <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Try {rewardLabel} free for 1 hour
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Simulate watching an optional rewarded AdMob preview ({ADMOB_TEST_CONFIG.rewardedAdUnitId.slice(-10)}) to unlock this item immediately.
            </p>
            <button
              type="button"
              disabled={adCountdown !== null}
              onClick={() => setAdCountdown(4)}
              className="w-full min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {adCountdown !== null
                  ? `Rewarding in ${adCountdown}s...`
                  : `Watch Rewarded Preview (4s)`}
              </span>
            </button>
          </div>
        )}

        {/* Premium Benefits List */}
        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          {[
            'Complete removal of all banner and interstitial ads',
            'All 15 synthesized sound packs including Arcade, Boing & Bubble Wrap',
            'All 8 themes including Neon Cyber, Lava Fire, Galaxy Space & Chocolate',
            'Custom sound assignment per button role & future seasonal editions',
          ].map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {notice && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {notice}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {monetization.isPremium ? (
            <div className="space-y-2.5">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200 text-center">
                Premium Unlocked · All Themes, Sounds & Ad-Free Mode Active
              </div>
              <button
                type="button"
                onClick={onRevokeDemoPremium}
                className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Switch Back to Free Preview Mode
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onPurchasePremium}
                className="w-full min-h-[48px] rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-display font-bold text-base hover:opacity-95 transition-opacity cursor-pointer"
              >
                Unlock Lifetime Premium · $2.99 (Demo Flow)
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestorePurchases();
                  setNotice(
                    'Checked local & Play Billing entitlement state.'
                  );
                }}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Purchases</span>
              </button>
            </>
          )}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Note: Web preview simulates Google Play Billing ({ADMOB_TEST_CONFIG.premiumProductId}) locally. Production Android builds verify purchases via BillingClient v7.
        </p>
      </div>
    </div>
  );
};
