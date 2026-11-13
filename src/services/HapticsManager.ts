import { HapticIntensity } from '../types/calculator';

const DURATION_MAP: Record<HapticIntensity, number> = {
  light: 10,
  medium: 22,
  strong: 38,
};

export function triggerHaptic(enabled: boolean, intensity: HapticIntensity) {
  if (!enabled || typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(DURATION_MAP[intensity]);
    } catch {
      // Ignore environments without vibration hardware
    }
  }
}

export function triggerCelebrationHaptic(enabled: boolean) {
  if (!enabled || typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([18, 35, 28]);
    } catch {
      // Ignore
    }
  }
}

export function subscribeShakeToClear(
  enabled: boolean,
  onShake: () => void
): () => void {
  if (!enabled || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
    return () => {};
  }

  let lastX = 0;
  let lastY = 0;
  let lastZ = 0;
  let lastTrigger = 0;
  let initialized = false;

  const handler = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const x = acc.x ?? 0;
    const y = acc.y ?? 0;
    const z = acc.z ?? 0;

    if (!initialized) {
      lastX = x;
      lastY = y;
      lastZ = z;
      initialized = true;
      return;
    }

    const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
    lastX = x;
    lastY = y;
    lastZ = z;

    const now = Date.now();
    if (delta > 26 && now - lastTrigger > 900) {
      lastTrigger = now;
      onShake();
    }
  };

  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
