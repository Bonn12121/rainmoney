'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Sparkles, HelpCircle, Spade, Apple, Disc, Layers } from 'lucide-react';
import Link from 'next/link';

type CasinoTab = 'slots' | 'roulette' | 'reveal';

// SLOTS CONFIG
const SLOT_SYMBOLS = [
  { char: '🍒', name: 'Cherry', value: 10 },
  { char: '🍋', name: 'Lemon', value: 10 },
  { char: '🍊', name: 'Orange', value: 10 },
  { char: '🍇', name: 'Grape', value: 15 },
  { char: '🔔', name: 'Bell', value: 25 },
  { char: '💎', name: 'Diamond', value: 50 },
  { char: '7️⃣', name: 'Seven', value: 100 },
];

// ROULETTE CONFIG
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export default function CasinoGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Active sub-game tab
  const [activeTab, setActiveTab] = useState<CasinoTab>('slots');
  const [betAmount, setBetAmount] = useState<number>(10);

  // --- SLOTS STATES ---
  const [slotsSpinning, setSlotsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<string[]>(['🍒', '🍒', '🍒']);
  const [slotsOutcome, setSlotsOutcome] = useState<string | null>(null);

  // --- ROULETTE STATES ---
  const [rouletteSpinning, setRouletteSpinning] = useState<boolean>(false);
  const [rouletteBetType, setRouletteBetType] = useState<'red' | 'black' | 'even' | 'odd' | number>('red');
  const [rouletteResultNumber, setRouletteResultNumber] = useState<number | null>(null);
  const [rouletteOutcome, setRouletteOutcome] = useState<{ win: boolean; payout: number } | null>(null);

  // --- REVEAL STATES ---
  const [revealPlaying, setRevealPlaying] = useState<boolean>(false);
  const [revealedCards, setRevealedCards] = useState<Record<number, { mult: number; label: string }>>({});
  const [chosenCardIndex, setChosenCardIndex] = useState<number | null>(null);
  const [revealOutcome, setRevealOutcome] = useState<string | null>(null);

  // Reset states on tab switch
  useEffect(() => {
    setSlotsOutcome(null);
    setRouletteOutcome(null);
    setRouletteResultNumber(null);
    setRevealOutcome(null);
    setRevealedCards({});
    setChosenCardIndex(null);
    setRevealPlaying(false);
  }, [activeTab]);

  // ==================== SLOTS LOGIC ====================
  const handleSpinSlots = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setSlotsSpinning(true);
    setSlotsOutcome(null);

    let spins = 0;
    const interval = setInterval(() => {
      // Rotate reels
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].char,
      ]);
      playPlop();
      spins++;

      if (spins >= 12) {
        clearInterval(interval);

        // Final result selection
        const finalReels = [
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        ];

        setReels(finalReels.map(r => r.char));
        setSlotsSpinning(false);

        // Calculate payout
        let multiplier = 0;
        let outcomeMsg = '';

        if (finalReels[0].char === finalReels[1].char && finalReels[1].char === finalReels[2].char) {
          // Three of a kind!
          multiplier = finalReels[0].value / 5; // e.g. Seven (100) -> 20x, Cherry (10) -> 2x
          // Ensure min multiplier of 5x for 3-of-a-kind, scale up
          multiplier = Math.max(5.0, multiplier);
          outcomeMsg = `JACKPOT! 3x ${finalReels[0].name}`;
        } else if (
          finalReels[0].char === finalReels[1].char ||
          finalReels[1].char === finalReels[2].char ||
          finalReels[0].char === finalReels[2].char
        ) {
          // Pair
          multiplier = 1.5;
          const matchedName = finalReels[0].char === finalReels[1].char ? finalReels[0].name : finalReels[2].name;
          outcomeMsg = `Double! Pair of ${matchedName}`;
        } else {
          // No match
          multiplier = 0;
          outcomeMsg = 'No Match';
        }

        const payout = Math.round(betAmount * multiplier * 100) / 100;
        if (multiplier > 0) {
          playWin();
          triggerWinConfetti();
          addCredits(payout);
          addHistoryItem('Casino Slots', betAmount, multiplier, payout, 'win');
          setSlotsOutcome(`${outcomeMsg} • Won $${payout}`);
        } else {
          playLoss();
          addHistoryItem('Casino Slots', betAmount, 0, 0, 'loss');
          setSlotsOutcome('Loss. Try spinning again!');
        }
      }
    }, 120);
  };

  // ==================== ROULETTE LOGIC ====================
  const handleSpinRoulette = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setRouletteSpinning(true);
    setRouletteResultNumber(null);
    setRouletteOutcome(null);

    // Ticker spin
    let duration = 0;
    const interval = setInterval(() => {
      setRouletteResultNumber(Math.floor(Math.random() * 37));
      playPlop();
      duration++;
      if (duration >= 15) {
        clearInterval(interval);
        
        const finalNum = Math.floor(Math.random() * 37);
        setRouletteResultNumber(finalNum);
        setRouletteSpinning(false);

        // Check outcome
        let win = false;
        let mult = 0;

        if (typeof rouletteBetType === 'number') {
          win = finalNum === rouletteBetType;
          mult = 35.0;
        } else if (rouletteBetType === 'red') {
          win = RED_NUMBERS.includes(finalNum);
          mult = 2.0;
        } else if (rouletteBetType === 'black') {
          win = BLACK_NUMBERS.includes(finalNum);
          mult = 2.0;
        } else if (rouletteBetType === 'even') {
          win = finalNum !== 0 && finalNum % 2 === 0;
          mult = 2.0;
        } else if (rouletteBetType === 'odd') {
          win = finalNum % 2 !== 0;
          mult = 2.0;
        }

        const payout = win ? Math.round(betAmount * mult * 100) / 100 : 0;
        setRouletteOutcome({ win, payout });

        if (win) {
          playWin();
          triggerWinConfetti();
          addCredits(payout);
          addHistoryItem('Casino Roulette', betAmount, mult, payout, 'win');
        } else {
          playLoss();
          addHistoryItem('Casino Roulette', betAmount, 0, 0, 'loss');
        }
      }
    }, 120);
  };

  // ==================== REVEAL LOGIC ====================
  const handleStartReveal = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }
    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setRevealedCards({});
    setChosenCardIndex(null);
    setRevealOutcome(null);
    setRevealPlaying(true);
  };

  const handleCardClick = (idx: number) => {
    if (!revealPlaying || chosenCardIndex !== null) return;

    playClick();
    setChosenCardIndex(idx);

    // Multipliers for reveal cards (1 crash card, others range from 0.5x to 8x)
    const options = [
      { mult: 0, label: '☠️ Crash' },
      { mult: 0.5, label: '0.5x Mini' },
      { mult: 1.2, label: '1.2x Payout' },
      { mult: 2.0, label: '2.0x Double' },
      { mult: 5.0, label: '5.0x Super' },
      { mult: 10.0, label: '10.0x Jackpot' },
    ];

    // Shuffle options
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const newRevealed: Record<number, { mult: number; label: string }> = {};
    shuffled.forEach((opt, index) => {
      newRevealed[index] = opt;
    });

    setRevealedCards(newRevealed);
    setRevealPlaying(false);

    const chosen = newRevealed[idx];
    const payout = Math.round(betAmount * chosen.mult * 100) / 100;
    const won = chosen.mult > 0;

    if (won) {
      playWin();
      if (chosen.mult >= 2.0) triggerWinConfetti();
      addCredits(payout);
      addHistoryItem('Casino Reveal', betAmount, chosen.mult, payout, 'win');
      setRevealOutcome(`Won $${payout} (${chosen.label})`);
    } else {
      playLoss();
      addHistoryItem('Casino Reveal', betAmount, 0, 0, 'loss');
      setRevealOutcome('Crashed! Card was a skull.');
    }
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
        <span className="text-[10px] bg-pink-500/10 border border-pink-500/20 text-pink-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Casino Royale
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-luxury-border/60">
        <button
          onClick={() => { playClick(); setActiveTab('slots'); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs uppercase font-extrabold tracking-wider transition-all ${
            activeTab === 'slots' 
              ? 'border-pink-500 text-pink-500 bg-pink-500/5' 
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Apple className="w-4 h-4" />
          Fruit Slots
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('roulette'); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs uppercase font-extrabold tracking-wider transition-all ${
            activeTab === 'roulette' 
              ? 'border-pink-500 text-pink-500 bg-pink-500/5' 
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Disc className="w-4 h-4" />
          Mini Roulette
        </button>
        <button
          onClick={() => { playClick(); setActiveTab('reveal'); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs uppercase font-extrabold tracking-wider transition-all ${
            activeTab === 'reveal' 
              ? 'border-pink-500 text-pink-500 bg-pink-500/5' 
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Lucky Draw
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Bet controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <Spade className="w-4 h-4 text-pink-500" />
                PLACE CASINO BET
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
                    disabled={slotsSpinning || rouletteSpinning || revealPlaying}
                    className="w-full bg-black border border-luxury-border focus:border-pink-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={slotsSpinning || rouletteSpinning || revealPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={slotsSpinning || rouletteSpinning || revealPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={slotsSpinning || rouletteSpinning || revealPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-pink-500 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Specific tab controls */}
              {activeTab === 'slots' && (
                <Button variant="gold" fullWidth size="lg" onClick={handleSpinSlots} disabled={slotsSpinning || betAmount <= 0} className="bg-pink-600 hover:bg-pink-500 text-white border-none font-bold">
                  {slotsSpinning ? 'Spinning Reels...' : 'Spin Fruits Slot'}
                </Button>
              )}

              {activeTab === 'roulette' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Roulette Bet Target</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => { playClick(); setRouletteBetType('red'); }}
                        className={`py-2 text-[10px] uppercase font-bold rounded border transition-colors ${
                          rouletteBetType === 'red' 
                            ? 'bg-red-600 text-white border-red-500' 
                            : 'bg-neutral-900 border-luxury-border hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        Red (2x)
                      </button>
                      <button
                        onClick={() => { playClick(); setRouletteBetType('black'); }}
                        className={`py-2 text-[10px] uppercase font-bold rounded border transition-colors ${
                          rouletteBetType === 'black' 
                            ? 'bg-neutral-950 text-white border-neutral-700' 
                            : 'bg-neutral-900 border-luxury-border hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        Black (2x)
                      </button>
                      <button
                        onClick={() => { playClick(); setRouletteBetType('even'); }}
                        className={`py-2 text-[10px] uppercase font-bold rounded border transition-colors ${
                          rouletteBetType === 'even' 
                            ? 'bg-blue-600 text-white border-blue-500' 
                            : 'bg-neutral-900 border-luxury-border hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        Even (2x)
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      <button
                        onClick={() => { playClick(); setRouletteBetType('odd'); }}
                        className={`py-2 text-[10px] uppercase font-bold rounded border transition-colors ${
                          rouletteBetType === 'odd' 
                            ? 'bg-amber-600 text-white border-amber-500' 
                            : 'bg-neutral-900 border-luxury-border hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        Odd (2x)
                      </button>
                      <input
                        type="number"
                        placeholder="Num 0-36"
                        min="0"
                        max="36"
                        value={typeof rouletteBetType === 'number' ? rouletteBetType : ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 36) {
                            setRouletteBetType(val);
                          }
                        }}
                        className="col-span-2 bg-black border border-luxury-border rounded text-[10px] text-center font-bold text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <Button variant="gold" fullWidth size="lg" onClick={handleSpinRoulette} disabled={rouletteSpinning || betAmount <= 0} className="bg-pink-600 hover:bg-pink-500 text-white border-none font-bold mt-2">
                    {rouletteSpinning ? 'Spinning Wheel...' : 'Spin Roulette Wheel'}
                  </Button>
                </div>
              )}

              {activeTab === 'reveal' && (
                <Button 
                  variant="gold" 
                  fullWidth 
                  size="lg" 
                  onClick={handleStartReveal} 
                  disabled={revealPlaying || betAmount <= 0}
                  className="bg-pink-600 hover:bg-pink-500 text-white border-none font-bold"
                >
                  {revealPlaying ? 'Pick a Card below!' : 'Start Card Reveal'}
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Visual Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* Main Visual Frame */}
          <Card className="bg-[#050505] border-luxury-border min-h-[380px] flex flex-col items-center justify-center p-8 select-none relative overflow-hidden">
            
            {/* 1. FRUIT SLOTS SCREEN */}
            {activeTab === 'slots' && (
              <div className="flex flex-col items-center gap-8 w-full max-w-md">
                <div className="flex items-center justify-center gap-4 bg-neutral-900/60 border border-luxury-border/60 p-6 rounded-2xl w-full shadow-inner">
                  {reels.map((char, index) => (
                    <div 
                      key={index} 
                      className={`w-20 h-24 rounded-xl bg-black border border-luxury-border flex items-center justify-center text-4xl shadow-md transition-all duration-100 ${
                        slotsSpinning ? 'scale-95 border-pink-500/50' : ''
                      }`}
                    >
                      <span className={slotsSpinning ? 'animate-bounce' : ''}>
                        {char}
                      </span>
                    </div>
                  ))}
                </div>

                {slotsOutcome && (
                  <span className="text-center font-extrabold text-sm uppercase bg-neutral-900 border border-luxury-border/60 px-4 py-2 rounded-xl text-pink-400 animate-pulse">
                    {slotsOutcome}
                  </span>
                )}
              </div>
            )}

            {/* 2. ROULETTE SCREEN */}
            {activeTab === 'roulette' && (
              <div className="flex flex-col items-center gap-8 w-full">
                
                {/* Visual wheel segment */}
                <div className="relative w-40 h-40 rounded-full border-4 border-luxury-border flex items-center justify-center bg-neutral-900 text-white shadow-2xl">
                  
                  {/* Rotating ticker */}
                  <div className={`absolute w-36 h-36 rounded-full border border-dashed border-pink-500/20 ${rouletteSpinning ? 'animate-spin' : ''}`} />
                  
                  <div className="flex flex-col items-center z-10">
                    {rouletteResultNumber !== null ? (
                      <>
                        <span className="text-5xl font-black font-mono">
                          {rouletteResultNumber}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded ${
                          rouletteResultNumber === 0 
                            ? 'bg-emerald-950 text-emerald-400' 
                            : RED_NUMBERS.includes(rouletteResultNumber) 
                            ? 'bg-red-950 text-red-400' 
                            : 'bg-neutral-950 text-neutral-400'
                        }`}>
                          {rouletteResultNumber === 0 ? 'Zero' : RED_NUMBERS.includes(rouletteResultNumber) ? 'Red' : 'Black'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-neutral-500 font-extrabold uppercase">Ready</span>
                    )}
                  </div>
                </div>

                {/* Outcome Banner */}
                {rouletteOutcome && (
                  <span className={`text-center font-extrabold text-sm uppercase bg-neutral-900 border border-luxury-border/60 px-4 py-2 rounded-xl animate-pulse ${
                    rouletteOutcome.win ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20'
                  }`}>
                    {rouletteOutcome.win ? `Winner! Payout $${rouletteOutcome.payout}` : 'Loss. Better luck next spin!'}
                  </span>
                )}

                <div className="text-[10px] text-neutral-500 font-semibold text-center">
                  Bet Target: <span className="text-pink-400 uppercase font-black">{typeof rouletteBetType === 'number' ? `Number ${rouletteBetType}` : rouletteBetType}</span>
                </div>

              </div>
            )}

            {/* 3. CARD REVEAL SCREEN */}
            {activeTab === 'reveal' && (
              <div className="flex flex-col items-center gap-6 w-full">
                
                {!revealPlaying && Object.keys(revealedCards).length === 0 && (
                  <div className="text-center text-xs text-neutral-500 font-bold uppercase tracking-widest py-8">
                    Start a card reveal to flip and win!
                  </div>
                )}

                {(revealPlaying || Object.keys(revealedCards).length > 0) && (
                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const isRevealed = revealedCards[idx] !== undefined;
                      const wasChosen = chosenCardIndex === idx;
                      const card = revealedCards[idx];

                      return (
                        <button
                          key={idx}
                          disabled={!revealPlaying}
                          onClick={() => handleCardClick(idx)}
                          className={`aspect-[3/4] rounded-xl border flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden font-bold ${
                            isRevealed
                              ? wasChosen
                                ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                                : 'bg-neutral-950 border-luxury-border/30 text-neutral-600 opacity-60'
                              : 'bg-gradient-to-br from-[#1a1a24] to-[#0c0c10] border-luxury-border/80 hover:border-pink-500/60 hover:scale-105 text-pink-500/30'
                          }`}
                        >
                          {isRevealed ? (
                            <div className="text-center flex flex-col gap-1">
                              <span className="text-xs uppercase font-extrabold">
                                {wasChosen ? 'Yours' : 'Prize'}
                              </span>
                              <span className="text-sm font-black text-white">
                                {card.label}
                              </span>
                            </div>
                          ) : (
                            <Spade className="w-8 h-8 opacity-40 animate-pulse-slow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {revealOutcome && (
                  <span className="text-center font-extrabold text-sm uppercase bg-neutral-900 border border-luxury-border/60 px-4 py-2 rounded-xl text-pink-400 animate-pulse mt-2">
                    {revealOutcome}
                  </span>
                )}

              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Casino Games Rules</strong>: 
                  Select a tab to choose your game. 
                  In <strong>Fruit Slots</strong>, spin to match cherries, lemons, and sevens for high payouts. 
                  In <strong>Mini Roulette</strong>, place bets on colors (Red/Black), patterns (Even/Odd), or a single number. 
                  In <strong>Lucky Draw</strong>, start the game, then click any card to reveal your win multiplier (watch out for the skull!).
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
