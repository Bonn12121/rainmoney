'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, ArrowUpDown, Coins, Flame, Trophy } from 'lucide-react';
import Link from 'next/link';

interface CardData {
  value: number; // 1 = Ace, 2-10, 11 = Jack, 12 = Queen, 13 = King
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-neutral-400',
  spades: 'text-neutral-400',
};

const CARD_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export default function HiLoGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Game Inputs
  const [betAmount, setBetAmount] = useState<number>(10);

  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [cardHistory, setCardHistory] = useState<CardData[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState<number>(1.00);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<'win' | 'loss' | null>(null);

  // Statistics
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });
  const [recentStreaks, setRecentStreaks] = useState<number[]>([4, 2, 8, 1]);

  // Generate a random card
  const getRandomCard = (excludeValue?: number): CardData => {
    const suits: CardData['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    let value = Math.floor(Math.random() * 13) + 1;
    if (excludeValue && value === excludeValue) {
      value = value === 13 ? 1 : value + 1;
    }
    return { value, suit };
  };

  // Start the Game Session
  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    const initialCard = getRandomCard();
    setCurrentCard(initialCard);
    setCardHistory([initialCard]);
    setIsPlaying(true);
    setCurrentStreak(0);
    setAccumulatedMultiplier(1.00);
    setGameOverReason(null);
  };

  // Payout Multipliers for Higher vs Lower (excluding equal to avoid ties)
  // V = currentCard.value (1 to 13)
  const getCurrentCardValue = () => currentCard?.value || 7;
  const currentVal = getCurrentCardValue();

  const higherProbability = (13 - currentVal) / 12;
  const lowerProbability = (currentVal - 1) / 12;

  // Multiplier formulas with 2% house edge
  const higherMultiplier = higherProbability > 0 ? parseFloat((0.98 / higherProbability).toFixed(2)) : 0;
  const lowerMultiplier = lowerProbability > 0 ? parseFloat((0.98 / lowerProbability).toFixed(2)) : 0;

  // Make Guess
  const handleGuess = (guess: 'higher' | 'lower') => {
    if (!isPlaying || isDrawing || !currentCard) return;

    playClick();
    setIsDrawing(true);

    const multToApply = guess === 'higher' ? higherMultiplier : lowerMultiplier;

    // Draw next card
    setTimeout(() => {
      const nextCard = getRandomCard(currentCard.value);
      const isCorrect = guess === 'higher' 
        ? nextCard.value > currentCard.value 
        : nextCard.value < currentCard.value;

      setCurrentCard(nextCard);
      setCardHistory(prev => [...prev, nextCard]);
      setIsDrawing(false);

      if (isCorrect) {
        // Correct Guess
        playPlop();
        const nextMult = accumulatedMultiplier * multToApply;
        setAccumulatedMultiplier(parseFloat(nextMult.toFixed(2)));
        setCurrentStreak(prev => prev + 1);
      } else {
        // Incorrect Guess - Loss
        playLoss();
        setIsPlaying(false);
        setGameOverReason('loss');
        addHistoryItem('Hi-Lo', betAmount, 0, 0, 'loss');
        setGameStats(prev => ({
          ...prev,
          losses: prev.losses + 1,
          profit: prev.profit - betAmount,
        }));
        setRecentStreaks(prev => [currentStreak, ...prev.slice(0, 5)]);
      }
    }, 450); // Small delay to simulate flip
  };

  // Cashout accumulated winnings
  const handleCashout = () => {
    if (!isPlaying || currentStreak === 0 || !currentCard) return;

    playWin();
    triggerWinConfetti();
    
    const payout = Math.round(betAmount * accumulatedMultiplier * 100) / 100;
    addCredits(payout);
    addHistoryItem('Hi-Lo', betAmount, accumulatedMultiplier, payout, 'win');

    setGameStats(prev => ({
      ...prev,
      wins: prev.wins + 1,
      profit: prev.profit + (payout - betAmount),
    }));
    setRecentStreaks(prev => [currentStreak, ...prev.slice(0, 5)]);
    
    setIsPlaying(false);
    setGameOverReason('win');
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
        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Hi-Lo Cards
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Game Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" />
                HI-LO CONTROLS
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
                    className="w-full bg-black border border-luxury-border focus:border-emerald-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={isPlaying}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-emerald-500 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Start Session / Play Button */}
              {!isPlaying ? (
                <Button variant="gold" fullWidth size="lg" onClick={handleStartGame}>
                  <Play className="w-4 h-4 mr-2 fill-black" />
                  Deal Initial Card
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  
                  {/* Guess buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="gold" 
                      fullWidth 
                      onClick={() => handleGuess('higher')}
                      disabled={isDrawing || higherMultiplier === 0}
                      className="bg-emerald-600 hover:bg-emerald-500 border-none text-white font-black"
                    >
                      Higher ({higherMultiplier > 0 ? `${higherMultiplier}x` : 'N/A'})
                    </Button>
                    <Button 
                      variant="danger" 
                      fullWidth 
                      onClick={() => handleGuess('lower')}
                      disabled={isDrawing || lowerMultiplier === 0}
                      className="bg-rose-600 hover:bg-rose-500 border-none text-white font-black"
                    >
                      Lower ({lowerMultiplier > 0 ? `${lowerMultiplier}x` : 'N/A'})
                    </Button>
                  </div>

                  {/* Cashout Button */}
                  <Button 
                    variant="gold" 
                    fullWidth 
                    size="lg"
                    onClick={handleCashout}
                    disabled={isDrawing || currentStreak === 0}
                    className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-none font-bold"
                  >
                    <span>
                      Cash Out: ${(betAmount * accumulatedMultiplier).toFixed(0)} ({accumulatedMultiplier}x)
                    </span>
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Session Stats */}
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

        {/* Right Side: Game Display */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* History */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">Recent Streaks:</span>
            {recentStreaks.map((val, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1 bg-neutral-900 border border-luxury-border/60 rounded-md text-[10px] font-extrabold text-neutral-400"
              >
                {val} Cards
              </span>
            ))}
          </div>

          {/* Main Card Arena */}
          <Card className="bg-[#050505] border-luxury-border min-h-[380px] relative overflow-hidden flex flex-col items-center justify-center p-8 select-none">
            
            {isPlaying && (
              <div className="absolute top-4 left-6 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-orange-400">
                  <Flame className="w-4 h-4 fill-orange-400" />
                  <span className="font-extrabold">Streak: {currentStreak}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gold-500">
                  <Trophy className="w-4 h-4 fill-gold-500" />
                  <span className="font-extrabold">{accumulatedMultiplier}x</span>
                </div>
              </div>
            )}

            {currentCard ? (
              <div className="flex flex-col items-center gap-6">
                
                {/* Floating Card Visual */}
                <div className={`w-40 h-56 rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#0c0c10] border-2 border-luxury-border relative shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex flex-col justify-between p-4 transition-transform duration-300 ${isDrawing ? 'rotate-y-180 scale-95 opacity-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-2xl font-black ${SUIT_COLORS[currentCard.suit]}`}>
                      {CARD_LABELS[currentCard.value]}
                    </span>
                    <span className={`text-2xl ${SUIT_COLORS[currentCard.suit]}`}>
                      {SUIT_SYMBOLS[currentCard.suit]}
                    </span>
                  </div>

                  <div className={`text-6xl text-center self-center my-auto ${SUIT_COLORS[currentCard.suit]}`}>
                    {SUIT_SYMBOLS[currentCard.suit]}
                  </div>

                  <div className="flex justify-between items-end rotate-180">
                    <span className={`text-2xl font-black ${SUIT_COLORS[currentCard.suit]}`}>
                      {CARD_LABELS[currentCard.value]}
                    </span>
                    <span className={`text-2xl ${SUIT_COLORS[currentCard.suit]}`}>
                      {SUIT_SYMBOLS[currentCard.suit]}
                    </span>
                  </div>
                </div>

                {/* History list inside round */}
                {cardHistory.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-neutral-500 font-extrabold uppercase mr-1">Path:</span>
                    {cardHistory.slice(0, -1).map((hist, idx) => (
                      <span key={idx} className={`text-xs font-bold ${SUIT_COLORS[hist.suit]}`}>
                        {CARD_LABELS[hist.value]}
                        {SUIT_SYMBOLS[hist.suit]}
                        <span className="text-neutral-600 ml-1">→</span>
                      </span>
                    ))}
                    <span className={`text-xs font-black bg-neutral-900 border border-luxury-border/60 px-2 py-0.5 rounded ${SUIT_COLORS[currentCard.suit]}`}>
                      {CARD_LABELS[currentCard.value]}
                      {SUIT_SYMBOLS[currentCard.suit]}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <ArrowUpDown className="w-12 h-12 text-emerald-500/20 animate-float" />
                <span className="text-xs text-neutral-500 uppercase tracking-widest font-extrabold">DEAL TO START GAME</span>
              </div>
            )}

            {/* Win/Loss screen overlay */}
            {gameOverReason && (
              <div className="absolute inset-0 bg-[#020202]/90 flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-10 transition-all rounded-2xl">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">ROUND COMPLETE</span>
                {gameOverReason === 'win' ? (
                  <>
                    <span className="text-4xl font-black text-emerald-500">
                      CASHED OUT!
                    </span>
                    <span className="text-sm text-neutral-300 font-semibold">
                      Won ${(betAmount * accumulatedMultiplier).toFixed(0)} at {accumulatedMultiplier}x multiplier
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-black text-rose-500">
                      CARD CRASHED
                    </span>
                    <span className="text-sm text-neutral-300 font-semibold">
                      Your guess was incorrect. Bet of ${betAmount} lost.
                    </span>
                  </>
                )}
                <Button size="sm" variant="dark" className="mt-2" onClick={() => setGameOverReason(null)}>
                  Clear Board
                </Button>
              </div>
            )}

          </Card>

          {/* Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Hi-Lo Rules</strong>: Click <strong>Deal Card</strong> to start. 
                  Guess whether the next card will be Higher or Lower than the current card. 
                  Guessing correctly increases your multiplier streak. 
                  You can cash out your winnings at any point, or keep drawing to aim for higher multipliers. 
                  If you guess wrong, you lose your initial bet and accumulated winnings.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
