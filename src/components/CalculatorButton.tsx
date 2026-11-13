import React, { useState, useRef } from 'react';
import { Delete } from 'lucide-react';
import { AnimationStyle, CalcButtonSpec, KeyColorStyle } from '../types/calculator';

interface CalculatorButtonProps {
  spec: CalcButtonSpec;
  palette: KeyColorStyle;
  animationStyle: AnimationStyle;
  animationsEnabled: boolean;
  onPress: (spec: CalcButtonSpec) => void;
}

const ANIMATION_CLASS_MAP: Record<AnimationStyle, string> = {
  jelly: 'animate-key-jelly',
  squishy: 'animate-key-squishy',
  bouncy: 'animate-key-bouncy',
  rubber: 'animate-key-rubber',
  pop: 'animate-key-pop',
};

export const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  spec,
  palette,
  animationStyle,
  animationsEnabled,
  onPress,
}) => {
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [animTick, setAnimTick] = useState(0);
  const pointerUsedRef = useRef(false);

  const triggerSpring = () => {
    if (animationsEnabled) {
      setAnimTick((t) => t + 1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointerUsedRef.current = true;
    setIsPointerDown(true);
    triggerSpring();
    onPress(spec);
  };

  const handlePointerUpOrCancel = () => {
    setIsPointerDown(false);
  };

  const handleClick = () => {
    // Support keyboard Enter/Space activation without double-firing on pointer clicks
    if (pointerUsedRef.current) {
      pointerUsedRef.current = false;
      return;
    }
    triggerSpring();
    onPress(spec);
  };

  const isEqual = spec.role === 'equal';
  const isDelete = spec.value === 'DEL';
  const animClass =
    animationsEnabled && animTick > 0 ? ANIMATION_CLASS_MAP[animationStyle] : '';

  const shadowRest = `0 6px 0 ${palette.edge}, 0 10px 16px -4px rgba(15, 23, 42, 0.25), inset 0 2px 0 ${palette.highlight}`;
  const shadowPressed = `0 2px 0 ${palette.edge}, 0 3px 6px -2px rgba(15, 23, 42, 0.2), inset 0 2px 0 ${palette.highlight}`;

  return (
    <button
      key={`${spec.id}-${animTick}`}
      type="button"
      aria-label={spec.ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onClick={handleClick}
      style={{
        backgroundColor: palette.face,
        color: palette.text,
        boxShadow: isPointerDown ? shadowPressed : shadowRest,
        transform: isPointerDown ? 'translateY(4px) scale(0.98)' : undefined,
      }}
      className={`relative min-h-[56px] sm:min-h-[64px] rounded-2xl font-display font-bold select-none flex items-center justify-center transition-[box-shadow,transform] duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white cursor-pointer ${
        isEqual ? 'text-2xl sm:text-[1.75rem]' : 'text-xl sm:text-2xl'
      } ${animClass}`}
    >
      {/* Top glossy pill reflection */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1.5 left-2.5 right-2.5 h-2 rounded-full bg-white/30"
      />
      {isDelete ? (
        <Delete className="w-6 h-6 stroke-[2.4]" />
      ) : (
        <span className="relative z-10 leading-none">{spec.label}</span>
      )}
    </button>
  );
};
