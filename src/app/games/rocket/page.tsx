'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Rocket, Play, ShieldAlert, Award, Activity } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

type GameState = 'idle' | 'countdown' | 'flying' | 'crashed';

export default function RocketGame() {
  const { 
    credits, 
    rocketState,
    rocketMultiplier,
    rocketCountdown,
    rocketRecentCrashes,
    rocketHasBet,
    rocketHasCashedOut,
    rocketWinAmount,
    placeRocketBet,
    cancelRocketBet,
    cashOutRocket
  } = useGameState();

  const { playClick, playWin, playLoss, playPlop, startRocketEngine, updateRocketEnginePitch, stopRocketEngine } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<string>('');

  // Game States (Local Visual State Hooks synced to global ones for animations)
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(10);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([1.42, 2.85, 1.12, 5.40, 1.03, 12.50]);
  const [dismissedCrash, setDismissedCrash] = useState<boolean>(false);

  useEffect(() => {
    if (gameState === 'flying' || gameState === 'countdown') {
      setDismissedCrash(false);
    }
  }, [gameState]);

  // Session Statistics
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Refs for Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state with global provider states
  useEffect(() => {
    setGameState(rocketState);
    setCurrentMultiplier(rocketMultiplier);
    setCountdown(rocketCountdown);
    setRecentCrashes(rocketRecentCrashes);
    setHasBet(rocketHasBet);
    setHasCashedOut(rocketHasCashedOut);
    setWinAmount(rocketWinAmount);

    // Audio effects engine transitions
    if (rocketState === 'flying') {
      startRocketEngine();
      updateRocketEnginePitch(rocketMultiplier);
    } else {
      stopRocketEngine();
    }
  }, [
    rocketState, 
    rocketMultiplier, 
    rocketCountdown, 
    rocketRecentCrashes, 
    rocketHasBet, 
    rocketHasCashedOut, 
    rocketWinAmount
  ]);

  // Sound management
  useEffect(() => {
    return () => {
      stopRocketEngine();
    };
  }, []);

  // Canvas drawing & animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 600;
    const height = canvas.height = 360;

    // Handle resize
    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        width = canvas.width;
      }
    };
    window.addEventListener('resize', handleResize);

    let animationId: number;
    const particleArr: { x: number; y: number; size: number; alpha: number; speedY: number }[] = [];

    const render = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (gameState === 'flying' || gameState === 'crashed') {
        // Curve parameters
        const startX = 60;
        const startY = height - 60;
        
        // Progress ratio (clamped between 0 and 1 for visual safety)
        const progress = Math.min(1.0, (currentMultiplier - 1.0) / 10.0);
        const endX = startX + (width - 120) * progress;
        const endY = startY - (height - 120) * Math.sin(progress * Math.PI / 2);

        // Draw bezier path
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (endX - startX) * 0.5, startY, endX, endY);
        ctx.strokeStyle = gameState === 'crashed' ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = gameState === 'crashed' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)';
        ctx.stroke();
        ctx.shadowBlur = 0; // reset glow

        // Generate rocket fire particles
        if (gameState === 'flying' && Math.random() > 0.3) {
          particleArr.push({
            x: endX - 10 * Math.cos(Math.atan2(2 * progress * (endY - startY), endX - startX)),
            y: endY - 10 * Math.sin(Math.atan2(2 * progress * (endY - startY), endX - startX)),
            size: Math.random() * 5 + 2,
            alpha: 1,
            speedY: Math.random() * 2 - 1,
          });
        }

        // Draw particles
        particleArr.forEach((p, index) => {
          p.x -= 2; // move left
          p.y += p.speedY;
          p.alpha -= 0.02;
          if (p.alpha <= 0) {
            particleArr.splice(index, 1);
          } else {
            ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Draw rocket or crash explosion
        if (gameState === 'crashed') {
          // Draw Explosion
          ctx.beginPath();
          ctx.arc(endX, endY, 25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(endX, endY, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        } else {
          // Draw dynamically rotated rocket
          const tangentAngle = Math.atan2(2 * progress * (endY - startY), endX - startX);
          drawCanvasRocket(ctx, endX, endY, tangentAngle);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [gameState, currentMultiplier]);

  // Listen to window events to play sounds and update session statistics
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCrashed = (e: CustomEvent) => {
      const { hadBet, betAmount: amt } = e.detail;
      playLoss();
      if (hadBet) {
        setGameStats(prev => ({
          ...prev,
          losses: prev.losses + 1,
          profit: prev.profit - amt
        }));
      }
    };

    const handleCashedOut = (e: CustomEvent) => {
      const { multiplier: mult, amount: payout } = e.detail;
      playWin();
      triggerWinConfetti();
      setGameStats(prev => ({
        ...prev,
        wins: prev.wins + 1,
        profit: prev.profit + (payout - betAmount),
      }));
    };

    window.addEventListener('rocket_crashed' as any, handleCrashed);
    window.addEventListener('rocket_cashed_out' as any, handleCashedOut);

    return () => {
      window.removeEventListener('rocket_crashed' as any, handleCrashed);
      window.removeEventListener('rocket_cashed_out' as any, handleCashedOut);
    };
  }, [betAmount]);

  const handlePlaceBet = () => {
    if (rocketState !== 'countdown' || rocketHasBet) return;
    if (betAmount < 0.01 || betAmount > credits) return;
    const success = placeRocketBet(betAmount, autoCashout);
    if (success) {
      playClick();
    }
  };

  const handleCancelBet = () => {
    if (rocketState !== 'countdown' || !rocketHasBet) return;
    cancelRocketBet();
    playClick();
  };

  const handleCashoutPress = () => {
    cashOutRocket();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow">
      
      {/* Top Breadcrumb Header */}
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
          Crash Multiplayer
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Game Controls */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Rocket className="w-4 h-4 text-gold-500" />
                ROCKET CONTROLS
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
                    disabled={gameState !== 'countdown' || hasBet}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={gameState !== 'countdown' || hasBet}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={gameState !== 'countdown' || hasBet}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      x2
                    </button>
                    <button
                      onClick={() => setBetAmount(credits)}
                      disabled={gameState !== 'countdown' || hasBet}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-gold-500 font-extrabold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto Cashout */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Auto Cashout Multiplier (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 2.00 (leave blank to manually cash out)"
                  value={autoCashout}
                  onChange={(e) => setAutoCashout(e.target.value)}
                  disabled={gameState !== 'countdown' || hasBet}
                  className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Game Action Buttons */}
              {gameState === 'idle' && (
                <Button variant="dark" fullWidth size="lg" disabled>
                  Connecting...
                </Button>
              )}

              {gameState === 'countdown' && (
                <div className="flex gap-2 w-full">
                  {!hasBet ? (
                    <Button variant="gold" fullWidth size="lg" onClick={handlePlaceBet} disabled={credits < betAmount || betAmount <= 0}>
                      <Play className="w-4 h-4 mr-2 fill-black" />
                      Place Bet (Deploying in {countdown}s)
                    </Button>
                  ) : (
                    <Button variant="danger" fullWidth size="lg" onClick={handleCancelBet}>
                      Cancel Bet (${betAmount})
                    </Button>
                  )}
                </div>
              )}

              {gameState === 'flying' && (
                <>
                  {hasBet ? (
                    <Button
                      variant={hasCashedOut ? 'dark' : 'gold'}
                      fullWidth
                      size="lg"
                      onClick={handleCashoutPress}
                      disabled={hasCashedOut}
                      className="relative overflow-hidden"
                    >
                      {hasCashedOut ? (
                        <span>Cashed Out (+${winAmount})</span>
                      ) : (
                        <span>
                          CASH OUT ${(currentMultiplier * betAmount).toFixed(2)}
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button variant="dark" fullWidth size="lg" disabled>
                      Observing Round (Next round in 10s)
                    </Button>
                  )}
                </>
              )}

              {gameState === 'crashed' && (
                <Button variant="danger" fullWidth size="lg" disabled>
                  Crashed at {currentMultiplier.toFixed(2)}x
                </Button>
              )}

            </CardContent>
          </Card>

          {/* User Volatility Stats */}
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
          
          {/* History multipliers */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentCrashes.map((val, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  val >= 2.0 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {val.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Main Visual Arena */}
          <Card className="bg-[#050505] border-luxury-border relative overflow-hidden flex flex-col items-center justify-center p-0 select-none">
            
            {/* Live Ticker Center Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center gap-1.5">
              {gameState === 'idle' && (
                <div className="flex flex-col items-center gap-2">
                  <Rocket className="w-12 h-12 text-gold-500/20 animate-float" />
                  <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">LOBBY OPEN FOR BETS</span>
                </div>
              )}

              {gameState === 'countdown' && (
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black gold-gradient-text tracking-widest">{countdown}</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-extrabold mt-2 animate-pulse-slow">PREPARING DEPLOYMENT</span>
                </div>
              )}

              {gameState === 'flying' && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-5xl sm:text-6xl font-black text-white tracking-tight animate-pulse-subtle">
                    {currentMultiplier.toFixed(2)}x
                  </span>
                  {hasCashedOut && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-extrabold">
                      CASHED OUT (+{winAmount} Credits)
                    </span>
                  )}
                </div>
              )}

              {gameState === 'crashed' && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl font-black text-red-500 tracking-tight uppercase">
                    CRASHED AT {currentMultiplier.toFixed(2)}x
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">ROCKET DESTROYED</span>
                </div>
              )}
            </div>

            {/* Visual Canvas Element */}
            <canvas ref={canvasRef} className="w-full rounded-2xl block min-h-[360px]" />

            <WinLoseOverlay
              isOpen={gameState === 'crashed' && hasBet && !dismissedCrash}
              onClose={() => setDismissedCrash(true)}
              outcome={hasCashedOut ? 'win' : 'loss'}
              multiplier={hasCashedOut ? (winAmount / betAmount) : 0}
              payout={hasCashedOut ? winAmount : 0}
            />
          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Rocket Rules</strong>: Place your virtual credits bet, then launch. The rocket flight will trigger a scaling multiplier ticker. 
                  You must click <strong>Cash Out</strong> before the rocket crashes at a randomly selected threshold. 
                  Cashing out will grant you `Bet × Current Multiplier` in credits. If the rocket crashes first, your bet is lost. 
                  Auto Cashout allows setting a pre-programmed cashout target.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}

// ==========================================
// LOW POLY SPACE VISUAL HELPERS
// ==========================================

const drawLowPolyMoon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  const vertices = [[cx, cy]];
  const rings = [r * 0.35, r * 0.7, r];
  const sectors = 8;
  
  for (let ringIdx = 0; ringIdx < rings.length; ringIdx++) {
    const rad = rings[ringIdx];
    for (let sec = 0; sec < sectors; sec++) {
      const angle = (sec * Math.PI * 2) / sectors + (ringIdx * 0.2);
      const jitterR = Math.sin(sec * 1.7 + ringIdx * 2.3) * (rad * 0.05);
      const jitterA = Math.cos(sec * 2.1 - ringIdx * 1.5) * 0.05;
      const x = cx + (rad + jitterR) * Math.cos(angle + jitterA);
      const y = cy + (rad + jitterR) * Math.sin(angle + jitterA);
      vertices.push([x, y]);
    }
  }

  for (let i = 0; i < sectors; i++) {
    const v0 = 0;
    const v1 = 1 + i;
    const v2 = 1 + ((i + 1) % sectors);
    const midAngle = (i + 0.5) * (Math.PI * 2 / sectors);
    const lightFactor = Math.max(0.15, Math.cos(midAngle - Math.PI * 0.75) * 0.5 + 0.5);
    const gray = Math.floor(100 + lightFactor * 80);
    ctx.fillStyle = `rgb(${gray}, ${gray + 5}, ${gray + 12})`;
    
    ctx.beginPath();
    ctx.moveTo(vertices[v0][0], vertices[v0][1]);
    ctx.lineTo(vertices[v1][0], vertices[v1][1]);
    ctx.lineTo(vertices[v2][0], vertices[v2][1]);
    ctx.closePath();
    ctx.fill();
  }

  for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
    const startInner = 1 + ringIdx * sectors;
    const startOuter = 1 + (ringIdx + 1) * sectors;
    for (let i = 0; i < sectors; i++) {
      const nextIdx = (i + 1) % sectors;
      const i0 = startInner + i;
      const i1 = startInner + nextIdx;
      const o0 = startOuter + i;
      const o1 = startOuter + nextIdx;

      const midAngle = (i + 0.3) * (Math.PI * 2 / sectors) + ringIdx * 0.1;
      const lightFactor = Math.max(0.15, Math.cos(midAngle - Math.PI * 0.75) * 0.5 + 0.5);
      const gray = Math.floor(100 + lightFactor * 80 - ringIdx * 15);
      ctx.fillStyle = `rgb(${gray}, ${gray + 5}, ${gray + 12})`;
      
      ctx.beginPath();
      ctx.moveTo(vertices[i0][0], vertices[i0][1]);
      ctx.lineTo(vertices[o0][0], vertices[o0][1]);
      ctx.lineTo(vertices[o1][0], vertices[o1][1]);
      ctx.closePath();
      ctx.fill();

      const midAngle2 = (i + 0.7) * (Math.PI * 2 / sectors) + ringIdx * 0.1;
      const lightFactor2 = Math.max(0.15, Math.cos(midAngle2 - Math.PI * 0.75) * 0.5 + 0.5);
      const gray2 = Math.floor(100 + lightFactor2 * 80 - ringIdx * 15);
      ctx.fillStyle = `rgb(${gray2}, ${gray2 + 5}, ${gray2 + 12})`;

      ctx.beginPath();
      ctx.moveTo(vertices[i0][0], vertices[i0][1]);
      ctx.lineTo(vertices[i1][0], vertices[i1][1]);
      ctx.lineTo(vertices[o1][0], vertices[o1][1]);
      ctx.closePath();
      ctx.fill();
    }
  }
};

const drawLowPolySaturn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  const vertices = [[cx, cy]];
  const rings = [r * 0.35, r * 0.7, r];
  const sectors = 8;
  
  for (let ringIdx = 0; ringIdx < rings.length; ringIdx++) {
    const rad = rings[ringIdx];
    for (let sec = 0; sec < sectors; sec++) {
      const angle = (sec * Math.PI * 2) / sectors - (ringIdx * 0.3);
      const jitterR = Math.sin(sec * 1.2 + ringIdx * 1.8) * (rad * 0.04);
      const x = cx + (rad + jitterR) * Math.cos(angle);
      const y = cy + (rad + jitterR) * Math.sin(angle);
      vertices.push([x, y]);
    }
  }

  const drawRingSegment = (innerRadiusX: number, innerRadiusY: number, outerRadiusX: number, outerRadiusY: number, startAngle: number, endAngle: number, color: string) => {
    ctx.fillStyle = color;
    const ringSectors = 12;
    const delta = (endAngle - startAngle) / ringSectors;
    
    ctx.beginPath();
    for (let i = 0; i <= ringSectors; i++) {
      const ang = startAngle + i * delta;
      const rx = cx + innerRadiusX * Math.cos(ang);
      const ry = cy + innerRadiusY * Math.sin(ang);
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    for (let i = ringSectors; i >= 0; i--) {
      const ang = startAngle + i * delta;
      const rx = cx + outerRadiusX * Math.cos(ang);
      const ry = cy + outerRadiusY * Math.sin(ang);
      ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
  };

  // Back ring
  drawRingSegment(r * 1.4, r * 0.4, r * 2.0, r * 0.6, Math.PI * 1.05, Math.PI * 1.95, '#78350f');
  drawRingSegment(r * 1.4, r * 0.4, r * 2.0, r * 0.6, Math.PI * 1.15, Math.PI * 1.85, '#9a3412');

  // Planet body
  for (let i = 0; i < sectors; i++) {
    const v0 = 0;
    const v1 = 1 + i;
    const v2 = 1 + ((i + 1) % sectors);
    const midAngle = (i + 0.5) * (Math.PI * 2 / sectors);
    const lightFactor = Math.max(0.15, Math.cos(midAngle - Math.PI * 0.75) * 0.5 + 0.5);
    
    const red = Math.floor(180 + lightFactor * 65);
    const green = Math.floor(110 + lightFactor * 55);
    const blue = Math.floor(30 + lightFactor * 25);
    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    
    ctx.beginPath();
    ctx.moveTo(vertices[v0][0], vertices[v0][1]);
    ctx.lineTo(vertices[v1][0], vertices[v1][1]);
    ctx.lineTo(vertices[v2][0], vertices[v2][1]);
    ctx.closePath();
    ctx.fill();
  }

  for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
    const startInner = 1 + ringIdx * sectors;
    const startOuter = 1 + (ringIdx + 1) * sectors;
    for (let i = 0; i < sectors; i++) {
      const nextIdx = (i + 1) % sectors;
      const i0 = startInner + i;
      const i1 = startInner + nextIdx;
      const o0 = startOuter + i;
      const o1 = startOuter + nextIdx;

      const midAngle = (i + 0.3) * (Math.PI * 2 / sectors) - ringIdx * 0.15;
      const lightFactor = Math.max(0.15, Math.cos(midAngle - Math.PI * 0.75) * 0.5 + 0.5);
      const red = Math.floor(160 + lightFactor * 65 - ringIdx * 20);
      const green = Math.floor(95 + lightFactor * 55 - ringIdx * 15);
      const blue = Math.floor(25 + lightFactor * 20 - ringIdx * 5);
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      
      ctx.beginPath();
      ctx.moveTo(vertices[i0][0], vertices[i0][1]);
      ctx.lineTo(vertices[o0][0], vertices[o0][1]);
      ctx.lineTo(vertices[o1][0], vertices[o1][1]);
      ctx.closePath();
      ctx.fill();

      const midAngle2 = (i + 0.7) * (Math.PI * 2 / sectors) - ringIdx * 0.15;
      const lightFactor2 = Math.max(0.15, Math.cos(midAngle2 - Math.PI * 0.75) * 0.5 + 0.5);
      const red2 = Math.floor(160 + lightFactor2 * 65 - ringIdx * 20);
      const green2 = Math.floor(95 + lightFactor2 * 55 - ringIdx * 15);
      const blue2 = Math.floor(25 + lightFactor2 * 20 - ringIdx * 5);
      ctx.fillStyle = `rgb(${red2}, ${green2}, ${blue2})`;

      ctx.beginPath();
      ctx.moveTo(vertices[i0][0], vertices[i0][1]);
      ctx.lineTo(vertices[i1][0], vertices[i1][1]);
      ctx.lineTo(vertices[o1][0], vertices[o1][1]);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Front ring
  drawRingSegment(r * 1.4, r * 0.4, r * 2.0, r * 0.6, 0.05, Math.PI * 0.95, '#ea580c');
  drawRingSegment(r * 1.5, r * 0.43, r * 1.8, r * 0.52, 0.1, Math.PI * 0.9, '#f97316');
};

const drawCanvasRocket = (ctx: CanvasRenderingContext2D, x: number, y: number, angleRad: number) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  
  // Flame trail (thick and robust)
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-32, -9);
  ctx.lineTo(-42, 0);
  ctx.lineTo(-32, 9);
  ctx.closePath();
  ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#ef4444';
  ctx.fill();
  
  // Main Rocket fuselage (Thick capsule cylinder)
  ctx.beginPath();
  ctx.moveTo(-15, -12);
  ctx.lineTo(8, -12);
  ctx.quadraticCurveTo(24, -8, 24, 0);
  ctx.quadraticCurveTo(24, 8, 8, 12);
  ctx.lineTo(-15, 12);
  ctx.closePath();
  
  const grad = ctx.createLinearGradient(-15, 0, 24, 0);
  grad.addColorStop(0, '#f43f5e');
  grad.addColorStop(0.7, '#f43f5e');
  grad.addColorStop(1, '#be123c');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#9f1239';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bottom booster ring
  ctx.fillStyle = '#475569';
  ctx.fillRect(-18, -8, 3, 16);

  // Big side fins (sleek and thick)
  // Top fin
  ctx.beginPath();
  ctx.moveTo(-5, -12);
  ctx.lineTo(-20, -22);
  ctx.lineTo(-15, -12);
  ctx.closePath();
  ctx.fillStyle = '#be123c';
  ctx.fill();
  ctx.stroke();
  
  // Bottom fin
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(-20, 22);
  ctx.lineTo(-15, 12);
  ctx.closePath();
  ctx.fillStyle = '#be123c';
  ctx.fill();
  ctx.stroke();

  // Center cockpit window (larger glass bubble)
  ctx.beginPath();
  ctx.arc(4, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#38bdf8';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Window shine
  ctx.beginPath();
  ctx.arc(2.5, -1.5, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
};
