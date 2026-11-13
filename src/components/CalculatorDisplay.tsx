import React from 'react';
import { Check, ClipboardPaste, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalculatorTheme } from '../types/calculator';

interface CalculatorDisplayProps {
  theme: CalculatorTheme;
  previousCalculation: string;
  currentExpression: string;
  displayValue: string;
  error: string | null;
  reaction: string | null;
  hasMemory: boolean;
  memoryValueFormatted: string;
  justEvaluated: boolean;
  copied: boolean;
  onCopy: () => void;
  onPaste: () => void;
}

export const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({
  theme,
  previousCalculation,
  currentExpression,
  displayValue,
  error,
  reaction,
  hasMemory,
  memoryValueFormatted,
  justEvaluated,
  copied,
  onCopy,
  onPaste,
}) => {
  const len = displayValue.length;
  const sizeClass =
    len > 15
      ? 'text-2xl sm:text-3xl'
      : len > 11
      ? 'text-3xl sm:text-4xl'
      : 'text-4xl sm:text-[2.75rem]';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5 select-none transition-colors duration-300"
      style={{
        backgroundColor: theme.displayBg,
        boxShadow:
          'inset 0 4px 12px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Glossy diagonal glass reflection */}
      <div
        className="pointer-events-none absolute -top-12 -left-10 h-32 w-2/3 rotate-[-12deg] bg-gradient-to-b from-white/[0.11] to-transparent"
        aria-hidden="true"
      />

      {/* Top micro toolbar: memory indicator + copy/paste */}
      <div className="relative z-10 flex items-center justify-between gap-2 min-h-[28px]">
        <div className="flex items-center gap-2 min-w-0 text-xs">
          {hasMemory ? (
            <span
              className="font-mono-tabular font-semibold truncate"
              style={{ color: theme.displaySubtext }}
            >
              M: {memoryValueFormatted}
            </span>
          ) : (
            <span className="text-white/35 text-xs truncate">
              {previousCalculation ? 'Last result' : 'Ready'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onCopy}
            title="Copy result"
            aria-label="Copy current result"
            className="min-h-[34px] min-w-[34px] px-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onPaste}
            title="Paste number"
            aria-label="Paste number from clipboard"
            className="min-h-[34px] min-w-[34px] px-2 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expression / Previous calculation line */}
      <div
        className="relative z-10 mt-1.5 min-h-[22px] text-right font-mono-tabular text-sm tracking-tight overflow-x-auto whitespace-nowrap studio-scroll"
        style={{ color: theme.displaySubtext }}
      >
        {currentExpression || previousCalculation || '\u00A0'}
      </div>

      {/* Main numeric display */}
      <div className="relative z-10 mt-1 min-h-[52px] flex items-end justify-end overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${displayValue}-${justEvaluated ? 'eq' : 'in'}`}
            initial={justEvaluated ? { opacity: 0, y: 10, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full text-right font-mono-tabular font-bold leading-tight tracking-tight overflow-x-auto whitespace-nowrap studio-scroll ${sizeClass}`}
            style={{ color: error ? '#FB7185' : theme.displayText }}
          >
            {error || displayValue}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Funny Result Reaction row (non-intrusive) */}
      <div className="relative z-10 mt-1.5 min-h-[20px] flex items-center justify-end">
        <AnimatePresence mode="wait">
          {reaction && !error && (
            <motion.p
              key={reaction}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs font-medium tracking-tight"
              style={{ color: theme.displaySubtext }}
            >
              {reaction}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
