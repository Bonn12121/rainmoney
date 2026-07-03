'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Trophy, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';
import { CustomEmoji } from '@/components/ui/CustomEmoji';

type CupSpeed = 'slow' | 'medium' | 'fast' | 'insane';
type GameState = 'idle' | 'showing_diamond' | 'shuffling' | 'waiting_choice' | 'revealing';

interface SpeedConfig {
  label: string;
  multiplier: number;
  swaps: number;
  intervalMs: number;
}

const SPEED_CONFIGS: Record<CupSpeed, SpeedConfig> = {
  slow: { label: 'Slow', multiplier: 2.0, swaps: 4, intervalMs: 500 },
  medium: { label: 'Medium', multiplier: 3.0, swaps: 7, intervalMs: 350 },
  fast: { label: 'Fast', multiplier: 5.0, swaps: 10, intervalMs: 220 },
  insane: { label: 'Insane', multiplier: 10.0, swaps: 15, intervalMs: 140 },
};

export default function CupGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [speed, setSpeed] = useState<CupSpeed>('medium');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [diamondIndex, setDiamondIndex] = useState<number>(1); // 0, 1, or 2
  const [cupPositions, setCupPositions] = useState<number[]>([0, 1, 2]); // maps visual slot to actual cup ID (cup with diamond is cup ID equal to initial diamondIndex)
  const [selectedCupSlot, setSelectedCupSlot] = useState<number | null>(null);
  const [isWon, setIsWon] = useState<boolean | null>(null);
  const [swapCount, setSwapCount] = useState<number>(0);

  const config = SPEED_CONFIGS[speed];
  const potentialPayout = Math.round(betAmount * config.multiplier * 100) / 100;

  // Run the shuffling sequence
  const startShuffle = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setSelectedCupSlot(null);
    setIsWon(null);

    // 1. Choose initial diamond index randomly
    const initialDiamond = Math.floor(Math.random() * 3);
    setDiamondIndex(initialDiamond);
    
    // Reset positions to match default
    setCupPositions([0, 1, 2]);
    setGameState('showing_diamond');

    // 2. Show the diamond briefly for 1.2 seconds, then hide and shuffle
    setTimeout(() => {
      setGameState('shuffling');
      runShufflingSequence();
    }, 1200);
  };

  const runShufflingSequence = () => {
    let currentSwap = 0;
    const totalSwaps = config.swaps;
    const intervalMs = config.intervalMs;

    // We copy positions
    let positions = [0, 1, 2];

    const interval = setInterval(() => {
      // Pick two distinct random slots to swap
      let idx1 = Math.floor(Math.random() * 3);
      let idx2 = Math.floor(Math.random() * 3);
      while (idx1 === idx2) {
        idx2 = Math.floor(Math.random() * 3);
      }

      // Swap positions
      const temp = positions[idx1];
      positions[idx1] = positions[idx2];
      positions[idx2] = temp;

      setCupPositions([...positions]);
      playPlop();

      currentSwap++;
      setSwapCount(currentSwap);

      if (currentSwap >= totalSwaps) {
        clearInterval(interval);
        setTimeout(() => {
          setGameState('waiting_choice');
        }, 300);
      }
    }, intervalMs);
  };

  const handleCupSelect = (slotIdx: number) => {
    if (gameState !== 'waiting_choice') return;

    setSelectedCupSlot(slotIdx);
    setGameState('revealing');
    playClick();

    // The cup ID sitting at this slot is cupPositions[slotIdx]
    // The diamond was placed under cup ID equal to the initial diamondIndex
    const cupId = cupPositions[slotIdx];
    const won = cupId === diamondIndex;

    setTimeout(() => {
      setIsWon(won);
      if (won) {
        playWin();
        triggerWinConfetti();
        addCredits(potentialPayout);
        addHistoryItem('Cup', betAmount, config.multiplier, potentialPayout, 'win');
      } else {
        playLoss();
        addHistoryItem('Cup', betAmount, 0, 0, 'loss');
      }
    }, 800);
  };

  const handleReset = () => {
    setGameState('idle');
    setSelectedCupSlot(null);
    setIsWon(null);
    setCupPositions([0, 1, 2]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-luxury-border/60 pb-5">
        <Link 
          href="/" 
          onClick={playClick}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors uppercase font-bold tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </Link>
        <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Diamond Shuffling Cup
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <Trophy className="w-4 h-4 text-teal-400" />
                CUP SHUFFLE CONTROLS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              
              {/* Bet Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-neutral-400">
                  <span>Bet Amount</span>
                  <span>Balance: ${credits.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    disabled={gameState !== 'idle'}
                    className="w-full bg-black border border-luxury-border focus:border-teal-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={gameState !== 'idle'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={gameState !== 'idle'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={gameState !== 'idle'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-teal-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Speed Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Shuffling Speed</span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SPEED_CONFIGS) as CupSpeed[]).map((spKey) => {
                    const spCfg = SPEED_CONFIGS[spKey];
                    return (
                      <button
                        key={spKey}
                        onClick={() => { playClick(); setSpeed(spKey); }}
                        disabled={gameState !== 'idle'}
                        className={`py-2 px-3 text-[10px] font-extrabold uppercase rounded-lg border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                          speed === spKey
                            ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                            : 'bg-neutral-900 border-luxury-border hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-50'
                        }`}
                      >
                        <span>{spCfg.label}</span>
                        <span className="opacity-75">{spCfg.multiplier.toFixed(1)}x</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              {gameState === 'idle' && (
                <Button variant="gold" fullWidth size="lg" onClick={startShuffle} className="bg-teal-500 hover:bg-teal-400 text-black border-none font-bold">
                  Start Shuffling
                </Button>
              )}

              {gameState === 'revealing' && isWon !== null && (
                <Button variant="dark" fullWidth size="lg" onClick={handleReset} className="font-bold">
                  Play Again
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Visual Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          <Card className="bg-[#050505] border-luxury-border min-h-[420px] flex flex-col items-center justify-center p-8 select-none relative overflow-hidden">
            
            {gameState === 'idle' && (
              <div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest">
                Choose a speed setting and click start to shuffle!
              </div>
            )}

            {gameState === 'shuffling' && (
              <div className="absolute top-8 text-xs font-bold text-teal-400/80 uppercase tracking-widest animate-pulse">
                Shuffling cups... ({swapCount} / {config.swaps})
              </div>
            )}

            {gameState === 'waiting_choice' && (
              <div className="absolute top-8 text-xs font-bold text-teal-400 uppercase tracking-widest animate-pulse">
                Find the diamond! Click a cup.
              </div>
            )}

            <WinLoseOverlay
              isOpen={gameState === 'revealing' && isWon !== null}
              onClose={handleReset}
              outcome={isWon ? 'win' : 'loss'}
              multiplier={isWon ? config.multiplier : 0}
              payout={isWon ? potentialPayout : 0}
            />

            {/* Cup Arena Grid */}
            {gameState !== 'idle' && (
              <div className="relative flex justify-center items-center w-full max-w-md h-56 mt-8">
                {Array.from({ length: 3 }).map((_, cupId) => {
                  // visual position mapping:
                  // cupPositions.indexOf(cupId) gives the current slot index for this cupId
                  const slotIdx = cupPositions.indexOf(cupId);
                  const isDiamondHere = cupId === diamondIndex;
                  const isRevealed = gameState === 'showing_diamond' || gameState === 'revealing';
                  const isSelected = selectedCupSlot === slotIdx;
                  
                  return (
                    <div
                      key={cupId}
                      className="absolute flex flex-col items-center justify-end"
                      style={{
                        left: `calc(50% + ${(slotIdx - 1) * 130}px)`,
                        transform: 'translateX(-50%)',
                        bottom: '20px',
                        transition: `left ${gameState === 'shuffling' ? config.intervalMs : 400}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                      }}
                    >
                      {/* Diamond Item behind the cup */}
                      {isDiamondHere && (
                        <div 
                          className="absolute z-0 bottom-6 transition-all duration-500"
                          style={{
                            opacity: isRevealed ? 1 : 0,
                            transform: `scale(${isRevealed ? 1.2 : 0.5})`,
                            transitionDelay: isRevealed ? '200ms' : '0ms'
                          }}
                        >
                          <CustomEmoji name="diamond" className="w-12 h-12" />
                        </div>
                      )}

                      {/* Cup Visual Button */}
                      <button
                        disabled={gameState !== 'waiting_choice'}
                        onClick={() => handleCupSelect(slotIdx)}
                        className="transition-all relative z-10 cursor-pointer duration-500 focus:outline-none"
                        style={{
                          transform: isRevealed ? 'translateY(-75px)' : 'translateY(0)',
                          filter: isSelected && isWon ? 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.6))' : 'none'
                        }}
                      >
                        <SVGMetallicCup />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Cup Shuffling Rules</strong>:
                  Place your bet and select a Shuffling Speed. Higher speeds mean more swaps and faster animation, yielding a higher payout multiplier (Slow 2.0x, Medium 3.0x, Fast 5.0x, Insane 10.0x). 
                  At start, the diamond (<CustomEmoji name="diamond" className="w-3 h-3 inline-block" />) is shown briefly. The cups then cover the diamond and shuffle. 
                  Once shuffled, guess which cup conceals the diamond. Guess right to win your payout!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}

function SVGMetallicCup() {
  return (
    <svg 
      viewBox="0 0 100 120" 
      className="w-20 h-28 drop-shadow-[0_12px_15px_rgba(0,0,0,0.8)]"
    >
      <defs>
        {/* Shiny gold/metallic gradient */}
        <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="25%" stopColor="#1e3a8a" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#93c5fd" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="85%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      {/* Cup Body (Trapezoid with curved bottom) */}
      <path 
        d="M 15 15 L 85 15 C 83 25, 80 85, 70 100 C 60 110, 40 110, 30 100 C 20 85, 17 25, 15 15 Z" 
        fill="url(#cupGrad)" 
        stroke="#334155" 
        strokeWidth="1.5" 
      />
      {/* Rim top ellipse to give 3D depth */}
      <ellipse cx="50" cy="15" rx="35" ry="6" fill="url(#rimGrad)" stroke="#60a5fa" strokeWidth="1" />
      {/* Decorative details (sleek luxury lines on cup) */}
      <path d="M 23 45 C 35 48, 65 48, 77 45" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.3" />
      <path d="M 26 70 C 35 73, 65 73, 74 70" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.3" />
      {/* Small star insignia */}
      <polygon points="50,45 53,52 60,52 55,56 57,63 50,59 43,63 45,56 40,52 47,52" fill="#60a5fa" opacity="0.8" />
    </svg>
  );
}
