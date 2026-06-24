'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Hash, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Payout paytable: record of selected numbers -> record of matches -> multiplier
const PAYTABLE: Record<number, Record<number, number>> = {
  1: { 1: 3.0 },
  2: { 1: 1.0, 2: 9.0 },
  3: { 1: 1.0, 2: 2.0, 3: 24.0 },
  4: { 2: 2.0, 3: 8.0, 4: 45.0 },
  5: { 2: 1.0, 3: 3.0, 4: 15.0, 5: 140.0 },
  6: { 3: 3.0, 4: 10.0, 5: 60.0, 6: 350.0 },
  7: { 3: 2.0, 4: 7.0, 5: 30.0, 6: 200.0, 7: 700.0 },
  8: { 4: 6.0, 5: 20.0, 6: 80.0, 7: 400.0, 8: 1000.0 },
  9: { 4: 5.0, 5: 15.0, 6: 60.0, 7: 250.0, 8: 800.0, 9: 1500.0 },
  10: { 5: 10.0, 6: 40.0, 7: 150.0, 8: 500.0, 9: 1200.0, 10: 2000.0 }
};

export default function KenoGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // States
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameResult, setGameResult] = useState<{ matches: number; multiplier: number; payout: number } | null>(null);

  // History & Stats
  const [recentPlays, setRecentPlays] = useState<{ matches: number; payout: number; win: boolean }[]>([
    { matches: 3, payout: 30, win: true },
    { matches: 0, payout: 0, win: false },
  ]);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Toggle selection
  const handleNumberClick = (num: number) => {
    if (isDrawing) return;
    
    playClick();
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else {
        if (prev.length >= 10) return prev; // Limit to 10 picks
        return [...prev, num];
      }
    });
    setGameResult(null);
    setDrawnNumbers([]);
  };

  // Quick pick 10 numbers
  const handleQuickPick = () => {
    if (isDrawing) return;
    playClick();
    const numbers: number[] = [];
    while (numbers.length < 10) {
      const rand = Math.floor(Math.random() * 40) + 1;
      if (!numbers.includes(rand)) {
        numbers.push(rand);
      }
    }
    setSelectedNumbers(numbers);
    setGameResult(null);
    setDrawnNumbers([]);
  };

  // Clear picks
  const handleClear = () => {
    if (isDrawing) return;
    playClick();
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setGameResult(null);
  };

  // Start Drawing
  const handleDraw = () => {
    if (betAmount <= 0 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }
    if (selectedNumbers.length === 0) {
      alert('Please select at least 1 number to play.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsDrawing(true);
    setDrawnNumbers([]);
    setGameResult(null);

    // Generate 10 winning numbers
    const winners: number[] = [];
    while (winners.length < 10) {
      const rand = Math.floor(Math.random() * 40) + 1;
      if (!winners.includes(rand)) {
        winners.push(rand);
      }
    }

    // Sequence Draw Animation
    let currentIndex = 0;
    const interval = setInterval(() => {
      const nextNum = winners[currentIndex];
      setDrawnNumbers(prev => [...prev, nextNum]);
      
      // Play high note if it's a hit, normal note otherwise
      if (selectedNumbers.includes(nextNum)) {
        playPlop(); // In the future we can make this more high-pitched
      } else {
        playPlop();
      }

      currentIndex++;
      if (currentIndex >= 10) {
        clearInterval(interval);
        
        // Calculate matches
        const matches = winners.filter(num => selectedNumbers.includes(num)).length;
        const matchesTable = PAYTABLE[selectedNumbers.length] || {};
        const multiplier = matchesTable[matches] || 0;
        const payout = Math.round(betAmount * multiplier);
        const won = multiplier > 0;

        setGameResult({ matches, multiplier, payout });
        setIsDrawing(false);

        if (won) {
          playWin();
          triggerWinConfetti();
          addCredits(payout);
          addHistoryItem('Keno', betAmount, multiplier, payout, 'win');
          setGameStats(prev => ({
            ...prev,
            wins: prev.wins + 1,
            profit: prev.profit + (payout - betAmount),
          }));
          setRecentPlays(prev => [{ matches, payout, win: true }, ...prev.slice(0, 5)]);
        } else {
          playLoss();
          addHistoryItem('Keno', betAmount, 0, 0, 'loss');
          setGameStats(prev => ({
            ...prev,
            losses: prev.losses + 1,
            profit: prev.profit - betAmount,
          }));
          setRecentPlays(prev => [{ matches, payout: 0, win: false }, ...prev.slice(0, 5)]);
        }
      }
    }, 200);
  };

  const selectedCount = selectedNumbers.length;
  const paytableForCount = PAYTABLE[selectedCount] || {};

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
        <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Keno Lottery
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Game Controls & Paytable */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <Hash className="w-4 h-4 text-violet-500" />
                KENO CONTROLS
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
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    disabled={isDrawing}
                    className="w-full bg-black border border-luxury-border focus:border-violet-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(1, Math.round(prev / 2)))}
                      disabled={isDrawing}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, prev * 2))}
                      disabled={isDrawing}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={isDrawing}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-violet-500 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Quick Actions */}
              <div className="flex gap-2 w-full">
                <Button variant="dark" fullWidth onClick={handleQuickPick} disabled={isDrawing}>
                  <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
                  Quick Pick 10
                </Button>
                <Button variant="dark" fullWidth onClick={handleClear} disabled={isDrawing || selectedCount === 0}>
                  <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                  Clear
                </Button>
              </div>

              {/* Action Trigger Button */}
              <Button 
                variant="gold" 
                fullWidth 
                size="lg" 
                onClick={handleDraw} 
                disabled={isDrawing || selectedCount === 0 || betAmount <= 0}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none text-white shadow-lg shadow-violet-950/20"
              >
                {isDrawing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Drawing Numbers...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-white" />
                    Play Round
                  </>
                )}
              </Button>

            </CardContent>
          </Card>

          {/* Paytable Summary Card */}
          <Card className="bg-[#0b0b0b]/80 border-luxury-border">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <span className="text-xs font-bold text-neutral-400">PAYTABLE ({selectedCount} PICKED)</span>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-1.5 text-xs text-neutral-400">
              {selectedCount === 0 ? (
                <div className="text-center py-4 text-neutral-500 font-medium">
                  Select numbers on the grid to see the payout table.
                </div>
              ) : (
                Object.keys(PAYTABLE[selectedCount] || {}).map(matchStr => {
                  const matches = parseInt(matchStr);
                  const mult = paytableForCount[matches];
                  return (
                    <div key={matches} className="flex justify-between items-center py-1 border-b border-luxury-border/30 last:border-b-0">
                      <span className="font-semibold text-neutral-300">{matches} Hits</span>
                      <span className="font-black text-violet-400">{mult}x</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Visual Keno Grid & History */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* History */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentPlays.map((val, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  val.win
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {val.matches} Hits ({val.payout > 0 ? `+$${val.payout}` : 'Loss'})
              </span>
            ))}
          </div>

          {/* Grid Display Board */}
          <Card className="bg-[#050505] border-luxury-border p-6 md:p-8 relative select-none">
            
            {/* Draw stats overlay */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Selections</span>
                <span className="text-white font-extrabold text-sm">{selectedCount} / 10</span>
              </div>
              
              {gameResult && (
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Result</span>
                  <div className="font-extrabold text-sm text-violet-400">
                    {gameResult.matches} Matches • {gameResult.multiplier}x Payout
                  </div>
                </div>
              )}
            </div>

            {/* Numbers Grid (40 Numbers: 8 columns x 5 rows) */}
            <div className="grid grid-cols-8 gap-2 md:gap-3">
              {Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
                const isSelected = selectedNumbers.includes(num);
                const isDrawn = drawnNumbers.includes(num);
                const isHit = isSelected && isDrawn;

                let buttonClass = 'bg-[#0f0f13] border-luxury-border/60 hover:bg-[#1a1a24] text-neutral-400';
                if (isHit) {
                  buttonClass = 'bg-violet-600 border-violet-400 text-white font-black drop-shadow-[0_0_12px_rgba(139,92,246,0.5)] animate-pulse';
                } else if (isDrawn) {
                  buttonClass = 'bg-red-500/20 border-red-500/40 text-red-400 font-bold';
                } else if (isSelected) {
                  buttonClass = 'bg-neutral-900 border-violet-500/60 text-violet-400 font-black';
                }

                return (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    disabled={isDrawing}
                    className={`aspect-square rounded-xl border flex items-center justify-center text-xs md:text-sm font-extrabold transition-all duration-200 ${buttonClass}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Large center banner when result rolls */}
            {gameResult && (
              <div className="absolute inset-0 bg-[#020202]/90 flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-10 transition-all rounded-2xl">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Draw complete</span>
                <span className={`text-4xl font-black ${gameResult.payout > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {gameResult.payout > 0 ? `YOU WON $${gameResult.payout.toLocaleString()}` : 'ROUND LOST'}
                </span>
                <span className="text-xs text-neutral-400 font-semibold">
                  {gameResult.matches} matches on {selectedCount} picks
                </span>
                <Button size="sm" variant="dark" className="mt-2" onClick={() => setGameResult(null)}>
                  Keep Selections
                </Button>
              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Keno Rules</strong>: Select between 1 and 10 numbers on the 40-number board. 
                  Place a bet and launch. 10 winning numbers will be drawn randomly. 
                  You win if you match enough drawn numbers. 
                  The payout rate increases with both the number of hits and the number of picks.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
