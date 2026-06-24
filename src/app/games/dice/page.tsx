'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Award, Dices, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DiceGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [prediction, setPrediction] = useState<'under' | 'over'>('under');
  const [rollTarget, setRollTarget] = useState<number>(50);

  // States
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState<boolean | null>(null);
  const [rollingTicker, setRollingTicker] = useState<number>(50);

  // Stats
  const [recentRolls, setRecentRolls] = useState<{ result: number; win: boolean }[]>([
    { result: 42.12, win: true },
    { result: 85.40, win: false },
    { result: 12.05, win: true },
  ]);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Calculate Win Chance and Multiplier
  const winChance = prediction === 'under' ? rollTarget : 100 - rollTarget;
  const multiplier = parseFloat((0.99 / (winChance / 100)).toFixed(4));
  const potentialPayout = Math.round(betAmount * multiplier);

  // Roll action
  const handleRoll = () => {
    if (betAmount <= 0 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsRolling(true);
    setRollResult(null);
    setHasWon(null);

    // Ticker animation
    let tickCount = 0;
    const tickerInterval = setInterval(() => {
      setRollingTicker(parseFloat((Math.random() * 100).toFixed(2)));
      tickCount++;
      
      if (tickCount % 2 === 0) playPlop();

      if (tickCount >= 12) {
        clearInterval(tickerInterval);
        
        // Final Roll
        const result = parseFloat((Math.random() * 99.99).toFixed(2));
        setRollResult(result);

        const won = prediction === 'under' ? result < rollTarget : result > rollTarget;
        setHasWon(won);
        setIsRolling(false);

        if (won) {
          playWin();
          triggerWinConfetti();
          addCredits(potentialPayout);
          addHistoryItem('Dice', betAmount, multiplier, potentialPayout, 'win');
          setGameStats(prev => ({
            ...prev,
            wins: prev.wins + 1,
            profit: prev.profit + (potentialPayout - betAmount),
          }));
          setRecentRolls(prev => [{ result, win: true }, ...prev.slice(0, 5)]);
        } else {
          playLoss();
          addHistoryItem('Dice', betAmount, 0, 0, 'loss');
          setGameStats(prev => ({
            ...prev,
            losses: prev.losses + 1,
            profit: prev.profit - betAmount,
          }));
          setRecentRolls(prev => [{ result, win: false }, ...prev.slice(0, 5)]);
        }
      }
    }, 80);
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
          Slider Dice Roll
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Dices className="w-4 h-4 text-gold-500" />
                DICE CONTROLS
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
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(1, Math.round(prev / 2)))}
                      disabled={isRolling}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, prev * 2))}
                      disabled={isRolling}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Prediction Mode */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Prediction</span>
                <div className="grid grid-cols-2 gap-2 bg-black border border-luxury-border p-1 rounded-xl">
                  <button
                    onClick={() => { playClick(); setPrediction('under'); }}
                    disabled={isRolling}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      prediction === 'under'
                        ? 'gold-gradient-bg text-black shadow-md'
                        : 'text-neutral-400 hover:text-white bg-transparent'
                    }`}
                  >
                    Roll Under
                  </button>
                  <button
                    onClick={() => { playClick(); setPrediction('over'); }}
                    disabled={isRolling}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      prediction === 'over'
                        ? 'gold-gradient-bg text-black shadow-md'
                        : 'text-neutral-400 hover:text-white bg-transparent'
                    }`}
                  >
                    Roll Over
                  </button>
                </div>
              </div>

              {/* Roll Target slider input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-neutral-400">
                  <span>Roll Target</span>
                  <span className="text-white font-extrabold">{rollTarget}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="97"
                  value={rollTarget}
                  onChange={(e) => setRollTarget(parseInt(e.target.value))}
                  disabled={isRolling}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gold-500 disabled:opacity-50"
                />
              </div>

              {/* Roll Action Button */}
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleRoll}
                disabled={isRolling || betAmount <= 0}
              >
                {isRolling ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Rolling Dice...
                  </span>
                ) : (
                  <span>Roll Dice</span>
                )}
              </Button>

            </CardContent>
          </Card>

          {/* Dice Math Summary Card */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Odds Breakdown</span>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Win Probability</span>
                <span className="text-neutral-300 font-bold">{winChance.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Payout Multiplier</span>
                <span className="text-gold-500 font-bold">{multiplier.toFixed(4)}x</span>
              </div>
              <div className="flex justify-between border-t border-luxury-border/60 pt-2.5">
                <span className="text-neutral-500 font-medium">Profit on Win</span>
                <span className="text-emerald-500 font-bold">+${potentialPayout - betAmount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Grid */}
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

        {/* Right Panel: Game visual arena */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* History Tracker */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentRolls.map((roll, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  roll.win
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {roll.result.toFixed(2)}
              </span>
            ))}
          </div>

          {/* Slider visual board */}
          <Card className="bg-[#050505] border-luxury-border p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden select-none">
            
            {/* Display large roll result ticker */}
            <div className="flex flex-col items-center gap-2 mb-8 text-center">
              <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest leading-none">ROLL RESULT</span>
              <h3 className={`text-6xl font-black tracking-tight ${
                isRolling 
                  ? 'text-neutral-500 animate-pulse' 
                  : hasWon === null
                  ? 'text-neutral-600'
                  : hasWon
                  ? 'text-emerald-500 glow-gold-large'
                  : 'text-red-500'
              }`}>
                {isRolling 
                  ? rollingTicker.toFixed(2)
                  : rollResult !== null 
                  ? rollResult.toFixed(2) 
                  : '00.00'}
              </h3>
              {hasWon !== null && !isRolling && (
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                  hasWon ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'
                }`}>
                  {hasWon ? 'WINNER!' : 'LOST'}
                </span>
              )}
            </div>

            {/* Custom Interactive Slider Visual */}
            <div className="w-full flex flex-col gap-6 px-4">
              
              {/* Range track representation */}
              <div className="w-full h-4 bg-neutral-900 border border-luxury-border rounded-full relative overflow-hidden">
                {/* Win and Loss region color blocks */}
                {prediction === 'under' ? (
                  <>
                    <div 
                      className="absolute left-0 top-0 bottom-0 gold-gradient-bg opacity-30 border-r border-gold-500/40"
                      style={{ width: `${rollTarget}%` }}
                    ></div>
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                      style={{ width: `${100 - rollTarget}%` }}
                    ></div>
                  </>
                ) : (
                  <>
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-red-500/10 border-r border-red-500/20"
                      style={{ width: `${rollTarget}%` }}
                    ></div>
                    <div 
                      className="absolute right-0 top-0 bottom-0 gold-gradient-bg opacity-30"
                      style={{ width: `${100 - rollTarget}%` }}
                    ></div>
                  </>
                )}

                {/* Rolled Marker pointer */}
                {(rollResult !== null || isRolling) && (
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl transition-all duration-300"
                    style={{ left: `${isRolling ? rollingTicker : rollResult}%` }}
                  >
                    <div className="absolute top-[-8px] left-[-6px] w-3 h-3 rounded-full bg-white border border-black shadow"></div>
                  </div>
                )}
              </div>

              {/* Slider scale indices */}
              <div className="flex justify-between text-[10px] text-neutral-500 font-extrabold tracking-wider px-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Dice Rules</strong>: Enter your bet, choose prediction target boundaries (Roll Under/Over), and adjust the slider to set your threshold. 
                  A random roll from 0.00 to 99.99 is generated. 
                  If the roll lands inside your predicted win range, you receive a multiplier payout corresponding to your risk. 
                  Lower win chances grant larger potential multiplier payouts!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
