'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, Award, Crown, User, ShieldCheck } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  credits: number;
  badge: string;
  isSelf?: boolean;
}

const STATIC_LEADERS: Omit<LeaderboardEntry, 'rank'>[] = [
  { username: 'John_DuPont', level: 48, credits: 142500, badge: 'Gold Club' },
  { username: 'MelonMusk', level: 39, credits: 98200, badge: 'Gold Club' },
  { username: 'Richard_Brans', level: 32, credits: 76150, badge: 'Gold Club' },
  { username: 'Vanderbilt', level: 27, credits: 54900, badge: 'Silver VIP' },
  { username: 'Rothschild', level: 25, credits: 48000, badge: 'Silver VIP' },
  { username: 'Monaco_VIP', level: 22, credits: 39500, badge: 'Silver VIP' },
  { username: 'Rockefeller', level: 19, credits: 31200, badge: 'Silver VIP' },
  { username: 'Aurelius', level: 18, credits: 28450, badge: 'Bronze Tier' },
  { username: 'Syndicate', level: 15, credits: 21900, badge: 'Bronze Tier' },
];

export default function Leaderboard() {
  const { credits, username, level } = useGameState();

  // Inject player into the standings based on credits
  const allEntries: LeaderboardEntry[] = [
    ...STATIC_LEADERS.map((l) => ({ ...l, isSelf: false })),
    { username, level, credits, badge: level >= 20 ? 'Silver VIP' : 'Bronze Tier', isSelf: true }
  ]
    .sort((a, b) => b.credits - a.credits)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const podium = allEntries.slice(0, 3);
  const remaining = allEntries.slice(3);

  // Helper for rank icon
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-gold-500 fill-gold-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-neutral-400 fill-neutral-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700 fill-amber-700" />;
    return <span className="font-bold text-neutral-500 text-xs w-5 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10 flex-grow">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
        <span className="text-[10px] tracking-widest font-extrabold text-gold-500 uppercase">Standings</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight">
          Global <span className="gold-gradient-text">High Rollers</span>
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
          Review the absolute elite. Rankings are recalculated in real time based on active wallet balances.
        </p>
      </div>

      {/* Podium (Top 3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4">
        {/* 2nd Place */}
        {podium[1] && (
          <Card 
            className={`order-2 md:order-1 bg-[#0c0c0c] border-luxury-border p-6 flex flex-col items-center gap-4 text-center ${
              podium[1].isSelf ? 'border-gold-500/25 bg-gold-500/[0.01]' : ''
            }`}
          >
            <span className="p-3 bg-neutral-500/10 rounded-full border border-neutral-500/20 text-neutral-400">
              <Award className="w-6 h-6 fill-neutral-400" />
            </span>
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">2nd Position</span>
              <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5 justify-center">
                {podium[1].username}
                {podium[1].isSelf && <span className="text-[8px] bg-gold-500/10 text-gold-500 border border-gold-500/20 px-1 py-0.5 rounded uppercase font-bold">You</span>}
              </h3>
              <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{podium[1].badge} • Lvl {podium[1].level}</p>
            </div>
            <div className="w-full bg-black/40 border border-luxury-border/60 py-2.5 rounded-xl">
              <span className="text-sm font-extrabold text-white">${podium[1].credits.toLocaleString()}</span>
            </div>
          </Card>
        )}

        {/* 1st Place */}
        {podium[0] && (
          <Card 
            glow
            className={`order-1 md:order-2 bg-[#0e0e0e] border-gold-500/15 py-8 px-6 flex flex-col items-center gap-5 text-center relative ${
              podium[0].isSelf ? 'bg-gold-500/[0.02]' : ''
            }`}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold-500 text-black text-[9px] font-black px-3 py-1 uppercase rounded-md tracking-wider shadow">
              CHAMPION
            </div>
            <span className="p-3.5 bg-gold-500/10 rounded-full border border-gold-500/20 text-gold-500 animate-bounce">
              <Crown className="w-8 h-8 fill-gold-500" />
            </span>
            <div>
              <span className="text-[10px] text-gold-500 font-bold uppercase tracking-wider block">1st Position</span>
              <h3 className="text-lg font-black text-white mt-1.5 flex items-center gap-1.5 justify-center">
                {podium[0].username}
                {podium[0].isSelf && <span className="text-[8px] bg-gold-500/10 text-gold-500 border border-gold-500/20 px-1 py-0.5 rounded uppercase font-bold">You</span>}
              </h3>
              <p className="text-[10px] text-gold-500/60 font-bold mt-0.5">{podium[0].badge} • Lvl {podium[0].level}</p>
            </div>
            <div className="w-full bg-black/60 border border-gold-500/10 py-3 rounded-xl">
              <span className="text-base font-black gold-gradient-text">${podium[0].credits.toLocaleString()}</span>
            </div>
          </Card>
        )}

        {/* 3rd Place */}
        {podium[2] && (
          <Card 
            className={`order-3 bg-[#0c0c0c] border-luxury-border p-6 flex flex-col items-center gap-4 text-center ${
              podium[2].isSelf ? 'border-gold-500/25 bg-gold-500/[0.01]' : ''
            }`}
          >
            <span className="p-3 bg-amber-800/10 rounded-full border border-amber-800/20 text-amber-700">
              <Award className="w-6 h-6 fill-amber-700" />
            </span>
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">3rd Position</span>
              <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5 justify-center">
                {podium[2].username}
                {podium[2].isSelf && <span className="text-[8px] bg-gold-500/10 text-gold-500 border border-gold-500/20 px-1 py-0.5 rounded uppercase font-bold">You</span>}
              </h3>
              <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{podium[2].badge} • Lvl {podium[2].level}</p>
            </div>
            <div className="w-full bg-black/40 border border-luxury-border/60 py-2.5 rounded-xl">
              <span className="text-sm font-extrabold text-white">${podium[2].credits.toLocaleString()}</span>
            </div>
          </Card>
        )}
      </div>

      {/* Standings Table (Remaining Leaders) */}
      <Card className="bg-[#0b0b0b]/40 border-luxury-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-luxury-border/60 text-neutral-500 uppercase tracking-widest text-[9px]">
                <th className="p-4 pl-6 w-16">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4">Membership Level</th>
                <th className="p-4">Standing Tag</th>
                <th className="p-4 text-right pr-6">Wallet Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/30">
              {remaining.map((item) => (
                <tr 
                  key={item.username} 
                  className={`hover:bg-white/[0.01] transition-colors font-medium ${
                    item.isSelf ? 'bg-gold-500/[0.02] hover:bg-gold-500/[0.03]' : ''
                  }`}
                >
                  <td className="p-4 pl-6">{getRankBadge(item.rank)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-neutral-900 border border-luxury-border flex items-center justify-center font-bold text-[10px] text-neutral-400">
                        {item.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-neutral-200 font-bold flex items-center gap-1.5">
                        {item.username}
                        {item.isSelf && <span className="text-[8px] bg-gold-500/10 text-gold-500 border border-gold-500/20 px-1 py-0.5 rounded uppercase font-bold">You</span>}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-400">VIP Level {item.level}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      item.badge === 'Gold Club' 
                        ? 'bg-gold-500/10 border-gold-500/20 text-gold-500' 
                        : item.badge === 'Silver VIP' 
                        ? 'bg-neutral-500/10 border-neutral-500/20 text-neutral-300' 
                        : 'bg-black border-luxury-border text-neutral-500'
                    }`}>
                      {item.badge}
                    </span>
                  </td>
                  <td className="p-4 text-right text-white font-extrabold pr-6">${item.credits.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
