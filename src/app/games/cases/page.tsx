'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, Sparkles, History, List, Coins, Gift, Eye } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

interface DropItem {
  mult: number;
  label: string;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface CaseConfig {
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
  common: { text: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-950/40', glow: 'shadow-[0_0_10px_rgba(148,163,184,0.1)]' },
  uncommon: { text: 'text-emerald-400', border: 'border-emerald-800/60', bg: 'bg-emerald-950/20', glow: 'shadow-[0_0_10px_rgba(52,211,153,0.1)]' },
  rare: { text: 'text-blue-400', border: 'border-blue-800/60', bg: 'bg-blue-950/20', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.15)]' },
  epic: { text: 'text-purple-400', border: 'border-purple-800/60', bg: 'bg-purple-950/20', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
  legendary: { text: 'text-amber-400', border: 'border-amber-700/60', bg: 'bg-amber-950/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]' },
};

const CASES: CaseConfig[] = [
  {
    id: 'bronze',
    name: 'Bronze Briefcase',
    cost: 10,
    description: 'Low risk, starter brief for testing your luck.',
    bgGrad: 'from-amber-950/30 via-slate-900 to-[#020617]',
    borderClass: 'border-amber-900/40',
    glowClass: 'hover:border-amber-800 hover:shadow-[0_0_20px_rgba(180,83,9,0.15)]',
    textColor: 'text-amber-500',
    drops: [
      { mult: 0.1, label: 'RM Sticker', tier: 'common' },
      { mult: 0.2, label: 'Key Ring', tier: 'common' },
      { mult: 0.5, label: 'Luxury Pen', tier: 'common' },
      { mult: 0.8, label: 'Money Clip', tier: 'common' },
      { mult: 1.0, label: 'Leather Wallet', tier: 'uncommon' },
      { mult: 1.2, label: 'Silver Token', tier: 'uncommon' },
      { mult: 1.5, label: 'Card Case', tier: 'uncommon' },
      { mult: 2.0, label: 'Silver Coin', tier: 'rare' },
      { mult: 5.0, label: 'Bronze Ring', tier: 'epic' },
    ],
  },
  {
    id: 'silver',
    name: 'Silver Safe',
    cost: 50,
    description: 'Mid tier safe containing designer accessories.',
    bgGrad: 'from-slate-800/30 via-slate-900 to-[#020617]',
    borderClass: 'border-slate-700/40',
    glowClass: 'hover:border-slate-500 hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]',
    textColor: 'text-slate-300',
    drops: [
      { mult: 0.2, label: 'Plastic Tokens', tier: 'common' },
      { mult: 0.5, label: 'Brass Cufflinks', tier: 'common' },
      { mult: 1.0, label: 'Leather Belt', tier: 'uncommon' },
      { mult: 1.5, label: 'Designer Tie', tier: 'uncommon' },
      { mult: 2.0, label: 'Aviators', tier: 'uncommon' },
      { mult: 3.0, label: 'Silver Ring', tier: 'rare' },
      { mult: 5.0, label: 'Premium Pen', tier: 'rare' },
      { mult: 15.0, label: 'Platinum Coin', tier: 'epic' },
    ],
  },
  {
    id: 'gold',
    name: 'Gold Vault',
    cost: 250,
    description: 'Premium vault containing precious bullion and watches.',
    bgGrad: 'from-yellow-950/20 via-slate-900 to-[#020617]',
    borderClass: 'border-yellow-950/60',
    glowClass: 'hover:border-yellow-500/40 hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]',
    textColor: 'text-yellow-500',
    drops: [
      { mult: 0.5, label: 'Faux Portfolio', tier: 'common' },
      { mult: 1.0, label: 'Gold Cufflinks', tier: 'common' },
      { mult: 1.5, label: 'Fountain Pen', tier: 'uncommon' },
      { mult: 2.0, label: 'VIP Cardholder', tier: 'uncommon' },
      { mult: 5.0, label: 'Gold Bar 1g', tier: 'rare' },
      { mult: 10.0, label: 'Platinum Ring', tier: 'rare' },
      { mult: 25.0, label: 'Gold Bar 10g', tier: 'epic' },
      { mult: 50.0, label: 'Swiss Watch', tier: 'legendary' },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond Case',
    cost: 1000,
    description: 'High roller elite briefcase. Massive multipliers.',
    bgGrad: 'from-blue-950/30 via-slate-900 to-[#020617]',
    borderClass: 'border-blue-900/40',
    glowClass: 'hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    textColor: 'text-blue-400',
    drops: [
      { mult: 0.1, label: 'Broken Diamond', tier: 'common' },
      { mult: 0.3, label: 'Fake Gem', tier: 'common' },
      { mult: 0.7, label: 'Zirconia Studs', tier: 'common' },
      { mult: 1.0, label: 'Croco Cardholder', tier: 'uncommon' },
      { mult: 1.5, label: 'Elite Cufflinks', tier: 'uncommon' },
      { mult: 2.0, label: 'Silk Pocket Square', tier: 'uncommon' },
      { mult: 5.0, label: 'Diamond Cufflinks', tier: 'rare' },
      { mult: 10.0, label: 'Sapphire Ring', tier: 'rare' },
      { mult: 50.0, label: 'Diamond Watch', tier: 'epic' },
      { mult: 150.0, label: 'Supercar Key', tier: 'legendary' },
    ],
  },
];

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
  const ITEM_WIDTH = 112; // w-28 = 112px
  const ITEM_GAP = 10; // gap-2.5 = 10px
  const WINNING_INDEX = 34; // Landing card index (35th card)

  // Pre-fill a static random set of cards just for visual decoration before first spin
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

    // Determine winning item (based on random case weights)
    // We make it more greedy:
    // Common: 75% (was 50%), Uncommon: 15% (was 30%), Rare: 7.5% (was 15%), Epic: 2% (was 4%), Legendary: 0.5% (was 1%)
    const roll = Math.random() * 100;
    let targetTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
    if (roll < 0.5) targetTier = 'legendary';
    else if (roll < 2.5) targetTier = 'epic';
    else if (roll < 10) targetTier = 'rare';
    else if (roll < 25) targetTier = 'uncommon';

    // Fallback if the case doesn't have epic/legendary drops
    let matchedDrops = pool.filter(d => d.tier === targetTier);
    if (matchedDrops.length === 0) {
      matchedDrops = pool.filter(d => d.tier === 'rare');
    }
    if (matchedDrops.length === 0) {
      matchedDrops = pool; // ultimate fallback
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
    // Center of container is where the line is
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const itemFullSize = ITEM_WIDTH + ITEM_GAP;
    // Exact center alignment of card index 34
    const centerPoint = WINNING_INDEX * itemFullSize + ITEM_WIDTH / 2;
    // Add random sub-card offset (-45px to +45px) so the needle lands in a slightly organic spot each time
    const randomShift = (Math.random() - 0.5) * 80;
    const finalOffset = -(centerPoint + randomShift - containerWidth / 2);

    // Apply offset slightly after render to trigger CSS transition
    setTimeout(() => {
      setTransitionDuration(4000);
      setOffset(finalOffset);
    }, 50);

    // 3. Play scrolling click/tick sounds
    // Decelerating time delays for ticks:
    const tickTimeouts = [
      100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
      1120, 1240, 1360, 1480, 1600, 1740, 1880, 2020, 2160, 2300,
      2460, 2620, 2780, 2940, 3100, 3280, 3460, 3640, 3840, 4040,
      4260, 4500, 4760, 5040
    ];

    tickTimeouts.forEach(delay => {
      setTimeout(() => {
        if (isSpinning) playPlop();
      }, delay * 0.8); // Scale down slightly to complete ticks in ~4s
    });

    // 4. Handle win completion
    setTimeout(() => {
      setIsSpinning(false);
      const payout = Math.round(activeCase.cost * winItem.mult * 100) / 100;
      addCredits(payout);
      addHistoryItem(`${activeCase.name} Open`, activeCase.cost, winItem.mult, payout, winItem.mult >= 1.0 ? 'win' : 'loss');

      setUnboxedResult({ item: winItem, payout });

      // Stat updates
      setStats(prev => ({
        totalUnboxes: prev.totalUnboxes + 1,
        spent: prev.spent + activeCase.cost,
        wins: prev.wins + (winItem.mult >= 1.0 ? 1 : 0),
        profit: prev.profit + (payout - activeCase.cost)
      }));

      // History updates
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
    }, 4100); // Wait for transition duration (4000ms) plus small buffer
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
        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Luxury Case Unboxing
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Middle Panels: The Cases & Carousel Spinner */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main Unboxing Wheel Section */}
          <Card className="bg-[#0b0b0b] border-luxury-border p-6 flex flex-col items-center justify-center gap-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"></div>
            
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
              className="w-full h-36 bg-black/60 border border-luxury-border rounded-2xl relative overflow-hidden flex items-center shadow-inner"
            >
              {/* Pointer center marker */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20 -translate-x-1/2">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-500"></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-blue-500"></div>
              </div>

              {/* Slider track */}
              <div 
                className="flex gap-2.5 px-4 transition-transform cubic-bezier(0.1, 0.8, 0.15, 1)"
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
                      className={`w-28 h-28 shrink-0 rounded-xl border flex flex-col justify-between p-2.5 transition-all select-none ${colors.bg} ${colors.border} ${colors.text} ${isWinningSpot ? `${colors.glow} scale-105 border-white/50 bg-black/45` : ''}`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">{item.tier}</span>
                      
                      <div className="flex flex-col items-center gap-1.5 my-auto">
                        <span className="text-xs font-black text-white text-center leading-tight truncate w-full">{item.label}</span>
                        <span className="text-[10px] font-black tracking-wide">{item.mult}x</span>
                      </div>
                      
                      <span className="text-[7px] text-center text-neutral-600 font-extrabold uppercase">RainMoney</span>
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
                className="px-10 py-3 flex items-center gap-2 font-black uppercase tracking-widest text-xs min-w-[180px]"
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

            {/* Outcome Overlay */}
            <WinLoseOverlay
              isOpen={!isSpinning && !!unboxedResult}
              onClose={() => setUnboxedResult(null)}
              outcome={unboxedResult && unboxedResult.item.mult >= 1.0 ? 'win' : 'loss'}
              multiplier={unboxedResult ? unboxedResult.item.mult : 0}
              payout={unboxedResult ? unboxedResult.payout : 0}
            />

          </Card>

          {/* Cases Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CASES.map((box) => (
              <Card 
                key={box.id}
                onClick={() => { if (!isSpinning) { playClick(); setSelectedCaseId(box.id); } }}
                className={`bg-[#0a0f1d]/50 border transition-all duration-300 cursor-pointer overflow-hidden p-5 flex flex-col justify-between gap-4 select-none ${box.borderClass} ${box.glowClass} ${selectedCaseId === box.id ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02] bg-blue-950/10' : 'opacity-85 hover:opacity-100'}`}
              >
                <div>
                  <span className={`text-xs font-black uppercase tracking-widest ${box.textColor}`}>{box.name}</span>
                  <p className="text-[10px] text-neutral-500 leading-normal font-medium mt-1">{box.description}</p>
                </div>
                <div className="flex justify-between items-center border-t border-luxury-border/60 pt-3">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase">Price</span>
                  <span className="text-sm font-extrabold text-white">${box.cost}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Drops Odds Table */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-luxury-border/60 flex items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                <List className="w-4 h-4 text-blue-400" />
                Case Contents & Multipliers
              </CardTitle>
              <span className="text-[8px] text-neutral-500 font-bold uppercase">Weighted Outcomes</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {activeCase.drops.map((drop, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center p-2.5 bg-black/35 rounded-xl border border-luxury-border/40 text-xs font-medium text-neutral-400 hover:border-luxury-border transition-colors"
                  >
                    <span className="truncate pr-1.5">{drop.label}</span>
                    <span className={`font-bold shrink-0 ${TIER_COLORS[drop.tier].text}`}>
                      {drop.mult.toFixed(1)}x
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar: Statistics & Recent Drops */}
        <div className="flex flex-col gap-6">
          
          {/* Unboxing Stats */}
          <Card className="bg-[#0b0b0b]/60">
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
          <Card className="bg-[#0b0b0b]/60">
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
                recentUnboxes.map((log, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-luxury-border/20 text-xs text-neutral-300 hover:bg-black/30 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-neutral-300 font-bold">{log.item.label}</span>
                      <span className="text-[9px] text-neutral-500 font-medium mt-0.5">{log.caseName}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-[10px] font-black uppercase ${TIER_COLORS[log.item.tier].text}`}>{log.item.mult}x</span>
                      <span className="text-neutral-200 font-extrabold mt-0.5">+${log.payout.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
