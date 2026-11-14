import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';
import { ADMOB_CONFIG } from './MonetizationManager';

const MIN_CALCS_BETWEEN_ADS = 5;
const MIN_COOLDOWN_MS = 90_000; // 90 seconds between interstitials

class AdManagerImpl {
  private initialized = false;
  private isLoaded = false;
  private isLoading = false;
  private calcCount = 0;
  private lastAdTimestamp = Date.now();
  private lastTapTimestamp = 0;

  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.initialized) {
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: false,
      });

      // Request UMP consent where required (EEA / UK / California)
      try {
        const consentInfo = await AdMob.requestConsentInfo();
        if (
          consentInfo.isConsentFormAvailable &&
          consentInfo.status === AdmobConsentStatus.REQUIRED
        ) {
          await AdMob.showConsentForm();
        }
      } catch {
        // Proceed gracefully if consent form is unavailable offline
      }

      await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        this.isLoaded = true;
        this.isLoading = false;
      });

      await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
        this.isLoaded = false;
        this.isLoading = false;
      });

      await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        this.isLoaded = false;
        this.lastAdTimestamp = Date.now();
        this.calcCount = 0;
        void this.preloadInterstitial();
      });

      await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
        this.isLoaded = false;
        void this.preloadInterstitial();
      });

      this.initialized = true;
      await this.preloadInterstitial();
    } catch {
      // Never block calculator usage if offline or ad SDK unavailable
    }
  }

  public recordTap() {
    this.lastTapTimestamp = Date.now();
  }

  public recordCalculationComplete() {
    this.calcCount += 1;
    if (!this.isLoaded && !this.isLoading && Capacitor.isNativePlatform()) {
      void this.preloadInterstitial();
    }
  }

  public async preloadInterstitial(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.interstitialAdUnitId,
        isTesting: false,
      });
    } catch {
      this.isLoading = false;
    }
  }

  /**
   * Shows an interstitial only at natural navigation transitions,
   * never during rapid tapping or mid-calculation.
   */
  public async maybeShowInterstitialOnTransition(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const now = Date.now();
    const isRapidTapping = now - this.lastTapTimestamp < 1500;
    const cooldownElapsed = now - this.lastAdTimestamp >= MIN_COOLDOWN_MS;

    if (
      this.isLoaded &&
      !isRapidTapping &&
      cooldownElapsed &&
      this.calcCount >= MIN_CALCS_BETWEEN_ADS
    ) {
      try {
        this.isLoaded = false;
        await AdMob.showInterstitial();
      } catch {
        void this.preloadInterstitial();
      }
    } else if (!this.isLoaded && !this.isLoading) {
      void this.preloadInterstitial();
    }
  }
}

export const AdManager = new AdManagerImpl();
