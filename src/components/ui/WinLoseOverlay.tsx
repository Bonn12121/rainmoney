'use client';

import React from 'react';

interface WinLoseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  outcome: 'win' | 'loss' | 'cashout' | null;
  multiplier: number;
  payout: number;
  language?: string;
}

export function WinLoseOverlay({
  isOpen,
  onClose,
  outcome,
  multiplier,
  payout,
}: WinLoseOverlayProps) {
  if (!isOpen || !outcome) return null;

  const isWin = outcome === 'win' || outcome === 'cashout';

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 bg-black/65 z-40 flex items-center justify-center p-4 cursor-pointer animate-fade-in rounded-2xl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-60 bg-[#050505] border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-2xl relative cursor-default transition-all duration-300 animate-pop-in ${
          isWin
            ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
            : 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
        }`}
      >
        {/* Multiplier Inner Box */}
        <div
          className={`py-1.5 px-8 border-2 rounded-xl flex items-center justify-center font-black text-2xl tracking-wide ${
            isWin
              ? 'border-emerald-500 text-emerald-400'
              : 'border-red-500 text-red-400'
          }`}
        >
          {isWin ? `${multiplier.toFixed(2)}x` : '0.00x'}
        </div>

        {/* Payout Text */}
        <div
          className={`text-2xl font-black font-sans leading-none ${
            isWin ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          ${isWin ? payout.toFixed(2) : '0.00'}
        </div>
      </div>
    </div>
  );
}
