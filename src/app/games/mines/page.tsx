'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Award, Gem, Bomb, Coins } from 'lucide-react';
import Link from 'next/link';
import { CustomEmoji } from '@/components/ui/CustomEmoji';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

export default function MinesGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, unlockAchievement, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [minesCount, setMinesCount] = useState<number>(3);

  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [grid, setGrid] = useState<('hidden' | 'gem' | 'mine')[]>(Array(25).fill('hidden'));
  const [mineLocations, setMineLocations] = useState<boolean[]>(Array(25).fill(false));
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameOutcome, setGameOutcome] = useState<'win' | 'loss' | null>(null);

  // Refs to avoid stale closures during rapid concurrent clicks
  const isPlayingRef = useRef<boolean>(false);
  const gameOverRef = useRef<boolean>(false);
  const revealedIndicesRef = useRef<number[]>([]);
  const gridRef = useRef<('hidden' | 'gem' | 'mine')[]>(Array(25).fill('hidden'));
  const mineLocationsRef = useRef<boolean[]>(Array(25).fill(false));
  const crackingIndicesRef = useRef<number[]>([]);

  // Stats
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Calculation for Mines Multiplier
  const getMultiplier = (gemsCount: number): number => {
    if (gemsCount === 0) return 1.00;
    let probability = 1.0;
    for (let i = 0; i < gemsCount; i++) {
      probability *= (25 - minesCount - i) / (25 - i);
    }
    return parseFloat((0.99 / probability).toFixed(2));
  };

  const currentMultiplier = getMultiplier(revealedIndices.length);
  const nextMultiplier = getMultiplier(revealedIndices.length + 1);

  // Start Mines Game
  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    
    // Reset and initialize refs
    isPlayingRef.current = true;
    gameOverRef.current = false;
    revealedIndicesRef.current = [];
    gridRef.current = Array(25).fill('hidden');
    crackingIndicesRef.current = [];

    setIsPlaying(true);
    setGameOver(false);
    setGameOutcome(null);
    setRevealedIndices([]);
    setGrid(Array(25).fill('hidden'));
    setCrackingIndices([]);

    // Create random mines coordinates
    const locations = Array(25).fill(false);
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!locations[idx]) {
        locations[idx] = true;
        minesPlaced++;
      }
    }
    mineLocationsRef.current = locations;
    setMineLocations(locations);
  };

  // Cracking animation state
  const [crackingIndices, setCrackingIndices] = useState<number[]>([]);

  // Card click action (Immediate reveal after cracking)
  const handleCardClickImmediate = (index: number) => {
    if (!isPlayingRef.current || gameOverRef.current) return;

    const isMine = mineLocationsRef.current[index];
    const newRevealed = [...revealedIndicesRef.current, index];
    revealedIndicesRef.current = newRevealed;
    setRevealedIndices(newRevealed);

    if (isMine) {
      // Hit a mine (Loss)
      gridRef.current[index] = 'mine';
      setGrid([...gridRef.current]);
      revealAllBoard('loss');
    } else {
      // Hit a gem (Continue)
      playPlop();
      gridRef.current[index] = 'gem';
      setGrid([...gridRef.current]);

      // If user clears the entire board of gems, trigger auto cashout
      const totalGems = 25 - minesCount;
      if (newRevealed.length === totalGems) {
        triggerCashout(newRevealed.length);
      }
    }
  };

  // Card click action with crack effect
  const handleCardClick = (index: number) => {
    if (!isPlayingRef.current || gameOverRef.current || revealedIndicesRef.current.includes(index) || crackingIndicesRef.current.includes(index)) return;

    playClick();
    crackingIndicesRef.current = [...crackingIndicesRef.current, index];
    setCrackingIndices([...crackingIndicesRef.current]);

    setTimeout(() => {
      if (!isPlayingRef.current || gameOverRef.current) return;

      crackingIndicesRef.current = crackingIndicesRef.current.filter(i => i !== index);
      setCrackingIndices([...crackingIndicesRef.current]);
      handleCardClickImmediate(index);
    }, 1000);
  };

  // Reveal all boards
  const revealAllBoard = (outcome: 'win' | 'loss') => {
    gameOverRef.current = true;
    isPlayingRef.current = false;
    crackingIndicesRef.current = [];

    setGameOver(true);
    setGameOutcome(outcome);
    setIsPlaying(false);
    setCrackingIndices([]);

    // Reveal everything
    const newGrid = gridRef.current.map((_, idx) => (mineLocationsRef.current[idx] ? 'mine' : 'gem'));
    gridRef.current = newGrid;
    setGrid(newGrid);

    if (outcome === 'loss') {
      playLoss();
      addHistoryItem('Mines', betAmount, 0, 0, 'loss');
      setGameStats(prev => ({ ...prev, losses: prev.losses + 1, profit: prev.profit - betAmount }));
    }
  };

  // Cashout
  const triggerCashout = (gemsCount = revealedIndicesRef.current.length) => {
    if (!isPlayingRef.current || gameOverRef.current || gemsCount === 0) return;

    const mult = getMultiplier(gemsCount);
    const payout = Math.round(betAmount * mult * 100) / 100;
    
    addCredits(payout);
    playWin();
    triggerWinConfetti();
    addHistoryItem('Mines', betAmount, mult, payout, 'win');

    if (gemsCount >= 5) {
      unlockAchievement('mine-sweeper');
    }

    setGameStats(prev => ({
      ...prev,
      wins: prev.wins + 1,
      profit: prev.profit + (payout - betAmount),
    }));

    revealAllBoard('win');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-luxury-border/60 pb-5">
        <Link 
          href="/" 
          onClick={playClick}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors font-bold tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </Link>
        <span className="text-[10px] bg-gold-500/10 border border-gold-500/20 text-gold-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Mines Grid Select
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Bomb className="w-4 h-4 text-gold-500" />
                MINES SETTINGS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              
              {/* Bet amount */}
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
                    disabled={isPlaying}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Mines selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Number of Mines (1 - 24)</span>
                <select
                  value={minesCount}
                  onChange={(e) => setMinesCount(parseInt(e.target.value))}
                  disabled={isPlaying}
                  className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl px-4 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Mine' : 'Mines'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start / Cashout Action buttons */}
              {!isPlaying ? (
                <Button variant="gold" fullWidth size="lg" onClick={handleStartGame}>
                  Start Round
                </Button>
              ) : (
                <Button
                  variant={revealedIndices.length === 0 ? 'dark' : 'gold'}
                  fullWidth
                  size="lg"
                  onClick={() => triggerCashout()}
                  disabled={revealedIndices.length === 0}
                >
                  {revealedIndices.length === 0 ? (
                    <span>Select a Card</span>
                  ) : (
                    <span>
                      Cash Out ${(betAmount * currentMultiplier).toFixed(2)}
                    </span>
                  )}
                </Button>
              )}

            </CardContent>
          </Card>

          {/* Mines Volatility Payout Table */}
          {isPlaying && (
            <Card className="bg-[#0b0b0b]/60">
              <CardHeader className="p-4 border-b border-luxury-border/60">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Expected Payouts</span>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Gems Uncovered</span>
                  <span className="text-neutral-300 font-bold">{revealedIndices.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Current Multiplier</span>
                  <span className="text-gold-500 font-bold">{currentMultiplier}x</span>
                </div>
                <div className="flex justify-between border-t border-luxury-border/60 pt-2.5">
                  <span className="text-neutral-500 font-medium">Next Gem Multiplier</span>
                  <span className="text-neutral-300 font-bold">{nextMultiplier}x</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session statistics */}
          <Card className="bg-[#0b0b0b]/60">
            <CardContent className="p-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-500 font-medium">Wins</span>
                <span className="text-emerald-500 font-bold mt-1">{gameStats.wins}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500 font-medium">Losses</span>
                <span className="text-red-500 font-bold mt-1">{gameStats.losses}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500 font-medium">Profit</span>
                <span className={`font-bold mt-1 ${gameStats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {gameStats.profit >= 0 ? '+' : ''}{gameStats.profit}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Game Grid */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          
          <Card className="bg-[#050505] border-luxury-border p-8 w-full max-w-[500px] aspect-square flex items-center justify-center relative overflow-hidden select-none">
            
            {/* Grid Container */}
            <div className="grid grid-cols-5 gap-3.5 w-full h-full">
              {grid.map((cellState, index) => {
                const isRevealed = revealedIndices.includes(index) || gameOver;
                const isCracking = crackingIndices.includes(index);
                const cellContent = () => {
                  if (cellState === 'gem') return <Gem className="w-7 h-7 text-emerald-400 filter drop-shadow(0 0 4px rgba(52,211,153,0.3)) animate-pulse-slow" />;
                  if (cellState === 'mine') return <Bomb className="w-7 h-7 text-red-500 filter drop-shadow(0 0 6px rgba(239,68,68,0.5))" />;
                  return null;
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleCardClick(index)}
                    disabled={!isPlaying || gameOver || isCracking}
                    className={`aspect-square w-full rounded-xl flex items-center justify-center transition-all duration-300 relative cursor-pointer border ${
                      isRevealed
                        ? cellState === 'gem'
                          ? 'bg-emerald-950/20 border-emerald-500/20'
                          : 'bg-red-950/20 border-red-500/25'
                        : isCracking
                        ? 'bg-luxury-surface animate-crack-shake z-20'
                        : isPlaying
                        ? 'bg-luxury-surface border-luxury-border hover:border-gold-500 hover:bg-luxury-surface-hover hover:scale-[1.10] hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:-translate-y-0.5 z-10'
                        : 'bg-luxury-surface/40 border-luxury-border/30 opacity-70'
                    }`}
                  >
                    {isCracking ? (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <svg className="absolute inset-0 w-full h-full stroke-amber-500/80" viewBox="0 0 100 100" fill="none">
                          <path d="M50 50 L35 15 M50 50 L75 30 M50 50 L48 85 M50 50 L85 65 M50 50 L15 60" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M35 15 L20 8 M75 30 L90 25 M48 85 L38 95 M85 65 L98 75 M15 60 L3 65" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      </div>
                    ) : (
                      cellContent()
                    )}
                  </button>
                );
              })}
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes crackShake {
                  0%, 100% { transform: scale(1.10) rotate(0deg); }
                  20% { transform: scale(1.10) translate(-1px, 1px) rotate(-1.5deg); }
                  40% { transform: scale(1.10) translate(1px, -1px) rotate(1.5deg); }
                  60% { transform: scale(1.10) translate(-1.5px, 1.5px) rotate(0deg); }
                  80% { transform: scale(1.10) translate(1.5px, 0.5px) rotate(1.5deg); }
                }
                .animate-crack-shake {
                  animation: crackShake 0.15s linear infinite !important;
                  border-color: #f59e0b !important;
                  box-shadow: 0 0 15px rgba(245, 158, 11, 0.4) !important;
                }
              ` }} />
            </div>

            {/* Center Outcome Overlay */}
            <WinLoseOverlay
              isOpen={gameOver}
              onClose={() => { setGameOver(false); setGameOutcome(null); }}
              outcome={gameOutcome}
              multiplier={currentMultiplier}
              payout={betAmount * currentMultiplier}
              language={language}
            />
          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60 w-full max-w-[500px] mt-6">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Mines Rules</strong>: Enter your bet amount, configure the hidden mine count (1 to 24), and click <strong>Start Round</strong>. 
                  Select squares on the grid. Gem reveals increase your potential multiplier. 
                  Click <strong>Cash Out</strong> to exit with your profits. If you reveal a mine, the round ends instantly and your bet is lost.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
