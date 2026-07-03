'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Zap } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';
import { CustomEmoji } from '@/components/ui/CustomEmoji';

type GameState = 'idle' | 'playing' | 'popped' | 'cashed_out';

export default function PumpGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [pumps, setPumps] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [payout, setPayout] = useState<number>(0);

  // Multiplier curve: starting at 1.0x, incrementing exponentially/incrementally
  const getNextMultiplier = (currentPumps: number): number => {
    if (currentPumps === 0) return 1.0;
    // Multiplier = 1.0 + currentPumps * 0.12 + Math.pow(currentPumps, 1.5) * 0.03
    const val = 1.0 + currentPumps * 0.12 + Math.pow(currentPumps, 1.5) * 0.03;
    return Math.round(val * 100) / 100;
  };

  const getPopProbability = (currentPumps: number): number => {
    // Pop chance starts at 4% on first pump and increases by 1.8% with each pump
    // capped at 85%
    return Math.min(0.85, 0.04 + currentPumps * 0.018);
  };

  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setGameState('playing');
    setPumps(0);
    setMultiplier(1.0);
    setPayout(0);
  };

  const handlePump = () => {
    if (gameState !== 'playing') return;

    playPlop();
    const nextPumps = pumps + 1;
    const nextMult = getNextMultiplier(nextPumps);
    const popChance = getPopProbability(nextPumps);

    // Roll for pop
    if (Math.random() < popChance) {
      // POP!
      playLoss();
      setGameState('popped');
      setMultiplier(0);
      addHistoryItem('Pump', betAmount, 0, 0, 'loss');
    } else {
      // Success pump!
      setPumps(nextPumps);
      setMultiplier(nextMult);
    }
  };

  const handleCashOut = () => {
    if (gameState !== 'playing' || pumps === 0) return;

    playWin();
    triggerWinConfetti();
    const finalPayout = Math.round(betAmount * multiplier * 100) / 100;
    setPayout(finalPayout);
    setGameState('cashed_out');
    addCredits(finalPayout);
    addHistoryItem('Pump', betAmount, multiplier, finalPayout, 'win');
  };

  const handleReset = () => {
    setGameState('idle');
    setPumps(0);
    setMultiplier(1.0);
    setPayout(0);
  };

  // Color options for balloon
  const getBalloonColor = () => {
    if (gameState === 'popped') return 'bg-red-600/20 border-red-500 scale-0 opacity-0';
    if (gameState === 'cashed_out') return 'bg-emerald-500 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]';
    
    // Smooth transitions of color as pumps increase
    if (pumps < 4) return 'bg-sky-500 border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.3)]';
    if (pumps < 8) return 'bg-indigo-500 border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.4)]';
    if (pumps < 12) return 'bg-purple-500 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.5)]';
    return 'bg-pink-500 border-pink-400 shadow-[0_0_50px_rgba(236,72,153,0.6)] animate-pulse';
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
        <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Pump & Cash Out
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Bet Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0f19]/60 border-luxury-border/60 shadow-lg">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-sky-400 animate-bounce" />
                PUMP CONTROLS
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
                  <span className="absolute left-4.5 top-3.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    disabled={gameState === 'playing'}
                    className="w-full bg-black border border-luxury-border focus:border-sky-500/50 rounded-full pl-9 pr-24 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={gameState === 'playing'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border/60 hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-full disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={gameState === 'playing'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border/60 hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-full disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={gameState === 'playing'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border/60 hover:border-neutral-700 text-[10px] text-sky-400 font-extrabold rounded-full disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {gameState === 'idle' && (
                <Button variant="gold" fullWidth size="lg" onClick={handleStartGame} className="bg-sky-500 hover:bg-sky-400 text-black border-none font-bold shadow-[0_0_20px_rgba(14,165,233,0.25)] rounded-full">
                  Place Bet
                </Button>
              )}

              {gameState === 'playing' && (
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="gold" 
                    fullWidth 
                    size="lg" 
                    onClick={handlePump}
                    className="bg-sky-500 hover:bg-sky-400 text-black border-none font-bold text-lg animate-pulse shadow-[0_0_25px_rgba(14,165,233,0.35)] rounded-full"
                  >
                    PUMP ({multiplier.toFixed(2)}x)
                  </Button>
                  <Button 
                    variant="glass" 
                    fullWidth 
                    size="md" 
                    onClick={handleCashOut}
                    disabled={pumps === 0}
                    className="border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 font-bold rounded-full"
                  >
                    Cash Out ${(betAmount * multiplier).toFixed(2)}
                  </Button>
                </div>
              )}

              {(gameState === 'popped' || gameState === 'cashed_out') && (
                <Button variant="dark" fullWidth size="lg" onClick={handleReset} className="font-bold rounded-full border border-luxury-border hover:border-luxury-border-active shadow-md">
                  Play Again
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Balloon Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          <Card className="bg-gradient-to-br from-black via-[#040816] to-[#02050f] border-blue-500/15 min-h-[420px] flex flex-col items-center justify-center p-8 select-none relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.06)] rounded-3xl">
            {/* Fine Grid pattern inside arena */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none -z-0"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_65%)] pointer-events-none -z-0"></div>
            
            {/* Outcome Overlay */}
            <WinLoseOverlay
              isOpen={gameState === 'popped' || gameState === 'cashed_out'}
              onClose={handleReset}
              outcome={gameState === 'cashed_out' ? 'win' : 'loss'}
              multiplier={gameState === 'cashed_out' ? multiplier : 0}
              payout={gameState === 'cashed_out' ? payout : 0}
            />

            {/* Balloon display container */}
            <div className="flex-grow flex items-center justify-center relative w-full h-full">
              {gameState === 'idle' && (
                <div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest">
                  Place a bet and pump the balloon!
                </div>
              )}

              {(gameState === 'playing' || gameState === 'cashed_out') && (
                <div className="relative flex flex-col items-center justify-center">
                  
                  {/* Balloon Body */}
                  <div 
                    className={`rounded-full border transition-all duration-300 flex items-center justify-center ${getBalloonColor()}`}
                    style={{
                      // Scale balloon dynamically with pumps (min 100px, base scales up by 12% per pump)
                      width: `${Math.min(260, 100 + pumps * 12)}px`,
                      height: `${Math.min(280, 110 + pumps * 13)}px`,
                      transform: `translateY(${-pumps * 1}px)`,
                    }}
                  >
                    {/* Multiplier text inside balloon */}
                    <div className="text-black font-black text-center select-none drop-shadow flex flex-col items-center justify-center">
                      <span className="text-2xl tracking-tight leading-none">
                        {multiplier.toFixed(2)}x
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider leading-none mt-1 opacity-70">
                        {pumps} pumps
                      </span>
                    </div>
                  </div>

                  {/* Balloon String/Knot */}
                  <div 
                    className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-sky-400/80 mt-[-2px] transition-all"
                    style={{
                      borderBottomColor: pumps >= 12 ? '#f472b6' : pumps >= 8 ? '#c084fc' : pumps >= 4 ? '#818cf8' : '#38bdf8'
                    }}
                  />
                  <div className="w-[2px] h-12 bg-neutral-600/40 rounded-full mt-[-2px]" />
                </div>
              )}
            </div>

            {/* Risk Indicator bar at bottom of arena */}
            {gameState === 'playing' && (
              <div className="w-full max-w-xs flex flex-col gap-1.5 mt-auto z-10">
                <div className="flex justify-between text-[10px] text-neutral-500 font-bold uppercase">
                  <span>Pop Danger</span>
                  <span className="text-red-400 font-extrabold">{(getPopProbability(pumps + 1) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-900 border border-luxury-border/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-300"
                    style={{ width: `${(getPopProbability(pumps + 1) * 100)}%` }}
                  />
                </div>
              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Pump Mini-Game Rules</strong>:
                  Place your initial bet. Click the <strong>PUMP</strong> button to inflate the balloon. 
                  Every pump increases your multiplier payout, but also increases the danger of the balloon bursting. 
                  The pop chance climbs with each pump. 
                  Press <strong>Cash Out</strong> at any moment before it pops to claim your funds!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
