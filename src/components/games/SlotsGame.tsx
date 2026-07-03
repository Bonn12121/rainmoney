'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Sparkles, HelpCircle, RotateCw, FastForward, CheckCircle2 } from 'lucide-react';
import { SlotTheme, SlotSymbol } from '@/utils/slotThemes';
import { SlotSymbolIcon } from './SlotSymbolIcon';

interface SlotsGameProps {
  theme: SlotTheme;
}

const PAYLINES = [
  { id: 1, path: [1, 1, 1, 1, 1], name: 'Center line', color: '#3b82f6' },
  { id: 2, path: [0, 0, 0, 0, 0], name: 'Top line', color: '#ef4444' },
  { id: 3, path: [2, 2, 2, 2, 2], name: 'Bottom line', color: '#10b981' },
  { id: 4, path: [0, 1, 2, 1, 0], name: 'V-Shape', color: '#ca8a04' },
  { id: 5, path: [2, 1, 0, 1, 2], name: 'Inverted V-Shape', color: '#a855f7' },
];

export default function SlotsGame({ theme }: SlotsGameProps) {
  const { credits, addCredits, deductCredits, addHistoryItem, language } = useGameState();
  const { playClick, playPlop, playWin, playLoss } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  
  // 5x3 Grid state (Reels)
  const [grid, setGrid] = useState<SlotSymbol[][]>([
    [theme.symbols[1], theme.symbols[2], theme.symbols[3]],
    [theme.symbols[2], theme.symbols[3], theme.symbols[4]],
    [theme.symbols[3], theme.symbols[4], theme.symbols[5]],
    [theme.symbols[4], theme.symbols[5], theme.symbols[6]],
    [theme.symbols[5], theme.symbols[6], theme.symbols[7] || theme.symbols[1]],
  ]);

  // Spinning states for individual reels (for delay stops)
  const [reelStates, setReelStates] = useState<('idle' | 'spinning' | 'settling')[]>(['idle', 'idle', 'idle', 'idle', 'idle']);

  const [turboMode, setTurboMode] = useState<boolean>(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  
  // Win outcome displays
  const [winAmount, setWinAmount] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winningLines, setWinningLines] = useState<number[]>([]); // indexes of PAYLINES
  const [spinOutcomeText, setSpinOutcomeText] = useState<string | null>(null);

  const autoPlayRef = useRef<boolean>(autoPlay);
  const isSpinningRef = useRef<boolean>(isSpinning);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  // Handle Autoplay Loop
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      if (!isSpinningRef.current && autoPlayRef.current) {
        handleSpin();
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [autoPlay]);

  // Evaluate Wins
  const evaluateGrid = (finalGrid: SlotSymbol[][], currentBet: number) => {
    const betPerLine = currentBet / 5;
    let totalPayout = 0;
    const linesWon: number[] = [];
    const explanations: string[] = [];

    // Evaluate each payline
    PAYLINES.forEach((line, paylineIdx) => {
      // Get the symbols along the path
      const lineSymbols = line.path.map((rowIdx, colIdx) => finalGrid[colIdx][rowIdx]);
      
      // Find the first non-wild symbol
      let firstNonWild: SlotSymbol | null = null;
      for (const sym of lineSymbols) {
        if (!sym.isWild) {
          firstNonWild = sym;
          break;
        }
      }

      // If all are wild, evaluate it using the highest value symbol (excluding Wild)
      const targetSym = firstNonWild || theme.symbols.find(s => !s.isWild) || theme.symbols[1];

      // Count matching prefix (either matching targetSym or Wild)
      let matchCount = 0;
      for (let i = 0; i < lineSymbols.length; i++) {
        const sym = lineSymbols[i];
        if (sym.isWild || sym.name === targetSym.name) {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= 3) {
        let mult = 0;
        if (matchCount === 3) mult = targetSym.multiplier3;
        else if (matchCount === 4) mult = targetSym.multiplier4;
        else if (matchCount === 5) mult = targetSym.multiplier5;

        const linePayout = betPerLine * mult;
        if (linePayout > 0) {
          totalPayout += linePayout;
          linesWon.push(paylineIdx);
          explanations.push(
            `${matchCount}x ${targetSym.char} on ${line.name} (${mult}x)`
          );
        }
      }
    });

    return {
      payout: totalPayout,
      linesWon,
      explanation: explanations.join(' | ')
    };
  };

  const finalizeSpin = (finalGrid: SlotSymbol[][]) => {
    const result = evaluateGrid(finalGrid, betAmount);
    
    if (result.payout > 0) {
      const roundedPayout = Math.round(result.payout * 100) / 100;
      addCredits(roundedPayout);
      setWinAmount(roundedPayout);
      setLastWin(roundedPayout);
      setWinningLines(result.linesWon);
      setSpinOutcomeText(result.explanation);
      
      playWin();
      if (roundedPayout >= betAmount * 5) {
        triggerWinConfetti();
      }

      addHistoryItem(
        theme.name,
        betAmount,
        Math.round((roundedPayout / betAmount) * 100) / 100,
        roundedPayout,
        'win'
      );
    } else {
      setWinAmount(0);
      playLoss();
      addHistoryItem(theme.name, betAmount, 0, 0, 'loss');
    }

    setIsSpinning(false);
  };

  const handleSpin = () => {
    if (isSpinningRef.current) return;
    if (betAmount <= 0 || betAmount > credits) {
      setAutoPlay(false);
      alert(language === 'vi' ? 'Tiền cược không hợp lệ hoặc số dư không đủ.' : 'Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) {
      setAutoPlay(false);
      return;
    }

    setIsSpinning(true);
    setWinAmount(0);
    setWinningLines([]);
    setSpinOutcomeText(null);
    playClick();

    // Set all reels to spinning
    setReelStates(['spinning', 'spinning', 'spinning', 'spinning', 'spinning']);

    // Generate final grid
    const finalGrid = Array.from({ length: 5 }, () => [
      theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
      theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
      theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
    ]);

    // Staggered reel stop times
    const baseDelay = turboMode ? 250 : 750;
    const stagger = turboMode ? 100 : 350;

    // Optional ticking plops during spin
    const tickerInterval = setInterval(() => {
      playPlop();
    }, 120);

    for (let colIdx = 0; colIdx < 5; colIdx++) {
      const delay = baseDelay + colIdx * stagger;
      setTimeout(() => {
        // Change state to settling for the physics animation
        setReelStates(prev => {
          const next = [...prev];
          next[colIdx] = 'settling';
          return next;
        });

        // Set final values in grid
        setGrid(prevGrid => {
          const nextGrid = [...prevGrid];
          nextGrid[colIdx] = finalGrid[colIdx];
          return nextGrid;
        });

        playPlop();

        // Statically settle after bounce keyframe animation (250ms)
        setTimeout(() => {
          setReelStates(prev => {
            const next = [...prev];
            next[colIdx] = 'idle';
            return next;
          });

          if (colIdx === 4) {
            clearInterval(tickerInterval);
            finalizeSpin(finalGrid);
          }
        }, 250);
      }, delay);
    }
  };

  const renderThemeDecorations = (themeId: string) => {
    switch (themeId) {
      case 'slots-egypt':
        return (
          <>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/sandpaper.png')] opacity-[0.04] pointer-events-none" />
            <div className="absolute top-2 left-4 text-[10px] text-yellow-600/30 uppercase font-serif tracking-widest pointer-events-none">𓁹 𓆃 𓀀 𓋹 𓃠 𓅓𓆗𓏠</div>
            <div className="absolute bottom-2 right-4 text-[10px] text-yellow-600/30 uppercase font-serif tracking-widest pointer-events-none">𓋹 𓁾 𓃗 𓏏 𓅱 𓍯 𓎼</div>
          </>
        );
      case 'slots-cyber':
        return (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489906_1px,transparent_1px),linear-gradient(to_bottom,#ec489906_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute top-2 right-4 text-[8px] text-cyan-500/40 uppercase font-mono tracking-widest pointer-events-none">SYS.STATUS: CONNECTED // MULTIPLIER: 99.8%</div>
          </>
        );
      case 'slots-sweet':
        return (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ec489910_2px,transparent_2px)] bg-[size:16px_16px] pointer-events-none" />
          </>
        );
      case 'slots-pirate':
        return (
          <>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-wood.png')] opacity-20 pointer-events-none" />
            <div className="absolute bottom-2 left-4 text-[9px] text-orange-500/30 font-black tracking-widest pointer-events-none">⚓ DEAD MAN'S CHEST</div>
          </>
        );
      case 'slots-zeus':
        return (
          <>
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-violet-600/10 blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-yellow-500/10 blur-[60px] pointer-events-none" />
            <div className="absolute top-2 left-4 text-[9px] text-violet-400/40 font-black tracking-widest pointer-events-none">⚡ OLYMPUS POWER</div>
          </>
        );
      case 'slots-undersea':
        return (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-sky-950/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-6 text-[9px] text-cyan-400/30 font-bold uppercase tracking-widest pointer-events-none">🫧 UNDERWATER AQUARIUM</div>
          </>
        );
      case 'slots-neon':
        return (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98106_1px,transparent_1px),linear-gradient(to_bottom,#10b98106_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            <div className="absolute top-2 left-4 text-[8px] text-emerald-400/40 font-black tracking-widest pointer-events-none">⚡ RETRO FRUIT CLUB ⚡</div>
          </>
        );
      case 'slots-safari':
        return (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-lime-950/10 via-transparent to-lime-950/10 pointer-events-none" />
            <div className="absolute top-2 right-4 text-[9px] text-lime-400/30 font-black tracking-widest pointer-events-none">🐾 WILD SAVANNA</div>
          </>
        );
      case 'slots-dragon':
        return (
          <>
            <div className="absolute top-2.5 left-4 text-[10px] text-yellow-500/50 font-black tracking-widest pointer-events-none flex items-center gap-1.5 drop-shadow">
              <span>🏮</span>
              <span>DRAGON FORTUNE SLOTS</span>
              <span>🏮</span>
            </div>
            <div className="absolute top-2.5 right-4 text-[9px] text-yellow-500/50 font-extrabold uppercase tracking-widest pointer-events-none drop-shadow">
              🌸 CHERRY BLOSSOM SPECIAL 🌸
            </div>
          </>
        );
      case 'slots-irish':
        return (
          <>
            <div className="absolute bottom-2 right-4 text-[9px] text-green-500/30 font-black tracking-widest pointer-events-none">🍀 POT OF GOLD 🌈</div>
          </>
        );
      default:
        return null;
    }
  };

  const handleAdjustBet = (amount: number) => {
    playClick();
    setBetAmount(Math.max(1, amount));
  };

  const renderFeltSymbol = (symbol: SlotSymbol, index: number, isReelSpinning: boolean) => {
    return (
      <div 
        key={index} 
        className={`flex flex-col items-center justify-center rounded-2xl bg-black/60 border border-white/[0.04] p-3 text-2xl sm:text-4xl transition-all select-none w-full h-[calc((100%-16px)/3)] sm:h-[calc((100%-24px)/3)] flex-shrink-0 ${
          isReelSpinning ? 'blur-[1.5px] scale-95 opacity-80 animate-pulse' : 'hover:scale-105'
        }`}
      >
        <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {symbol.iconKey ? (
            <SlotSymbolIcon themeId={theme.id} symbolName={symbol.name} className="w-12 h-12 sm:w-14 sm:h-14" fallbackChar={symbol.char} />
          ) : (
            <span className={symbol.colorClass || 'text-white'}>{symbol.char}</span>
          )}
        </span>
        <span className="text-[7px] text-neutral-500 font-extrabold uppercase mt-1 tracking-widest leading-none block select-none">
          {symbol.name}
        </span>
      </div>
    );
  };

  const paytableTranslations = {
    en: {
      rules: 'Paytable & Rules',
      paylines: '5 Active Paylines',
      paylinesDesc: 'Matches must start from the leftmost reel and continue consecutively along active paylines. Wild matches any symbol.',
      symbolName: 'Symbol',
      matches: 'Payout Multipliers',
      wild: 'Wild (Substitutes any symbol)',
      close: 'Close',
      turbo: 'Turbo',
      auto: 'Auto',
      spin: 'SPIN',
      balance: 'Balance',
      bet: 'Total Bet',
      win: 'Win',
      lastWin: 'Last Win',
      howToWin: 'Matching 3, 4, or 5 of the same symbol pays:'
    },
    vi: {
      rules: 'Bảng Thưởng & Luật',
      paylines: '5 Đường Thưởng Hoạt Động',
      paylinesDesc: 'Các kết hợp thắng phải bắt đầu từ cuộn ngoài cùng bên trái và tiếp tục liên tiếp trên đường thưởng. Wild thay thế mọi biểu tượng.',
      symbolName: 'Biểu tượng',
      matches: 'Hệ Số Nhân Thưởng',
      wild: 'Wild (Thay thế mọi biểu tượng)',
      close: 'Đóng',
      turbo: 'Turbo',
      auto: 'Tự Động',
      spin: 'QUAY',
      balance: 'Số Dư',
      bet: 'Tổng Cược',
      win: 'Thắng',
      lastWin: 'Thắng Lần Trước',
      howToWin: 'Khớp 3, 4, hoặc 5 biểu tượng cùng loại để nhận:'
    }
  };

  const t = paytableTranslations[language === 'vi' ? 'vi' : 'en'];

  return (
    <div className="relative w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 overflow-hidden -mx-4 -my-10 sm:-mx-6 lg:-mx-8">
      {/* Dynamic ambient page glow depending on the theme */}
      <div 
        className="absolute inset-0 transition-all duration-750 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 25%, ${theme.themeColorGlow}22 0%, transparent 65%), #030408`
        }}
      />
      
      {/* Full-bleed themed background illustrations */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-750 z-0">
        {theme.id === 'slots-cyber' && (
          <div className="w-full h-full bg-[url('/images/slots_cyber_bg.png')] bg-cover bg-center opacity-30" />
        )}
        {theme.id === 'slots-egypt' && (
          <div className="w-full h-full bg-[url('/images/slots_egypt_bg.png')] bg-cover bg-center opacity-30" />
        )}
        {theme.id === 'slots-sweet' && (
          <div className="w-full h-full bg-[url('/images/slots_sweet_bg.png')] bg-cover bg-center opacity-25" />
        )}
        {theme.id === 'slots-neon' && (
          <div className="w-full h-full bg-[url('/images/slots_neon_bg.png')] bg-cover bg-center opacity-30" />
        )}
        {theme.id === 'slots-undersea' && (
          <div className="w-full h-full bg-[url('/images/slots_undersea_bg.png')] bg-cover bg-center opacity-35" />
        )}
        {theme.id === 'slots-zeus' && (
          <div className="w-full h-full bg-[url('/images/slots_zeus_bg.png')] bg-cover bg-center opacity-30" />
        )}
        {theme.id === 'slots-dragon' && (
          <div className="w-full h-full bg-[url('/images/slots_dragon_bg.png')] bg-cover bg-center opacity-70 animate-fade-in" />
        )}
        {/* Fallbacks for themes without generated assets */}
        {['slots-pirate', 'slots-safari', 'slots-irish'].includes(theme.id) && (
          <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/95 to-black/80 opacity-50" />
        )}
      </div>

      <div className="relative flex flex-col gap-6 w-full max-w-5xl mx-auto z-10">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-luxury-border/60 pb-5">
          <Link 
            href="/" 
            onClick={playClick}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors font-bold tracking-wide"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'vi' ? 'Sảnh Game' : 'Back to Lobby'}
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { playClick(); setShowPaytable(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-white/[0.08] hover:border-white/20 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg tracking-wider transition-all duration-300 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t.rules}
            </button>
   
            <span 
              className="text-[10px] border font-extrabold px-3 py-1.5 rounded-lg tracking-wide select-none"
              style={{ 
                backgroundColor: `${theme.primaryColor}10`, 
                borderColor: `${theme.primaryColor}30`,
                color: theme.primaryColor 
              }}
            >
              {theme.name}
            </span>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Stats & Bet Control */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-4.5 border-b border-luxury-border/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t.bet}</span>
            </CardHeader>
            <CardContent className="p-4.5 flex flex-col gap-4">
              
              {/* Credits display */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{t.balance}</span>
                <span className="text-xl font-extrabold text-white font-mono">${credits.toLocaleString()}</span>
              </div>

              {/* Adjust Bet */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">{t.bet}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={isSpinning}
                    className="w-full bg-black border border-luxury-border focus:border-white/20 rounded-xl pl-7 pr-14 py-2 text-xs text-white font-extrabold focus:outline-none disabled:opacity-50 font-mono"
                  />
                  <div className="absolute right-1.5 top-1.5 flex gap-0.5">
                    <button
                      onClick={() => handleAdjustBet(Math.max(1, Math.round(betAmount / 2)))}
                      disabled={isSpinning}
                      className="px-2 py-0.5 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[8px] text-neutral-400 font-extrabold rounded-md disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => handleAdjustBet(Math.min(credits, betAmount * 2))}
                      disabled={isSpinning}
                      className="px-2 py-0.5 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[8px] text-neutral-400 font-extrabold rounded-md disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Spin & Speed Controls */}
              <div className="flex items-center gap-2 justify-between border-t border-luxury-border/60 pt-3">
                <button
                  onClick={() => { playClick(); setTurboMode(!turboMode); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[9px] font-extrabold uppercase transition-all duration-300 ${
                    turboMode 
                      ? 'bg-amber-600/10 border-amber-500/30 text-amber-400 shadow-md' 
                      : 'bg-black/30 border-white/[0.08] text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Enable Turbo Spins"
                >
                  <FastForward className="w-3 h-3" />
                  {t.turbo}
                </button>

                <button
                  onClick={() => { playClick(); setAutoPlay(!autoPlay); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[9px] font-extrabold uppercase transition-all duration-300 ${
                    autoPlay 
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-md' 
                      : 'bg-black/30 border-white/[0.08] text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Toggle Auto Spin"
                >
                  <RotateCw className="w-3 h-3 animate-spin-slow" />
                  {t.auto}
                </button>
              </div>

              {/* Main Spin Button */}
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning || betAmount <= 0}
                className="font-black uppercase tracking-widest text-sm relative overflow-hidden py-3"
                style={{ 
                  backgroundColor: theme.primaryColor,
                  color: '#000000',
                  boxShadow: `0 0 20px -5px ${theme.themeColorGlow}` 
                }}
              >
                {isSpinning ? (language === 'vi' ? 'ĐANG QUAY...' : 'SPINNING...') : t.spin}
              </Button>

            </CardContent>
          </Card>

          {/* Last Win Display */}
          {lastWin !== null && (
            <Card className="bg-[#0b0b0b]/60 border-luxury-border/40 select-none">
              <CardContent className="p-4 flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{t.lastWin}</span>
                <span className="text-xl font-black text-emerald-400 font-mono">+${lastWin.toLocaleString()}</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Slots Machine Arena */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          <div 
            className="w-full rounded-[30px] border relative p-5 sm:p-7 flex flex-col justify-between overflow-hidden shadow-2xl min-h-[460px]"
            style={{ 
              borderColor: `${theme.primaryColor}20`,
              background: `radial-gradient(circle at center, rgba(12,15,28,0.95), #02040a)`,
              boxShadow: `0 20px 50px -10px ${theme.themeColorGlow}`
            }}
          >
            {/* Outer Machine Gloss & Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none z-10" />
            
            {/* Theme Custom Decorations */}
            {renderThemeDecorations(theme.id)}

            <div 
              className="w-full flex-grow rounded-2xl border border-white/[0.05] p-3 sm:p-4 flex flex-col relative min-h-[300px] overflow-hidden"
              style={{
                background: theme.id === 'slots-egypt' ? "url('/images/slots_egypt_box_bg.png') center/cover no-repeat"
                  : theme.id === 'slots-neon' ? "url('/images/slots_neon_box_bg.png') center/cover no-repeat"
                  : theme.id === 'slots-cyber' ? "url('/images/slots_cyber_bg.png') center/cover no-repeat"
                  : theme.id === 'slots-sweet' ? "url('/images/slots_sweet_bg.png') center/cover no-repeat"
                  : theme.id === 'slots-zeus' ? "url('/images/slots_zeus_bg.png') center/cover no-repeat"
                  : theme.id === 'slots-undersea' ? "url('/images/slots_undersea_bg.png') center/cover no-repeat"
                  : 'rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Semi-transparent overlay to ensure contrast and readability of slots symbols */}
              <div className="absolute inset-0 bg-black/65 pointer-events-none z-0" />
              
              {/* Paylines Overlay Line Drawer */}
              {winningLines.length > 0 && !isSpinning && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" xmlns="http://www.w3.org/2000/svg">
                  {winningLines.map((lineIdx) => {
                    const line = PAYLINES[lineIdx];
                    const pts: string[] = [];
                    // Calculate node coordinates dynamically based on cell index
                    // 5 columns, 3 rows
                    const colWidth = 100 / 5;
                    const rowHeight = 100 / 3;
                    
                    line.path.forEach((rowVal, colVal) => {
                      const cx = colVal * colWidth + colWidth / 2;
                      const cy = rowVal * rowHeight + rowHeight / 2;
                      pts.push(`${cx}%,${cy}%`);
                    });

                    return (
                      <polyline
                        key={lineIdx}
                        points={pts.join(' ')}
                        fill="none"
                        stroke={line.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                        opacity="0.85"
                        style={{
                          filter: `drop-shadow(0 0 6px ${line.color})`
                        }}
                      />
                    );
                  })}
                </svg>
              )}

              {/* The Reels Grid */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-grow relative z-10 h-[340px] sm:h-[380px]">
                {grid.map((colSymbols, colIdx) => {
                  return (
                    <div 
                      key={colIdx} 
                      className="relative overflow-hidden h-full rounded-2xl bg-black/45 border border-white/[0.03] p-1 flex flex-col justify-between"
                    >
                      {/* Reel Track */}
                      <div 
                        className={`w-full flex flex-col gap-2 sm:gap-3 transition-transform duration-75 ${
                          reelStates[colIdx] === 'spinning' 
                            ? 'animate-slide-reel' 
                            : reelStates[colIdx] === 'settling' 
                            ? 'animate-settle-reel' 
                            : ''
                        }`}
                      >
                        {reelStates[colIdx] === 'spinning' ? (
                          Array.from({ length: 9 }).map((_, symIdx) => {
                            const symbol = theme.symbols[symIdx % theme.symbols.length];
                            return renderFeltSymbol(symbol, symIdx, true);
                          })
                        ) : (
                          colSymbols.map((symbol, rowIdx) => 
                            renderFeltSymbol(symbol, rowIdx, false)
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideReel {
                  0% { transform: translateY(-33.3333%); }
                  100% { transform: translateY(0%); }
                }
                @keyframes settleReel {
                  0% { transform: translateY(-15px); }
                  50% { transform: translateY(5px); }
                  75% { transform: translateY(-2px); }
                  100% { transform: translateY(0); }
                }
                .animate-slide-reel {
                  animation: slideReel 0.12s linear infinite !important;
                }
                .animate-settle-reel {
                  animation: settleReel 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards !important;
                }
              ` }} />
            </div>

            {/* Win Display Area */}
            <div className="mt-5 flex flex-col items-center justify-center text-center relative min-h-[64px] z-10 select-none border-t border-white/[0.04] pt-4">
              {winAmount > 0 && !isSpinning ? (
                <div className="animate-bounce">
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    {language === 'vi' ? 'THẮNG!' : 'WIN!'} +${winAmount.toLocaleString()}
                  </h3>
                  {spinOutcomeText && (
                    <span className="text-[9px] text-neutral-400 uppercase font-black tracking-wider block mt-1">
                      {spinOutcomeText}
                    </span>
                  )}
                </div>
              ) : isSpinning ? (
                <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest animate-pulse">
                  {language === 'vi' ? 'Đang quay...' : 'SPINNING REELS...'}
                </span>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider">
                    {t.paylines}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold max-w-md mx-auto">
                    {t.paylinesDesc}
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0b0f19]/90 border border-luxury-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-luxury-border/60 flex justify-between items-center bg-[#070b14]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{t.rules}</h3>
              <button 
                onClick={() => setShowPaytable(false)} 
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[420px]">
              
              <div className="flex flex-col gap-1 text-[11px] leading-relaxed text-neutral-400 bg-black/25 border border-white/[0.04] p-3 rounded-2xl">
                <span className="font-extrabold text-white flex items-center gap-1 uppercase text-[10px] tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {t.paylines}
                </span>
                <p>{t.paylinesDesc}</p>
              </div>

              {/* Paylines list */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">{language === 'vi' ? 'SƠ ĐỒ ĐƯỜNG THƯỞNG' : 'PAYLINE PATHS'}</span>
                <div className="grid grid-cols-5 gap-2 text-center text-[9px] font-bold text-neutral-400">
                  {PAYLINES.map((line) => (
                    <div key={line.id} className="p-2 bg-black/40 border border-white/[0.03] rounded-xl flex flex-col items-center gap-1">
                      <span style={{ color: line.color }} className="font-black">Line {line.id}</span>
                      <span className="text-[7.5px] text-neutral-600 block">{line.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-white/[0.06] my-2" />

              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">{t.howToWin}</span>
                
                <div className="flex flex-col gap-2">
                  {theme.symbols.map((sym, index) => {
                    if (sym.isWild) {
                      return (
                        <div key={index} className="flex justify-between items-center text-xs p-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            {sym.iconKey ? (
                              <SlotSymbolIcon themeId={theme.id} symbolName={sym.name} className="w-6 h-6 shrink-0" fallbackChar={sym.char} />
                            ) : (
                              <span className="text-xl">{sym.char}</span>
                            )}
                            <span className="font-bold text-white">{sym.name}</span>
                          </div>
                          <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wide">{t.wild}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={index} className="flex justify-between items-center text-xs p-2.5 bg-black/20 border border-white/[0.03] rounded-xl">
                        <div className="flex items-center gap-2.5">
                          {sym.iconKey ? (
                            <SlotSymbolIcon themeId={theme.id} symbolName={sym.name} className="w-6 h-6 shrink-0" fallbackChar={sym.char} />
                          ) : (
                            <span className="text-xl">{sym.char}</span>
                          )}
                          <span className="font-bold text-white">{sym.name}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono font-bold text-neutral-300">
                          <span>3x: <span className="text-emerald-400">{sym.multiplier3}x</span></span>
                          <span>4x: <span className="text-emerald-400">{sym.multiplier4}x</span></span>
                          <span>5x: <span className="text-emerald-400">{sym.multiplier5}x</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setShowPaytable(false)} className="mt-4">
                {t.close}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
