import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AppearanceMode,
  AnimationStyle,
  CalcButtonSpec,
  CalculatorTheme,
  KeyColorStyle,
} from '../types/calculator';
import { CalculatorDisplay } from './CalculatorDisplay';
import { CalculatorButton } from './CalculatorButton';

export const CALCULATOR_BUTTONS: CalcButtonSpec[] = [
  { id: 'ac', label: 'AC', value: 'AC', role: 'clear', ariaLabel: 'All Clear' },
  { id: 'sign', label: '+/-', value: 'SIGN', role: 'utility', ariaLabel: 'Toggle positive or negative' },
  { id: 'pct', label: '%', value: '%', role: 'utility', ariaLabel: 'Percentage' },
  { id: 'div', label: '÷', value: '÷', role: 'operator', ariaLabel: 'Divide' },

  { id: '7', label: '7', value: '7', role: 'number', ariaLabel: '7' },
  { id: '8', label: '8', value: '8', role: 'number', ariaLabel: '8' },
  { id: '9', label: '9', value: '9', role: 'number', ariaLabel: '9' },
  { id: 'mul', label: '×', value: '×', role: 'operator', ariaLabel: 'Multiply' },

  { id: '4', label: '4', value: '4', role: 'number', ariaLabel: '4' },
  { id: '5', label: '5', value: '5', role: 'number', ariaLabel: '5' },
  { id: '6', label: '6', value: '6', role: 'number', ariaLabel: '6' },
  { id: 'sub', label: '−', value: '−', role: 'operator', ariaLabel: 'Subtract' },

  { id: '1', label: '1', value: '1', role: 'number', ariaLabel: '1' },
  { id: '2', label: '2', value: '2', role: 'number', ariaLabel: '2' },
  { id: '3', label: '3', value: '3', role: 'number', ariaLabel: '3' },
  { id: 'add', label: '+', value: '+', role: 'operator', ariaLabel: 'Add' },

  { id: '0', label: '0', value: '0', role: 'number', ariaLabel: '0' },
  { id: 'dot', label: '.', value: '.', role: 'number', ariaLabel: 'Decimal point' },
  { id: 'del', label: 'Delete', value: 'DEL', role: 'utility', ariaLabel: 'Delete last digit' },
  { id: 'eq', label: '=', value: '=', role: 'equal', ariaLabel: 'Equals' },
];

interface CalculatorScreenProps {
  theme: CalculatorTheme;
  appearanceMode: AppearanceMode;
  animationStyle: AnimationStyle;
  animationsEnabled: boolean;
  previousCalculation: string;
  currentExpression: string;
  displayValue: string;
  error: string | null;
  reaction: string | null;
  hasMemory: boolean;
  memoryValueFormatted: string;
  justEvaluated: boolean;
  celebrateBurstId: number;
  copied: boolean;
  onButtonPress: (spec: CalcButtonSpec) => void;
  onMemoryAction: (action: 'MC' | 'MR' | 'M+' | 'M-') => void;
  onCopy: () => void;
  onPaste: () => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  theme,
  appearanceMode,
  animationStyle,
  animationsEnabled,
  previousCalculation,
  currentExpression,
  displayValue,
  error,
  reaction,
  hasMemory,
  memoryValueFormatted,
  justEvaluated,
  celebrateBurstId,
  copied,
  onButtonPress,
  onMemoryAction,
  onCopy,
  onPaste,
}) => {
  const isDark = appearanceMode === 'dark';
  const chassisBg = isDark ? theme.chassisBgDark : theme.chassisBgLight;
  const chassisEdge = isDark ? theme.chassisEdgeDark : theme.chassisEdgeLight;

  const getKeyPalette = (spec: CalcButtonSpec, idx: number): KeyColorStyle => {
    if (spec.role === 'number' && theme.keys.rainbowPalette) {
      return theme.keys.rainbowPalette[idx % theme.keys.rainbowPalette.length];
    }
    switch (spec.role) {
      case 'clear':
        return theme.keys.clear;
      case 'operator':
        return theme.keys.operator;
      case 'equal':
        return theme.keys.equal;
      case 'utility':
        return theme.keys.utility;
      case 'number':
      default:
        return theme.keys.number;
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col gap-3">
      {/* Main 3D Toy Calculator Chassis */}
      <div
        className="relative rounded-[2rem] p-4 sm:p-5 transition-colors duration-300"
        style={{
          backgroundColor: chassisBg,
          boxShadow: `0 12px 0 ${chassisEdge}, 0 24px 44px -12px rgba(15, 23, 42, 0.28), inset 0 2px 0 rgba(255, 255, 255, 0.35)`,
        }}
      >
        {/* Celebratory confetti burst on Equal press */}
        <AnimatePresence>
          {animationsEnabled && celebrateBurstId > 0 && (
            <div
              key={celebrateBurstId}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center overflow-visible"
            >
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = (i / 10) * Math.PI * 2;
                const dist = 42 + (i % 3) * 18;
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist - 16;
                const color =
                  theme.celebrationColors[i % theme.celebrationColors.length];
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }}
                    animate={{
                      opacity: 0,
                      x: tx,
                      y: ty,
                      scale: 1.15,
                      rotate: i * 45,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Display Screen */}
        <CalculatorDisplay
          theme={theme}
          previousCalculation={previousCalculation}
          currentExpression={currentExpression}
          displayValue={displayValue}
          error={error}
          reaction={reaction}
          hasMemory={hasMemory}
          memoryValueFormatted={memoryValueFormatted}
          justEvaluated={justEvaluated}
          copied={copied}
          onCopy={onCopy}
          onPaste={onPaste}
        />

        {/* Tactile Memory Register Strip */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(['MC', 'MR', 'M+', 'M-'] as const).map((mem) => (
            <button
              key={mem}
              type="button"
              onClick={() => onMemoryAction(mem)}
              className="min-h-[38px] rounded-xl text-xs font-mono-tabular font-semibold tracking-tight transition-transform active:translate-y-0.5 cursor-pointer"
              style={{
                backgroundColor: theme.keys.utility.face,
                color: theme.keys.utility.text,
                boxShadow: `0 3px 0 ${theme.keys.utility.edge}, inset 0 1px 0 ${theme.keys.utility.highlight}`,
              }}
            >
              {mem}
            </button>
          ))}
        </div>

        {/* 5x4 3D Keypad Grid */}
        <div className="mt-3.5 grid grid-cols-4 gap-2.5 sm:gap-3 pb-1.5">
          {CALCULATOR_BUTTONS.map((spec, idx) => (
            <CalculatorButton
              key={spec.id}
              spec={spec}
              palette={getKeyPalette(spec, idx)}
              animationStyle={animationStyle}
              animationsEnabled={animationsEnabled}
              onPress={onButtonPress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
