'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

type PlinkoRisk = 'low' | 'medium' | 'high' | 'extreme';

interface PlinkoBin {
  multiplier: number;
  color: string;
}

const ROWS_BY_RISK: Record<PlinkoRisk, number> = {
  low: 8,
  medium: 10,
  high: 12,
  extreme: 14
};

const BINS_BY_RISK: Record<PlinkoRisk, PlinkoBin[]> = {
  low: [
    { multiplier: 3.0, color: '#1d4ed8' }, // 3 wins left
    { multiplier: 1.6, color: '#2563eb' },
    { multiplier: 1.1, color: '#3b82f6' },
    { multiplier: 0.9, color: '#1e293b' }, // lose center
    { multiplier: 0.8, color: '#0f172a' },
    { multiplier: 0.9, color: '#1e293b' },
    { multiplier: 1.1, color: '#3b82f6' }, // 3 wins right
    { multiplier: 1.6, color: '#2563eb' },
    { multiplier: 3.0, color: '#1d4ed8' },
  ],
  medium: [
    { multiplier: 10.0, color: '#047857' }, // 3 wins left
    { multiplier: 5.0, color: '#059669' },
    { multiplier: 2.0, color: '#10b981' },
    { multiplier: 0.8, color: '#1e293b' }, // lose center
    { multiplier: 0.5, color: '#0f172a' },
    { multiplier: 0.4, color: '#020617' },
    { multiplier: 0.5, color: '#0f172a' },
    { multiplier: 0.8, color: '#1e293b' },
    { multiplier: 2.0, color: '#10b981' }, // 3 wins right
    { multiplier: 5.0, color: '#059669' },
    { multiplier: 10.0, color: '#047857' },
  ],
  high: [
    { multiplier: 100.0, color: '#b45309' }, // 3 wins left
    { multiplier: 30.0, color: '#d97706' },
    { multiplier: 10.0, color: '#f59e0b' },
    { multiplier: 0.8, color: '#334155' }, // lose center
    { multiplier: 0.5, color: '#1e293b' },
    { multiplier: 0.3, color: '#0f172a' },
    { multiplier: 0.2, color: '#020617' },
    { multiplier: 0.3, color: '#0f172a' },
    { multiplier: 0.5, color: '#1e293b' },
    { multiplier: 0.8, color: '#334155' },
    { multiplier: 10.0, color: '#f59e0b' }, // 3 wins right
    { multiplier: 30.0, color: '#d97706' },
    { multiplier: 100.0, color: '#b45309' },
  ],
  extreme: [
    { multiplier: 1000.0, color: '#881337' }, // 3 wins left
    { multiplier: 250.0, color: '#9f1239' },
    { multiplier: 50.0, color: '#e11d48' },
    { multiplier: 0.8, color: '#334155' }, // lose center
    { multiplier: 0.4, color: '#1e293b' },
    { multiplier: 0.2, color: '#111827' },
    { multiplier: 0.1, color: '#0f172a' },
    { multiplier: 0.05, color: '#020617' },
    { multiplier: 0.1, color: '#0f172a' },
    { multiplier: 0.2, color: '#111827' },
    { multiplier: 0.4, color: '#1e293b' },
    { multiplier: 0.8, color: '#334155' },
    { multiplier: 50.0, color: '#e11d48' }, // 3 wins right
    { multiplier: 250.0, color: '#9f1239' },
    { multiplier: 1000.0, color: '#881337' },
  ]
};

const riskButtonColors: Record<PlinkoRisk, string> = {
  low: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/10 border border-blue-500/20',
  medium: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/10 border border-emerald-500/20',
  high: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-md shadow-amber-500/10 border border-amber-500/20',
  extreme: 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-red-500/25 animate-pulse border border-red-400/20 font-black'
};

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bet: number;
  trail: { x: number; y: number }[];
}

export default function PlinkoGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');

  // Stats
  const [recentPayouts, setRecentPayouts] = useState<number[]>([1.5, 0.4, 3.0, 1.0, 1.5]);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Refs for High Performance Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const activePegsRef = useRef<{ x: number; y: number; time: number }[]>([]);

  const bins = BINS_BY_RISK[risk];
  const numRows = ROWS_BY_RISK[risk];

  // Peg Layout Constants (Zoomed smaller for better visual margins and clearance)
  const spacingX = 32;
  const spacingY = 27;
  const startY = 60;
  const pegRadius = 2.5;
  const ballRadius = 5.2;

  // Trigger Ball Drop
  const handleDropBall = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 600;
    const center = width / 2;

    const newBall: Ball = {
      id: Math.random().toString(36).substring(2, 9),
      x: center + (Math.random() - 0.5) * 2, // Tighter drop center
      y: 12,
      vx: (Math.random() - 0.5) * 0.15, // Significantly lower initial horizontal velocity
      vy: 0,
      bet: betAmount,
      trail: [],
    };

    ballsRef.current.push(newBall);
  };

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = 600;
    const height = canvas.height = 550;
    const center = width / 2;

    const render = () => {
      // Clear the canvas to let the parent card grid and gradients show through
      ctx.clearRect(0, 0, width, height);

      // Draw active pulsing pegs
      const now = Date.now();
      activePegsRef.current = activePegsRef.current.filter(p => now - p.time < 150);

      // Draw Static Peg Board Layout (Triangular)
      for (let r = 0; r < numRows; r++) {
        const count = r + 1;
        for (let i = 0; i < count; i++) {
          const pegX = center + (i - (count - 1) / 2) * spacingX;
          const pegY = startY + r * spacingY;

          const isPulsing = activePegsRef.current.some(
            p => Math.abs(p.x - pegX) < 2 && Math.abs(p.y - pegY) < 2
          );

          ctx.beginPath();
          ctx.arc(pegX, pegY, isPulsing ? pegRadius * 1.7 : pegRadius, 0, Math.PI * 2);
          ctx.fillStyle = isPulsing ? '#60a5fa' : '#334155'; // Vibrant blue pulse and slate peg color
          ctx.fill();
        }
      }

      // Draw neon guide rails (slanted boundaries)
      ctx.save();
      ctx.beginPath();
      // Left rail
      ctx.moveTo(center - 0.85 * spacingX, startY);
      ctx.lineTo(center - (numRows * 0.5 + 0.85) * spacingX, startY + numRows * spacingY);
      // Right rail
      ctx.moveTo(center + 0.85 * spacingX, startY);
      ctx.lineTo(center + (numRows * 0.5 + 0.85) * spacingX, startY + numRows * spacingY);

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)'; // Blue neon glow
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#3b82f6';
      ctx.stroke();
      ctx.restore();

      // Draw bottom bins / buckets (with rounded corners)
      const binWidth = spacingX - 6;
      bins.forEach((bin, idx) => {
        const binX = center + (idx - numRows / 2) * spacingX - binWidth / 2;
        const binY = startY + numRows * spacingY + 8;

        ctx.save();
        ctx.beginPath();
        // 5px radius corner for attractive modern style
        ctx.roundRect(binX, binY, binWidth, 24, 5);
        ctx.fillStyle = bin.color;
        ctx.fill();

        // White glowing border for high rewards
        if (bin.multiplier >= 2.0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();

        // Text color styling inside buckets
        ctx.fillStyle = bin.multiplier >= 2.0 ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${bin.multiplier}`, binX + binWidth / 2, binY + 12);
      });

      // 1. Ball-on-ball collisions (elastic circle collision physics for premium crowd behavior)
      const activeBalls = ballsRef.current;
      for (let j = 0; j < activeBalls.length; j++) {
        for (let k = j + 1; k < activeBalls.length; k++) {
          const b1 = activeBalls[j];
          const b2 = activeBalls[k];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ballRadius * 2;

          if (dist < minDist) {
            // Resolve overlap (push them apart equally to prevent clipping)
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            const overlap = minDist - dist;
            
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Elastic circle collision velocity transfer
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = nx * kx + ny * ky;

            if (p > 0) {
              b1.vx -= p * nx;
              b1.vy -= p * ny;
              b2.vx += p * nx;
              b2.vy += p * ny;

              // Dampen energy slightly to prevent chaotic outer bounces
              b1.vx *= 0.90;
              b1.vy *= 0.90;
              b2.vx *= 0.90;
              b2.vy *= 0.90;
            }
          }
        }
      }

      // Update and Draw active balls in Ref array
      const remainingBalls: Ball[] = [];
      const gravity = 0.15;
      const airResistance = 0.99;

      ballsRef.current.forEach(ball => {
        // Apply physics
        ball.vy += gravity;
        
        // Gentle center pull force to balance binomial distribution and make outer edges harder to reach
        const centerPull = (center - ball.x) * 0.00085;
        ball.vx += centerPull;

        ball.vx *= airResistance;
        ball.vy *= airResistance;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Containment physics (slant boundary rails)
        const rowProgress = Math.max(0, (ball.y - startY) / spacingY);
        const halfWidth = (rowProgress * 0.5 + 0.85) * spacingX;
        const leftBound = center - halfWidth;
        const rightBound = center + halfWidth;

        if (ball.x - ballRadius < leftBound) {
          ball.x = leftBound + ballRadius;
          ball.vx = Math.abs(ball.vx) * 0.45 + 0.35; // bounce inward right
          playPlop();
        } else if (ball.x + ballRadius > rightBound) {
          ball.x = rightBound - ballRadius;
          ball.vx = -Math.abs(ball.vx) * 0.45 - 0.35; // bounce inward left
          playPlop();
        }

        // Check peg collisions
        for (let r = 0; r < numRows; r++) {
          const count = r + 1;
          for (let i = 0; i < count; i++) {
            const pegX = center + (i - (count - 1) / 2) * spacingX;
            const pegY = startY + r * spacingY;

            const dx = ball.x - pegX;
            const dy = ball.y - pegY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = ballRadius + pegRadius;

            if (dist < minDist) {
              // Resolve overlap
              const nx = dx / dist;
              const ny = dy / dist;
              ball.x = pegX + nx * minDist;
              ball.y = pegY + ny * minDist;

              // Reflect velocity with slightly dampened restitution for lower edge chance
              const dot = ball.vx * nx + ball.vy * ny;
              if (dot < 0) {
                const restitution = 0.35; // Slightly lower bounciness (0.35 instead of 0.38)
                ball.vx = ball.vx - (1 + restitution) * dot * nx;
                ball.vy = ball.vy - (1 + restitution) * dot * ny;

                // Dampen horizontal velocity and use tighter variance to keep balls central
                ball.vx = ball.vx * 0.88 + (Math.random() - 0.5) * 0.08;
                ball.vy += (Math.random() - 0.5) * 0.04;

                // Trigger peg animation pulse & sound
                playPlop();
                activePegsRef.current.push({ x: pegX, y: pegY, time: Date.now() });
              }
            }
          }
        }

        // Save position to trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 5) {
          ball.trail.shift();
        }

        // Draw trail glow
        ball.trail.forEach((pos, idx) => {
          const alpha = idx / ball.trail.length;
          const radius = ballRadius * (0.4 + 0.6 * alpha);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.45})`;
          ctx.fill();
        });

        // Check if ball landed in bottom bins
        const binY = startY + numRows * spacingY + 8;
        if (ball.y >= binY) {
          // Resolve final bin index
          let idx = Math.round((ball.x - center) / spacingX + numRows / 2);
          if (idx < 0) idx = 0;
          if (idx >= bins.length) idx = bins.length - 1;

          const targetWedge = bins[idx];
          const finalMultiplier = targetWedge.multiplier;

          // Resolve payout
          const payout = Math.round(ball.bet * finalMultiplier * 100) / 100;
          const won = finalMultiplier >= 1.0;

          if (won) {
            playWin();
            if (finalMultiplier >= 3.0) triggerWinConfetti();
            addCredits(payout);
            addHistoryItem('Plinko', ball.bet, finalMultiplier, payout, 'win');
            setGameStats(prev => ({
              ...prev,
              wins: prev.wins + 1,
              profit: prev.profit + (payout - ball.bet),
            }));
          } else {
            playLoss();
            addHistoryItem('Plinko', ball.bet, 0, 0, 'loss');
            setGameStats(prev => ({
              ...prev,
              losses: prev.losses + 1,
              profit: prev.profit - ball.bet,
            }));
          }

          setRecentPayouts(prev => [finalMultiplier, ...prev.slice(0, 5)]);
        } else {
          // Draw actual ball
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#3b82f6';
          ctx.stroke();

          remainingBalls.push(ball);
        }
      });

      ballsRef.current = remainingBalls;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [bins]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 flex-grow">
      
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
        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Plinko Board
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0f19]/60 border-luxury-border/60 shadow-lg rounded-2xl">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-450 animate-pulse" />
                PLINKO CONTROLS
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
                  <span className="absolute left-4.5 top-3.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full bg-black border border-luxury-border focus:border-blue-500/50 rounded-full pl-9 pr-24 py-3 text-sm text-white font-extrabold focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border/60 hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-full cursor-pointer transition-colors"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border/60 hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-full cursor-pointer transition-colors"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Volatility select */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Volatility Profile</span>
                <div className="grid grid-cols-4 gap-1.5 bg-black border border-luxury-border/60 p-1.5 rounded-full">
                  {(['low', 'medium', 'high', 'extreme'] as PlinkoRisk[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => { playClick(); setRisk(lvl); }}
                      className={`py-2 text-[9px] uppercase font-black rounded-full transition-all duration-300 cursor-pointer ${
                        risk === lvl
                          ? riskButtonColors[lvl]
                          : 'text-neutral-500 hover:text-neutral-300 bg-transparent'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop Ball Button */}
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleDropBall}
                disabled={betAmount < 0.01}
                className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 text-white font-extrabold shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-full py-3.5 uppercase tracking-widest text-xs border border-blue-400/20"
              >
                Drop Ball
              </Button>

            </CardContent>
          </Card>

          {/* Session Statistics */}
          <Card className="bg-[#0b0f19]/40 border-luxury-border/50 shadow-md">
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

        {/* Right Panel: Game Board */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Recent payout history */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentPayouts.map((val, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                  val >= 1.0 
                    ? 'bg-blue-950/40 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {val.toFixed(1)}x
              </span>
            ))}
          </div>

          {/* Canvas Board */}
          <Card className="bg-gradient-to-br from-black via-[#040816] to-[#02050f] border-blue-500/15 flex items-center justify-center p-4 relative overflow-hidden select-none shadow-[0_0_50px_rgba(59,130,246,0.06)] rounded-3xl">
            {/* Fine Grid pattern inside board */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none -z-0"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_65%)] pointer-events-none -z-0"></div>
            <canvas ref={canvasRef} className="block w-full max-w-[600px] h-[550px] relative z-10 bg-transparent rounded-2xl" />
          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0b0f19]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Plinko Rules</strong>: Set your bet and risk volatility profile. 
                  Low risk has narrow payouts but guarantees keeping credits. 
                  High risk features bins up to <strong>500.0x</strong> at the edges. 
                  <strong>Extreme</strong> risk features massive edges up to <strong>1000.0x</strong> with a 0.1x center trap!
                  Click <strong>Drop Ball</strong> to watch a sphere fall through the pins, bouncing off pegs to settle in a multiplier bucket.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
