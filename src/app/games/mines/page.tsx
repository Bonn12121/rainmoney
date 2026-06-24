'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Award, Gem, Bomb, Coins } from 'lucide-react';
import Link from 'next/link';

export default function MinesGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, unlockAchievement } = useGameState();
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
    setIsPlaying(true);
    setGameOver(false);
    setGameOutcome(null);
    setRevealedIndices([]);
    setGrid(Array(25).fill('hidden'));

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
    setMineLocations(locations);
  };

  // Card click action
  const handleCardClick = (index: number) => {
    if (!isPlaying || gameOver || revealedIndices.includes(index)) return;

    const isMine = mineLocations[index];
    const newRevealed = [...revealedIndices, index];
    setRevealedIndices(newRevealed);

    if (isMine) {
      // Hit a mine (Loss)
      setGrid(prev => {
        const copy = [...prev];
        copy[index] = 'mine';
        return copy;
      });
      revealAllBoard('loss');
    } else {
      // Hit a gem (Continue)
      playPlop();
      setGrid(prev => {
        const copy = [...prev];
        copy[index] = 'gem';
        return copy;
      });

      // If user clears the entire board of gems, trigger auto cashout
      const totalGems = 25 - minesCount;
      if (newRevealed.length === totalGems) {
        triggerCashout(newRevealed.length);
      }
    }
  };

  // Reveal all boards
  const revealAllBoard = (outcome: 'win' | 'loss') => {
    setGameOver(true);
    setGameOutcome(outcome);
    setIsPlaying(false);

    // Reveal everything
    setGrid(prev => {
      return prev.map((_, idx) => (mineLocations[idx] ? 'mine' : 'gem'));
    });

    if (outcome === 'loss') {
      playLoss();
      addHistoryItem('Mines', betAmount, 0, 0, 'loss');
      setGameStats(prev => ({ ...prev, losses: prev.losses + 1, profit: prev.profit - betAmount }));
    }
  };

  // Cashout
  const triggerCashout = (gemsCount = revealedIndices.length) => {
    if (!isPlaying || gameOver || gemsCount === 0) return;

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
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors uppercase font-bold tracking-widest"
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
                      Cash Out @ ${(betAmount * currentMultiplier).toFixed(0)} ({currentMultiplier}x)
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
                const cellContent = () => {
                  if (cellState === 'gem') return <Gem className="w-7 h-7 text-emerald-400 filter drop-shadow(0 0 4px rgba(52,211,153,0.3)) animate-pulse-slow" />;
                  if (cellState === 'mine') return <Bomb className="w-7 h-7 text-red-500 filter drop-shadow(0 0 6px rgba(239,68,68,0.5))" />;
                  return null;
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleCardClick(index)}
                    disabled={!isPlaying || gameOver}
                    className={`aspect-square w-full rounded-xl flex items-center justify-center transition-all duration-300 relative cursor-pointer border ${
                      isRevealed
                        ? cellState === 'gem'
                          ? 'bg-emerald-950/20 border-emerald-500/20'
                          : 'bg-red-950/20 border-red-500/25'
                        : isPlaying
                        ? 'bg-luxury-surface border-luxury-border hover:border-gold-500/40 hover:bg-luxury-surface-hover hover:scale-[1.04]'
                        : 'bg-luxury-surface/40 border-luxury-border/30 opacity-70'
                    }`}
                  >
                    {cellContent()}
                  </button>
                );
              })}
            </div>

            {/* Banner outcome display */}
            {gameOver && gameOutcome && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
                <span className="text-[10px] tracking-widest font-extrabold text-gold-500 uppercase leading-none">Game Over</span>
                <h3 className={`text-2xl font-black mt-2 tracking-wide uppercase ${gameOutcome === 'win' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {gameOutcome === 'win' ? 'SUCCESSFUL CASHOUT' : 'HIT A MINE!'}
                </h3>
                
                <div className="bg-black/60 border border-luxury-border px-5 py-3 rounded-xl flex gap-6 mt-4 text-left">
                  <div>
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">Multiplier</span>
                    <span className="text-base font-extrabold text-white block mt-1">
                      {gameOutcome === 'win' ? `${currentMultiplier.toFixed(2)}x` : '0.00x'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">Payout</span>
                    <span className="text-base font-extrabold text-white block mt-1">
                      {gameOutcome === 'win' ? `$${(betAmount * currentMultiplier).toFixed(0)}` : '$0'}
                    </span>
                  </div>
                </div>

                <Button variant="gold" size="sm" className="mt-6" onClick={handleStartGame}>
                  Play Again
                </Button>
              </div>
            )}
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
