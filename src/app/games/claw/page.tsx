'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Award, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

interface Capsule {
  multiplier: number;
  label: string;
  labelVi: string;
  color: string;
}

const CAPSULES: Capsule[] = [
  { multiplier: 0, label: 'Empty Capsule', labelVi: 'Hộp Rỗng', color: '#64748b' },
  { multiplier: 0.5, label: 'Consolation', labelVi: 'An Ủi', color: '#cbd5e1' },
  { multiplier: 1.2, label: 'Common Prize', labelVi: 'Giải Thường', color: '#10b981' },
  { multiplier: 2.0, label: 'Uncommon Safe', labelVi: 'Giải Khá', color: '#3b82f6' },
  { multiplier: 5.0, label: 'Rare Bronze', labelVi: 'Cúp Đồng', color: '#f59e0b' },
  { multiplier: 10.0, label: 'Epic Gold', labelVi: 'Cúp Vàng', color: '#eab308' },
  { multiplier: 50.0, label: 'Mega Jackpot', labelVi: 'HŨ SIÊU CẤP', color: '#a855f7' }
];

export default function ClawMachineGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<'idle' | 'aiming' | 'dropping' | 'retracting' | 'ended'>('idle');
  const [clawX, setClawX] = useState<number>(50); // percentage 0 to 100
  const [clawY, setClawY] = useState<number>(0); // percentage 0 to 100
  const [activeCapsules, setActiveCapsules] = useState<{ id: number; x: number; type: Capsule }[]>([]);
  const [grabbedCapsule, setGrabbedCapsule] = useState<{ id: number; x: number; type: Capsule } | null>(null);
  const [outcomePayout, setOutcomePayout] = useState<number>(0);

  const aimDirectionRef = useRef<'left' | 'right'>('right');
  const animFrameRef = useRef<number | null>(null);
  const capsuleIdCounter = useRef<number>(0);
  
  const activeCapsulesRef = useRef<{ id: number; x: number; type: Capsule }[]>([]);
  const clawXRef = useRef<number>(50);

  const translations = {
    en: {
      title: 'Claw Machine',
      desc: 'Time your grab! Click drop when the claw lines up with a high-value capsule.',
      bet: 'Bet Amount',
      balance: 'Balance',
      play: 'Insert Coin',
      drop: 'DROP CLAW',
      aiming: 'Aiming...',
      rules: 'Claw Rules',
      rulesDesc: 'The claw swings side to side automatically once the coin is inserted. Hit DROP CLAW to grab. Prizes are determined by the capsule caught (up to 50x multiplier).',
      empty: 'Missed / Empty',
      won: 'Won Payout'
    },
    vi: {
      title: 'Máy Gắp Thú',
      desc: 'Căn thời gian chuẩn xác! Nhấp thả khi càng gắp thẳng hàng với kẹo/hộp quà giá trị cao.',
      bet: 'Tiền cược',
      balance: 'Số dư',
      play: 'Bỏ Xu Vào',
      drop: 'THẢ GẮP',
      aiming: 'Đang ngắm...',
      rules: 'Luật Gắp Quà',
      rulesDesc: 'Càng gắp sẽ tự động di chuyển qua lại sau khi nạp xu. Nhấn THẢ GẮP để gắp quà. Phần thưởng tùy thuộc vào hộp quà gắp được (lên đến 50x).',
      empty: 'Trượt / Hộp Rỗng',
      won: 'Tiền thưởng'
    }
  };

  const t = translations[language];

  // Initialize rolling capsule conveyor belt on mount
  useEffect(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      list.push({
        id: capsuleIdCounter.current++,
        x: i * 20,
        type: getRandomCapsuleType()
      });
    }
    setActiveCapsules(list);
    activeCapsulesRef.current = list;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const getRandomCapsuleType = (): Capsule => {
    const roll = Math.random() * 100;
    if (roll < 10) return CAPSULES[0]; // Empty
    if (roll < 30) return CAPSULES[1]; // 0.5x
    if (roll < 60) return CAPSULES[2]; // 1.2x
    if (roll < 80) return CAPSULES[3]; // 2x
    if (roll < 92) return CAPSULES[4]; // 5x
    if (roll < 98) return CAPSULES[5]; // 10x
    return CAPSULES[6]; // 50x
  };

  // Main conveyor and aim animation ticks
  useEffect(() => {
    let lastTime = Date.now();
    const updateTick = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // 1. Move Conveyor belt capsules
      setActiveCapsules(prev => {
        let updated = prev.map(cap => ({
          ...cap,
          x: cap.x + delta * 12 // speed pixels/seconds
        }));

        // Recycle offscreen capsules
        if (updated.length > 0 && updated[0].x > 105) {
          updated.shift();
          updated.push({
            id: capsuleIdCounter.current++,
            x: -15,
            type: getRandomCapsuleType()
          });
        }
        activeCapsulesRef.current = updated;
        return updated;
      });

      // 2. Swing claw if in AIMING mode
      setGameState(state => {
        if (state === 'aiming') {
          setClawX(cx => {
            let next = cx;
            if (aimDirectionRef.current === 'right') {
              next += delta * 45;
              if (next >= 90) {
                next = 90;
                aimDirectionRef.current = 'left';
              }
            } else {
              next -= delta * 45;
              if (next <= 10) {
                next = 10;
                aimDirectionRef.current = 'right';
              }
            }
            clawXRef.current = next;
            return next;
          });
        }
        return state;
      });

      animFrameRef.current = requestAnimationFrame(updateTick);
    };

    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setGameState('aiming');
    setGrabbedCapsule(null);
    setOutcomePayout(0);
    setClawY(0);
    setClawX(50);
    clawXRef.current = 50;
  };

  const handleDropClaw = () => {
    if (gameState !== 'aiming') return;
    playClick();
    setGameState('dropping');

    // Animate drop down
    let y = 0;
    const dropInterval = setInterval(() => {
      y += 5;
      setClawY(y);
      if (y >= 75) {
        clearInterval(dropInterval);
        attemptGrab(y);
      }
    }, 25);
  };

  const attemptGrab = (currentY: number) => {
    // Find capsule within target X bounds (around clawXRef.current)
    const cx = clawXRef.current;
    const match = activeCapsulesRef.current.find(c => Math.abs(c.x - cx) < 6);
    let caught: typeof activeCapsules[0] | null = null;
    
    if (match) {
      caught = match;
      // remove it from conveyor belt visually while it gets pulled up
      setActiveCapsules(caps => {
        const filtered = caps.filter(c => c.id !== match.id);
        activeCapsulesRef.current = filtered;
        return filtered;
      });
    }

    if (caught) {
      playPlop();
      setGrabbedCapsule(caught);
    }

    // Retract claw back up
    let y = currentY;
    const retractInterval = setInterval(() => {
      y -= 5;
      setClawY(y);
      if (y <= 0) {
        clearInterval(retractInterval);
        resolveClaw(caught);
      }
    }, 30);
  };

  const resolveClaw = (caught: typeof activeCapsules[0] | null) => {
    setGameState('ended');
    let payoutVal = 0;
    let multiplier = 0;

    if (caught) {
      const cap = (caught as any).type as Capsule;
      multiplier = cap.multiplier;
      payoutVal = Math.round(betAmount * cap.multiplier * 100) / 100;
      
      if (payoutVal > 0) {
        addCredits(payoutVal);
        playWin();
        if (cap.multiplier >= 10) {
          triggerWinConfetti();
        }
      } else {
        playLoss();
      }
    } else {
      playLoss();
    }

    setOutcomePayout(payoutVal);
    addHistoryItem(
      'Claw Machine', 
      betAmount, 
      multiplier, 
      payoutVal, 
      payoutVal > betAmount ? 'win' : 'loss'
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
        
        {/* Left Controls */}
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
                    disabled={gameState !== 'idle' && gameState !== 'ended'}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(1, Math.round(prev / 2)))}
                      disabled={gameState !== 'idle' && gameState !== 'ended'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, prev * 2))}
                      disabled={gameState !== 'idle' && gameState !== 'ended'}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {gameState === 'idle' || gameState === 'ended' ? (
                <Button
                  variant="gold"
                  fullWidth
                  size="lg"
                  onClick={handleStartGame}
                  disabled={betAmount <= 0}
                >
                  {t.play}
                </Button>
              ) : (
                <Button
                  variant="gold"
                  fullWidth
                  size="lg"
                  onClick={handleDropClaw}
                  disabled={gameState !== 'aiming'}
                >
                  {t.drop}
                </Button>
              )}

            </CardContent>
          </Card>

          {/* Capsule legends */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-[#1e293b]/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Capsule Loot Tiers</span>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2 text-xs">
              {CAPSULES.map((cap, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cap.color }}></span>
                    <span className="text-neutral-400 font-medium">{language === 'vi' ? cap.labelVi : cap.label}</span>
                  </div>
                  <span className="font-bold text-neutral-200">{cap.multiplier}x</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rules info */}
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

        {/* Right Arena: Claw Machine Visual */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <Card className="bg-[#0f172a] border-luxury-border relative p-6 flex flex-col justify-between min-h-[460px] rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Visual Glass Machine Cage Backdrop */}
            <div className="absolute inset-x-6 top-6 bottom-20 border border-white/[0.05] bg-black/40 rounded-2xl relative overflow-hidden flex flex-col justify-between select-none">
              
              {/* Crane track line */}
              <div className="absolute top-4 inset-x-4 h-[3px] bg-slate-800 rounded"></div>

              {/* Claw Structure */}
              <div 
                className="absolute top-4 transition-all duration-[40ms] ease-out flex flex-col items-center z-20"
                style={{ 
                  left: `${clawX}%`, 
                  transform: 'translateX(-50%)',
                  height: `${clawY}%`,
                  minHeight: '40px'
                }}
              >
                {/* String / wire */}
                <div className="w-[1.5px] bg-slate-400 flex-grow min-h-[16px]"></div>

                {/* Claw Head */}
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center text-white relative shadow-md">
                  <svg className="w-5 h-5 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v10M8 12h8M6 12v6M18 12v6" />
                    <path d="M6 18c0 1 1 2 2.5 2s2.5-1 2.5-2M18 18c0 1-1 2-2.5 2s-2.5-1-2.5-2" />
                  </svg>
                  
                  {/* Grabbed Capsule slot */}
                  {grabbedCapsule && (
                    <div 
                      className="absolute -bottom-4 w-6 h-6 rounded-full border shadow-2xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: grabbedCapsule.type.color,
                        borderColor: '#ffffff50',
                        boxShadow: `0 0 12px ${grabbedCapsule.type.color}`
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Conveyor Belt with Capsules */}
              <div className="absolute bottom-2 inset-x-0 h-12 border-t border-slate-800 bg-[#070b13] flex items-center overflow-hidden">
                <div className="w-full h-full relative">
                  
                  {/* Conveyor Belt roller lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,_transparent_95%,_rgba(255,255,255,0.03)_95%)] bg-[size:24px_100%]"></div>
                  
                  {/* Capsules scrolling */}
                  {activeCapsules.map((cap) => (
                    <div
                      key={cap.id}
                      className="absolute bottom-2.5 w-7 h-7 rounded-full border flex items-center justify-center shadow-lg"
                      style={{ 
                        left: `${cap.x}%`,
                        backgroundColor: cap.type.color,
                        borderColor: '#ffffff30',
                        boxShadow: `0 4px 10px rgba(0,0,0,0.5), 0 0 8px ${cap.type.color}40`
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                    </div>
                  ))}

                </div>
              </div>

            </div>

            {/* Payout result display */}
            <div className="h-16 flex items-center justify-center relative z-10 w-full">
              {gameState === 'aiming' && (
                <div className="text-center animate-pulse">
                  <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-widest">{t.aiming}</span>
                </div>
              )}
            </div>

            <WinLoseOverlay
              isOpen={gameState === 'ended'}
              onClose={() => setGameState('idle')}
              outcome={grabbedCapsule && grabbedCapsule.type.multiplier > 0 ? 'win' : 'loss'}
              multiplier={grabbedCapsule ? grabbedCapsule.type.multiplier : 0}
              payout={outcomePayout}
              language={language}
            />

          </Card>

        </div>

      </div>
    </div>
  );
}
