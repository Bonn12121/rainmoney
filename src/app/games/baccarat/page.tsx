'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Coins } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

interface CardType {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  value: string;
  scoreValue: number;
}

const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const SUIT_COLORS = { spades: 'text-white', hearts: 'text-red-500', diamonds: 'text-red-500', clubs: 'text-white' };

export default function BaccaratGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [betSelection, setBetSelection] = useState<'player' | 'banker' | 'tie'>('player');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [playerCards, setPlayerCards] = useState<CardType[]>([]);
  const [bankerCards, setBankerCards] = useState<CardType[]>([]);
  const [winner, setWinner] = useState<'player' | 'banker' | 'tie' | null>(null);
  const [outcomePayout, setOutcomePayout] = useState<number>(0);

  const translations = {
    en: {
      title: 'Royal Baccarat',
      desc: 'Predict which side will get closest to a total card score of 9: Player, Banker, or Tie.',
      bet: 'Bet Amount',
      balance: 'Balance',
      selectSide: 'Place Your Bet On',
      play: 'Deal Baccarat Hand',
      playing: 'Dealing...',
      rules: 'Baccarat Rules',
      rulesDesc: 'Card totals modulo 10 determine the score (Aces=1, Tens/Face cards=0). Payouts: Player wins 2x, Banker wins 1.95x, Tie wins 9x.',
      playerHand: 'Player Hand',
      bankerHand: 'Banker Hand',
      payout: 'Payout',
      player: 'Player',
      banker: 'Banker',
      tie: 'Tie'
    },
    vi: {
      title: 'Bài Baccarat Hoàng Gia',
      desc: 'Dự đoán bên nào sẽ có tổng số điểm gần với 9 nhất: Nhà Con (Player), Nhà Cái (Banker), hoặc Hòa (Tie).',
      bet: 'Tiền cược',
      balance: 'Số dư',
      selectSide: 'Đặt Cược Vào Cửa',
      play: 'Chia Bài Baccarat',
      playing: 'Đang chia bài...',
      rules: 'Luật Baccarat',
      rulesDesc: 'Tổng điểm chia cho 10 lấy phần dư (Át=1, các lá 10/Hình=0). Tỷ lệ: Nhà Con ăn 2x, Nhà Cái ăn 1.95x, Cửa Hòa ăn 9x.',
      playerHand: 'Bài Nhà Con',
      bankerHand: 'Bài Nhà Cái',
      payout: 'Thanh toán',
      player: 'Nhà Con',
      banker: 'Nhà Cái',
      tie: 'Hòa'
    }
  };

  const t = translations[language];

  // Helper: Create a fresh deck
  const generateDeck = () => {
    const suits: ('spades' | 'hearts' | 'diamonds' | 'clubs')[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = [
      { name: 'A', score: 1 },
      { name: '2', score: 2 },
      { name: '3', score: 3 },
      { name: '4', score: 4 },
      { name: '5', score: 5 },
      { name: '6', score: 6 },
      { name: '7', score: 7 },
      { name: '8', score: 8 },
      { name: '9', score: 9 },
      { name: '10', score: 0 },
      { name: 'J', score: 0 },
      { name: 'Q', score: 0 },
      { name: 'K', score: 0 }
    ];

    let newDeck: CardType[] = [];
    for (const suit of suits) {
      for (const val of values) {
        newDeck.push({
          suit,
          value: val.name,
          scoreValue: val.score
        });
      }
    }

    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  // Helper: Calculate Baccarat score (modulo 10)
  const calculateScore = (hand: CardType[]) => {
    const total = hand.reduce((sum, card) => sum + card.scoreValue, 0);
    return total % 10;
  };

  // Deal Game
  const handleDeal = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setGameState('playing');
    setWinner(null);
    setOutcomePayout(0);

    const deck = generateDeck();
    
    // Draw initial 2 cards each
    const p1 = deck.pop()!;
    const b1 = deck.pop()!;
    const p2 = deck.pop()!;
    const b2 = deck.pop()!;

    let pHand = [p1, p2];
    let bHand = [b1, b2];

    setPlayerCards(pHand);
    setBankerCards(bHand);

    // Audio plops for cards
    setTimeout(() => playPlop(), 200);
    setTimeout(() => playPlop(), 450);

    setTimeout(() => {
      let pScore = calculateScore(pHand);
      let bScore = calculateScore(bHand);

      // Check for Natural win
      if (pScore >= 8 || bScore >= 8) {
        resolveBaccarat(pHand, bHand);
      } else {
        // Draw third cards
        let playerDrew = false;
        if (pScore <= 5) {
          pHand.push(deck.pop()!);
          setPlayerCards([...pHand]);
          playerDrew = true;
          playPlop();
        }

        const newPlayerScore = calculateScore(pHand);

        // Banker drawing logic
        let bankerDraw = false;
        if (!playerDrew) {
          if (bScore <= 5) bankerDraw = true;
        } else {
          // Standard Baccarat drawing rules simplified
          const thirdCardVal = pHand[2].scoreValue;
          if (bScore <= 2) {
            bankerDraw = true;
          } else if (bScore === 3 && thirdCardVal !== 8) {
            bankerDraw = true;
          } else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(thirdCardVal)) {
            bankerDraw = true;
          } else if (bScore === 5 && [4, 5, 6, 7].includes(thirdCardVal)) {
            bankerDraw = true;
          } else if (bScore === 6 && [6, 7].includes(thirdCardVal)) {
            bankerDraw = true;
          }
        }

        if (bankerDraw) {
          setTimeout(() => {
            bHand.push(deck.pop()!);
            setBankerCards([...bHand]);
            playPlop();
            
            setTimeout(() => {
              resolveBaccarat(pHand, bHand);
            }, 600);
          }, 400);
        } else {
          resolveBaccarat(pHand, bHand);
        }
      }
    }, 900);
  };

  const resolveBaccarat = (pHand: CardType[], bHand: CardType[]) => {
    const pScore = calculateScore(pHand);
    const bScore = calculateScore(bHand);

    let roundWinner: 'player' | 'banker' | 'tie' = 'tie';
    if (pScore > bScore) roundWinner = 'player';
    else if (bScore > pScore) roundWinner = 'banker';

    setWinner(roundWinner);
    setGameState('ended');

    const userWon = betSelection === roundWinner;
    let payoutVal = 0;
    let multiplier = 0;

    if (userWon) {
      if (roundWinner === 'player') {
        multiplier = 2.0;
        payoutVal = betAmount * 2;
      } else if (roundWinner === 'banker') {
        multiplier = 1.95;
        payoutVal = Math.round(betAmount * 1.95 * 100) / 100;
      } else {
        multiplier = 9.0;
        payoutVal = betAmount * 9;
      }

      addCredits(payoutVal);
      playWin();
      triggerWinConfetti();
    } else {
      playLoss();
    }

    setOutcomePayout(payoutVal);
    addHistoryItem(
      `Baccarat (${roundWinner.toUpperCase()})`,
      betAmount,
      userWon ? multiplier : 0,
      payoutVal,
      userWon ? 'win' : 'loss'
    );
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
          {language === 'vi' ? 'Sảnh Game' : 'Back to Lobby'}
        </Link>
        <span className="text-[10px] bg-gold-500/10 border border-gold-500/20 text-gold-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          {t.title}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">{t.bet}</span>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              
              {/* Bet Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-neutral-400">
                  <span>{t.bet}</span>
                  <span>{t.balance}: ${credits.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    disabled={gameState === 'playing'}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(1, Math.round(prev / 2)))}
                      disabled={gameState === 'playing'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, prev * 2))}
                      disabled={gameState === 'playing'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Side Selection buttons */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest text-[9px]">{t.selectSide}</span>
                <div className="grid grid-cols-3 gap-2 bg-black border border-luxury-border p-1 rounded-xl">
                  <button
                    onClick={() => { playClick(); setBetSelection('player'); }}
                    disabled={gameState === 'playing'}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      betSelection === 'player'
                        ? 'gold-gradient-bg text-amber-950 shadow-md'
                        : 'text-neutral-450 hover:text-white bg-transparent'
                    }`}
                  >
                    {t.player} <span className="block text-[8.5px] opacity-75">2x</span>
                  </button>
                  <button
                    onClick={() => { playClick(); setBetSelection('banker'); }}
                    disabled={gameState === 'playing'}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      betSelection === 'banker'
                        ? 'gold-gradient-bg text-amber-950 shadow-md'
                        : 'text-neutral-450 hover:text-white bg-transparent'
                    }`}
                  >
                    {t.banker} <span className="block text-[8.5px] opacity-75">1.95x</span>
                  </button>
                  <button
                    onClick={() => { playClick(); setBetSelection('tie'); }}
                    disabled={gameState === 'playing'}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      betSelection === 'tie'
                        ? 'gold-gradient-bg text-amber-950 shadow-md'
                        : 'text-neutral-450 hover:text-white bg-transparent'
                    }`}
                  >
                    {t.tie} <span className="block text-[8.5px] opacity-75">9x</span>
                  </button>
                </div>
              </div>

              {/* Deal button */}
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleDeal}
                disabled={gameState === 'playing' || betAmount <= 0}
              >
                {gameState === 'playing' ? t.playing : t.play}
              </Button>

            </CardContent>
          </Card>

          {/* Rules Card */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-[#1e293b]/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t.rules}</span>
            </CardHeader>
            <CardContent className="p-4 flex gap-3 text-xs leading-relaxed text-neutral-400">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <p>{t.rulesDesc}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Baccarat Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <Card className="bg-[#0f172a] border-luxury-border relative p-8 flex flex-col justify-between min-h-[460px] rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Split layout: Player vs Banker cards */}
            <div className="grid grid-cols-2 gap-4 w-full relative z-10 flex-grow py-6">
              
              {/* Player Side */}
              <div className="flex flex-col items-center gap-4 border-r border-white/[0.03]">
                <div className="text-center">
                  <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">{t.playerHand}</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {playerCards.length > 0 ? calculateScore(playerCards) : ''}
                  </span>
                </div>

                <div className="flex gap-2.5 flex-wrap justify-center min-h-[120px] items-center">
                  {playerCards.length === 0 ? (
                    <div className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Awaiting Deal</div>
                  ) : (
                    playerCards.map((card, idx) => (
                      <div 
                        key={idx}
                        className="w-16 h-24 bg-[#05070d] border-[1.5px] border-luxury-border rounded-xl flex flex-col justify-between p-1.5 shadow-lg animate-fade-in"
                      >
                        <span className="text-[10px] font-black self-start leading-none">{card.value}</span>
                        <span className={`text-xl font-black self-center ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
                        <span className="text-[10px] font-black self-end leading-none rotate-180">{card.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Banker Side */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block">{t.bankerHand}</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {bankerCards.length > 0 ? calculateScore(bankerCards) : ''}
                  </span>
                </div>

                <div className="flex gap-2.5 flex-wrap justify-center min-h-[120px] items-center">
                  {bankerCards.length === 0 ? (
                    <div className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Awaiting Deal</div>
                  ) : (
                    bankerCards.map((card, idx) => (
                      <div 
                        key={idx}
                        className="w-16 h-24 bg-[#05070d] border-[1.5px] border-luxury-border rounded-xl flex flex-col justify-between p-1.5 shadow-lg animate-fade-in"
                      >
                        <span className="text-[10px] font-black self-start leading-none">{card.value}</span>
                        <span className={`text-xl font-black self-center ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
                        <span className="text-[10px] font-black self-end leading-none rotate-180">{card.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Outcome Display */}
            <WinLoseOverlay
              isOpen={gameState === 'ended'}
              onClose={() => setGameState('idle')}
              outcome={winner === betSelection ? 'win' : 'loss'}
              multiplier={winner === betSelection ? (winner === 'tie' ? 9.0 : winner === 'player' ? 2.0 : 1.95) : 0}
              payout={outcomePayout}
              language={language}
            />

          </Card>

        </div>

      </div>
    </div>
  );
}
