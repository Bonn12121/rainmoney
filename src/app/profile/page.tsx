'use client';

import React, { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  Coins, 
  Award, 
  History, 
  Edit3, 
  Check, 
  BarChart3, 
  ShieldAlert, 
  Trophy,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Star
} from 'lucide-react';

export default function Profile() {
  const { 
    credits, 
    username, 
    level, 
    xp, 
    gameHistory, 
    achievements, 
    updateUsername,
    resetProgress 
  } = useGameState();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUsername(tempName);
      setIsEditingName(false);
    }
  };

  // Compute stats
  const totalBetsPlaced = gameHistory.length;
  const totalCreditsBet = gameHistory.reduce((sum, item) => sum + item.bet, 0);
  const totalPayout = gameHistory.reduce((sum, item) => sum + item.payout, 0);
  const netProfit = totalPayout - totalCreditsBet;
  const maxWinMultiplier = gameHistory.length > 0 
    ? Math.max(...gameHistory.filter(i => i.status === 'win').map(i => i.multiplier), 0)
    : 0;

  const xpNeeded = level * 1000;
  const xpPercentage = Math.min(100, Math.floor((xp / xpNeeded) * 100));

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10 flex-grow">
      
      {/* Profile Overview Header */}
      <section className="flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* User Card */}
        <Card className="flex-1 bg-gradient-to-br from-[#0d0d0d] via-luxury-surface to-[#070707] border-luxury-border flex flex-col justify-between p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar block */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-black border-2 border-gold-500/20 flex items-center justify-center font-serif text-3xl font-bold text-gold-500 tracking-widest shadow-lg shadow-gold-500/5">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gold-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-black shadow">
                VIP
              </div>
            </div>

            {/* Username & edit */}
            <div className="flex-grow flex flex-col gap-2 text-center sm:text-left">
              {isEditingName ? (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value.slice(0, 16))}
                    className="bg-black border border-gold-500/30 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gold-500 font-medium"
                    placeholder="Enter name"
                  />
                  <Button variant="gold" size="sm" onClick={handleSaveName} className="py-2.5 px-3">
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl font-bold tracking-wide text-white">{username}</h2>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-neutral-500 hover:text-white rounded-md hover:bg-white/5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="text-[10px] text-gold-500/80 font-bold uppercase tracking-widest leading-none">
                VIP MEMBERSHIP TIER
              </span>
            </div>
          </div>

          <hr className="border-luxury-border/60 my-6" />

          {/* Level Progress */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end text-xs font-medium">
              <span className="text-neutral-400">Level {level} Progress</span>
              <span className="text-neutral-300 font-bold">{xp} / {xpNeeded} XP</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-black/60 border border-luxury-border h-2 rounded-full overflow-hidden">
              <div 
                className="gold-gradient-bg h-full rounded-full transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>

            <span className="text-[10px] text-neutral-500 font-medium">
              Earn 0.5 XP for every virtual dollar ($) bet. Reach {xpNeeded} XP to advance to Level {level + 1}.
            </span>
          </div>
        </Card>

        {/* Dynamic balance stats card */}
        <Card className="w-full lg:w-96 bg-[#0b0b0b] border-luxury-border p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block leading-none">Account Wealth</span>
            
            <div className="bg-black/60 border border-luxury-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gold-500/10 p-2 rounded-lg border border-gold-500/20">
                  <Coins className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">Wallet</span>
                  <span className="text-xl font-black text-white block mt-1.5">${credits.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-black/60 border border-luxury-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gold-500/10 p-2 rounded-lg border border-gold-500/20">
                  <Trophy className="w-5 h-5 text-gold-500" />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">Achievements</span>
                  <span className="text-xl font-black text-white block mt-1.5">{unlockedCount} / {achievements.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                if (confirm('DANGER: This will permanently wipe your profile, level, match history, and balance. Proceed?')) {
                  resetProgress();
                }
              }}
              className="w-full text-center text-xs text-red-500/80 hover:text-red-400 font-bold tracking-wide uppercase border border-red-500/15 hover:border-red-500/35 hover:bg-red-500/5 py-2.5 rounded-xl transition-all"
            >
              Wipe Account Progress
            </button>
          </div>
        </Card>

      </section>

      {/* Grid: Gameplay Stats & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Statistics panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold-500" />
            <h3 className="text-lg font-bold tracking-wide text-white">Lobby Statistics</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-[#0b0b0b]/60 p-5 border-luxury-border">
              <span className="text-[9px] text-neutral-500 font-bold block uppercase tracking-wider">Total Rounds</span>
              <span className="text-lg font-black text-white block mt-2">{totalBetsPlaced}</span>
            </Card>

            <Card className="bg-[#0b0b0b]/60 p-5 border-luxury-border">
              <span className="text-[9px] text-neutral-500 font-bold block uppercase tracking-wider">Total Bet Volume</span>
              <span className="text-lg font-black text-white block mt-2">${totalCreditsBet.toLocaleString()}</span>
            </Card>

            <Card className="bg-[#0b0b0b]/60 p-5 border-luxury-border">
              <span className="text-[9px] text-neutral-500 font-bold block uppercase tracking-wider">Net Yield</span>
              <span className={`text-lg font-black block mt-2 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {netProfit >= 0 ? '+' : '-'}${Math.abs(netProfit).toLocaleString()}
              </span>
            </Card>

            <Card className="bg-[#0b0b0b]/60 p-5 border-luxury-border">
              <span className="text-[9px] text-neutral-500 font-bold block uppercase tracking-wider">Max Multiplier</span>
              <span className="text-lg font-black text-gold-500 block mt-2">
                {maxWinMultiplier > 0 ? `${maxWinMultiplier.toFixed(2)}x` : '—'}
              </span>
            </Card>
          </div>

          {/* Match History Log */}
          <Card className="bg-[#0b0b0b]/40 border-luxury-border">
            <CardHeader className="p-5 pb-3 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <History className="w-4 h-4 text-gold-500" />
                MATCH HISTORY LOG
              </CardTitle>
              <CardDescription className="text-[10px]">Record of your last 100 rounds played.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {gameHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 font-medium">
                  No rounds recorded. Enter a lobby to start playing.
                </div>
              ) : (
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-luxury-border/60 text-neutral-500 uppercase tracking-widest text-[9px]">
                      <th className="p-4">Game</th>
                      <th className="p-4">Bet Amount</th>
                      <th className="p-4">Multiplier</th>
                      <th className="p-4">Outcome Payout</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-border/30">
                    {gameHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.01] transition-colors font-medium">
                        <td className="p-4 text-neutral-300 font-bold">{item.game}</td>
                        <td className="p-4 text-neutral-400">${item.bet}</td>
                        <td className="p-4 text-gold-500/80 font-bold">{item.multiplier > 0 ? `${item.multiplier.toFixed(2)}x` : '—'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${
                            item.status === 'win' 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' 
                              : 'bg-red-950/40 text-red-400 border border-red-500/10'
                          }`}>
                            {item.status === 'win' ? `+$${item.payout}` : `-$${item.bet}`}
                          </span>
                        </td>
                        <td className="p-4 text-right text-neutral-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements list */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-500" />
            <h3 className="text-lg font-bold tracking-wide text-white">Achievements</h3>
          </div>

          <div className="flex flex-col gap-4">
            {achievements.map((ach) => (
              <Card 
                key={ach.id} 
                className={`bg-luxury-surface transition-all duration-300 ${
                  ach.unlocked 
                    ? 'border-gold-500/25 bg-gradient-to-r from-luxury-surface to-gold-500/[0.02]' 
                    : 'border-luxury-border opacity-60'
                }`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                    ach.unlocked 
                      ? 'bg-gold-500/10 border-gold-500/20 text-gold-500' 
                      : 'bg-black border-luxury-border text-neutral-600'
                  }`}>
                    <Star className={`w-5 h-5 ${ach.unlocked ? 'fill-gold-500 text-gold-500' : ''}`} />
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${ach.unlocked ? 'text-white' : 'text-neutral-400'}`}>
                      {ach.title}
                    </h5>
                    <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug font-medium">
                      {ach.description}
                    </p>
                    {ach.unlocked && ach.unlockedAt && (
                      <span className="text-[8px] text-gold-500/60 font-bold uppercase tracking-wider block mt-1.5 leading-none">
                        Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
