'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Play,
  Sparkles,
  History,
  List,
  Tag,
  Key,
  PenTool,
  Wallet,
  Banknote,
  Coins,
  CreditCard,
  Crown,
  Glasses,
  Shirt,
  Briefcase,
  Box,
  Watch,
  AlertTriangle,
  Car,
  Gem,
  Shield,
  Square
} from 'lucide-react';
import Link from 'next/link';

export interface DropItem {
  id: string;
  mult: number;
  label: string;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  iconType: string;
  dropRateText: string;
  rarityTag: string;
}

export interface CaseConfig {
  id: string;
  name: string;
  cost: number;
  description: string;
  bgGrad: string;
  borderClass: string;
  glowClass: string;
  textColor: string;
  drops: DropItem[];
}

const TIER_COLORS = {
  common: {
    text: 'text-slate-400',
    border: 'border-slate-800',
    bg: 'bg-slate-950/60',
    badgeBg: 'bg-slate-900/90 text-slate-400 border-slate-700/50',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.15)]',
    iconBg: 'bg-slate-900/80 border-slate-700/60',
    gradient: 'from-slate-900/60 via-slate-950/40 to-black',
  },
  uncommon: {
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    bg: 'bg-emerald-950/40',
    badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/50',
    glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)]',
    iconBg: 'bg-emerald-950/80 border-emerald-700/60',
    gradient: 'from-emerald-950/50 via-slate-950/40 to-black',
  },
  rare: {
    text: 'text-blue-400',
    border: 'border-blue-800/60',
    bg: 'bg-blue-950/40',
    badgeBg: 'bg-blue-950/90 text-blue-300 border-blue-700/50',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]',
    iconBg: 'bg-blue-950/80 border-blue-700/60',
    gradient: 'from-blue-950/50 via-slate-950/40 to-black',
  },
  epic: {
    text: 'text-purple-400',
    border: 'border-purple-800/60',
    bg: 'bg-purple-950/40',
    badgeBg: 'bg-purple-950/90 text-purple-300 border-purple-700/50',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.3)]',
    iconBg: 'bg-purple-950/80 border-purple-700/60',
    gradient: 'from-purple-950/50 via-slate-950/40 to-black',
  },
  legendary: {
    text: 'text-amber-400',
    border: 'border-amber-700/60',
    bg: 'bg-amber-950/50',
    badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-600/50',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
    iconBg: 'bg-amber-950/80 border-amber-600/60',
    gradient: 'from-amber-950/60 via-slate-950/40 to-black',
  },
};

const CASES: CaseConfig[] = [
  {
    id: 'bronze',
    name: 'Bronze Briefcase',
    cost: 10,
    description: 'Starter briefcase containing everyday accessories.',
    bgGrad: 'from-amber-950/30 via-slate-900 to-[#020617]',
    borderClass: 'border-amber-900/40',
    glowClass: 'hover:border-amber-700/60 hover:shadow-[0_0_20px_rgba(180,83,9,0.2)]',
    textColor: 'text-amber-500',
    drops: [
      { id: 'b1', mult: 0.1, label: 'RM Sticker', tier: 'common', iconType: 'sticker', dropRateText: '25% Drop', rarityTag: 'Common' },
      { id: 'b2', mult: 0.2, label: 'Key Ring', tier: 'common', iconType: 'key', dropRateText: '20% Drop', rarityTag: 'Common' },
      { id: 'b3', mult: 0.5, label: 'Luxury Pen', tier: 'common', iconType: 'pen', dropRateText: '18% Drop', rarityTag: 'Common' },
      { id: 'b4', mult: 0.8, label: 'Money Clip', tier: 'common', iconType: 'money_clip', dropRateText: '12% Drop', rarityTag: 'Common' },
      { id: 'b5', mult: 1.0, label: 'Leather Wallet', tier: 'uncommon', iconType: 'wallet', dropRateText: '10% Drop', rarityTag: 'Uncommon' },
      { id: 'b6', mult: 1.2, label: 'Silver Token', tier: 'uncommon', iconType: 'coin', dropRateText: '8% Drop', rarityTag: 'Uncommon' },
      { id: 'b7', mult: 1.5, label: 'Card Case', tier: 'uncommon', iconType: 'card', dropRateText: '4% Drop', rarityTag: 'Uncommon' },
      { id: 'b8', mult: 2.0, label: 'Silver Coin', tier: 'rare', iconType: 'coin', dropRateText: '2.5% Drop', rarityTag: 'Rare' },
      { id: 'b9', mult: 5.0, label: 'Bronze Ring', tier: 'epic', iconType: 'ring', dropRateText: '0.5% Drop', rarityTag: 'Very Rare' },
    ],
  },
  {
    id: 'silver',
    name: 'Silver Safe',
    cost: 50,
    description: 'Mid tier safe containing designer accessories & coins.',
    bgGrad: 'from-slate-800/30 via-slate-900 to-[#020617]',
    borderClass: 'border-slate-700/40',
    glowClass: 'hover:border-slate-400 hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]',
    textColor: 'text-slate-300',
    drops: [
      { id: 's1', mult: 0.2, label: 'Plastic Tokens', tier: 'common', iconType: 'coin', dropRateText: '30% Drop', rarityTag: 'Common' },
      { id: 's2', mult: 0.5, label: 'Brass Cufflinks', tier: 'common', iconType: 'cufflinks', dropRateText: '25% Drop', rarityTag: 'Common' },
      { id: 's3', mult: 1.0, label: 'Leather Belt', tier: 'uncommon', iconType: 'belt', dropRateText: '15% Drop', rarityTag: 'Uncommon' },
      { id: 's4', mult: 1.5, label: 'Designer Tie', tier: 'uncommon', iconType: 'tie', dropRateText: '12% Drop', rarityTag: 'Uncommon' },
      { id: 's5', mult: 2.0, label: 'Aviators', tier: 'uncommon', iconType: 'glasses', dropRateText: '8% Drop', rarityTag: 'Uncommon' },
      { id: 's6', mult: 3.0, label: 'Silver Ring', tier: 'rare', iconType: 'ring', dropRateText: '5% Drop', rarityTag: 'Rare' },
      { id: 's7', mult: 5.0, label: 'Premium Pen', tier: 'rare', iconType: 'pen', dropRateText: '3.5% Drop', rarityTag: 'Rare' },
      { id: 's8', mult: 15.0, label: 'Platinum Coin', tier: 'epic', iconType: 'coin', dropRateText: '1.5% Drop', rarityTag: 'Very Rare' },
    ],
  },
  {
    id: 'gold',
    name: 'Gold Vault',
    cost: 250,
    description: 'Premium vault containing gold bullion and luxury watches.',
    bgGrad: 'from-yellow-950/20 via-slate-900 to-[#020617]',
    borderClass: 'border-yellow-950/60',
    glowClass: 'hover:border-yellow-500/40 hover:shadow-[0_0_25px_rgba(234,179,8,0.25)]',
    textColor: 'text-yellow-500',
    drops: [
      { id: 'g1', mult: 0.5, label: 'Faux Portfolio', tier: 'common', iconType: 'briefcase', dropRateText: '35% Drop', rarityTag: 'Common' },
      { id: 'g2', mult: 1.0, label: 'Gold Cufflinks', tier: 'common', iconType: 'cufflinks', dropRateText: '25% Drop', rarityTag: 'Common' },
      { id: 'g3', mult: 1.5, label: 'Fountain Pen', tier: 'uncommon', iconType: 'pen', dropRateText: '15% Drop', rarityTag: 'Uncommon' },
      { id: 'g4', mult: 2.0, label: 'VIP Cardholder', tier: 'uncommon', iconType: 'card', dropRateText: '12% Drop', rarityTag: 'Uncommon' },
      { id: 'g5', mult: 5.0, label: 'Gold Bar 1g', tier: 'rare', iconType: 'gold_bar', dropRateText: '7% Drop', rarityTag: 'Rare' },
      { id: 'g6', mult: 10.0, label: 'Platinum Ring', tier: 'rare', iconType: 'ring', dropRateText: '4% Drop', rarityTag: 'Rare' },
      { id: 'g7', mult: 25.0, label: 'Gold Bar 10g', tier: 'epic', iconType: 'gold_bar', dropRateText: '1.5% Drop', rarityTag: 'Very Rare' },
      { id: 'g8', mult: 50.0, label: 'Swiss Watch', tier: 'legendary', iconType: 'watch', dropRateText: '0.5% Drop', rarityTag: 'Ultra Rare' },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond Case',
    cost: 1000,
    description: 'High roller elite briefcase. Contains diamonds & supercar keys.',
    bgGrad: 'from-blue-950/30 via-slate-900 to-[#020617]',
    borderClass: 'border-blue-900/40',
    glowClass: 'hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
    textColor: 'text-blue-400',
    drops: [
      { id: 'd1', mult: 0.1, label: 'Broken Diamond', tier: 'common', iconType: 'broken_gem', dropRateText: '30% Drop', rarityTag: 'Common' },
      { id: 'd2', mult: 0.3, label: 'Fake Gem', tier: 'common', iconType: 'gem', dropRateText: '25% Drop', rarityTag: 'Common' },
      { id: 'd3', mult: 0.7, label: 'Zirconia Studs', tier: 'common', iconType: 'cufflinks', dropRateText: '18% Drop', rarityTag: 'Common' },
      { id: 'd4', mult: 1.0, label: 'Croco Cardholder', tier: 'uncommon', iconType: 'card', dropRateText: '10% Drop', rarityTag: 'Uncommon' },
      { id: 'd5', mult: 1.5, label: 'Elite Cufflinks', tier: 'uncommon', iconType: 'cufflinks', dropRateText: '8% Drop', rarityTag: 'Uncommon' },
      { id: 'd6', mult: 2.0, label: 'Silk Pocket Square', tier: 'uncommon', iconType: 'pocket_square', dropRateText: '5% Drop', rarityTag: 'Uncommon' },
      { id: 'd7', mult: 5.0, label: 'Diamond Cufflinks', tier: 'rare', iconType: 'gem', dropRateText: '2.5% Drop', rarityTag: 'Rare' },
      { id: 'd8', mult: 10.0, label: 'Sapphire Ring', tier: 'rare', iconType: 'ring', dropRateText: '1.0% Drop', rarityTag: 'Rare' },
      { id: 'd9', mult: 50.0, label: 'Diamond Watch', tier: 'epic', iconType: 'watch', dropRateText: '0.4% Drop', rarityTag: 'Very Rare' },
      { id: 'd10', mult: 150.0, label: 'Supercar Key', tier: 'legendary', iconType: 'car', dropRateText: '0.1% Drop', rarityTag: 'Ultra Rare' },
    ],
  },
];

const ItemIcon = ({ iconType, className = 'w-6 h-6' }: { iconType: string; className?: string }) => {
  switch (iconType) {
    case 'watch':
      return <Watch className={`${className} text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]`} />;
    case 'car':
      return <Car className={`${className} text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]`} />;
    case 'gold_bar':
      return <Box className={`${className} text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.7)]`} />;
    case 'gem':
      return <Gem className={`${className} text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.7)]`} />;
    case 'broken_gem':
      return <AlertTriangle className={`${className} text-slate-400`} />;
    case 'ring':
      return <Crown className={`${className} text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]`} />;
    case 'wallet':
      return <Wallet className={`${className} text-emerald-400`} />;
    case 'pen':
      return <PenTool className={`${className} text-blue-400`} />;
    case 'card':
      return <CreditCard className={`${className} text-indigo-400`} />;
    case 'key':
      return <Key className={`${className} text-amber-300`} />;
    case 'briefcase':
      return <Briefcase className={`${className} text-slate-300`} />;
    case 'glasses':
      return <Glasses className={`${className} text-teal-400`} />;
    case 'coin':
      return <Coins className={`${className} text-amber-400`} />;
    case 'sticker':
      return <Tag className={`${className} text-slate-400`} />;
    case 'money_clip':
      return <Banknote className={`${className} text-emerald-400`} />;
    case 'cufflinks':
      return <Sparkles className={`${className} text-purple-300`} />;
    case 'belt':
      return <Shield className={`${className} text-slate-400`} />;
    case 'tie':
      return <Shirt className={`${className} text-blue-300`} />;
    case 'pocket_square':
      return <Square className={`${className} text-purple-300`} />;
    default:
      return <Sparkles className={`${className} text-slate-400`} />;
  }
};

export default function CasesGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Selected config
  const [selectedCaseId, setSelectedCaseId] = useState<string>('bronze');
  const activeCase = CASES.find(c => c.id === selectedCaseId)!;

  // Unboxing states
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [transitionDuration, setTransitionDuration] = useState<number>(0);
  const [reelItems, setReelItems] = useState<DropItem[]>([]);
  const [winningItem, setWinningItem] = useState<DropItem | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [unboxedResult, setUnboxedResult] = useState<{ item: DropItem; payout: number } | null>(null);

  // Statistics
  const [recentUnboxes, setRecentUnboxes] = useState<{ caseName: string; item: DropItem; payout: number }[]>([]);
  const [stats, setStats] = useState({ totalUnboxes: 0, spent: 0, wins: 0, profit: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_WIDTH = 128; // w-32 = 128px
  const ITEM_GAP = 12; // gap-3 = 12px
  const WINNING_INDEX = 34; // Landing card index (35th card)

  useEffect(() => {
    generateDecorativeReel();
  }, [selectedCaseId]);

  const generateDecorativeReel = () => {
    const items: DropItem[] = [];
    const pool = activeCase.drops;
    for (let i = 0; i < 45; i++) {
      items.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setReelItems(items);
    setTransitionDuration(0);
    setOffset(0);
    setWinningItem(null);
    setUnboxedResult(null);
  };

  const handleUnbox = () => {
    if (isSpinning) return;
    if (activeCase.cost > credits) {
      alert('Insufficient balance.');
      return;
    }

    const success = deductCredits(activeCase.cost);
    if (!success) return;

    playClick();
    setIsSpinning(true);
    setUnboxedResult(null);
    setWinningItem(null);

    // Reset reel translation instantly
    setTransitionDuration(0);
    setOffset(0);

    // 1. Generate unboxing items pool
    const newReel: DropItem[] = [];
    const pool = activeCase.drops;

    // Fill first 34 items randomly
    for (let i = 0; i < WINNING_INDEX; i++) {
      newReel.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // Determine winning item weighted pool
    const roll = Math.random() * 100;
    let targetTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
    if (roll < 0.5) targetTier = 'legendary';
    else if (roll < 2.5) targetTier = 'epic';
    else if (roll < 10) targetTier = 'rare';
    else if (roll < 25) targetTier = 'uncommon';

    let matchedDrops = pool.filter(d => d.tier === targetTier);
    if (matchedDrops.length === 0) {
      matchedDrops = pool.filter(d => d.tier === 'rare');
    }
    if (matchedDrops.length === 0) {
      matchedDrops = pool;
    }

    const winItem = matchedDrops[Math.floor(Math.random() * matchedDrops.length)];
    newReel.push(winItem); // index 34
    setWinningItem(winItem);

    // Fill remaining 10 items randomly
    for (let i = 0; i < 10; i++) {
      newReel.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    setReelItems(newReel);

    // 2. Calculate transform offset
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const itemFullSize = ITEM_WIDTH + ITEM_GAP;
    const centerPoint = WINNING_INDEX * itemFullSize + ITEM_WIDTH / 2;
    const randomShift = (Math.random() - 0.5) * 70;
    const finalOffset = -(centerPoint + randomShift - containerWidth / 2);

    setTimeout(() => {
      setTransitionDuration(4000);
      setOffset(finalOffset);
    }, 50);

    // 3. Play tick sounds
    const tickTimeouts = [
      100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
      1120, 1240, 1360, 1480, 1600, 1740, 1880, 2020, 2160, 2300,
      2460, 2620, 2780, 2940, 3100, 3280, 3460, 3640, 3840, 4040,
      4260, 4500
    ];

    tickTimeouts.forEach(delay => {
      setTimeout(() => {
        if (isSpinning) playPlop();
      }, delay * 0.8);
    });

    // 4. Handle win completion
    setTimeout(() => {
      setIsSpinning(false);
      const payout = Math.round(activeCase.cost * winItem.mult * 100) / 100;
      addCredits(payout);
      addHistoryItem(`${activeCase.name} Open`, activeCase.cost, winItem.mult, payout, winItem.mult >= 1.0 ? 'win' : 'loss');

      setUnboxedResult({ item: winItem, payout });

      setStats(prev => ({
        totalUnboxes: prev.totalUnboxes + 1,
        spent: prev.spent + activeCase.cost,
        wins: prev.wins + (winItem.mult >= 1.0 ? 1 : 0),
        profit: prev.profit + (payout - activeCase.cost)
      }));

      setRecentUnboxes(prev => [
        { caseName: activeCase.name, item: winItem, payout },
        ...prev.slice(0, 9)
      ]);

      if (winItem.mult >= 2.0) {
        playWin();
        triggerWinConfetti();
      } else {
        playLoss();
      }
    }, 4100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 flex-grow">
      
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
        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Luxury Case Unboxing
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Middle Panels: The Cases & Carousel Spinner */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main Unboxing Wheel Section */}
          <Card className="bg-[#0b0b0b] border-luxury-border p-6 flex flex-col items-center justify-center gap-6 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
            
            <div className="text-center">
              <h2 className="text-base font-extrabold tracking-wider uppercase text-white">
                UNBOXING TRACK: {activeCase.name}
              </h2>
              <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-1">
                Cost to unbox: <span className="text-blue-400 font-bold">${activeCase.cost}</span>
              </p>
            </div>

            {/* Spinner Container */}
            <div 
              ref={containerRef}
              className="w-full h-52 bg-black/80 border border-luxury-border/80 rounded-2xl relative overflow-hidden flex items-center shadow-inner"
            >
              {/* Pointer center marker */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.9)] z-20 -translate-x-1/2">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-blue-500"></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[8px] border-b-blue-500"></div>
              </div>

              {/* Slider track */}
              <div 
                className="flex gap-3 px-4 transition-transform cubic-bezier(0.1, 0.8, 0.15, 1)"
                style={{ 
                  transform: `translateX(${offset}px)`,
                  transitionDuration: `${transitionDuration}ms`,
                  width: `${reelItems.length * (ITEM_WIDTH + ITEM_GAP)}px`
                }}
              >
                {reelItems.map((item, index) => {
                  const colors = TIER_COLORS[item.tier];
                  const isWinningSpot = index === WINNING_INDEX && !isSpinning && winningItem;
                  return (
                    <div 
                      key={index}
                      className={`w-32 h-44 shrink-0 rounded-2xl border flex flex-col justify-between p-2.5 transition-all select-none relative overflow-hidden bg-gradient-to-b ${colors.gradient} ${colors.border} ${isWinningSpot ? `${colors.glow} scale-105 border-white/60 bg-black/70 z-10` : ''}`}
                    >
                      {/* Top Tier Badge */}
                      <div className="flex justify-between items-center w-full z-10">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.badgeBg}`}>
                          {item.tier}
                        </span>
                        <span className="text-[8px] font-extrabold text-neutral-400">
                          {item.dropRateText}
                        </span>
                      </div>

                      {/* Center Real Icon Box */}
                      <div className="relative flex items-center justify-center my-auto py-1 z-10">
                        <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${colors.iconBg} shadow-inner`}>
                          <ItemIcon iconType={item.iconType} className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Small text note under icon & Multiplier */}
                      <div className="flex flex-col items-center gap-1 w-full text-center z-10">
                        <span className="text-[10px] font-bold text-white text-center leading-tight truncate w-full px-0.5">
                          {item.label}
                        </span>

                        <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border w-full text-center ${colors.badgeBg}`}>
                          {item.mult.toFixed(1)}x Multi
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                onClick={handleUnbox}
                disabled={isSpinning || credits < activeCase.cost}
                className="px-10 py-3 flex items-center gap-2 font-black uppercase tracking-widest text-xs min-w-[190px]"
              >
                <Play className="w-4 h-4 fill-black" />
                {isSpinning ? 'Unboxing...' : `Unbox ($${activeCase.cost})`}
              </Button>
              {!isSpinning && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={generateDecorativeReel}
                  className="font-bold text-xs"
                >
                  Shuffle Reel
                </Button>
              )}
            </div>

            {/* Outcome Modal Overlay with Real Icon */}
            {unboxedResult && !isSpinning && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fade-in rounded-2xl">
                <div className={`w-80 bg-[#080c16] border-2 ${TIER_COLORS[unboxedResult.item.tier].border} rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative animate-pop-in`}>
                  
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-3 ${TIER_COLORS[unboxedResult.item.tier].badgeBg}`}>
                    {unboxedResult.item.rarityTag} Item Unboxed!
                  </span>

                  {/* Big Item Icon */}
                  <div className={`p-4 rounded-3xl border ${TIER_COLORS[unboxedResult.item.tier].iconBg} ${TIER_COLORS[unboxedResult.item.tier].glow} mb-3`}>
                    <ItemIcon iconType={unboxedResult.item.iconType} className="w-12 h-12" />
                  </div>

                  {/* Small text note under icon */}
                  <h3 className="text-base font-black text-white mb-1">
                    {unboxedResult.item.label}
                  </h3>

                  {/* Multiplier under text note */}
                  <div className={`text-xs font-black tracking-wider px-3 py-1 rounded-xl border mb-3 ${TIER_COLORS[unboxedResult.item.tier].badgeBg}`}>
                    {unboxedResult.item.mult.toFixed(1)}x Multiplier
                  </div>

                  {/* Payout */}
                  <div className="text-xl font-black text-emerald-400 font-mono mb-4">
                    +${unboxedResult.payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>

                  <Button
                    variant="gold"
                    size="md"
                    onClick={() => setUnboxedResult(null)}
                    className="w-full font-black uppercase text-xs tracking-wider"
                  >
                    Collect & Continue
                  </Button>
                </div>
              </div>
            )}

          </Card>

          {/* Cases Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CASES.map((box) => (
              <Card 
                key={box.id}
                onClick={() => { if (!isSpinning) { playClick(); setSelectedCaseId(box.id); } }}
                className={`bg-[#0a0f1d]/50 border transition-all duration-300 cursor-pointer overflow-hidden p-4 flex flex-col justify-between gap-3 select-none ${box.borderClass} ${box.glowClass} ${selectedCaseId === box.id ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02] bg-blue-950/15' : 'opacity-85 hover:opacity-100'}`}
              >
                <div>
                  <span className={`text-xs font-black uppercase tracking-widest ${box.textColor}`}>{box.name}</span>
                  <p className="text-[10px] text-neutral-500 leading-normal font-medium mt-1 line-clamp-2">{box.description}</p>
                </div>

                {/* Mini Item Icons Preview inside Case */}
                <div className="flex items-center gap-1.5 py-1.5 border-t border-b border-luxury-border/40 my-1 overflow-hidden">
                  {box.drops.slice(0, 4).map((d, i) => (
                    <div key={i} className={`p-1.5 rounded-lg border flex items-center justify-center ${TIER_COLORS[d.tier].iconBg}`} title={d.label}>
                      <ItemIcon iconType={d.iconType} className="w-3.5 h-3.5" />
                    </div>
                  ))}
                  <span className="text-[9px] text-neutral-500 font-bold pl-1">+{box.drops.length - 4} more</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase">Price</span>
                  <span className="text-sm font-extrabold text-white">${box.cost}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Drops Odds Table with Item Icons, Text Notes, and Multipliers */}
          <Card className="bg-[#0b0b0b]/60 border-luxury-border">
            <CardHeader className="p-4 border-b border-luxury-border/60 flex items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                <List className="w-4 h-4 text-blue-400" />
                Case Contents & Multipliers
              </CardTitle>
              <span className="text-[9px] text-neutral-500 font-bold uppercase">Visual Drop Rarity</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeCase.drops.map((drop) => {
                  const colors = TIER_COLORS[drop.tier];
                  return (
                    <div 
                      key={drop.id} 
                      className={`flex flex-col items-center justify-between p-3 bg-gradient-to-b ${colors.gradient} rounded-2xl border ${colors.border} hover:border-luxury-border transition-all duration-300 hover:-translate-y-0.5 group select-none`}
                    >
                      {/* Top Rarity Badge */}
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${colors.badgeBg}`}>
                          {drop.rarityTag}
                        </span>
                        <span className="text-[8px] font-extrabold text-neutral-400">
                          {drop.dropRateText}
                        </span>
                      </div>

                      {/* Real Item Icon */}
                      <div className={`p-2.5 rounded-2xl border my-2 flex items-center justify-center ${colors.iconBg} group-hover:scale-110 transition-transform`}>
                        <ItemIcon iconType={drop.iconType} className="w-7 h-7" />
                      </div>

                      {/* Small Text Note under Icon */}
                      <span className="text-[11px] font-bold text-white text-center truncate w-full mb-1">
                        {drop.label}
                      </span>

                      {/* Multiplier pill under note */}
                      <div className="w-full pt-1.5 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[8px] text-neutral-500 font-medium uppercase">Multi</span>
                        <span className={`text-xs font-black ${colors.text}`}>
                          {drop.mult.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar: Statistics & Recent Drops */}
        <div className="flex flex-col gap-6">
          
          {/* Unboxing Stats */}
          <Card className="bg-[#0b0b0b]/60 border-luxury-border">
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-center text-xs">
              <div className="flex flex-col py-1 border-r border-luxury-border/40">
                <span className="text-neutral-500 font-medium">Total Opened</span>
                <span className="text-white font-extrabold text-base mt-1">{stats.totalUnboxes}</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-neutral-500 font-medium">Total Spent</span>
                <span className="text-white font-extrabold text-base mt-1">${stats.spent}</span>
              </div>
              <div className="flex flex-col py-1 border-t border-r border-luxury-border/40 pt-3">
                <span className="text-neutral-500 font-medium">Win Count</span>
                <span className="text-emerald-400 font-extrabold text-base mt-1">{stats.wins}</span>
              </div>
              <div className="flex flex-col py-1 border-t border-luxury-border/40 pt-3">
                <span className="text-neutral-500 font-medium">Session Profit</span>
                <span className={`font-extrabold text-base mt-1 ${stats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.profit >= 0 ? '+' : ''}${stats.profit.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Unboxed Items Log */}
          <Card className="bg-[#0b0b0b]/60 border-luxury-border">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <CardTitle className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-blue-400" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {recentUnboxes.length === 0 ? (
                <div className="text-[10px] text-neutral-600 text-center py-6">
                  No cases opened in this session yet.
                </div>
              ) : (
                recentUnboxes.map((log, idx) => {
                  const colors = TIER_COLORS[log.item.tier];
                  return (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center p-2.5 bg-black/40 rounded-2xl border border-luxury-border/30 hover:border-luxury-border/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <div className={`p-1.5 rounded-xl border flex items-center justify-center shrink-0 ${colors.iconBg}`}>
                          <ItemIcon iconType={log.item.iconType} className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left truncate">
                          <span className="text-white font-bold text-xs truncate">{log.item.label}</span>
                          <span className="text-[9px] text-neutral-500 font-medium">{log.caseName} • {log.item.rarityTag}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-[10px] font-black ${colors.text}`}>{log.item.mult.toFixed(1)}x Multi</span>
                        <span className="text-emerald-400 font-extrabold text-xs">+${log.payout.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
