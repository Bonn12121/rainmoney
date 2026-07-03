'use client';

import React, { useState, useEffect } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, CloudRain, Hand, Layers } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

interface CardType {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  value: string;
  scoreValue: number;
}

const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

const SUIT_COLORS = {
  spades: 'text-white',
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-white'
};

interface BlackjackCardProps {
  card: CardType;
  index: number;
  total: number;
  isHidden: boolean;
  isDealer: boolean;
}

const BlackjackCard: React.FC<BlackjackCardProps> = ({ card, index, total, isHidden, isDealer }) => {
  const mid = (total - 1) / 2;
  const angle = isDealer ? (index - mid) * 4 : (index - mid) * 8;
  const translateX = (index - mid) * 22;
  const translateY = isDealer ? -Math.abs(index - mid) * 2 : Math.abs(index - mid) * 4;
  
  const cardStyle: React.CSSProperties = {
    zIndex: index + 10,
    transform: `perspective(800px) rotateX(12deg) rotateZ(${angle}deg) translate3d(${translateX}px, ${translateY}px, 0px)`,
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
  };

  return (
    <div className="relative select-none animate-deal-card" style={cardStyle}>
      <div className={`card-3d-wrapper ${isHidden ? 'is-hidden' : ''}`}>
        
        {/* Front Face */}
        <div className="card-3d-front flex flex-col justify-between p-2">
          <div className="text-[11px] font-black self-start leading-none text-white font-mono flex flex-col items-center">
            <span>{card.value}</span>
            <span className={`text-[10px] ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className={`text-2xl font-black self-center leading-none ${SUIT_COLORS[card.suit]}`}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className="text-[11px] font-black self-end leading-none text-white font-mono flex flex-col items-center rotate-180">
            <span>{card.value}</span>
            <span className={`text-[10px] ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>

        {/* Back Face (Rain Money Logo) */}
        <div className="card-3d-back flex flex-col items-center justify-between p-2.5 overflow-hidden">
          <div className="w-full h-full border border-amber-500/30 rounded-lg flex flex-col items-center justify-center relative bg-[#040712]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.1),transparent_70%)] pointer-events-none"></div>
            <div className="flex flex-col items-center justify-center gap-1 z-10 text-amber-500/80">
              <CloudRain className="w-5 h-5 animate-pulse text-amber-500" />
              <span className="text-[8px] font-black tracking-widest text-center text-amber-400">
                RAIN
              </span>
              <span className="text-[6px] font-bold tracking-widest text-neutral-400 -mt-1 uppercase font-sans">
                MONEY
              </span>
            </div>
            <div className="absolute top-1 left-1 text-[5px] text-amber-500/40">♣</div>
            <div className="absolute top-1 right-1 text-[5px] text-amber-500/40">♦</div>
            <div className="absolute bottom-1 left-1 text-[5px] text-amber-500/40">♥</div>
            <div className="absolute bottom-1 right-1 text-[5px] text-amber-500/40">♠</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default function BlackjackGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dealer_turn' | 'ended'>('idle');
  const [outcome, setOutcome] = useState<'win' | 'loss' | 'push' | 'blackjack' | null>(null);
  const [payout, setPayout] = useState<number>(0);
  
  const [isSequentialDealing, setIsSequentialDealing] = useState<boolean>(false);
  const [revealDealerCard, setRevealDealerCard] = useState<boolean>(false);

  // Language translation dictionary
  const blackjackTranslations = {
    en: {
      title: '3D Classic Blackjack',
      desc: 'Beat the dealer by getting closer to 21 without going over.',
      bet: 'Bet Amount',
      balance: 'Balance',
      hit: 'Hit',
      stand: 'Stand',
      double: 'Double Down',
      play: 'Deal Cards',
      reset: 'Play Again',
      dealerScore: "Dealer's Hand",
      playerScore: "Your Hand",
      rules: 'Blackjack Rules',
      rulesDesc: 'Natural Blackjack pays 2.5x. Double down is allowed on first 2 cards (doubles bet and draws 1 card). Dealer stands on 17.',
      win: 'Won',
      loss: 'Lost',
      push: 'Push (Refunded)'
    },
    vi: {
      title: 'Xì Dách Cổ Điển 3D',
      desc: 'Đánh bại nhà cái bằng cách tiến gần đến 21 điểm nhất mà không vượt quá.',
      bet: 'Tiền cược',
      balance: 'Số dư',
      hit: 'Rút Bài',
      stand: 'Dừng',
      double: 'Gấp Đôi',
      play: 'Chia Bài',
      reset: 'Chơi Tiếp',
      dealerScore: 'Bài Nhà Cái',
      playerScore: 'Bài Của Bạn',
      rules: 'Luật Xì Dách',
      rulesDesc: 'Xì Dách tự nhiên ăn 2.5x. Được phép Gấp Đôi ở 2 lá đầu tiên (nhân đôi tiền cược và rút đúng 1 lá). Nhà cái dừng ở 17 điểm.',
      win: 'Thắng',
      loss: 'Thua',
      push: 'Hòa (Hoàn cược)'
    }
  };

  const t = blackjackTranslations[language === 'vi' ? 'vi' : 'en'];

  // Helper: Create a fresh shuffled deck
  const generateDeck = () => {
    const suits: ('spades' | 'hearts' | 'diamonds' | 'clubs')[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values = [
      { name: 'A', score: 11 },
      { name: '2', score: 2 },
      { name: '3', score: 3 },
      { name: '4', score: 4 },
      { name: '5', score: 5 },
      { name: '6', score: 6 },
      { name: '7', score: 7 },
      { name: '8', score: 8 },
      { name: '9', score: 9 },
      { name: '10', score: 10 },
      { name: 'J', score: 10 },
      { name: 'Q', score: 10 },
      { name: 'K', score: 10 }
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

  // Helper: Calculate hand score
  const calculateScore = (hand: CardType[]) => {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
      score += card.scoreValue;
      if (card.value === 'A') aces++;
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  // Start fast sequential deal game loop
  const handleDeal = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert(language === 'vi' ? 'Tiền cược không hợp lệ hoặc số dư không đủ.' : 'Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    
    // Clear hands and lock inputs
    setGameState('playing');
    setIsSequentialDealing(true);
    setRevealDealerCard(false);
    setPlayerHand([]);
    setDealerHand([]);
    setOutcome(null);
    setPayout(0);

    const newDeck = generateDeck();
    
    // Pop initial 4 cards
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    setDeck(newDeck);

    // Card 1: Player
    setTimeout(() => {
      setPlayerHand([p1]);
      playPlop();
    }, 150);

    // Card 2: Dealer (Face up)
    setTimeout(() => {
      setDealerHand([d1]);
      playPlop();
    }, 300);

    // Card 3: Player
    setTimeout(() => {
      setPlayerHand([p1, p2]);
      playPlop();
    }, 450);

    // Card 4: Dealer (Face down)
    setTimeout(() => {
      setDealerHand([d1, d2]);
      playPlop();
    }, 600);

    // Complete Deal Sequence
    setTimeout(() => {
      const playerScore = calculateScore([p1, p2]);
      const dealerScore = calculateScore([d1, d2]);

      setIsSequentialDealing(false);

      if (playerScore === 21) {
        if (dealerScore === 21) {
          resolveGame([p1, p2], [d1, d2], 'push', betAmount);
        } else {
          resolveGame([p1, p2], [d1, d2], 'blackjack', betAmount);
        }
      }
    }, 750);
  };

  // Player draws a card
  const handleHit = () => {
    if (gameState !== 'playing' || isSequentialDealing) return;
    
    setIsSequentialDealing(true);
    playPlop();

    const tempDeck = [...deck];
    const nextCard = tempDeck.pop()!;
    const newHand = [...playerHand, nextCard];

    setDeck(tempDeck);
    setPlayerHand(newHand);

    setTimeout(() => {
      const score = calculateScore(newHand);
      setIsSequentialDealing(false);

      if (score > 21) {
        resolveGame(newHand, dealerHand, 'loss', betAmount);
      }
    }, 250);
  };

  // Player stands: Trigger Dealer sequence
  const handleStand = () => {
    if (gameState !== 'playing' || isSequentialDealing) return;
    playClick();
    handleDealerTurn(playerHand, betAmount, deck);
  };

  // Player doubles down
  const handleDoubleDown = () => {
    if (gameState !== 'playing' || playerHand.length !== 2 || isSequentialDealing) return;
    if (credits < betAmount) {
      alert(language === 'vi' ? 'Số dư không đủ để gấp đôi.' : 'Insufficient credits to double down.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsSequentialDealing(true);

    const tempDeck = [...deck];
    const nextCard = tempDeck.pop()!;
    const newHand = [...playerHand, nextCard];
    const currentBet = betAmount * 2;

    setDeck(tempDeck);
    setPlayerHand(newHand);
    playPlop();

    setTimeout(() => {
      const score = calculateScore(newHand);
      if (score > 21) {
        setIsSequentialDealing(false);
        resolveGame(newHand, dealerHand, 'loss', currentBet);
      } else {
        setTimeout(() => {
          handleDealerTurn(newHand, currentBet, tempDeck);
        }, 200);
      }
    }, 250);
  };

  // Snappy Dealer turn logic
  const handleDealerTurn = (pHand: CardType[], currentBet: number, activeDeck: CardType[]) => {
    setGameState('dealer_turn');
    setIsSequentialDealing(true);
    setRevealDealerCard(true);

    let tempDealer = [...dealerHand];
    let tempDeck = [...activeDeck];

    const runDealerAI = () => {
      const dealerScore = calculateScore(tempDealer);
      if (dealerScore < 17) {
        setTimeout(() => {
          playPlop();
          const nextCard = tempDeck.pop()!;
          tempDealer.push(nextCard);
          setDealerHand([...tempDealer]);
          setDeck(tempDeck);
          
          setTimeout(runDealerAI, 350);
        }, 250);
      } else {
        setTimeout(() => {
          setIsSequentialDealing(false);
          evaluateDealerResult(pHand, tempDealer, currentBet);
        }, 300);
      }
    };

    setTimeout(runDealerAI, 300);
  };

  const evaluateDealerResult = (pHand: CardType[], dHand: CardType[], currentBet: number) => {
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    if (dScore > 21) {
      resolveGame(pHand, dHand, 'win', currentBet);
    } else if (pScore > dScore) {
      resolveGame(pHand, dHand, 'win', currentBet);
    } else if (pScore < dScore) {
      resolveGame(pHand, dHand, 'loss', currentBet);
    } else {
      resolveGame(pHand, dHand, 'push', currentBet);
    }
  };

  // Final resolution
  const resolveGame = (
    pHand: CardType[],
    dHand: CardType[],
    result: 'win' | 'loss' | 'push' | 'blackjack',
    currentBet: number
  ) => {
    let multiplier = 0;
    let finalPayout = 0;

    setIsSequentialDealing(false);

    if (result === 'win') {
      multiplier = 2.0;
      finalPayout = currentBet * 2;
      addCredits(finalPayout);
      playWin();
      triggerWinConfetti();
    } else if (result === 'blackjack') {
      multiplier = 2.5;
      finalPayout = Math.round(currentBet * 2.5 * 100) / 100;
      addCredits(finalPayout);
      playWin();
      triggerWinConfetti();
    } else if (result === 'push') {
      multiplier = 1.0;
      finalPayout = currentBet;
      addCredits(finalPayout);
      playClick();
    } else {
      playLoss();
    }

    setPayout(finalPayout);
    setOutcome(result);
    setGameState('ended');

    const status = result === 'win' || result === 'blackjack' ? 'win' : result === 'push' ? 'win' : 'loss';
    addHistoryItem('Blackjack', currentBet, multiplier, finalPayout, status);
  };

  const isButtonsDisabled = gameState !== 'playing' || isSequentialDealing;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow">
      
      {/* Styles Injection */}
      <style>{`
        .blackjack-table-container {
          perspective: 1200px;
        }

        .blackjack-table {
          background: radial-gradient(circle at 50% 30%, #034f37 0%, #012a1d 75%);
          border: 12px solid #1c150c;
          box-shadow: 
            inset 0 0 80px rgba(0, 0, 0, 0.8),
            0 20px 40px rgba(0, 0, 0, 0.7);
          transform: rotateX(12deg);
          transform-style: preserve-3d;
          transition: transform 0.8s ease-in-out;
        }

        .felt-print {
          color: rgba(251, 191, 36, 0.08);
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
          font-family: serif;
          letter-spacing: 0.15em;
          font-weight: 800;
          text-align: center;
          pointer-events: none;
          user-select: none;
        }

        .card-3d-wrapper {
          position: relative;
          width: 80px;
          height: 112px;
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .card-3d-wrapper.is-hidden {
          transform: rotateY(180deg);
        }

        .card-3d-front, .card-3d-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }

        .card-3d-front {
          background-color: #0b0f19;
          border: 1.5px solid #1d293d;
        }

        .card-3d-back {
          transform: rotateY(180deg);
        }

        @keyframes card-deal-player {
          0% {
            transform: translate3d(80px, -280px, 150px) rotate(270deg) scale(0.2);
            opacity: 0;
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
          }
        }

        .animate-deal-card {
          animation: card-deal-player 0.45s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>

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
        
        {/* Left Control Panel */}
        <div className="flex flex-col gap-6 relative">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">{t.bet}</span>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              
              {/* Bet amount */}
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
                    disabled={gameState === 'playing' || gameState === 'dealer_turn'}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(1, Math.round(prev / 2)))}
                      disabled={gameState === 'playing' || gameState === 'dealer_turn'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, prev * 2))}
                      disabled={gameState === 'playing' || gameState === 'dealer_turn'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {gameState === 'idle' || gameState === 'ended' ? (
                <Button
                  variant="gold"
                  fullWidth
                  size="lg"
                  onClick={handleDeal}
                  disabled={betAmount <= 0 || isSequentialDealing}
                >
                  {isSequentialDealing ? (language === 'vi' ? 'Đang chia...' : 'Dealing...') : t.play}
                </Button>
              ) : (
                <Button
                  variant="dark"
                  fullWidth
                  size="lg"
                  disabled={true}
                  className="border border-neutral-800 text-neutral-500 font-extrabold uppercase tracking-wider"
                >
                  {language === 'vi' ? 'Đang Trong Ván...' : 'In Progress...'}
                </Button>
              )}

            </CardContent>
          </Card>

          {/* Rules info */}
          <Card className="bg-[#0b0b0b]/60 border-[#1e293b]/60">
            <CardHeader className="p-4 border-b border-[#1e293b]/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t.rules}</span>
            </CardHeader>
            <CardContent className="p-4 flex gap-3 text-xs leading-relaxed text-neutral-400">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <p>{t.rulesDesc}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Blackjack Arena */}
        <div className="lg:col-span-2 flex flex-col gap-6 blackjack-table-container">
          
          <div className="w-full blackjack-table rounded-[40px] relative p-6 flex flex-col items-center justify-between min-h-[500px] overflow-hidden">
            
            {/* Wooden Rim Shadow Overlay */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-[40px] z-20"></div>

            {/* FELT GRAPHICS & LOGO */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-6 z-0 select-none">
              <div className="w-[88%] h-[85%] rounded-full border border-dashed border-[#059669]/15 flex items-center justify-center">
                <div className="w-[85%] h-[80%] rounded-full border border-[#059669]/5"></div>
              </div>
              
              {/* Centered Rain Money Logo */}
              <div className="absolute top-[35%] flex flex-col items-center gap-1.5 opacity-[0.06]">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-12 h-12 text-emerald-300" />
                  <span className="text-4xl font-extrabold tracking-widest text-white font-sans uppercase">
                    Rain<span className="text-amber-400">Money</span>
                  </span>
                </div>
                <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">
                  Casino Club
                </span>
              </div>
              
              {/* Felt Text Rules */}
              <div className="absolute top-[58%] flex flex-col items-center gap-1 felt-print">
                <div className="text-[10px] font-black uppercase text-amber-500/25">Blackjack Pays 3 to 2</div>
                <div className="text-[9px] font-extrabold uppercase text-emerald-300/15">Dealer must stand on 17 & draw to 16</div>
                <div className="text-[8px] font-bold text-neutral-400/10">INSURANCE PAYS 2 TO 1</div>
              </div>
            </div>

            {/* 3D Card Shoe */}
            <div className="absolute top-5 right-6 w-24 h-16 bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700/50 rounded-lg shadow-2xl flex items-center justify-center z-10 transform rotate-12 scale-90 select-none">
              <div className="absolute -top-1 -left-1 w-full h-full bg-gradient-to-br from-neutral-800 to-black rounded-lg border border-neutral-700/30"></div>
              <div className="absolute -top-2 -left-2 w-full h-full bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-center overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-neutral-700/80 border-l border-white/20"></div>
                <div className="w-3 h-full bg-amber-500/20 border-r border-amber-500/40"></div>
                <CloudRain className="w-4 h-4 text-neutral-600 animate-pulse" />
              </div>
              <span className="absolute -bottom-5 text-[8px] font-black uppercase tracking-widest text-neutral-500 text-center w-full font-mono">
                Deck ({deck.length} Left)
              </span>
            </div>

            {/* DEALER AREA */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 w-full mt-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-emerald-300 font-extrabold uppercase tracking-widest bg-[#022c22]/80 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                  {t.dealerScore} {(!isSequentialDealing || gameState === 'dealer_turn') && dealerHand.length > 0 ? `(${calculateScore(dealerHand)})` : ''}
                </span>
              </div>
              <div className="flex justify-center min-h-[112px] items-center relative w-full px-20">
                {dealerHand.length === 0 ? (
                  <div className="text-[9px] text-emerald-400/20 uppercase tracking-widest font-black py-8">Dealer Ready</div>
                ) : (
                  <div className="relative flex items-center justify-center w-full" style={{ height: '112px' }}>
                    {dealerHand.map((card, idx) => {
                      const isHidden = (gameState === 'playing' || isSequentialDealing) && idx === 1 && !revealDealerCard;
                      return (
                        <div key={idx} className="absolute">
                          <BlackjackCard 
                            card={card}
                            index={idx}
                            total={dealerHand.length}
                            isHidden={isHidden}
                            isDealer={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RESULT MESSAGE */}
            <WinLoseOverlay
              isOpen={gameState === 'ended' && !!outcome}
              onClose={() => setGameState('idle')}
              outcome={outcome === 'win' || outcome === 'blackjack' ? 'win' : outcome === 'push' ? 'cashout' : 'loss'}
              multiplier={outcome === 'blackjack' ? 2.5 : outcome === 'win' ? 2.0 : outcome === 'push' ? 1.0 : 0}
              payout={outcome === 'loss' ? 0 : payout}
              language={language}
            />

            {/* PLAYER AREA */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 w-full mb-1">
              <div className="flex justify-center min-h-[112px] items-center relative w-full px-20">
                {playerHand.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 z-20 select-none animate-fade-in py-5">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/35 flex items-center justify-center bg-black/20">
                      <span className="text-[8px] font-black tracking-widest text-amber-500/50 uppercase">
                        Bet
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center w-full" style={{ height: '112px' }}>
                    {playerHand.map((card, idx) => (
                      <div key={idx} className="absolute">
                        <BlackjackCard 
                          card={card}
                          index={idx}
                          total={playerHand.length}
                          isHidden={false}
                          isDealer={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stacked chips visual on the felt table */}
              {playerHand.length > 0 && (
                <div className="absolute -bottom-8 flex flex-col items-center gap-0.5 z-20 select-none scale-75">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute w-10 h-10 bg-amber-500 border border-white/20 rounded-full shadow-lg flex items-center justify-center font-black text-black text-[9px] font-mono transform rotate-12 -translate-y-2 z-30">
                      ${betAmount}
                    </div>
                    <div className="absolute w-10 h-10 bg-amber-600 border border-black/20 rounded-full shadow-md transform -rotate-12 -translate-y-1.5 z-20"></div>
                    <div className="absolute w-10 h-10 bg-amber-700 border border-black/20 rounded-full shadow-md transform rotate-6 -translate-y-0.5 z-10"></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[9px] text-emerald-300 font-extrabold uppercase tracking-widest bg-[#022c22]/80 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                  {t.playerScore} {playerHand.length > 0 ? `(${calculateScore(playerHand)})` : ''}
                </span>
              </div>

              {/* Blackjack control buttons row: Double, Hit, Stand, Split */}
              {gameState === 'playing' && (
                <div className="flex justify-center items-center gap-2 mt-3 select-none animate-fade-in w-full max-w-[390px] px-2 z-35">
                  {/* Double Down */}
                  <button
                    onClick={handleDoubleDown}
                    disabled={isSequentialDealing || playerHand.length !== 2 || credits < betAmount}
                    className="flex-1 flex items-center justify-center py-2.5 px-1 bg-[#0b0e1e]/90 hover:bg-[#111630] border border-white/[0.08] hover:border-emerald-500/30 text-white disabled:opacity-40 disabled:hover:bg-[#0b0e1e]/90 disabled:hover:border-white/[0.08] rounded-xl transition-all duration-200 cursor-pointer shadow-lg text-[10px] font-bold"
                  >
                    <span className="text-[9px] font-black text-emerald-400 mr-1.5 uppercase tracking-tighter">x2</span>
                    <span>{language === 'vi' ? 'Gấp Đôi' : 'Double'}</span>
                  </button>

                  {/* Hit */}
                  <button
                    onClick={handleHit}
                    disabled={isSequentialDealing}
                    className="flex-1 flex items-center justify-center py-2.5 px-1 bg-[#0b0e1e]/90 hover:bg-[#111630] border border-white/[0.08] hover:border-sky-500/30 text-white disabled:opacity-40 disabled:hover:bg-[#0b0e1e]/90 disabled:hover:border-white/[0.08] rounded-xl transition-all duration-200 cursor-pointer shadow-lg text-[10px] font-bold"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400 mr-1.5" />
                    <span>{language === 'vi' ? 'Rút Bài' : 'Hit'}</span>
                  </button>

                  {/* Stand */}
                  <button
                    onClick={handleStand}
                    disabled={isSequentialDealing}
                    className="flex-1 flex items-center justify-center py-2.5 px-1 bg-[#0b0e1e]/90 hover:bg-[#111630] border border-white/[0.08] hover:border-violet-500/30 text-white disabled:opacity-40 disabled:hover:bg-[#0b0e1e]/90 disabled:hover:border-white/[0.08] rounded-xl transition-all duration-200 cursor-pointer shadow-lg text-[10px] font-bold"
                  >
                    <Hand className="w-3.5 h-3.5 text-violet-400 mr-1.5" />
                    <span>{language === 'vi' ? 'Dừng' : 'Stand'}</span>
                  </button>

                  {/* Split (Disabled) */}
                  <button
                    disabled={true}
                    className="flex-1 flex items-center justify-center py-2.5 px-1 bg-[#0b0e1e]/60 border border-white/[0.03] text-neutral-500 rounded-xl cursor-not-allowed text-[10px] font-bold"
                  >
                    <div className="flex gap-0.5 mr-1.5 opacity-40">
                      <div className="w-2 h-3 border border-amber-600/65 rounded bg-amber-600/10" />
                      <div className="w-2 h-3 border border-amber-600/65 rounded bg-amber-600/10 transform translate-x-[-2px] translate-y-[0.5px]" />
                    </div>
                    <span>{language === 'vi' ? 'Tách Bài' : 'Split'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
