import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator as CalcIcon,
  History as HistoryIcon,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Sun,
  Volume2,
} from 'lucide-react';
import {
  computeSmartPercentage,
  evaluateExpression,
  formatDisplayInput,
  formatResultNumber,
} from './engine/CalculatorEngine';
import { SOUND_PACKS, SoundManager } from './audio/SoundManager';
import {
  subscribeShakeToClear,
  triggerCelebrationHaptic,
  triggerHaptic,
} from './services/HapticsManager';
import { getThemeById } from './themes/ThemeRegistry';
import {
  loadHistory,
  loadMemory,
  loadPreferences,
  resetPreferences,
  saveHistory,
  saveMemory,
  savePreferences,
} from './services/PreferencesManager';
import { AdManager } from './monetization/AdManager';
import {
  ButtonRole,
  CalcButtonSpec,
  HistoryEntry,
  SoundPackId,
  StudioTab,
  UserPreferences,
} from './types/calculator';
import { AppIcon } from './components/AppIcon';
import { CalculatorScreen } from './components/CalculatorScreen';
import { SoundStudio } from './components/SoundStudio';
import { ThemeStore } from './components/ThemeStore';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsScreen } from './components/SettingsScreen';
import { AndroidBlueprintDrawer } from './components/AndroidBlueprintDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';

const OPERATORS = new Set(['+', '−', '×', '÷']);

export default function App() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [memoryValue, setMemoryValue] = useState<number>(() => loadMemory());

  // Navigation state: mobile defaults to 'calculator', desktop shows calculator + right studio tab
  const [mobileTab, setMobileTab] = useState<StudioTab>('calculator');
  const [desktopTab, setDesktopTab] = useState<Exclude<StudioTab, 'calculator'>>('history');

  // Calculator expression & display state
  const [tokens, setTokens] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('0');
  const [enteringOperand, setEnteringOperand] = useState<boolean>(false);
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [previousCalculation, setPreviousCalculation] = useState<string>('');
  const [lastRepeatOp, setLastRepeatOp] = useState<{
    op: string;
    rhs: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [celebrateBurstId, setCelebrateBurstId] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [shakeNotice, setShakeNotice] = useState<boolean>(false);

  // Modals
  const [androidExportOpen, setAndroidExportOpen] = useState<boolean>(false);

  const activeTheme = useMemo(() => getThemeById(prefs.themeId), [prefs.themeId]);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.appearanceMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [prefs.appearanceMode]);

  // Initialize AdMob Interstitial & UMP consent on native Android (no-op on web)
  useEffect(() => {
    void AdManager.initialize();
  }, []);

  const updatePrefs = useCallback((patch: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePreferences(next);
      return next;
    });
  }, []);

  const handleResetPrefs = useCallback(() => {
    const fresh = resetPreferences();
    setPrefs(fresh);
  }, []);

  const playButtonSound = useCallback(
    (role: ButtonRole, isEqualResult = false) => {
      if (!prefs.soundEnabled) return;
      SoundManager.prewarm();

      let chosenPack: SoundPackId = prefs.soundPack;

      if (prefs.randomSoundMode) {
        chosenPack = SoundManager.pickRandomPack();
      } else if (prefs.roleSoundOverrides.enabled) {
        if (role === 'number') chosenPack = prefs.roleSoundOverrides.number;
        else if (role === 'clear') chosenPack = prefs.roleSoundOverrides.clear;
        else if (role === 'equal') chosenPack = prefs.roleSoundOverrides.equal;
        else chosenPack = prefs.roleSoundOverrides.operator;
      }

      if (chosenPack === 'silent') return;
      SoundManager.play(chosenPack, prefs.soundVolume, role);
      if (isEqualResult) {
        SoundManager.playCelebration(prefs.soundVolume);
      }
    },
    [prefs]
  );

  const handleClearAll = useCallback(() => {
    setTokens([]);
    setCurrentInput('0');
    setEnteringOperand(false);
    setJustEvaluated(false);
    setPreviousCalculation('');
    setLastRepeatOp(null);
    setError(null);
    setReaction(null);
  }, []);

  // Shake-to-clear DeviceMotion hook
  useEffect(() => {
    return subscribeShakeToClear(prefs.shakeToClearEnabled, () => {
      handleClearAll();
      triggerHaptic(prefs.vibrationEnabled, 'strong');
      setShakeNotice(true);
      setTimeout(() => setShakeNotice(false), 1800);
    });
  }, [handleClearAll, prefs.shakeToClearEnabled, prefs.vibrationEnabled]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (error) {
        setError(null);
        setTokens([]);
        setPreviousCalculation('');
      }
      setReaction(null);

      if (justEvaluated) {
        setTokens([]);
        setPreviousCalculation('');
        setJustEvaluated(false);
        setLastRepeatOp(null);
        const initial = digit === '.' ? '0.' : digit;
        setCurrentInput(initial);
        setEnteringOperand(true);
        return;
      }

      if (!enteringOperand) {
        const initial = digit === '.' ? '0.' : digit;
        setCurrentInput(initial);
        setEnteringOperand(true);
        return;
      }

      setCurrentInput((prev) => {
        if (digit === '.') {
          if (prev.includes('.')) return prev;
          return `${prev}.`;
        }
        if (prev.replace('-', '').replace('.', '').length >= 16) return prev;
        if (prev === '0') return digit;
        if (prev === '-0') return `-${digit}`;
        return `${prev}${digit}`;
      });
    },
    [enteringOperand, error, justEvaluated]
  );

  const handleOperator = useCallback(
    (op: string) => {
      if (error) {
        setError(null);
        setTokens(['0', op]);
        setEnteringOperand(false);
        setJustEvaluated(false);
        return;
      }

      setReaction(null);
      setLastRepeatOp(null);

      if (justEvaluated) {
        setJustEvaluated(false);
        setTokens([currentInput, op]);
        setEnteringOperand(false);
        return;
      }

      if (!enteringOperand && tokens.length > 0 && OPERATORS.has(tokens[tokens.length - 1])) {
        setTokens((prev) => [...prev.slice(0, -1), op]);
        return;
      }

      setTokens((prev) => [...prev, currentInput, op]);
      setEnteringOperand(false);
    },
    [currentInput, enteringOperand, error, justEvaluated, tokens]
  );

  const handleToggleSign = useCallback(() => {
    if (error) return;
    setJustEvaluated(false);
    setCurrentInput((prev) => {
      if (prev === '0' || prev === '0.') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
    setEnteringOperand(true);
  }, [error]);

  const handlePercentage = useCallback(() => {
    if (error) return;
    const prefix = tokens.join(' ');
    const pct = computeSmartPercentage(currentInput, prefix);
    setCurrentInput(pct);
    setEnteringOperand(true);
    setJustEvaluated(false);
  }, [currentInput, error, tokens]);

  const handleDelete = useCallback(() => {
    if (error) {
      handleClearAll();
      return;
    }
    if (justEvaluated) {
      setJustEvaluated(false);
      setPreviousCalculation('');
      return;
    }
    setCurrentInput((prev) => {
      if (prev.length <= 1 || (prev.startsWith('-') && prev.length === 2)) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, [error, handleClearAll, justEvaluated]);

  const handleEquals = useCallback(() => {
    if (error) return;

    let exprTokens = [...tokens];
    let exprLabel = '';

    if (justEvaluated && lastRepeatOp && tokens.length === 0) {
      exprTokens = [currentInput, lastRepeatOp.op, lastRepeatOp.rhs];
      exprLabel = `${formatDisplayInput(currentInput)} ${lastRepeatOp.op} ${formatDisplayInput(lastRepeatOp.rhs)}`;
    } else if (exprTokens.length === 0) {
      exprTokens = [currentInput];
      exprLabel = formatDisplayInput(currentInput);
    } else if (!enteringOperand && OPERATORS.has(exprTokens[exprTokens.length - 1])) {
      // If user pressed e.g. 5 + =, use 5 as right-hand operand
      const lastOp = exprTokens[exprTokens.length - 1];
      exprTokens = [...exprTokens, currentInput];
      setLastRepeatOp({ op: lastOp, rhs: currentInput });
      exprLabel = exprTokens
        .map((t) => (OPERATORS.has(t) ? t : formatDisplayInput(t)))
        .join(' ');
    } else {
      const lastOp = exprTokens[exprTokens.length - 1];
      if (OPERATORS.has(lastOp)) {
        setLastRepeatOp({ op: lastOp, rhs: currentInput });
      }
      exprTokens = [...exprTokens, currentInput];
      exprLabel = exprTokens
        .map((t) => (OPERATORS.has(t) ? t : formatDisplayInput(t)))
        .join(' ');
    }

    const outcome = evaluateExpression(exprTokens.join(' '));
    if (!outcome.ok || outcome.value === undefined || !outcome.formatted) {
      setError(outcome.error ?? 'Error');
      setTokens([]);
      setPreviousCalculation(exprLabel);
      setReaction(null);
      return;
    }

    const rawStr = outcome.value.toString();
    const activeReaction = prefs.funnyReactionsEnabled
      ? outcome.reaction ?? null
      : null;

    setPreviousCalculation(`${exprLabel} =`);
    setCurrentInput(rawStr);
    setTokens([]);
    setEnteringOperand(false);
    setJustEvaluated(true);
    setError(null);
    setReaction(activeReaction);
    setCelebrateBurstId((id) => id + 1);

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      expression: exprLabel,
      result: outcome.formatted,
      rawResult: outcome.value,
      timestamp: Date.now(),
      reaction: activeReaction ?? undefined,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      saveHistory(next);
      return next;
    });
    AdManager.recordCalculationComplete();
  }, [
    currentInput,
    enteringOperand,
    error,
    justEvaluated,
    lastRepeatOp,
    prefs.funnyReactionsEnabled,
    tokens,
  ]);

  const handleButtonPress = useCallback(
    (spec: CalcButtonSpec) => {
      AdManager.recordTap();
      const isEqual = spec.value === '=';
      playButtonSound(spec.role, isEqual);

      if (isEqual) {
        triggerCelebrationHaptic(prefs.vibrationEnabled);
      } else {
        triggerHaptic(prefs.vibrationEnabled, prefs.hapticIntensity);
      }

      if (spec.value === 'AC') {
        handleClearAll();
      } else if (spec.value === 'SIGN') {
        handleToggleSign();
      } else if (spec.value === '%') {
        handlePercentage();
      } else if (spec.value === 'DEL') {
        handleDelete();
      } else if (spec.value === '=') {
        handleEquals();
      } else if (OPERATORS.has(spec.value)) {
        handleOperator(spec.value);
      } else {
        handleDigit(spec.value);
      }
    },
    [
      handleClearAll,
      handleDelete,
      handleDigit,
      handleEquals,
      handleOperator,
      handlePercentage,
      handleToggleSign,
      playButtonSound,
      prefs.hapticIntensity,
      prefs.vibrationEnabled,
    ]
  );

  const handleMemoryAction = useCallback(
    (action: 'MC' | 'MR' | 'M+' | 'M-') => {
      playButtonSound('utility');
      triggerHaptic(prefs.vibrationEnabled, prefs.hapticIntensity);
      const currentVal = Number(currentInput.replace(/,/g, ''));
      const validNum = Number.isFinite(currentVal) ? currentVal : 0;

      if (action === 'MC') {
        setMemoryValue(0);
        saveMemory(0);
      } else if (action === 'MR') {
        setCurrentInput(memoryValue.toString());
        setEnteringOperand(true);
        setJustEvaluated(false);
        setError(null);
      } else if (action === 'M+') {
        const next = memoryValue + validNum;
        setMemoryValue(next);
        saveMemory(next);
      } else if (action === 'M-') {
        const next = memoryValue - validNum;
        setMemoryValue(next);
        saveMemory(next);
      }
    },
    [currentInput, memoryValue, playButtonSound, prefs.hapticIntensity, prefs.vibrationEnabled]
  );

  const handleCopyResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard permission errors
    }
  }, [currentInput]);

  const handlePasteNumber = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/,/g, '').trim();
      if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
        setCurrentInput(cleaned);
        setEnteringOperand(true);
        setJustEvaluated(false);
        setError(null);
      }
    } catch {
      // Ignore clipboard permission errors
    }
  }, []);

  // Keyboard support for rapid desktop typing
  const pressRef = useRef(handleButtonPress);
  pressRef.current = handleButtonPress;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        handlePasteNumber();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        handleCopyResult();
        return;
      }

      const keyMap: Record<string, string> = {
        '*': '×',
        '/': '÷',
        '-': '−',
        '+': '+',
        Enter: '=',
        '=': '=',
        Backspace: 'DEL',
        Escape: 'AC',
        '%': '%',
      };

      let targetVal: string | null = null;
      if (/^[0-9.]$/.test(e.key)) {
        targetVal = e.key;
      } else if (keyMap[e.key]) {
        targetVal = keyMap[e.key];
      }

      if (!targetVal) return;
      e.preventDefault();

      const role: ButtonRole =
        targetVal === 'AC'
          ? 'clear'
          : targetVal === '='
          ? 'equal'
          : OPERATORS.has(targetVal)
          ? 'operator'
          : targetVal === '%' || targetVal === 'DEL'
          ? 'utility'
          : 'number';

      pressRef.current({
        id: targetVal,
        label: targetVal,
        value: targetVal,
        role,
        ariaLabel: targetVal,
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCopyResult, handlePasteNumber]);

  const formattedDisplay = formatDisplayInput(currentInput);
  const currentExpressionDisplay = tokens
    .map((t) => (OPERATORS.has(t) ? t : formatDisplayInput(t)))
    .join(' ');

  const openSection = (tab: Exclude<StudioTab, 'calculator'>) => {
    setDesktopTab(tab);
    setMobileTab(tab);
    void AdManager.maybeShowInterstitialOnTransition();
  };

  const renderStudioPanel = (tab: Exclude<StudioTab, 'calculator'>) => {
    switch (tab) {
      case 'sounds':
        return (
          <SoundStudio
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
          />
        );
      case 'themes':
        return (
          <ThemeStore
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
          />
        );
      case 'history':
        return (
          <HistoryPanel
            history={history}
            onReuseResult={(entry) => {
              setCurrentInput(entry.rawResult.toString());
              setTokens([]);
              setEnteringOperand(true);
              setJustEvaluated(false);
              setError(null);
              setReaction(null);
              setMobileTab('calculator');
            }}
            onDeleteEntry={(id) => {
              setHistory((prev) => {
                const next = prev.filter((e) => e.id !== id);
                saveHistory(next);
                return next;
              });
            }}
            onClearAll={() => {
              setHistory([]);
              saveHistory([]);
            }}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onResetPrefs={handleResetPrefs}
            onTestShakeClear={() => {
              handleClearAll();
              triggerHaptic(prefs.vibrationEnabled, 'strong');
              setShakeNotice(true);
              setTimeout(() => setShakeNotice(false), 1800);
            }}
            onOpenAndroidExport={() => setAndroidExportOpen(true)}
            onOpenSoundStudio={() => openSection('sounds')}
            onOpenThemeStore={() => openSection('themes')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => setMobileTab('calculator')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            <AppIcon size={32} />
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
              Wacky 3D Calculator
            </span>
          </button>

          {/* Zone 2: Single-line navigation links (Desktop) */}
          <nav
            aria-label="Studio sections"
            className="hidden lg:flex items-center gap-6 text-sm font-medium"
          >
            {(
              [
                ['sounds', 'Sound Studio'],
                ['themes', 'Themes'],
                ['history', 'History'],
                ['settings', 'Settings'],
              ] as const
            ).map(([tabId, label]) => {
              const active = desktopTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => {
                    setDesktopTab(tabId);
                    void AdManager.maybeShowInterstitialOnTransition();
                  }}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action (Light / Dark Appearance) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                updatePrefs({
                  appearanceMode:
                    prefs.appearanceMode === 'dark' ? 'light' : 'dark',
                })
              }
              aria-label="Toggle dark mode"
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {prefs.appearanceMode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Shake-to-clear transient feedback */}
      {shakeNotice && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-xs font-semibold shadow-lg">
          Shake detected — Calculation cleared
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24 lg:pb-10">
        {/* Desktop 2-column Studio Layout; Mobile single focused view */}
        <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-8 items-start">
          {/* Left Column: 3D Tactile Calculator (Visible always on lg+, or on mobile when mobileTab === 'calculator') */}
          <section
            aria-label="Calculator"
            className={
              mobileTab === 'calculator' ? 'block' : 'hidden lg:block'
            }
          >
            <CalculatorScreen
              theme={activeTheme}
              appearanceMode={prefs.appearanceMode}
              animationStyle={prefs.animationStyle}
              animationsEnabled={prefs.animationsEnabled}
              previousCalculation={previousCalculation}
              currentExpression={currentExpressionDisplay}
              displayValue={formattedDisplay}
              error={error}
              reaction={reaction}
              hasMemory={memoryValue !== 0}
              memoryValueFormatted={formatResultNumber(memoryValue)}
              justEvaluated={justEvaluated}
              celebrateBurstId={celebrateBurstId}
              copied={copied}
              onButtonPress={handleButtonPress}
              onMemoryAction={handleMemoryAction}
              onCopy={handleCopyResult}
              onPaste={handlePasteNumber}
            />
            <div className="mt-3 max-w-[440px] mx-auto lg:hidden">
              <PWAInstallButton variant="card" />
            </div>
          </section>

          {/* Right Column: Studio Inspector (Visible on lg+, or on mobile when mobileTab !== 'calculator') */}
          <section
            aria-label="Studio workspace"
            className={
              mobileTab !== 'calculator' ? 'block' : 'hidden lg:block'
            }
          >
            {/* Desktop Studio Quick Summary Strip */}
            <div className="hidden lg:flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Theme: <span className="font-semibold text-slate-900 dark:text-slate-100">{activeTheme.name}</span>
                {' · '}
                Physics: <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{prefs.animationStyle}</span>
                {' · '}
                Sound: <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {prefs.soundEnabled
                    ? prefs.randomSoundMode
                      ? 'Random Mode'
                      : SOUND_PACKS.find((s) => s.id === prefs.soundPack)?.name
                    : 'Muted'}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <PWAInstallButton variant="compact" />
                <button
                  type="button"
                  onClick={() => setAndroidExportOpen(true)}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Android Studio Export
                </button>
              </div>
            </div>

            {renderStudioPanel(
              mobileTab !== 'calculator' ? mobileTab : desktopTab
            )}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Thumb Navigation Bar (hidden on lg+) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {(
          [
            { id: 'calculator', label: 'Calc', Icon: CalcIcon },
            { id: 'sounds', label: 'Sounds', Icon: Volume2 },
            { id: 'themes', label: 'Themes', Icon: Palette },
            { id: 'history', label: 'History', Icon: HistoryIcon },
            { id: 'settings', label: 'Settings', Icon: SettingsIcon },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = mobileTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMobileTab(id);
                if (id !== 'calculator') {
                  setDesktopTab(id);
                  void AdManager.maybeShowInterstitialOnTransition();
                }
              }}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                active
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Android Blueprint Modal */}
      <AndroidBlueprintDrawer
        open={androidExportOpen}
        onClose={() => setAndroidExportOpen(false)}
      />
    </div>
  );
}
