'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Award, Coins, Crown, CloudRain } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

export default function CoinFlipGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selection, setSelection] = useState<'heads' | 'tails'>('heads');

  // States
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [coinRotation, setCoinRotation] = useState<number>(0);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [hasWon, setHasWon] = useState<boolean | null>(null);

  // Stats
  const [recentFlips, setRecentFlips] = useState<{ side: 'heads' | 'tails'; win: boolean }[]>([
    { side: 'heads', win: true },
    { side: 'tails', win: false },
    { side: 'heads', win: true },
  ]);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  const payoutMultiplier = 1.96;
  const potentialPayout = Math.round(betAmount * payoutMultiplier * 100) / 100;

  // Trigger Coin Flip
  const handleFlip = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsFlipping(true);
    setHasWon(null);

    // Pick outcome side
    const outcome: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    
    // Rotate coin (e.g. at least 6 complete rotations + target side rotation)
    // Heads ends at 0 mod 360, Tails ends at 180 mod 360
    setCoinRotation(prev => {
      const additionalSpins = 6;
      const currentMod360 = prev % 360;
      const targetMod = outcome === 'heads' ? 0 : 180;
      let diff = (targetMod - currentMod360 + 360) % 360;
      if (diff === 0) diff = 360; // ensure it rotates if already on target side
      return prev + (additionalSpins * 360) + diff;
    });

    // Play flip tickers sound effects
    let coinTick = 0;
    const tickInterval = setInterval(() => {
      playPlop();
      coinTick++;
      if (coinTick >= 8) clearInterval(tickInterval);
    }, 150);

    setTimeout(() => {
      setCoinSide(outcome);
      const won = selection === outcome;
      setHasWon(won);
      setIsFlipping(false);

      if (won) {
        playWin();
        triggerWinConfetti();
        addCredits(potentialPayout);
        addHistoryItem('Coin Flip', betAmount, payoutMultiplier, potentialPayout, 'win');
        setGameStats(prev => ({
          ...prev,
          wins: prev.wins + 1,
          profit: prev.profit + (potentialPayout - betAmount),
        }));
        setRecentFlips(prev => [{ side: outcome, win: true }, ...prev.slice(0, 5)]);
      } else {
        playLoss();
        addHistoryItem('Coin Flip', betAmount, 0, 0, 'loss');
        setGameStats(prev => ({
          ...prev,
          losses: prev.losses + 1,
          profit: prev.profit - betAmount,
        }));
        setRecentFlips(prev => [{ side: outcome, win: false }, ...prev.slice(0, 5)]);
      }
    }, 1200); // 1.2s spin animation
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
          Binary Coin Toss
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Coins className="w-4 h-4 text-gold-500" />
                COIN FLIP CONTROLS
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
                    disabled={isFlipping}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={isFlipping}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={isFlipping}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Side Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest text-[9px]">{language === 'vi' ? 'Chọn Mặt Xu' : 'Select Coin Face Side'}</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { playClick(); setSelection('heads'); }}
                    disabled={isFlipping}
                    className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      selection === 'heads'
                        ? 'bg-yellow-500/10 border-yellow-500/60 shadow-[0_0_20px_rgba(250,204,21,0.15)] scale-[1.02]'
                        : 'bg-black/50 border-luxury-border text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <Crown className={`w-8 h-8 mb-2 transition-transform duration-300 ${selection === 'heads' ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-neutral-600'}`} />
                    <span className={`text-[10px] font-black tracking-widest uppercase ${selection === 'heads' ? 'text-yellow-400' : 'text-neutral-400'}`}>
                      {language === 'vi' ? 'Vương Miện' : 'HEADS'}
                    </span>
                  </button>

                  <button
                    onClick={() => { playClick(); setSelection('tails'); }}
                    disabled={isFlipping}
                    className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      selection === 'tails'
                        ? 'bg-yellow-500/10 border-yellow-500/60 shadow-[0_0_20px_rgba(250,204,21,0.15)] scale-[1.02]'
                        : 'bg-black/50 border-luxury-border text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <CloudRain className={`w-8 h-8 mb-2 transition-transform duration-300 ${selection === 'tails' ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-neutral-600'}`} />
                    <span className={`text-[10px] font-black tracking-widest uppercase ${selection === 'tails' ? 'text-yellow-400' : 'text-neutral-400'}`}>
                      {language === 'vi' ? 'Cơn Mưa' : 'TAILS'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleFlip}
                disabled={isFlipping || betAmount <= 0}
              >
                {isFlipping ? 'Flipping...' : 'Flip Coin'}
              </Button>

            </CardContent>
          </Card>

          {/* Odds card */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Odds Breakdown</span>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Win Probability</span>
                <span className="text-neutral-300 font-bold">50.00%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Payout Multiplier</span>
                <span className="text-gold-500 font-bold">{payoutMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between border-t border-luxury-border/60 pt-2.5">
                <span className="text-neutral-500 font-medium">Profit on Win</span>
                <span className="text-emerald-500 font-bold">+${potentialPayout - betAmount}</span>
              </div>
            </CardContent>
          </Card>

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

        {/* Right Panel: Game visual arena */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Recent history */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentFlips.map((f, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  f.win
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {f.side === 'heads' ? 'H' : 'T'}
              </span>
            ))}
          </div>

          {/* 3D Coin Arena */}
          <Card className="bg-[#050505] border-luxury-border p-12 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden select-none">
            
            {/* Coin 3D scene */}
            <div className={`w-48 h-48 relative [perspective:800px] flex items-center justify-center mb-6 ${isFlipping ? 'animate-coin-fling' : ''}`}>
              <div 
                className="w-40 h-40 rounded-full relative [transform-style:preserve-3d] transition-transform duration-[1200ms] cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                style={{ transform: `rotateY(${coinRotation}deg)` }}
              >
                 {/* HEADS SIDE (Front Face) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fef08a] via-[#facc15] to-[#a16207] border-[6px] border-[#b45309] flex items-center justify-center [backface-visibility:hidden] shadow-[inset_0_4px_10px_rgba(255,255,255,0.4),0_8px_30px_rgba(0,0,0,0.7)]">
                  <div className="w-[90%] h-[90%] rounded-full border border-dashed border-[#fef08a]/50 flex flex-col items-center justify-center p-3 select-none">
                    <Crown className="w-16 h-16 text-[#fef08a] drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)] stroke-[1.8]" />
                    <span className="text-[7px] text-[#fef08a] font-black tracking-widest uppercase mt-1 opacity-75">RainMoney</span>
                  </div>
                </div>

                {/* TAILS SIDE (Back Face) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fef08a] via-[#facc15] to-[#a16207] border-[6px] border-[#b45309] flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-[inset_0_4px_10px_rgba(255,255,255,0.4),0_8px_30px_rgba(0,0,0,0.7)]">
                  <div className="w-[90%] h-[90%] rounded-full border border-dashed border-[#fef08a]/50 flex flex-col items-center justify-center p-3 select-none">
                    <CloudRain className="w-16 h-16 text-[#fef08a] drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)] stroke-[1.8]" />
                    <span className="text-[7px] text-[#fef08a] font-black tracking-widest uppercase mt-1 opacity-75">Sandbox</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Outcome Display */}
            {!isFlipping && hasWon !== null && (
              <div className="text-center animate-fade-in">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">LANDED ON</span>
                <h4 className="text-2xl font-black text-white uppercase mt-1">{coinSide}</h4>
              </div>
            )}

            <WinLoseOverlay
              isOpen={!isFlipping && hasWon !== null}
              onClose={() => setHasWon(null)}
              outcome={hasWon ? 'win' : 'loss'}
              multiplier={hasWon ? payoutMultiplier : 0}
              payout={hasWon ? potentialPayout : 0}
              language={language}
            />

            {isFlipping && (
              <div className="text-center animate-pulse">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">FLIPPING COIN...</span>
              </div>
            )}
          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Coin Flip Rules</strong>: Enter your bet, select your predicted side (Heads: Crown, or Tails: Rain), and click <strong>Flip Coin</strong>. 
                  The 3D coin will spin rapidly. Landing on your chosen outcome awards a payout equal to <strong>1.96x</strong> your bet amount. 
                  Landing on the opposite side loses your bet.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
