'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Award, Layers, Crown, Gem, Bomb } from 'lucide-react';
import Link from 'next/link';

type Difficulty = 'easy' | 'medium' | 'hard';

// Payout matrices for Tiers 1-8
const PAYOUTS: Record<Difficulty, number[]> = {
  easy: [1.45, 2.15, 3.20, 4.75, 7.00, 10.40, 15.40, 22.80],
  medium: [1.96, 3.88, 7.68, 15.20, 30.10, 59.60, 118.00, 233.00],
  hard: [2.94, 8.73, 25.90, 77.00, 228.00, 678.00, 2015.00, 5985.00],
};

interface RowState {
  tiles: ('hidden' | 'gem' | 'mine')[];
  mineIndices: number[];
  selectedIndex: number | null;
}

export default function TowersGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, unlockAchievement } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Game States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<number>(0); // 0-7, bottom up
  const [tower, setTower] = useState<RowState[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameOutcome, setGameOutcome] = useState<'win' | 'loss' | null>(null);

  // Stats
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  const multipliers = PAYOUTS[difficulty];
  const activeMultiplier = currentTier > 0 ? multipliers[currentTier - 1] : 1.00;
  const nextMultiplier = multipliers[currentTier];

  // Tile count based on difficulty
  const getTileCount = () => {
    if (difficulty === 'easy') return 3;
    if (difficulty === 'medium') return 2;
    return 3;
  };

  // Start Towers Game
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
    setCurrentTier(0);

    const tileCount = getTileCount();
    const minesCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1 : 2;

    // Build the 8-tier tower board structure
    const initialTower: RowState[] = Array.from({ length: 8 }, () => {
      // Pick random mine index
      const mineIndices: number[] = [];
      while (mineIndices.length < minesCount) {
        const idx = Math.floor(Math.random() * tileCount);
        if (!mineIndices.includes(idx)) {
          mineIndices.push(idx);
        }
      }

      return {
        tiles: Array(tileCount).fill('hidden'),
        mineIndices,
        selectedIndex: null,
      };
    });

    setTower(initialTower);
  };

  // Click card on active row
  const handleTileClick = (rowIndex: number, tileIndex: number) => {
    if (!isPlaying || gameOver || rowIndex !== currentTier) return;

    const row = tower[rowIndex];
    const isMine = row.mineIndices.includes(tileIndex);

    // Update row state
    setTower(prev => {
      const copy = [...prev];
      copy[rowIndex].selectedIndex = tileIndex;
      copy[rowIndex].tiles = copy[rowIndex].tiles.map((_, idx) => {
        if (copy[rowIndex].mineIndices.includes(idx)) return 'mine';
        return 'gem';
      });
      return copy;
    });

    if (isMine) {
      // Hit a mine (Loss)
      setGameOver(true);
      setGameOutcome('loss');
      setIsPlaying(false);
      playLoss();
      addHistoryItem('Towers', betAmount, 0, 0, 'loss');
      setGameStats(prev => ({ ...prev, losses: prev.losses + 1, profit: prev.profit - betAmount }));
    } else {
      // Hit a gem (Advance)
      playPlop();
      
      if (currentTier === 7) {
        // Reached apex (Win game)
        triggerCashout(8);
      } else {
        // Go up one tier
        setCurrentTier(prev => prev + 1);
      }
    }
  };

  // Cashout
  const triggerCashout = (completedTiers = currentTier) => {
    if (!isPlaying || gameOver || completedTiers === 0) return;

    const mult = multipliers[completedTiers - 1];
    const payout = Math.round(betAmount * mult * 100) / 100;

    addCredits(payout);
    playWin();
    triggerWinConfetti();
    addHistoryItem('Towers', betAmount, mult, payout, 'win');

    if (completedTiers >= 6) {
      unlockAchievement('tower-climber');
    }

    setGameStats(prev => ({
      ...prev,
      wins: prev.wins + 1,
      profit: prev.profit + (payout - betAmount),
    }));

    setGameOver(true);
    setGameOutcome('win');
    setIsPlaying(false);
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
          Vertical Climb Tower
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold-500" />
                TOWER SETTINGS
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

              {/* Difficulty selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Difficulty Risk</span>
                <div className="grid grid-cols-3 gap-2 bg-black border border-luxury-border p-1 rounded-xl">
                  {['easy', 'medium', 'hard'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => { playClick(); setDifficulty(lvl as Difficulty); }}
                      disabled={isPlaying}
                      className={`py-2 text-[10px] uppercase font-extrabold rounded-lg transition-all cursor-pointer ${
                        difficulty === lvl
                          ? 'gold-gradient-bg text-black shadow-md'
                          : 'text-neutral-400 hover:text-white bg-transparent'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Play Actions */}
              {!isPlaying ? (
                <Button variant="gold" fullWidth size="lg" onClick={handleStartGame}>
                  Start Climb
                </Button>
              ) : (
                <Button
                  variant={currentTier === 0 ? 'dark' : 'gold'}
                  fullWidth
                  size="lg"
                  onClick={() => triggerCashout()}
                  disabled={currentTier === 0}
                >
                  {currentTier === 0 ? (
                    <span>Make Tier 1 Pick</span>
                  ) : (
                    <span>
                      Cash Out @ ${(betAmount * activeMultiplier).toFixed(0)} ({activeMultiplier.toFixed(2)}x)
                    </span>
                  )}
                </Button>
              )}

            </CardContent>
          </Card>

          {/* Towers active multipliers */}
          {isPlaying && (
            <Card className="bg-[#0b0b0b]/60">
              <CardHeader className="p-4 border-b border-luxury-border/60">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Climb Rates</span>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Completed Tiers</span>
                  <span className="text-neutral-300 font-bold">{currentTier} / 8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Current Payout</span>
                  <span className="text-gold-500 font-bold">{activeMultiplier.toFixed(2)}x</span>
                </div>
                {currentTier < 8 && (
                  <div className="flex justify-between border-t border-luxury-border/60 pt-2.5">
                    <span className="text-neutral-500 font-medium">Next Tier Multiplier</span>
                    <span className="text-neutral-300 font-bold">{nextMultiplier.toFixed(2)}x</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session Statistics */}
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

        {/* Right Panel: Game Board */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          
          <Card className="bg-[#050505] border-luxury-border p-6 w-full max-w-[420px] flex flex-col gap-2 relative overflow-hidden select-none">
            
            {/* Grid rows starting from top (Index 7) down to bottom (Index 0) */}
            {isPlaying ? (
              tower.map((row, rIdx) => {
                const rowRealIdx = 7 - rIdx; // display bottom up
                const actualRow = tower[rowRealIdx];
                const isActiveRow = rowRealIdx === currentTier;
                const isLocked = rowRealIdx > currentTier;
                const isCompleted = rowRealIdx < currentTier;

                return (
                  <div 
                    key={rowRealIdx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      isActiveRow
                        ? 'border-gold-500/30 bg-gold-500/[0.02] shadow-inner'
                        : isLocked
                        ? 'border-luxury-border opacity-40 grayscale pointer-events-none'
                        : 'border-luxury-border bg-black/20 opacity-80'
                    }`}
                  >
                    {/* Row level number */}
                    <span className={`text-[10px] font-extrabold w-8 text-center ${
                      isActiveRow ? 'text-gold-500' : 'text-neutral-500'
                    }`}>
                      T{rowRealIdx + 1}
                    </span>

                    {/* Columns grid */}
                    <div className="flex-grow grid grid-flow-col gap-2.5 px-4">
                      {actualRow.tiles.map((tileState, tIdx) => {
                        const isClicked = actualRow.selectedIndex === tIdx;
                        const cellContent = () => {
                          if (tileState === 'gem' && (isClicked || gameOver)) {
                            return <Gem className="w-4 h-4 text-emerald-400 filter drop-shadow(0 0 2px rgba(52,211,153,0.3))" />;
                          }
                          if (tileState === 'mine' && (isClicked || gameOver)) {
                            return <Bomb className="w-4 h-4 text-red-500 filter drop-shadow(0 0 4px rgba(239,68,68,0.4))" />;
                          }
                          return null;
                        };

                        return (
                          <button
                            key={tIdx}
                            onClick={() => handleTileClick(rowRealIdx, tIdx)}
                            disabled={!isActiveRow || gameOver}
                            className={`py-3.5 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${
                              isClicked
                                ? tileState === 'gem'
                                  ? 'bg-emerald-950/20 border-emerald-500/20'
                                  : 'bg-red-950/20 border-red-500/25'
                                : isCompleted
                                ? 'bg-neutral-900/40 border-neutral-800'
                                : isActiveRow
                                ? 'bg-luxury-surface border-luxury-border hover:border-gold-500/40 hover:bg-luxury-surface-hover'
                                : 'bg-luxury-surface/30 border-luxury-border/10'
                            }`}
                          >
                            {cellContent() || <span className="w-4 h-4 block"></span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Multiplier pill for this row */}
                    <span className={`text-[10px] font-extrabold w-14 text-right ${
                      isCompleted ? 'text-neutral-400' : isActiveRow ? 'text-gold-500' : 'text-neutral-600'
                    }`}>
                      {multipliers[rowRealIdx].toFixed(2)}x
                    </span>
                  </div>
                );
              })
            ) : (
              // Empty/Pre-game states
              <div className="py-32 text-center flex flex-col items-center gap-3">
                <Layers className="w-12 h-12 text-luxury-border animate-float" />
                <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">TOWER LOBBY LOCKED</span>
                <p className="text-[10px] text-neutral-600 max-w-xs leading-relaxed font-medium">
                  Configure difficulty and place your bet to begin climbing the tower rows.
                </p>
                <Button variant="gold" size="sm" className="mt-2" onClick={handleStartGame}>
                  Initialize Board
                </Button>
              </div>
            )}

            {/* Overlays */}
            {gameOver && gameOutcome && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
                <span className="text-[10px] tracking-widest font-extrabold text-gold-500 uppercase leading-none">Tower Cleared</span>
                <h3 className={`text-2xl font-black mt-2 tracking-wide uppercase ${gameOutcome === 'win' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {gameOutcome === 'win' ? 'SUCCESSFUL CLIMB' : 'HIT A MINE!'}
                </h3>
                
                <div className="bg-black/60 border border-luxury-border px-5 py-3 rounded-xl flex gap-6 mt-4 text-left">
                  <div>
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">Multiplier</span>
                    <span className="text-base font-extrabold text-white block mt-1">
                      {gameOutcome === 'win' ? `${activeMultiplier.toFixed(2)}x` : '0.00x'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">Payout</span>
                    <span className="text-base font-extrabold text-white block mt-1">
                      {gameOutcome === 'win' ? `$${(betAmount * activeMultiplier).toFixed(0)}` : '$0'}
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
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60 w-full max-w-[420px] mt-6">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Towers Rules</strong>: Place your bet, configure difficulty, and start climbing. 
                  Select one square in the active gold-rimmed row (T1 at the bottom up to T8 at the apex). 
                  Revealing a gem unlocks the row above and multiplies your active multiplier. 
                  Click <strong>Cash Out</strong> to exit. Revealing a mine destroys your progress.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
