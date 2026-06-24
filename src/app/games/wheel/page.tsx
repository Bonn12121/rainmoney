'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Play, ShieldAlert, Award, Disc, RotateCw } from 'lucide-react';
import Link from 'next/link';

type RiskLevel = 'low' | 'medium' | 'high';

interface Wedge {
  multiplier: number;
  color: string; // hex
  textColor: string;
}

const LOW_WEDGES: Wedge[] = [
  { multiplier: 1.2, color: '#161616', textColor: '#FFFFFF' },
  { multiplier: 1.5, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.8, color: '#262626', textColor: '#A3A3A3' },
  { multiplier: 1.2, color: '#161616', textColor: '#FFFFFF' },
  { multiplier: 1.5, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.8, color: '#262626', textColor: '#A3A3A3' },
  { multiplier: 1.2, color: '#161616', textColor: '#FFFFFF' },
  { multiplier: 1.5, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.8, color: '#262626', textColor: '#A3A3A3' },
  { multiplier: 1.2, color: '#161616', textColor: '#FFFFFF' },
  { multiplier: 1.5, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.8, color: '#262626', textColor: '#A3A3A3' },
];

const MEDIUM_WEDGES: Wedge[] = [
  { multiplier: 2.0, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 1.5, color: '#262626', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 3.0, color: '#93c5fd', textColor: '#000000' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 1.5, color: '#262626', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 2.0, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 1.5, color: '#262626', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
];

const HIGH_WEDGES: Wedge[] = [
  { multiplier: 5.0, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 0.0, color: '#161616', textColor: '#A3A3A3' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 10.0, color: '#93c5fd', textColor: '#000000' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 0.0, color: '#161616', textColor: '#A3A3A3' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 5.0, color: '#3b82f6', textColor: '#FFFFFF' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
  { multiplier: 0.0, color: '#161616', textColor: '#A3A3A3' },
  { multiplier: 0.0, color: '#1F1F1F', textColor: '#A3A3A3' },
];

export default function WheelGame() {
  const { credits, deductCredits, addCredits, addHistoryItem } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Inputs
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<RiskLevel>('medium');

  // States
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<'win' | 'loss' | null>(null);

  // Stats
  const [recentOutcomes, setRecentOutcomes] = useState<number[]>([1.5, 0.0, 2.0, 0.8, 1.2]);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, profit: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wedges = risk === 'low' ? LOW_WEDGES : risk === 'medium' ? MEDIUM_WEDGES : HIGH_WEDGES;

  // Draw the Wheel Canvas once wedges or risk changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    const anglePerWedge = (2 * Math.PI) / wedges.length;

    wedges.forEach((wedge, index) => {
      const startAngle = index * anglePerWedge - Math.PI / 2;
      const endAngle = startAngle + anglePerWedge;

      // Draw segment wedge
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = wedge.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#050505';
      ctx.stroke();

      // Draw wedge texts
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + anglePerWedge / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = wedge.textColor;
      ctx.font = 'bold 12px sans-serif';
      // Offset from outer edge
      ctx.fillText(`${wedge.multiplier.toFixed(1)}x`, radius - 15, 0);
      ctx.restore();
    });

    // Draw center gold circle hub (adjusted to blue/navy)
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    // Draw little center lock
    ctx.beginPath();
    ctx.arc(center, center, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
  }, [wedges, risk]);

  // Spin function
  const handleSpin = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setIsSpinning(true);
    setSelectedMultiplier(null);
    setOutcomeStatus(null);

    // Pick target wedge index
    const targetIndex = Math.floor(Math.random() * wedges.length);
    const targetWedge = wedges[targetIndex];

    const anglePerWedge = 360 / wedges.length;
    // Calculate final rotation target in degrees
    // Center of the wedge is targetIndex * anglePerWedge
    // We want the selector (which points to the top - 0 deg / Math.PI * 1.5) to align with this wedge.
    // The top wedge starts at index 0. The wheel spins clockwise.
    // So to land index K at the top pointer, we need to spin the wheel:
    // targetAngle = 360 - (K * anglePerWedge)
    const wedgeCenterAngle = (targetIndex * anglePerWedge) + (anglePerWedge / 2);
    const targetAngle = 360 - wedgeCenterAngle;
    
    // Add multiple rotations (e.g. 6 complete spins)
    const extraRotations = 6;
    const totalRotation = rotationDegrees + (extraRotations * 360) + targetAngle - (rotationDegrees % 360);
    setRotationDegrees(totalRotation);

    // Sound ticking simulations
    const totalTicks = 30;
    let ticks = 0;
    const playTickSound = () => {
      if (ticks < totalTicks) {
        playPlop();
        ticks++;
        const delay = Math.min(450, 40 + Math.pow(ticks / 10, 3.2) * 6);
        setTimeout(playTickSound, delay);
      }
    };
    setTimeout(playTickSound, 100);

    // End spin timeout (must match CSS transition duration of 3s)
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedMultiplier(targetWedge.multiplier);
      
      const won = targetWedge.multiplier >= 1.0;
      const status = won ? 'win' : 'loss';
      setOutcomeStatus(status);

      const payout = Math.round(betAmount * targetWedge.multiplier * 100) / 100;

      if (won) {
        playWin();
        if (targetWedge.multiplier > 1.0) triggerWinConfetti();
        addCredits(payout);
        addHistoryItem('Wheel', betAmount, targetWedge.multiplier, payout, 'win');
        setGameStats(prev => ({
          ...prev,
          wins: prev.wins + 1,
          profit: prev.profit + (payout - betAmount),
        }));
      } else {
        playLoss();
        addHistoryItem('Wheel', betAmount, 0, 0, 'loss');
        setGameStats(prev => ({
          ...prev,
          losses: prev.losses + 1,
          profit: prev.profit - betAmount,
        }));
      }

      setRecentOutcomes(prev => [targetWedge.multiplier, ...prev.slice(0, 5)]);
    }, 3000); // 3 seconds CSS spin
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
        <span className="text-[10px] bg-gold-500/10 border border-gold-500/20 text-gold-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
          Multiplier Wheel
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Panel: Inputs */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Disc className="w-4 h-4 text-gold-500" />
                WHEEL SETTINGS
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
                    disabled={isSpinning}
                    className="w-full bg-black border border-luxury-border focus:border-gold-500/50 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none disabled:opacity-50"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setBetAmount(prev => Math.max(0.01, Math.round((prev / 2) * 100) / 100))}
                      disabled={isSpinning}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => setBetAmount(prev => Math.min(credits, Math.round(prev * 2 * 100) / 100))}
                      disabled={isSpinning}
                      className="px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg disabled:opacity-50"
                    >
                      x2
                    </button>
                  </div>
                </div>
              </div>

              {/* Risk selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Risk Profile</span>
                <div className="grid grid-cols-3 gap-2 bg-black border border-luxury-border p-1 rounded-xl">
                  {['low', 'medium', 'high'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => { playClick(); setRisk(lvl as RiskLevel); }}
                      disabled={isSpinning}
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

              {/* Spin Action Button */}
              <Button
                variant="gold"
                fullWidth
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning || betAmount <= 0}
              >
                {isSpinning ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Spinning Wheel...
                  </span>
                ) : (
                  <span>Spin Wheel</span>
                )}
              </Button>

            </CardContent>
          </Card>

          {/* Wheel wedge breakdown */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Wedge Multipliers</span>
            </CardHeader>
            <CardContent className="p-4 flex flex-wrap gap-2.5">
              {wedges.map((w, idx) => (
                <span 
                  key={idx} 
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border bg-black border-luxury-border ${
                    w.multiplier >= 2.0 
                      ? 'text-gold-500' 
                      : w.multiplier === 0.0 
                      ? 'text-red-500'
                      : 'text-neutral-400'
                  }`}
                >
                  {w.multiplier.toFixed(1)}x
                </span>
              ))}
            </CardContent>
          </Card>

          {/* Session Statistics */}
          <Card className="bg-[#0b0b0b]/60">
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

        {/* Right Panel: Game visual arena */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* History */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mr-2">History:</span>
            {recentOutcomes.map((val, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold border ${
                  val >= 1.0 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                }`}
              >
                {val.toFixed(1)}x
              </span>
            ))}
          </div>

          {/* Spinning Wheel Arena */}
          <Card className="bg-[#050505] border-luxury-border p-12 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden select-none">
            
            {/* Top Pointer cursor */}
            <div className="absolute top-[48px] z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-gold-500 drop-shadow-[0_2px_5px_rgba(212,175,55,0.4)]"></div>

            {/* Rotatable wheel canvas wrapper */}
            <div 
              className="relative flex items-center justify-center rounded-full overflow-hidden border-[4px] border-luxury-border shadow-2xl transition-transform ease-out"
              style={{ 
                transform: `rotate(${rotationDegrees}deg)`,
                transitionDuration: isSpinning ? '3000ms' : '0ms'
              }}
            >
              <canvas ref={canvasRef} className="block shadow-inner" />
            </div>

            {/* Standalone Outcome status panel */}
            {!isSpinning && selectedMultiplier !== null && (
              <div className="mt-8 text-center animate-fade-in">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest block leading-none">LANDED ON MULTIPLIER</span>
                <h4 className="text-3xl font-black text-white uppercase mt-2">{selectedMultiplier.toFixed(1)}x</h4>
                <p className={`text-xs font-extrabold mt-1.5 ${outcomeStatus === 'win' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {outcomeStatus === 'win' 
                    ? `Payout +$${(Math.round(betAmount * selectedMultiplier * 100) / 100).toLocaleString()}` 
                    : `Loss -$${betAmount.toLocaleString()}`}
                </p>
              </div>
            )}

            {isSpinning && (
              <div className="mt-8 text-center animate-pulse">
                <span className="text-[10px] text-gold-500/60 font-extrabold uppercase tracking-widest">WHEEL SPINNING...</span>
              </div>
            )}
          </Card>

          {/* Game Rules Description */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border/60">
            <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-400 font-medium">
              <ShieldAlert className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Wheel Rules</strong>: Select your bet amount and risk category (Low, Medium, or High). 
                  Click <strong>Spin Wheel</strong> to rotate. 
                  Low risk wedging guarantees high hit rates with smaller yields (e.g. 0.8x to 1.5x). 
                  High risk features high reward sectors (up to 10.0x) paired with high zero-multiplier crash odds. 
                  Payout equals `Bet × Multiplier` sector value.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
