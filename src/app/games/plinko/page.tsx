'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

type PlinkoRisk = 'low' | 'medium' | 'high';

interface PlinkoBin {
  multiplier: number;
  color: string;
}

const BINS_BY_RISK: Record<PlinkoRisk, PlinkoBin[]> = {
  low: [
    { multiplier: 15.0, color: '#1e3a8a' }, // Deep Blue
    { multiplier: 6.0, color: '#1d4ed8' },  // Mid-dark Blue
    { multiplier: 2.5, color: '#2563eb' },  // Blue
    { multiplier: 1.5, color: '#3b82f6' },  // Brand Blue
    { multiplier: 1.2, color: '#60a5fa' },  // Light Blue
    { multiplier: 1.1, color: '#1e293b' },  // Slate
    { multiplier: 0.8, color: '#0f172a' },  // Dark Slate
    { multiplier: 1.1, color: '#1e293b' },
    { multiplier: 1.2, color: '#60a5fa' },
    { multiplier: 1.5, color: '#3b82f6' },
    { multiplier: 2.5, color: '#2563eb' },
    { multiplier: 6.0, color: '#1d4ed8' },
    { multiplier: 15.0, color: '#1e3a8a' },
  ],
  medium: [
    { multiplier: 50.0, color: '#1e3a8a' },
    { multiplier: 18.0, color: '#1d4ed8' },
    { multiplier: 6.0, color: '#2563eb' },
    { multiplier: 3.0, color: '#3b82f6' },
    { multiplier: 1.5, color: '#60a5fa' },
    { multiplier: 1.0, color: '#1e293b' },
    { multiplier: 0.4, color: '#0f172a' },
    { multiplier: 1.0, color: '#1e293b' },
    { multiplier: 1.5, color: '#60a5fa' },
    { multiplier: 3.0, color: '#3b82f6' },
    { multiplier: 6.0, color: '#2563eb' },
    { multiplier: 18.0, color: '#1d4ed8' },
    { multiplier: 50.0, color: '#1e3a8a' },
  ],
  high: [
    { multiplier: 500.0, color: '#1e3a8a' },
    { multiplier: 100.0, color: '#1d4ed8' },
    { multiplier: 30.0, color: '#2563eb' },
    { multiplier: 10.0, color: '#3b82f6' },
    { multiplier: 4.0, color: '#60a5fa' },
    { multiplier: 1.5, color: '#1e293b' },
    { multiplier: 0.2, color: '#0f172a' },
    { multiplier: 1.5, color: '#1e293b' },
    { multiplier: 4.0, color: '#60a5fa' },
    { multiplier: 10.0, color: '#3b82f6' },
    { multiplier: 30.0, color: '#2563eb' },
    { multiplier: 100.0, color: '#1d4ed8' },
    { multiplier: 500.0, color: '#1e3a8a' },
  ],
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
  const numRows = 12; // 12 rows of pegs

  // Peg Layout Constants
  const spacingX = 40;
  const spacingY = 34;
  const startY = 50;
  const pegRadius = 3;
  const ballRadius = 6;

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
      x: center + (Math.random() - 0.5) * 4,
      y: 12,
      vx: (Math.random() - 0.5) * 0.8,
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
      ctx.fillStyle = '#020617'; // Set to match luxury background
      ctx.fillRect(0, 0, width, height);

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
          ctx.arc(pegX, pegY, isPulsing ? pegRadius * 1.6 : pegRadius, 0, Math.PI * 2);
          ctx.fillStyle = isPulsing ? '#3b82f6' : '#334155'; // Blue pulse and slate peg color
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

      // Draw bottom bins / buckets
      const binWidth = spacingX - 6;
      bins.forEach((bin, idx) => {
        const binX = center + (idx - numRows / 2) * spacingX - binWidth / 2;
        const binY = startY + numRows * spacingY + 8;

        ctx.fillStyle = bin.color;
        ctx.fillRect(binX, binY, binWidth, 24);

        // Text color styling inside buckets
        ctx.fillStyle = bin.multiplier >= 2.0 ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${bin.multiplier}`, binX + binWidth / 2, binY + 12);
      });

      // Update and Draw active balls in Ref array
      const remainingBalls: Ball[] = [];
      const gravity = 0.15;
      const airResistance = 0.99;

      ballsRef.current.forEach(ball => {
        // Apply physics
        ball.vy += gravity;
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

              // Reflect velocity
              const dot = ball.vx * nx + ball.vy * ny;
              if (dot < 0) {
                const restitution = 0.45;
                ball.vx = ball.vx - (1 + restitution) * dot * nx;
                ball.vy = ball.vy - (1 + restitution) * dot * ny;

                // Add minor random bounce variance
                ball.vx += (Math.random() - 0.5) * 0.25;
                ball.vy += (Math.random() - 0.5) * 0.08;

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
        <span className="text-[10px] bg-gold-500/10 border border-gold-500/20 text-gold-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Plinko Board
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0a0f1d] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold-500" />
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
                  <span className="absolute left-4 top-3.5 text-neutral-500 font-extrabold text-xs">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg cursor-pointer"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg cursor-pointer"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Volatility select */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Volatility Profile</span>
                <div className="grid grid-cols-3 gap-2 bg-black border border-luxury-border p-1 rounded-xl">
                  {['low', 'medium', 'high'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => { playClick(); setRisk(lvl as PlinkoRisk); }}
                      className={`py-2 text-[10px] uppercase font-extrabold rounded-lg transition-all cursor-pointer ${
                        risk === lvl
                          ? 'gold-gradient-bg text-black shadow-md'
                          : 'text-neutral-400 hover:text-white bg-transparent'
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
              >
                Drop Ball
              </Button>

            </CardContent>
          </Card>

          {/* Session Statistics */}
          <Card className="bg-[#0a0f1d]/60 border-luxury-border">
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
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  val >= 1.0 
                    ? 'bg-blue-950/40 text-blue-400 border-blue-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {val.toFixed(1)}x
              </span>
            ))}
          </div>

          {/* Canvas Board */}
          <Card className="bg-[#020617] border-luxury-border flex items-center justify-center p-0 relative overflow-hidden select-none">
            <canvas ref={canvasRef} className="block w-full max-w-[600px] h-[550px]" />
          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0a0f1d]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Plinko Rules</strong>: Set your bet and risk volatility profile. 
                  Low risk has narrow payouts but guarantees keeping credits. 
                  High risk features bins up to <strong>500.0x</strong> at the edges, balanced by low values in the center (0.2x). 
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
