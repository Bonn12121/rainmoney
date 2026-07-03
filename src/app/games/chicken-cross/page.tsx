'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, Award, Footprints, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

// Payout multipliers for 10 road steps
const MULTIPLIERS = [1.15, 1.35, 1.60, 1.90, 2.30, 2.85, 3.60, 4.80, 6.80, 10.00];

// Probability decreases as multiplier increases
const PROBABILITIES = [0.96, 0.92, 0.88, 0.84, 0.80, 0.75, 0.70, 0.60, 0.50, 0.40];

interface LaneState {
  direction: 'up' | 'down';
  speed: number; // Animation duration in seconds (2 to 5)
  color: string; // Truck color variation
}

const COLOR_CONFIGS: Record<string, { main: string, light: string, dark: string }> = {
  'bg-purple-600': { main: '#9333ea', light: '#a855f7', dark: '#7e22ce' },
  'bg-blue-600': { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
  'bg-red-600': { main: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
  'bg-amber-600': { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
  'bg-emerald-600': { main: '#059669', light: '#10b981', dark: '#047857' },
  'bg-rose-600': { main: '#e11d48', light: '#f43f5e', dark: '#be123c' },
};

// Vector Chicken Component - High Quality 3D glossy cartoon style
const VectorChicken = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`w-18 h-18 drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Body Gradient */}
      <radialGradient id="bodyGrad" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </radialGradient>
      {/* Comb (Red) Gradient */}
      <linearGradient id="combGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff4d4d" />
        <stop offset="100%" stopColor="#cc0000" />
      </linearGradient>
      {/* Beak Gradient */}
      <linearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      {/* Cheek Pink Glow */}
      <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fda4af" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
      </radialGradient>
      {/* Wing Gradient */}
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>

    {/* Tail Feathers */}
    <path d="M 22,46 C 14,40 8,42 6,48 C 4,54 10,60 18,58 C 12,62 10,68 14,72 C 18,76 24,70 26,62" fill="url(#wingGrad)" opacity="0.9" />
    <path d="M 28,40 C 20,32 15,36 12,42 C 9,48 16,56 24,52" fill="url(#wingGrad)" />

    {/* Feet / Legs */}
    <g stroke="#ea580c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 42,75 L 42,88 M 42,88 L 34,92 M 42,88 L 42,94 M 42,88 L 48,92" />
      <path d="M 58,75 L 58,88 M 58,88 L 50,92 M 58,88 L 58,94 M 58,88 L 64,92" />
    </g>

    {/* Main Body */}
    <circle cx="50" cy="52" r="28" fill="url(#bodyGrad)" stroke="#94a3b8" strokeWidth="1.5" />

    {/* Wing */}
    <path d="M 38,50 C 35,55 30,55 26,50 C 22,45 25,38 35,40 C 38,41 42,45 38,50 Z" fill="url(#wingGrad)" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 45,55 C 42,62 36,65 30,60 C 24,55 28,46 38,48 C 43,49 48,51 45,55 Z" fill="url(#wingGrad)" stroke="#94a3b8" strokeWidth="1.2" />

    {/* Comb */}
    <path d="M 52,24 C 48,16 42,18 42,24 C 42,16 34,18 36,24 C 36,18 30,20 32,26 C 36,28 44,28 54,26 C 54,26 54,24 52,24 Z" fill="url(#combGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />

    {/* Wattle */}
    <path d="M 68,54 C 68,62 62,64 60,58 Z" fill="url(#combGrad)" />

    {/* Beak */}
    <path d="M 76,46 L 88,48 L 76,54 Z" fill="url(#beakGrad)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.1))" />

    {/* Eye */}
    <circle cx="64" cy="38" r="8" fill="#1e293b" />
    <circle cx="64" cy="38" r="5" fill="#0284c7" opacity="0.3" />
    <circle cx="66" cy="36" r="3" fill="#ffffff" />
    <circle cx="62" cy="40" r="1" fill="#ffffff" />

    {/* Blushy Cheek */}
    <circle cx="56" cy="48" r="6" fill="url(#cheekGrad)" />

    {/* Feathery hair tuft */}
    <path d="M 48,27 C 52,26 54,28 52,30" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Vector Highway Barrier Component - Detailed Concrete & Steel Barrier
const HighwayBarrier = ({ className }: { className?: string }) => (
  <div className={`relative w-18 h-10 flex flex-col items-center justify-between pointer-events-none select-none ${className}`}>
    {/* Barrier main block with striped pattern */}
    <div 
      className="w-full h-6 rounded-md border border-neutral-600/90 shadow-[0_6px_10px_rgba(0,0,0,0.5)] relative overflow-hidden"
      style={{
        background: 'repeating-linear-gradient(45deg, #e11d48, #e11d48 10px, #ffffff 10px, #ffffff 20px)',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-[2px] bg-white/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />
      {/* Bolt circles on the barrier face */}
      <div className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-neutral-300 shadow-inner border border-neutral-500" />
      <div className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-neutral-300 shadow-inner border border-neutral-500" />
    </div>
    {/* Heavy duty concrete feet */}
    <div className="w-full flex justify-between px-3 -mt-[2px] z-10">
      <div className="w-4 h-4 bg-neutral-700 border border-neutral-500 rounded-sm shadow-md flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
      </div>
      <div className="w-4 h-4 bg-neutral-700 border border-neutral-500 rounded-sm shadow-md flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
      </div>
    </div>
  </div>
);

// Vector Top-Down Truck Component - Bigger & Highly Detailed Semi-Truck
const VectorTruck = ({ color = 'bg-purple-600', isHeadingUp = false, className = '', style }: { color?: string, isHeadingUp?: boolean, className?: string, style?: React.CSSProperties }) => {
  const config = COLOR_CONFIGS[color] || COLOR_CONFIGS['bg-purple-600'];
  const mainColor = config.main;
  const lightColor = config.light;
  const darkColor = config.dark;

  return (
    <svg 
      viewBox="0 0 80 180" 
      style={style} 
      className={`w-14 h-32 drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)] pointer-events-none select-none transition-transform duration-300 ${isHeadingUp ? 'rotate-180' : ''} ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Cab Gradients */}
        <linearGradient id={`cabGrad-${mainColor}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={mainColor} />
          <stop offset="30%" stopColor={lightColor} />
          <stop offset="70%" stopColor={mainColor} />
          <stop offset="100%" stopColor={darkColor} />
        </linearGradient>
        {/* Windshield Gradient */}
        <linearGradient id="windshieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        {/* Trailer Gradients */}
        <linearGradient id="trailerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="25%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        {/* Wheel Gradient */}
        <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Wheels */}
      {/* Front wheels */}
      <rect x="3" y="130" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="69" y="130" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      {/* Rear trailer wheels */}
      <rect x="2" y="20" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="10" y="20" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="62" y="20" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="70" y="20" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      
      <rect x="2" y="42" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="10" y="42" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="62" y="42" width="8" height="18" rx="2" fill="url(#wheelGrad)" />
      <rect x="70" y="42" width="8" height="18" rx="2" fill="url(#wheelGrad)" />

      {/* Side Mirrors */}
      <path d="M 8,142 H 2 V 132 H 8 Z" fill="#475569" />
      <rect x="1" y="130" width="2" height="6" rx="0.5" fill="#94a3b8" />
      <path d="M 72,142 H 78 V 132 H 72 Z" fill="#475569" />
      <rect x="77" y="130" width="2" height="6" rx="0.5" fill="#94a3b8" />

      {/* Main Chassis / Frame */}
      <rect x="12" y="10" width="56" height="162" rx="4" fill="#0f172a" opacity="0.6" />

      {/* Cargo Trailer Body */}
      <rect x="14" y="12" width="52" height="105" rx="3" fill="url(#trailerGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
      {/* Trailer Roof lines */}
      <line x1="20" y1="20" x2="20" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="26" y1="20" x2="26" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="32" y1="20" x2="32" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="38" y1="20" x2="38" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="42" y1="20" x2="42" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="48" y1="20" x2="48" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="54" y1="20" x2="54" y2="110" stroke="#94a3b8" strokeWidth="1" />
      <line x1="60" y1="20" x2="60" y2="110" stroke="#94a3b8" strokeWidth="1" />
      {/* Stripes */}
      <line x1="14" y1="30" x2="66" y2="30" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="14" y1="60" x2="66" y2="60" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="14" y1="90" x2="66" y2="90" stroke="#cbd5e1" strokeWidth="1.5" />
      {/* Brand logo decal */}
      <rect x="25" y="45" width="30" height="10" rx="1" fill={mainColor} opacity="0.85" />
      <text x="40" y="52" fill="#ffffff" fontSize="4.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">RAINMONEY</text>

      {/* Connector coupling */}
      <rect x="35" y="117" width="10" height="8" fill="#334155" />
      <circle cx="40" cy="121" r="2.5" fill="#1e293b" />

      {/* Cabin (colored) */}
      <path 
        d="M 16,125 
           C 16,125 15,127 15,132 
           L 15,164 
           C 15,168 18,172 24,172 
           L 56,172 
           C 62,172 65,168 65,164 
           L 65,132 
           C 65,127 64,125 64,125 
           Z" 
        fill={`url(#cabGrad-${mainColor})`} 
        stroke={darkColor} 
        strokeWidth="1.5" 
      />

      {/* Windshield */}
      <path 
        d="M 22,156 
           L 58,156 
           C 60,156 61,155 61,152 
           L 59,142 
           C 58,139 56,138 53,138 
           L 27,138 
           C 24,138 22,139 21,142 
           L 19,152 
           C 19,155 20,156 22,156 
           Z" 
        fill="url(#windshieldGrad)" 
        stroke="#0284c7" 
        strokeWidth="1" 
      />
      {/* Glare line */}
      <path d="M 22,140 Q 40,146 58,140" stroke="#ffffff" strokeWidth="1" opacity="0.45" strokeLinecap="round" />
      
      {/* Sunroof */}
      <rect x="30" y="125" width="20" height="8" rx="1" fill="#1e293b" opacity="0.4" />

      {/* Headlights */}
      <circle cx="22" cy="170" r="4.5" fill="#fef08a" opacity="0.9" />
      <circle cx="22" cy="170" r="2" fill="#ffffff" />
      
      <circle cx="58" cy="170" r="4.5" fill="#fef08a" opacity="0.9" />
      <circle cx="58" cy="170" r="2" fill="#ffffff" />

      {/* Indicators */}
      <rect x="15" y="160" width="2" height="6" rx="1" fill="#f97316" />
      <rect x="63" y="160" width="2" height="6" rx="1" fill="#f97316" />
    </svg>
  );
};

export default function ChickenCrossGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, unlockAchievement, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  
  // Game States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLane, setCurrentLane] = useState<number>(0); // 0: start zone, 1-10: lanes, 11: safety grass zone
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameOutcome, setGameOutcome] = useState<'win' | 'loss' | 'cashout' | null>(null);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [crashingLane, setCrashingLane] = useState<number | null>(null);

  // Statistics
  const [stats, setStats] = useState({ plays: 0, wins: 0, profit: 0 });

  // Generate lane variations once on mount
  const [lanes, setLanes] = useState<LaneState[]>([]);

  useEffect(() => {
    const truckColors = ['bg-purple-600', 'bg-blue-600', 'bg-red-600', 'bg-amber-600', 'bg-emerald-600', 'bg-rose-600'];
    const generatedLanes: LaneState[] = Array.from({ length: 10 }, (_, idx) => ({
      direction: idx % 2 === 0 ? 'up' : 'down',
      speed: 1.8 + Math.random() * 1.5, // 1.8s to 3.3s speed
      color: truckColors[idx % truckColors.length],
    }));
    setLanes(generatedLanes);
  }, []);

  const activeMultiplier = currentLane > 0 ? MULTIPLIERS[currentLane - 1] : 1.00;
  const nextMultiplier = currentLane < 10 ? MULTIPLIERS[currentLane] : 10.00;

  // Start Chicken Cross Game
  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsPlaying(true);
    setGameOver(false);
    setGameOutcome(null);
    setCurrentLane(0);
    setCrashingLane(null);
    setLastWinAmount(0);
  };

  // Jump to the next lane
  const handleStepForward = () => {
    if (!isPlaying || gameOver) return;

    playPlop();
    const nextLaneIdx = currentLane + 1;
    
    // Probability check: higher multiplier, lower chance to win
    const successRate = PROBABILITIES[currentLane];
    const success = Math.random() < successRate;

    if (success) {
      setCurrentLane(nextLaneIdx);
      
      // If player reached step 10 (the other side of the road)
      if (nextLaneIdx === 10) {
        const winAmount = betAmount * 10.00;
        addCredits(winAmount);
        setLastWinAmount(winAmount);
        setGameOutcome('win');
        setGameOver(true);
        setIsPlaying(false);
        playWin();
        triggerWinConfetti();
        unlockAchievement('crossing_master');

        setStats(prev => ({
          plays: prev.plays + 1,
          wins: prev.wins + 1,
          profit: prev.profit + (winAmount - betAmount),
        }));

        addHistoryItem('Chicken Cross', betAmount, 10.00, winAmount, 'win');
      }
    } else {
      // Hit by truck! Loss
      setCrashingLane(nextLaneIdx);
      setGameOutcome('loss');
      setGameOver(true);
      setIsPlaying(false);
      playLoss();

      setStats(prev => ({
        plays: prev.plays + 1,
        wins: prev.wins,
        profit: prev.profit - betAmount,
      }));

      addHistoryItem('Chicken Cross', betAmount, 0, 0, 'loss');
    }
  };

  // Cash Out mid-way
  const handleCashOut = () => {
    if (!isPlaying || currentLane === 0 || gameOver) return;

    const winAmount = betAmount * activeMultiplier;
    addCredits(winAmount);
    setLastWinAmount(winAmount);
    setGameOutcome('cashout');
    setGameOver(true);
    setIsPlaying(false);
    playWin();

    setStats(prev => ({
      plays: prev.plays + 1,
      wins: prev.wins + 1,
      profit: prev.profit + (winAmount - betAmount),
    }));

    addHistoryItem('Chicken Cross', betAmount, activeMultiplier, winAmount, 'win');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 flex-grow">
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors font-sans">
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-grow">
        
        {/* Betting Panel Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="bg-luxury-surface border-luxury-border/60 shadow-xl rounded-3xl h-full flex flex-col justify-between">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 font-sans">
                <Footprints className="w-5 h-5 text-emerald-400 animate-bounce" />
                <span>Chicken Cross</span>
              </CardTitle>
              <CardDescription className="text-[10px] text-neutral-450 font-bold leading-relaxed font-sans mt-1">
                Click on the glowing circular lane buttons on the road to hop forward. Higher multipliers carry higher danger!
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 flex-grow flex flex-col gap-5 justify-start">
              {/* Bet Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-sans">Bet Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm font-extrabold text-neutral-550">$</span>
                  <input
                    type="number"
                    disabled={isPlaying}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full bg-black border border-luxury-border focus:border-blue-500/35 rounded-2xl pl-8 pr-16 py-3 text-xs text-white font-extrabold focus:outline-none font-mono"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => !isPlaying && setBetAmount(prev => Math.max(0.01, prev / 2))}
                      className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-luxury-border text-[9px] text-neutral-450 font-black rounded-lg cursor-pointer transition-colors"
                    >
                      ½
                    </button>
                    <button
                      onClick={() => !isPlaying && setBetAmount(prev => prev * 2)}
                      className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-luxury-border text-[9px] text-neutral-450 font-black rounded-lg cursor-pointer transition-colors"
                    >
                      2x
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Multiplier Info */}
              <div className="flex justify-between items-center bg-black/40 border border-luxury-border/60 px-4 py-3 rounded-2xl text-[10px] font-bold">
                <span className="text-neutral-450 uppercase font-sans tracking-wide">Active Multiplier</span>
                <span className="text-white font-mono text-xs">{activeMultiplier.toFixed(2)}x</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-2">
                {!isPlaying ? (
                  <Button
                    onClick={handleStartGame}
                    variant="gold"
                    fullWidth
                    size="lg"
                    className="font-black uppercase tracking-widest text-[11px] py-3.5 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 font-sans"
                  >
                    <Play className="w-4 h-4 fill-black mr-1" />
                    <span>Start Crossing</span>
                  </Button>
                ) : (
                  <>
                    <div className="bg-blue-550/10 border border-blue-500/25 p-3 rounded-2xl text-center text-[10px] text-blue-400 font-bold uppercase tracking-wider animate-pulse">
                      Click the glowing button on the road to hop!
                    </div>
                    <Button
                      onClick={handleCashOut}
                      variant="outline"
                      fullWidth
                      disabled={currentLane === 0}
                      className="font-black uppercase tracking-widest text-[11px] py-3.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-sans"
                    >
                      <span>Cash Out (${(betAmount * activeMultiplier).toFixed(2)})</span>
                    </Button>
                  </>
                )}
              </div>

              {/* Stat list */}
              <div className="flex flex-col gap-2 border-t border-luxury-border/30 pt-4 mt-2">
                <div className="flex justify-between text-[9px] font-bold text-neutral-450 uppercase font-sans">
                  <span>Plays</span>
                  <span className="text-white font-mono">{stats.plays}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-neutral-450 uppercase font-sans">
                  <span>Wins</span>
                  <span className="text-white font-mono">{stats.wins}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-neutral-450 uppercase font-sans">
                  <span>Net Profit</span>
                  <span className={`font-mono font-black ${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.profit >= 0 ? '+' : ''}${stats.profit.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Road Game Board */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="bg-[#0b0e1a]/95 border-luxury-border/60 shadow-xl rounded-3xl overflow-hidden flex-grow flex flex-col relative min-h-[580px]">
            
            {/* Visual Road Container */}
            <div className="flex-grow flex flex-row relative h-full">
              
              {/* Left sidewalk: Start Zone */}
              <div className="w-20 bg-gradient-to-b from-[#132c1c] via-[#1a3a25] to-[#132c1c] border-r border-emerald-500/20 flex flex-col justify-between items-center py-8 relative shadow-[inset_-6px_0_15px_rgba(0,0,0,0.6)]">
                {/* Grass decorations */}
                <div className="text-2xl opacity-60">🌸</div>
                <div className="text-2xl opacity-60">🌳</div>
                <div className="text-2xl opacity-65">💡</div>
                
                {/* Start indicator text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400/80 -rotate-90 font-sans">STARTING ZONE</span>
                </div>

                {/* Render chicken if here */}
                {currentLane === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-35 transition-all duration-300">
                    <VectorChicken />
                  </div>
                )}
              </div>

              {/* Middle Lanes (10 vertical road tracks) */}
              <div className="flex-grow flex flex-row">
                {lanes.map((lane, idx) => {
                  const laneNumber = idx + 1;
                  const isCurrent = currentLane === laneNumber;
                  const isCrashedHere = crashingLane === laneNumber;
                  const isPassed = currentLane >= laneNumber;
                  const isNextToClick = isPlaying && !gameOver && laneNumber === currentLane + 1;

                  // Render moving vehicles only on active or future lanes. Passed lanes are blocked by barriers.
                  const showTraffic = isPlaying && !gameOver && laneNumber > currentLane;

                  // Compute potential win text for this circle button
                  const potentialWinnings = betAmount * MULTIPLIERS[idx];
                  const winningsText = potentialWinnings.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  });

                  return (
                    <div 
                      key={idx} 
                      className={`relative flex-grow flex flex-col justify-between items-center py-6 border-r border-dashed border-neutral-700/40 bg-[#0c0f1d] shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                        isCurrent ? 'bg-[#121831]/60 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] border-r-blue-500/20' : ''
                      }`}
                    >
                      {/* Zebra crossing dashes at top and bottom of each lane */}
                      <div className="w-full flex flex-col gap-1 items-center opacity-40 select-none">
                        <div className="w-3 h-1.5 bg-yellow-500/80 rounded-sm shadow-md"></div>
                        <div className="w-3 h-1.5 bg-yellow-500/80 rounded-sm shadow-md"></div>
                      </div>

                      {/* Moving Vector Truck Animation */}
                      {showTraffic && (
                        <div className="absolute inset-x-0 inset-y-16 pointer-events-none overflow-hidden select-none z-10 flex justify-center">
                          {/* Render custom vector truck */}
                          <VectorTruck 
                            color={lane.color} 
                            isHeadingUp={lane.direction === 'up'}
                            className="absolute"
                            style={{
                              animation: `${lane.direction === 'up' ? 'trafficUp' : 'trafficDown'} ${lane.speed}s linear infinite`,
                            }}
                          />
                        </div>
                      )}

                      {/* Real barrier built on passed lanes to block traffic */}
                      {isPassed && (
                        <div className="absolute top-[20%] z-25">
                          <HighwayBarrier />
                        </div>
                      )}

                      {/* Intermediary circle button */}
                      <button
                        disabled={!isNextToClick}
                        onClick={handleStepForward}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 z-20 ${
                          isNextToClick
                            ? 'bg-gradient-to-b from-[#2563eb] to-[#1e3a8a] border-blue-400 hover:scale-105 active:scale-95 cursor-pointer animate-pulse shadow-[0_0_18px_rgba(59,130,246,0.7)]'
                            : isPassed
                              ? 'bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 border-emerald-500/30 opacity-85'
                              : 'bg-gradient-to-b from-[#1a2035] to-[#0c0f1c] border-luxury-border/80 opacity-60'
                        }`}
                      >
                        {/* Inner vertical grille lines */}
                        <div className="absolute inset-0 flex items-center justify-around opacity-[0.08] pointer-events-none px-2 rounded-full overflow-hidden">
                          <div className="w-[1.5px] h-full bg-white"></div>
                          <div className="w-[1.5px] h-full bg-white"></div>
                          <div className="w-[1.5px] h-full bg-white"></div>
                          <div className="w-[1.5px] h-full bg-white"></div>
                          <div className="w-[1.5px] h-full bg-white"></div>
                          <div className="w-[1.5px] h-full bg-white"></div>
                        </div>

                        {/* Money Text overlay */}
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-white/95 font-mono tracking-tighter drop-shadow-md z-10 leading-none">
                          ${winningsText}
                        </span>

                        {/* Success percentage (only shown on next step) */}
                        {isNextToClick && (
                          <span className="text-[6px] text-blue-300 font-extrabold uppercase mt-1 leading-none tracking-widest">
                            {(PROBABILITIES[currentLane] * 100).toFixed(0)}%
                          </span>
                        )}
                      </button>

                      {/* Center content: Render Safe Chicken or Crash Particle */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        {isCurrent && (
                          <div className="animate-bounce">
                            <VectorChicken />
                          </div>
                        )}
                        {isCrashedHere && (
                          <div className="relative w-full h-full flex flex-col items-center justify-center">
                            {/* Crashing Truck zoomed down */}
                            <VectorTruck color={lane.color} className="absolute -translate-y-6 scale-115 z-40 animate-bounce" />
                            {/* Explosion effect */}
                            <div className="absolute text-5xl leading-none animate-ping text-red-500 font-extrabold z-50">
                              💥
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Zebra crossing dashes at bottom */}
                      <div className="w-full flex flex-col gap-1 items-center opacity-40 select-none mt-auto">
                        <div className="w-3 h-1.5 bg-yellow-500/80 rounded-sm shadow-md"></div>
                        <div className="w-3 h-1.5 bg-yellow-500/80 rounded-sm shadow-md"></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right sidewalk: Safety Grass Finish Zone */}
              <div className="w-20 bg-gradient-to-b from-[#132c1c] via-[#1a3a25] to-[#132c1c] border-l border-emerald-500/20 flex flex-col justify-between items-center py-8 relative shadow-[inset_6px_0_15px_rgba(0,0,0,0.6)]">
                {/* Grass decorations */}
                <div className="text-2xl opacity-60">🏡</div>
                <div className="text-2xl opacity-60">🌳</div>
                <div className="text-2xl opacity-60">🎉</div>
                
                {/* Finish indicator text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80 -rotate-90 font-sans">SAFETY ZONE</span>
                </div>

                {/* Render chicken if here */}
                {currentLane === 10 && (
                  <div className="absolute inset-0 flex items-center justify-center z-35 transition-all duration-300">
                    <VectorChicken className="animate-bounce" />
                  </div>
                )}
              </div>
            </div>

            {/* Game Result Alert Overlays */}
            <WinLoseOverlay
              isOpen={gameOver}
              onClose={() => { setGameOver(false); setGameOutcome(null); }}
              outcome={gameOutcome}
              multiplier={gameOutcome === 'win' ? 10.00 : gameOutcome === 'cashout' ? activeMultiplier : 0}
              payout={gameOutcome === 'win' || gameOutcome === 'cashout' ? lastWinAmount : 0}
              language={language}
            />
          </Card>
        </div>
      </div>

      {/* Traffic Keyframes Styling */}
      <style jsx global>{`
        @keyframes trafficUp {
          0% {
            transform: translateY(500px);
          }
          100% {
            transform: translateY(-140px);
          }
        }
        @keyframes trafficDown {
          0% {
            transform: translateY(-140px);
          }
          100% {
            transform: translateY(500px);
          }
        }
      `}</style>
    </div>
  );
}
