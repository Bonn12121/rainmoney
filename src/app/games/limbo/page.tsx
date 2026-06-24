'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Zap, RefreshCw, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function LimboGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.00);

  // States
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState<boolean | null>(null);
  const [tickerValue, setTickerValue] = useState<number>(1.00);

  // Stats & History
  const [recentRolls, setRecentRolls] = useState<{ result: number; win: boolean }[]>([
    { result: 1.85, win: false },
    { result: 12.40, win: true },
    { result: 1.05, win: false },
  ]);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Payout and Probability Calculations
  const winChance = Math.min(99, Math.max(0.01, 99 / targetMultiplier));
  const potentialPayout = Math.round(betAmount * targetMultiplier);

  // Roll target generator
  const generateLimboResult = (): number => {
    // 1% instant crash to 1.00x, otherwise pareto distribution
    if (Math.random() < 0.01) return 1.00;
    const value = 0.99 / (1.0 - Math.random());
    return Math.max(1.00, parseFloat(Math.min(1000.00, value).toFixed(2)));
  };

  const handleRoll = () => {
    if (betAmount <= 0 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }
    if (targetMultiplier < 1.01 || targetMultiplier > 1000) {
      alert('Target multiplier must be between 1.01 and 1000.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsRolling(true);
    setRollResult(null);
    setHasWon(null);

    const finalResult = generateLimboResult();
    const won = finalResult >= targetMultiplier;

    // Fast-rolling ticker animation
    let current = 1.00;
    const steps = 15;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      // Exponential curve for ticker animation
      current = 1.00 + Math.pow(step / steps, 2) * (finalResult - 1.00);
      setTickerValue(parseFloat(current.toFixed(2)));
      
      if (step % 2 === 0) playPlop();

      if (step >= steps) {
        clearInterval(interval);
        setRollResult(finalResult);
        setTickerValue(finalResult);
        setHasWon(won);
        setIsRolling(false);

        if (won) {
          playWin();
          triggerWinConfetti();
          addCredits(potentialPayout);
          addHistoryItem('Limbo', betAmount, targetMultiplier, potentialPayout, 'win');
          setGameStats(prev => ({
            ...prev,
            wins: prev.wins + 1,
            profit: prev.profit + (potentialPayout - betAmount),
          }));
          setRecentRolls(prev => [{ result: finalResult, win: true }, ...prev.slice(0, 5)]);
        } else {
          playLoss();
          addHistoryItem('Limbo', betAmount, 0, 0, 'loss');
          setGameStats(prev => ({
            ...prev,
            losses: prev.losses + 1,
            profit: prev.profit - betAmount,
          }));
          setRecentRolls(prev => [{ result: finalResult, win: false }, ...prev.slice(0, 5)]);
        }
      }
    }, 60);
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
        <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Limbo Multiplier
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-rose-500" />
                LIMBO CONFIG
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
                    disabled={isRolling}
                    className="w-full bg-black border border-luxury-border focus:border-rose-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(1, Math.round(prev / 2)))}
                      disabled={isRolling}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, prev * 2))}
                      disabled={isRolling}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={isRolling}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-rose-500 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Multiplier */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-neutral-400">
                  <span>Target Multiplier</span>
                  <span>Win Chance: {winChance.toFixed(2)}%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    max="1000"
                    value={targetMultiplier}
                    onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 0))}
                    disabled={isRolling}
                    className="w-full bg-black border border-luxury-border focus:border-rose-500/50 rounded-xl px-4 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-3 text-neutral-400 font-extrabold text-sm">x</span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                variant="gold" 
                fullWidth 
                size="lg" 
                onClick={handleRoll} 
                disabled={isRolling || betAmount <= 0}
                className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 border-none text-white shadow-lg shadow-rose-950/20"
              >
                {isRolling ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Rolling...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-white" />
                    Roll Target
                  </>
                )}
              </Button>

            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Session Statistics</span>
            </CardHeader>
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

        {/* Right Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* History */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentRolls.map((val, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  val.win
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {val.result.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Main LED Display */}
          <Card className="bg-[#050505] border-luxury-border relative overflow-hidden flex flex-col items-center justify-center p-12 min-h-[360px] select-none">
            
            {/* Grid background */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 opacity-[0.02] pointer-events-none">
              {Array(60).fill(0).map((_, i) => (
                <div key={i} className="border border-white" />
              ))}
            </div>

            {/* Neon Glow Circle */}
            <div className={`absolute w-72 h-72 rounded-full blur-[80px] transition-all duration-700 ${
              hasWon === true 
                ? 'bg-emerald-500/10' 
                : hasWon === false 
                ? 'bg-rose-500/10' 
                : 'bg-rose-500/5'
            }`} />

            <div className="relative z-10 flex flex-col items-center gap-6">
              
              {/* Ticker Text */}
              <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tight transition-colors duration-300 ${
                hasWon === true 
                  ? 'text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : hasWon === false 
                  ? 'text-rose-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                  : 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.15)]'
              }`}>
                {tickerValue.toFixed(2)}x
              </span>

              {/* Status sub-bar */}
              <div className="flex flex-col items-center text-center gap-1.5 mt-2">
                {hasWon === true && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-md uppercase tracking-wider font-extrabold animate-bounce">
                    Target Met! (+${potentialPayout - betAmount} profit)
                  </span>
                )}
                {hasWon === false && (
                  <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-500/20 px-3 py-1 rounded-md uppercase tracking-wider font-extrabold">
                    Target Missed (Result is lower)
                  </span>
                )}
                {hasWon === null && (
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">
                    Set target and roll to begin
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Limbo Rules</strong>: Pick a target multiplier and bet amount. The game rolls a multiplier.
                  If the rolled multiplier matches or exceeds your target multiplier, you win.
                  Your payout is based directly on your chosen target multiplier: <code>Bet Amount × Target Multiplier</code>.
                  If the rolled multiplier is lower, your bet is lost. Higher target multipliers have lower win probabilities.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
