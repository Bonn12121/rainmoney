'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameState } from '@/context/GameStateContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Rocket, 
  Grid, 
  Dices, 
  Coins as CoinIcon, 
  Disc, 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  Activity, 
  Award, 
  Trophy, 
  Gift, 
  Layers,
  Zap,
  Hash,
  ArrowUpDown,
  Spade
} from 'lucide-react';

interface LiveWin {
  id: string;
  username: string;
  game: string;
  bet: number;
  multiplier: number;
  payout: number;
  time: string;
}

const INITIAL_LIVE_WINS: LiveWin[] = [
  { id: '1', username: 'Aurelius', game: 'Rocket', bet: 250, multiplier: 3.42, payout: 855, time: 'Just now' },
  { id: '2', username: 'Vanderbilt', game: 'Mines', bet: 100, multiplier: 1.84, payout: 184, time: '1s ago' },
  { id: '3', username: 'Rothschild', game: 'Dice', bet: 500, multiplier: 2.00, payout: 1000, time: '3s ago' },
  { id: '4', username: 'Monaco_VIP', game: 'Coin Flip', bet: 1000, multiplier: 1.96, payout: 1960, time: '5s ago' },
  { id: '5', username: 'Syndicate', game: 'Wheel', bet: 200, multiplier: 5.00, payout: 1000, time: '8s ago' },
];

const FICTIONOUS_NAMES = [
  'RoyalFlush', 'GildedKnight', 'Sovereign', 'GoldFingers', 'BlackCardClub',
  'Dynasty', 'Elixir', 'Centurion', 'Meridian', 'ApexTrader', 'NovaRich'
];

const GAMES = [
  { id: 'rocket', name: 'Rocket', desc: 'Watch the multiplier climb and cash out before the crash.', icon: Rocket, color: 'text-amber-500', path: '/games/rocket', tag: 'High Volatility' },
  { id: 'mines', name: 'Mines', desc: 'Uncover gold gems on a grid while avoiding hidden mines.', icon: Grid, color: 'text-yellow-500', path: '/games/mines', tag: 'Strategy' },
  { id: 'dice', name: 'Dice', desc: 'Predict numbers over/under and adjust your win probability.', icon: Dices, color: 'text-amber-400', path: '/games/dice', tag: 'Configurable Risk' },
  { id: 'coin-flip', name: 'Coin Flip', desc: 'Choose heads or tails for a double-or-nothing luxury flip.', icon: CoinIcon, color: 'text-yellow-600', path: '/games/coin-flip', tag: '50/50' },
  { id: 'wheel', name: 'Wheel', desc: 'Spin the segmented wheel with adjustable multiplier volatility.', icon: Disc, color: 'text-amber-600', path: '/games/wheel', tag: 'Instant Win' },
  { id: 'plinko', name: 'Plinko', desc: 'Drop balls through a peg board to hit high multiplier bins.', icon: TrendingUp, color: 'text-yellow-300', path: '/games/plinko', tag: 'Classic Physics' },
  { id: 'towers', name: 'Towers', desc: 'Climb towers row by row selecting tiles to cash out larger payouts.', icon: Layers, color: 'text-amber-300', path: '/games/towers', tag: 'Tiered Climb' },
  { id: 'limbo', name: 'Limbo', desc: 'Set your target multiplier and roll to win instantly.', icon: Zap, color: 'text-rose-500', path: '/games/limbo', tag: 'Instant Multiplier' },
  { id: 'keno', name: 'Keno', desc: 'Pick up to 10 numbers and match drawn numbers for huge payouts.', icon: Hash, color: 'text-violet-500', path: '/games/keno', tag: 'Lottery' },
  { id: 'hi-lo', name: 'Hi-Lo', desc: 'Guess if the next card will be higher or lower to build cashout multipliers.', icon: ArrowUpDown, color: 'text-emerald-500', path: '/games/hi-lo', tag: 'Card Strategy' },
  { id: 'casino', name: 'Casino', desc: 'Enjoy classic slots, mini-roulette, and card matching in one place.', icon: Spade, color: 'text-pink-500', path: '/games/casino', tag: 'Multi-Game' },
];

export default function Home() {
  const { credits, level, claimDailyReward, dailyRewardClaimedAt } = useGameState();
  const [liveWins, setLiveWins] = useState<LiveWin[]>(INITIAL_LIVE_WINS);
  const [stats, setStats] = useState({
    activePlayers: 2481,
    totalBets: 148204,
    houseVolume: 8429184
  });

  // Simulating live wins and changing stats periodically to make it dynamic
  useEffect(() => {
    const winsInterval = setInterval(() => {
      const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
      const randomUser = FICTIONOUS_NAMES[Math.floor(Math.random() * FICTIONOUS_NAMES.length)];
      const bet = Math.floor(Math.random() * 800) + 50;
      const isLargeWin = Math.random() > 0.8;
      const multiplier = isLargeWin 
        ? parseFloat((Math.random() * 8 + 2).toFixed(2)) 
        : parseFloat((Math.random() * 1.5 + 1.1).toFixed(2));
      const payout = Math.round(bet * multiplier);

      const newWin: LiveWin = {
        id: Math.random().toString(36).substring(2, 9),
        username: randomUser,
        game: randomGame.name,
        bet,
        multiplier,
        payout,
        time: 'Just now'
      };

      setLiveWins(prev => [newWin, ...prev.slice(0, 4)].map((win, idx) => ({
        ...win,
        time: idx === 0 ? 'Just now' : `${idx * 2}s ago`
      })));

      setStats(prev => ({
        activePlayers: prev.activePlayers + (Math.random() > 0.5 ? 1 : -1),
        totalBets: prev.totalBets + 1,
        houseVolume: prev.houseVolume + bet
      }));
    }, 4000);

    return () => clearInterval(winsInterval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 flex-grow">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/15 bg-gradient-to-b from-[#08152e]/50 via-black to-[#02050f] py-16 px-8 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_60px_-15px_rgba(59,130,246,0.2)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full filter blur-3xl -ml-20 -mb-20"></div>

        <div className="max-w-2xl flex flex-col gap-6 relative z-10">
          <span className="self-start px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-extrabold rounded-full uppercase tracking-widest">
            Luxury Gaming Hub
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Elevated Virtual <br />
            <span className="gold-gradient-text">USD Entertainment</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Welcome to RainMoney, a premium fintech-inspired platform. Experience simple, beautifully designed game titles utilizing virtual currency. Pure aesthetics.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link href="/games/rocket">
              <Button variant="gold" size="lg" className="flex items-center gap-2">
                <span>Play Rocket</span>
                <ArrowUpRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/store">
              <Button variant="outline" size="lg">
                Acquire Funds
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Card Stat */}
        <div className="w-full md:w-80 relative z-10 flex flex-col gap-4">
          <Card glow className="bg-black/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b-0">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Balance</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">${credits.toLocaleString()}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs border-t border-luxury-border/60 pt-3">
                <span className="text-neutral-500">Tier Membership</span>
                <span className="text-gold-500 font-bold uppercase tracking-wide">VIP Level {level}</span>
              </div>
              <Link href="/store" className="w-full">
                <Button variant="glass" size="sm" fullWidth className="text-xs">
                  Virtual Store
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-[#0b0b0b]/60">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-gold-500/10 rounded-2xl border border-gold-500/20 text-gold-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Active Users</span>
              <h4 className="text-xl font-extrabold text-white mt-1.5">{stats.activePlayers.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b0b0b]/60">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-gold-500/10 rounded-2xl border border-gold-500/20 text-gold-500">
              <Activity className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Game Rounds</span>
              <h4 className="text-xl font-extrabold text-white mt-1.5">{stats.totalBets.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b0b0b]/60">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-gold-500/10 rounded-2xl border border-gold-500/20 text-gold-500">
              <Award className="w-6 h-6 animate-float" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Win Volume</span>
              <h4 className="text-xl font-extrabold text-white mt-1.5">{stats.houseVolume.toLocaleString()} C</h4>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Grid: Games Grid on the left, Feeds/Sidebar on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Featured Games (Col-Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-wide text-white">Featured Luxury Games</h2>
              <p className="text-xs text-neutral-500 font-medium">Explore premium visual animations and instant outcomes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {GAMES.map((game) => (
              <Link href={game.path} key={game.id} className="group">
                <Card className="h-full bg-luxury-surface hover:bg-[#151515] border-luxury-border group-hover:border-gold-500/30 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                  <CardHeader className="p-6 border-b-0 pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl bg-gold-500/5 group-hover:bg-gold-500/10 border border-gold-500/10 group-hover:border-gold-500/30 transition-all duration-300 ${game.color}`}>
                        <game.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-extrabold tracking-widest uppercase text-neutral-500 group-hover:text-gold-400 bg-black border border-luxury-border px-2 py-0.5 rounded-md transition-colors">
                        {game.tag}
                      </span>
                    </div>
                    <CardTitle className="mt-4 text-base font-extrabold flex items-center gap-1 group-hover:text-gold-300 transition-colors">
                      {game.name}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-gold-500" />
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-xs text-neutral-400 leading-relaxed font-medium">
                      {game.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 text-right">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                      Enter Lobby &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar feeds */}
        <div className="flex flex-col gap-8">
          
          {/* Live Wins Feed */}
          <Card className="bg-[#0b0b0b]/60 flex flex-col h-[350px]">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE WINS
              </CardTitle>
              <CardDescription className="text-[10px]">Real-time outcome feed of guest accounts.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-y-hidden flex-grow flex flex-col divide-y divide-luxury-border/40">
              {liveWins.map((win) => (
                <div key={win.id} className="flex justify-between items-center p-3.5 hover:bg-white/[0.02] transition-colors text-xs">
                  <div className="flex flex-col">
                    <span className="text-neutral-300 font-semibold">{win.username}</span>
                    <span className="text-[10px] text-neutral-500 font-medium">on {win.game}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gold-500/80 font-bold uppercase tracking-wide">{win.multiplier}x</span>
                    <span className="text-neutral-300 font-bold mt-0.5">+{win.payout} Credits</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Leaderboard Preview */}
          <Card className="bg-[#0b0b0b]/60">
            <CardHeader className="p-5 border-b border-luxury-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold-500" />
                  LEADERBOARD
                </CardTitle>
                <CardDescription className="text-[10px]">Top-performing users.</CardDescription>
              </div>
              <Link href="/leaderboard" className="text-[10px] text-gold-500 hover:underline font-bold uppercase tracking-wider">
                Full list
              </Link>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-bold w-4">1</span>
                  <div className="w-6 h-6 rounded-md bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-[10px] text-gold-500 font-bold">JD</div>
                  <span className="text-neutral-200 font-medium">John_DuPont</span>
                </div>
                <span className="text-neutral-300 font-bold">142,500 Cr</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-bold w-4">2</span>
                  <div className="w-6 h-6 rounded-md bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-[10px] text-neutral-400 font-bold">MR</div>
                  <span className="text-neutral-200 font-medium">MelonMusk</span>
                </div>
                <span className="text-neutral-300 font-bold">98,200 Cr</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-bold w-4">3</span>
                  <div className="w-6 h-6 rounded-md bg-amber-700/10 border border-amber-700/20 flex items-center justify-center text-[10px] text-amber-600 font-bold">RB</div>
                  <span className="text-neutral-200 font-medium">Richard_Brans</span>
                </div>
                <span className="text-neutral-300 font-bold">76,150 Cr</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
