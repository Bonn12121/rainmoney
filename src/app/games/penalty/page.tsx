'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Award, Play } from 'lucide-react';
import Link from 'next/link';
import { WinLoseOverlay } from '@/components/ui/WinLoseOverlay';

type GoalTarget = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

const MULTIPLIERS = [1.4, 1.95, 2.7, 3.8, 5.4, 8.0, 12.0, 20.0];

export default function PenaltyShootoutGame() {
  const { credits, deductCredits, addCredits, addHistoryItem, language } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [goalsScored, setGoalsScored] = useState<number>(0);
  const [outcome, setOutcome] = useState<'goal' | 'save' | 'cashout' | null>(null);
  const [goalkeeperPos, setGoalkeeperPos] = useState<GoalTarget | null>(null);
  const [playerShotPos, setPlayerShotPos] = useState<GoalTarget | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);

  const translations = {
    en: {
      title: 'Penalty Shootout',
      desc: 'Pick a corner to kick. Beat the goalkeeper to build multipliers and cash out!',
      bet: 'Bet Amount',
      balance: 'Balance',
      play: 'Start Match',
      cashout: 'Cash Out',
      shoot: 'Select Net Target',
      rules: 'Shootout Rules',
      rulesDesc: 'Avoid the goalkeeper\'s dive to score. Each consecutive goal builds your cashout multiplier (up to 20x). If the goalie saves your shot, the bet is lost.',
      payout: 'Payout',
      multiplier: 'Multiplier',
      goal: 'GOAL!',
      save: 'SAVED!'
    },
    vi: {
      title: 'Sút Phạt Đền',
      desc: 'Chọn góc sút. Đánh bại thủ môn để tăng số nhân tiền thưởng và rút tiền!',
      bet: 'Tiền cược',
      balance: 'Số dư',
      play: 'Bắt Đầu Đá',
      cashout: 'Rút Tiền',
      shoot: 'Chọn Góc Sút',
      rules: 'Luật Sút Phạt',
      rulesDesc: 'Tránh hướng bay người của thủ môn để ghi bàn. Mỗi bàn thắng liên tiếp sẽ gia tăng số nhân tiền cược của bạn (lên đến 20x). Nếu thủ môn cản phá được, bạn sẽ mất tiền cược.',
      payout: 'Thanh toán',
      multiplier: 'Số nhân',
      goal: 'VÀO!',
      save: 'ĐÃ CẢN PHÁ!'
    }
  };

  const t = translations[language];
  const currentMultiplier = goalsScored > 0 ? MULTIPLIERS[goalsScored - 1] : 0;
  const nextMultiplier = MULTIPLIERS[goalsScored] || MULTIPLIERS[MULTIPLIERS.length - 1];

  const handleStartGame = () => {
    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const success = deductCredits(betAmount);
    if (!success) return;

    playClick();
    setGameState('playing');
    setGoalsScored(0);
    setOutcome(null);
    setGoalkeeperPos(null);
    setPlayerShotPos(null);
    setPayoutAmount(0);
  };

  const handleShot = (target: GoalTarget) => {
    if (gameState !== 'playing') return;
    playPlop();
    setPlayerShotPos(target);

    // Goalkeeper chooses one of 5 directions
    const targets: GoalTarget[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];
    const goalieChoice = targets[Math.floor(Math.random() * targets.length)];
    setGoalkeeperPos(goalieChoice);

    setTimeout(() => {
      if (target !== goalieChoice) {
        // Goal scored!
        playWin();
        const nextGoals = goalsScored + 1;
        setGoalsScored(nextGoals);
        setOutcome('goal');

        // Check if maximum goals reached
        if (nextGoals === MULTIPLIERS.length) {
          handleCashout(nextGoals);
        }
      } else {
        // Goalkeeper saved it!
        playLoss();
        setOutcome('save');
        setGameState('ended');
        setPayoutAmount(0);
        addHistoryItem('Penalty Shootout', betAmount, 0, 0, 'loss');
      }
    }, 600);
  };

  const handleCashout = (overrideGoals?: number) => {
    const goals = overrideGoals !== undefined ? overrideGoals : goalsScored;
    if (goals === 0) return;

    playWin();
    triggerWinConfetti();
    const mult = MULTIPLIERS[goals - 1];
    const payout = Math.round(betAmount * mult * 100) / 100;
    addCredits(payout);
    setPayoutAmount(payout);
    setOutcome('cashout');
    setGameState('ended');

    addHistoryItem('Penalty Shootout', betAmount, mult, payout, 'win');
  };

  const resetOutcomeState = () => {
    setOutcome(null);
    setGoalkeeperPos(null);
    setPlayerShotPos(null);
  };

  const renderTargetButton = (target: GoalTarget, positionClasses: string) => {
    const isSelected = playerShotPos === target;
    const isGoalieHere = goalkeeperPos === target;
    const isSaved = outcome === 'save' && isSelected && isGoalieHere;
    const isScored = outcome === 'goal' && isSelected && !isGoalieHere;
    
    let btnClasses = "border-white/25 text-white/50 bg-black/60 hover:border-cyan-400 hover:text-cyan-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]";
    if (isSelected) {
      if (isSaved) {
        btnClasses = "border-red-500 bg-red-950/40 text-red-400 scale-110 shadow-[0_0_25px_rgba(239,68,68,0.8)]";
      } else if (isScored) {
        btnClasses = "border-emerald-500 bg-emerald-950/40 text-emerald-400 scale-115 shadow-[0_0_25px_rgba(16,185,129,0.8)]";
      } else {
        btnClasses = "border-cyan-500 bg-cyan-950/30 text-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-pulse";
      }
    } else if (gameState !== 'playing' || outcome) {
      btnClasses = "border-neutral-800 text-neutral-600 bg-black/20 opacity-30 pointer-events-none";
    }

    return (
      <div className={`flex ${positionClasses}`}>
        <button
          onClick={() => handleShot(target)}
          disabled={gameState !== 'playing' || !!outcome}
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${btnClasses}`}
        >
          {/* Holographic rings */}
          {gameState === 'playing' && !outcome && !isSelected && (
            <>
              <div className="absolute inset-[-4px] rounded-full border border-cyan-500/10 scale-90 group-hover:scale-100 group-hover:border-cyan-500/30 transition-all duration-300" />
              <div className="absolute inset-[-8px] rounded-full border border-dashed border-cyan-500/5 scale-75 group-hover:scale-100 group-hover:animate-spin transition-all duration-300" style={{ animationDuration: '6s' }} />
            </>
          )}
          
          <svg className="w-7 h-7 filter drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>
    );
  };

  // Goalkeeper layout & styling logic
  const getGoaliePos = () => {
    if (goalkeeperPos) {
      const top = goalkeeperPos === 'top-left' || goalkeeperPos === 'top-right' ? '22%' : goalkeeperPos === 'center' ? '48%' : '72%';
      const left = goalkeeperPos === 'top-left' || goalkeeperPos === 'bottom-left' ? '22%' : goalkeeperPos === 'top-right' || goalkeeperPos === 'bottom-right' ? '78%' : '50%';
      return { top, left };
    }
    return { top: '48%', left: '50%' };
  };
  
  const goaliePos = getGoaliePos();
  
  let goalieShieldClasses = "";
  let goalieGlowColor = "";
  let goalieStatusText = "GK";
  
  if (gameState === 'idle' || gameState === 'ended') {
    goalieShieldClasses = "bg-neutral-850 border-neutral-700 text-neutral-500 shadow-none";
    goalieGlowColor = "bg-neutral-500/5 border-neutral-500/10";
    goalieStatusText = "STBY";
  } else if (!playerShotPos) {
    goalieShieldClasses = "bg-gradient-to-br from-cyan-600 via-teal-400 to-cyan-700 border-white text-white shadow-[0_0_25px_rgba(34,211,238,0.7)] animate-pulse";
    goalieGlowColor = "bg-cyan-500/15 border-cyan-500/35 animate-ping";
    goalieStatusText = "READY";
  } else if (!outcome) {
    goalieShieldClasses = "bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-600 border-white text-white shadow-[0_0_25px_rgba(245,158,11,0.8)]";
    goalieGlowColor = "bg-amber-500/20 border-amber-500/40 animate-ping";
    goalieStatusText = "DEFEND";
  } else if (outcome === 'save') {
    goalieShieldClasses = "bg-gradient-to-br from-rose-600 via-red-500 to-rose-700 border-white text-white shadow-[0_0_35px_rgba(239,68,68,0.9)] scale-110";
    goalieGlowColor = "bg-red-500/30 border-red-500/50 animate-ping";
    goalieStatusText = "BLOCKED";
  } else if (outcome === 'goal') {
    goalieShieldClasses = "bg-neutral-950 border-neutral-900 text-neutral-600 opacity-20 shadow-none scale-90 border-dashed";
    goalieGlowColor = "bg-transparent border-transparent";
    goalieStatusText = "FAILED";
  }

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

              {/* Game State Actions */}
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
                <div className="flex flex-col gap-2">
                  <div className="bg-black/50 border border-luxury-border p-3.5 rounded-2xl flex flex-col gap-1.5 text-center text-xs font-bold">
                    <span className="text-neutral-500 uppercase tracking-widest text-[9px]">{language === 'vi' ? 'Tiền Thưởng Hiện Tại' : 'Accumulated Multiplier'}</span>
                    <span className="text-xl text-yellow-450 font-black">{goalsScored > 0 ? `${currentMultiplier.toFixed(2)}x` : '1.00x'}</span>
                  </div>
                  <Button
                    variant="gold"
                    fullWidth
                    size="lg"
                    onClick={() => handleCashout()}
                    disabled={goalsScored === 0}
                  >
                    {t.cashout} (+${Math.round(betAmount * currentMultiplier * 100) / 100})
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Multiplier progression list */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-4 border-b border-[#1e293b]/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t.multiplier} Ladder</span>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-4 gap-2 text-center text-xs">
              {MULTIPLIERS.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg border font-black ${
                    goalsScored === idx + 1
                      ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                      : goalsScored > idx + 1
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-500'
                      : 'bg-black/40 border-luxury-border text-neutral-500'
                  }`}
                >
                  <span className="block text-[8px] uppercase font-bold">{idx + 1} {language === 'vi' ? 'Trái' : 'Goal'}</span>
                  <span className="text-[11px] mt-0.5 block">{m.toFixed(2)}x</span>
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

        {/* Right Side: Pitch and Goal */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-b from-[#0f172a] via-[#022c22] to-[#011c14] border-emerald-500/20 relative p-8 flex flex-col items-center justify-between min-h-[480px] overflow-visible rounded-3xl shadow-[0_0_50px_rgba(4,120,87,0.15)]">
            
            {/* Stadium Visual Assets / Light Beams */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent rounded-3xl" />
            <div className="absolute top-0 left-12 w-[140px] h-[280px] bg-gradient-to-b from-cyan-500/8 to-transparent origin-top -rotate-12 blur-md pointer-events-none z-0" />
            <div className="absolute top-0 right-12 w-[140px] h-[280px] bg-gradient-to-b from-cyan-500/8 to-transparent origin-top rotate-12 blur-md pointer-events-none z-0" />
            
            {/* Stadium Lights */}
            <div className="absolute top-4 left-8 w-24 h-7 bg-cyan-400/20 blur-md rounded-full border border-cyan-300/10 z-10 flex items-center justify-center gap-1.5 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse delay-300" />
            </div>
            <div className="absolute top-4 right-8 w-24 h-7 bg-cyan-400/20 blur-md rounded-full border border-cyan-300/10 z-10 flex items-center justify-center gap-1.5 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse delay-300" />
            </div>

            {/* Grid Overlay Field Line */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-[#064e3b]/20 to-[#011c14]/95 border-t-2 border-emerald-500/35 z-0 flex flex-col items-center justify-center rounded-b-3xl">
              {/* Penalty spot */}
              <div className="w-4.5 h-4.5 rounded-full bg-white/60 border border-white/30 -mt-10 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              {/* Penalty arc */}
              <div className="w-36 h-18 rounded-t-full border-t-2 border-dashed border-white/20 -mt-2" />
            </div>

            {/* Goal Net Structure (Overflow visible so ball can fly in from foreground) */}
            <div className="w-full max-w-xl aspect-[8/5] border-[6px] border-white bg-black/60 relative z-10 rounded-t-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] flex flex-col justify-between border-b-0">
              
              {/* Goal frame neon LED indicator line */}
              <div className="absolute -inset-[6px] border-2 border-dashed border-cyan-400/30 rounded-t-2xl pointer-events-none z-30" />
              
              {/* Net grid backing */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/30 via-black/90 to-black z-0 rounded-t-xl">
                <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.06)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.06)_1px,_transparent_1px)] bg-[size:12px_12px] rounded-t-xl" />
              </div>

              {/* Goal keeper avatar with Energy Shield */}
              <div 
                className="absolute transition-all duration-500 ease-out z-25 flex flex-col items-center select-none"
                style={{
                  top: goaliePos.top,
                  left: goaliePos.left,
                  transform: 'translate(-50%, -50%) scale(1.15)',
                  opacity: outcome === 'goal' ? 0.3 : 1
                }}
              >
                {/* Glowing neon goalie shield */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-2xl opacity-75 ${goalieGlowColor}`} />
                  <div className={`w-13 h-13 border-2 border-white rounded-xl flex flex-col items-center justify-center text-white transition-all duration-300 ${goalieShieldClasses}`}>
                    <svg className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <circle cx="12" cy="11" r="3" />
                    </svg>
                  </div>
                </div>
                <span className="text-[7.5px] bg-black/95 text-neutral-300 font-extrabold px-1.5 py-0.5 rounded border border-neutral-700 uppercase tracking-widest mt-1.5 shadow-md">
                  {goalieStatusText}
                </span>
              </div>

              {/* Soccer Ball flying from penalty spot to target */}
              {(gameState === 'playing' || playerShotPos) && (
                <div 
                  className="absolute transition-all duration-500 ease-out z-30"
                  style={{
                    top: playerShotPos
                      ? (playerShotPos === 'top-left' || playerShotPos === 'top-right' ? '22%' : playerShotPos === 'center' ? '48%' : '72%')
                      : '120%', // Penalty spot coordinates relative to the goal structure container
                    left: playerShotPos
                      ? (playerShotPos === 'top-left' || playerShotPos === 'bottom-left' ? '22%' : playerShotPos === 'top-right' || playerShotPos === 'bottom-right' ? '78%' : '50%')
                      : '50%',
                    transform: `translate(-50%, -50%) scale(${playerShotPos ? 0.75 : 1.25})`,
                  }}
                >
                  {/* Ball Speed Trail / Glowing Ring */}
                  {playerShotPos && (
                    <div className="absolute inset-[-8px] rounded-full border-2 border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '1.5s' }} />
                  )}
                  
                  {/* Soccer Ball design */}
                  <div className={`w-9 h-9 rounded-full bg-white border-2 border-neutral-900 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.95)] ${playerShotPos && !outcome ? 'animate-spin' : ''}`} style={{ animationDuration: '0.4s' }}>
                    <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      <path d="M2.5 9h19M2.5 15h19" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Interactive Target Spots Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 p-6 gap-x-8 gap-y-4 z-20">
                {renderTargetButton('top-left', 'justify-start items-start')}
                <div /> {/* Empty center-top space */}
                {renderTargetButton('top-right', 'justify-end items-start')}
                {renderTargetButton('bottom-left', 'justify-start items-end')}
                {renderTargetButton('center', 'justify-center items-end')}
                {renderTargetButton('bottom-right', 'justify-end items-end')}
              </div>

            </div>

            {/* Outcome Display Panel */}
            <div className="h-16 flex items-center justify-center relative z-10 w-full">
              {outcome === 'goal' && (
                <div className="text-center animate-fade-in flex flex-col items-center gap-2">
                  <span className="text-xl font-black text-emerald-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    {t.goal} (+{nextMultiplier.toFixed(2)}x next)
                  </span>
                  <Button variant="gold" size="sm" onClick={resetOutcomeState} className="shadow-lg">
                    {language === 'vi' ? 'Tiếp Tục Sút' : 'Keep Shooting'}
                  </Button>
                </div>
              )}
            </div>

            <WinLoseOverlay
              isOpen={outcome === 'save' || outcome === 'cashout'}
              onClose={() => { setGameState('idle'); setOutcome(null); }}
              outcome={outcome === 'cashout' ? 'win' : 'loss'}
              multiplier={outcome === 'cashout' ? currentMultiplier : 0}
              payout={outcome === 'cashout' ? payoutAmount : 0}
              language={language}
            />

          </Card>
        </div>

      </div>
    </div>
  );
}
