'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GameIcon } from '@/components/ui/GameIcons';
import { triggerWinConfetti } from '@/utils/confetti';
import { 
  ArrowUpRight, 
  Users, 
  Activity, 
  Award, 
  Trophy,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  Flame,
  Coins,
  CloudRain,
  Sun,
  Heart,
  Search,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Dices,
  X
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

const CHAT_TEMPLATES = [
  "LFG! Just hit a 8x multiplier on Pump!",
  "Mines is paying out today, who's in?",
  "Anyone got code for some extra credits?",
  "gg to RoyalFlush on that cashout",
  "Dice is so smooth. Set at 95% win chance to grind level",
  "Just went to Level 5. daily reward increased!",
  "sportsbook match is ending soon, bet settled!",
  "damn, rocket crashed at 1.05x lol",
  "plinko 1000x target, let's go",
  "just cashed out $5k on coin flip, heads never fails",
  "this site looks clean af",
  "wheel high risk mode is insane",
  "yo when is the rain drop happening?",
  "just claimed my daily, thanks rainmoney!"
];

const GAMES = [
  { id: 'rocket', name: 'Rocket', desc: 'Watch the multiplier climb and cash out before the crash.', path: '/games/rocket', tag: 'High Volatility', category: 'original', thumbnail: '/images/thumbnails/rocket.png' },
  { id: 'mines', name: 'Mines', desc: 'Uncover gold gems on a grid while avoiding hidden mines.', path: '/games/mines', tag: 'Strategy', category: 'original', thumbnail: '/images/thumbnails/mines.png' },
  { id: 'dice', name: 'Dice', desc: 'Predict numbers over/under and adjust your win probability.', path: '/games/dice', tag: 'Configurable Risk', category: 'original', thumbnail: '/images/thumbnails/dice.png' },
  { id: 'coin-flip', name: 'Coin Flip', desc: 'Choose heads or tails for a double-or-nothing luxury flip.', path: '/games/coin-flip', tag: '50/50', category: 'original', thumbnail: '/images/thumbnails/coin-flip.png' },
  { id: 'wheel', name: 'Wheel', desc: 'Spin the segmented wheel with adjustable multiplier volatility.', path: '/games/wheel', tag: 'Instant Win', category: 'original', thumbnail: '/images/thumbnails/wheel.png' },
  { id: 'plinko', name: 'Plinko', desc: 'Drop balls through a peg board to hit high multiplier bins.', path: '/games/plinko', tag: 'Classic Physics', category: 'original', thumbnail: '/images/thumbnails/plinko.png' },
  { id: 'towers', name: 'Towers', desc: 'Climb towers row by row selecting tiles to cash out larger payouts.', path: '/games/towers', tag: 'Tiered Climb', category: 'original', thumbnail: '/images/thumbnails/towers.png' },
  { id: 'limbo', name: 'Limbo', desc: 'Set your target multiplier and roll to win instantly.', path: '/games/limbo', tag: 'Instant Multiplier', category: 'original', thumbnail: '/images/thumbnails/limbo.png' },
  { id: 'keno', name: 'Keno', desc: 'Pick up to 10 numbers and match drawn numbers for huge payouts.', path: '/games/keno', tag: 'Lottery', category: 'original', thumbnail: '/images/thumbnails/keno.png' },
  { id: 'hi-lo', name: 'Hi-Lo', desc: 'Guess if the next card will be higher or lower to build cashout multipliers.', path: '/games/hi-lo', tag: 'Card Strategy', category: 'original', thumbnail: '/images/thumbnails/hi-lo.png' },
  { id: 'pump', name: 'Pump', desc: 'Inflate a balloon to grow your payout multiplier. Cash out before it pops!', path: '/games/pump', tag: 'Balloon Inflation', category: 'original', thumbnail: '/images/thumbnails/pump.png' },
  { id: 'rps', name: 'RPS', desc: 'Play Rock, Paper, Scissors against the house bot to win 2.0x.', path: '/games/rps', tag: 'Player vs Bot', category: 'original', thumbnail: '/images/thumbnails/rps.png' },
  { id: 'cup', name: 'Cup', desc: 'Track the diamond hidden under one of three cups. Shuffling speed boosts payout.', path: '/games/cup', tag: 'Visual Tracking', category: 'original', thumbnail: '/images/thumbnails/cup.png' },
  { id: 'toe', name: 'Toe', desc: 'Challenge the AI bot to a game of Tic-Tac-Toe. Win for a 2.5x multiplier.', path: '/games/toe', tag: 'Player vs Bot', category: 'original', thumbnail: '/images/thumbnails/toe.png' },
  { id: 'cases', name: 'Luxury Cases', desc: 'Unbox premium safes and briefcases to reveal virtual payouts and items.', path: '/games/cases', tag: 'Unboxing', category: 'original', thumbnail: '/images/thumbnails/cases.png' },
  { id: 'blackjack', name: 'Blackjack', desc: 'Beat the dealer by getting closer to 21 without going over.', path: '/games/blackjack', tag: 'Card Strategy', category: 'original', thumbnail: '/images/thumbnails/blackjack.png' },
  { id: 'claw', name: 'Claw Machine', desc: 'Drop the claw to grab reward capsules containing up to 50x multipliers.', path: '/games/claw', tag: 'Arcade Skill', category: 'original', thumbnail: '/images/thumbnails/claw.png' },
  { id: 'baccarat', name: 'Baccarat', desc: 'Bet on Player, Banker, or Tie in this classic luxury card game.', path: '/games/baccarat', tag: 'Luxury Card', category: 'original', thumbnail: '/images/thumbnails/baccarat.png' },
  { id: 'chicken-cross', name: 'Chicken Cross', desc: 'Help the chicken cross the lanes of traffic to reach the grass for a 10x multiplier!', path: '/games/chicken-cross', tag: '10x Payout', category: 'original', thumbnail: '/images/thumbnails/chicken-cross.png' },
  
  // Sports category
  { id: 'sports', name: 'Sports Betting', desc: 'Place virtual bets on live global sports fixtures including Premier League, NBA, NFL, UFC & Esports.', path: '/games/sports', tag: 'Sportsbook', category: 'sports' },
  { id: 'penalty', name: 'Penalty Shootout', desc: 'Shoot penalties and build multipliers. Cash out anytime!', path: '/games/penalty', tag: 'Sports Action', category: 'original', thumbnail: '/images/thumbnails/penalty.png' },

  // Slots category
  { id: 'slots-neon', name: 'Neon Fruits Slots', desc: 'Spin glowing classic fruit reels for retro neon payouts.', path: '/games/slots-neon', tag: 'Neon Classic', category: 'slots', thumbnail: '/images/thumbnails/slots-neon.png' },
  { id: 'slots-egypt', name: 'Pharaoh\'s Gold Slots', desc: 'Uncover ancient treasures along Egyptian paylines.', path: '/games/slots-egypt', tag: 'Ancient Egypt', category: 'slots', thumbnail: '/images/thumbnails/slots-egypt.png' },
  { id: 'slots-sweet', name: 'Sweet Candy Reels', desc: 'Spin delicious candy treats for colorful multipliers.', path: '/games/slots-sweet', tag: 'Sweet Candy', category: 'slots', thumbnail: '/images/thumbnails/slots-sweet.png' },
  { id: 'slots-pirate', name: 'Pirate\'s Bounty Slots', desc: 'Search for hidden ocean chests on the pirate reels.', path: '/games/slots-pirate', tag: 'Pirate Treasure', category: 'slots', thumbnail: '/images/thumbnails/slots-pirate.png' },
  { id: 'slots-zeus', name: 'Zeus Olympus Slots', desc: 'Harness the thunder god\'s lightning for epic payouts.', path: '/games/slots-zeus', tag: 'Greek Mythology', category: 'slots', thumbnail: '/images/thumbnails/slots-zeus.png' },
  { id: 'slots-cyber', name: 'Cyberpunk Reels', desc: 'Hack into the neon synthwave grid for cyber wins.', path: '/games/slots-cyber', tag: 'Futuristic Cyber', category: 'slots', thumbnail: '/images/thumbnails/slots-cyber.png' },
  { id: 'slots-safari', name: 'Safari Wilds Slots', desc: 'Spot exotic wild beasts in the African savanna slots.', path: '/games/slots-safari', tag: 'Safari Wilds', category: 'slots', thumbnail: '/images/thumbnails/slots-safari.png' },
  { id: 'slots-dragon', name: 'Dragon\'s Fortune Slots', desc: 'Spin the imperial Chinese dragons for ancient fortune.', path: '/games/slots-dragon', tag: 'Chinese Dynasty', category: 'slots', thumbnail: '/images/thumbnails/slots-dragon.png' },
  { id: 'slots-irish', name: 'Leprechaun Gold Slots', desc: 'Find the pot of gold at the end of the clover reels.', path: '/games/slots-irish', tag: 'Irish Luck', category: 'slots', thumbnail: '/images/thumbnails/slots-irish.png' },
  { id: 'slots-undersea', name: 'Undersea Riches', desc: 'Dive deep into ocean reefs to uncover lost treasures.', path: '/games/slots-undersea', tag: 'Deep Ocean', category: 'slots', thumbnail: '/images/thumbnails/slots-undersea.png' },
];

const CAROUSEL_GAMES = GAMES.filter(g => g.category === 'original' || g.category === 'slots' || g.category === 'sports');

const COVER_GRADIENTS: Record<string, string> = {
  rocket: 'bg-gradient-to-br from-rose-500 via-red-400 to-amber-400',
  mines: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400',
  dice: 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300',
  'coin-flip': 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500',
  wheel: 'bg-gradient-to-br from-orange-400 via-rose-500 to-purple-500',
  plinko: 'bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-500',
  towers: 'bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400',
  limbo: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-400',
  keno: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500',
  'hi-lo': 'bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-500',
  pump: 'bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-400',
  rps: 'bg-gradient-to-br from-orange-400 via-amber-400 to-red-400',
  cup: 'bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-400',
  toe: 'bg-gradient-to-br from-indigo-400 via-purple-400 to-violet-400',
  sports: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500',
  cases: 'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400',
  blackjack: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600',
  penalty: 'bg-gradient-to-br from-teal-400 via-emerald-400 to-green-500',
  claw: 'bg-gradient-to-br from-violet-400 via-fuchsia-400 to-purple-500',
  baccarat: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600',
  'chicken-cross': 'bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500',
  'slots-neon': 'bg-gradient-to-br from-emerald-400 via-teal-500 to-green-500',
  'slots-egypt': 'bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-500',
  'slots-sweet': 'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400',
  'slots-pirate': 'bg-gradient-to-br from-orange-400 via-rose-500 to-purple-550',
  'slots-zeus': 'bg-gradient-to-br from-violet-400 via-purple-500 to-pink-500',
  'slots-cyber': 'bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500',
  'slots-safari': 'bg-gradient-to-br from-lime-400 via-emerald-400 to-teal-500',
  'slots-dragon': 'bg-gradient-to-br from-red-500 via-rose-500 to-orange-500',
  'slots-irish': 'bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500',
  'slots-undersea': 'bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-500',
};

const renderThumbnailPattern = (gameId: string) => {
  switch (gameId) {
    case 'rocket':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] bg-[size:12px_12px]" />;
    case 'mines':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#eab308_1px,transparent_1px),linear-gradient(to_bottom,#eab308_1px,transparent_1px)] bg-[size:14px_14px]" />;
    case 'dice':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_2px,transparent_2px)] bg-[size:16px_16px]" />;
    case 'coin-flip':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#eab308_80%)]" />;
    case 'wheel':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle,#f97316_1px,transparent_1px)] bg-[size:20px_20px]" />;
    case 'plinko':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#0ea5e9_1.5px,transparent_1.5px)] bg-[size:16px_16px]" />;
    case 'towers':
      return <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(45deg,#6366f1_25%,transparent_25%,transparent_75%,#6366f1_75%,#6366f1)] bg-[size:20px_20px] bg-[position:0_0,10px_10px]" />;
    case 'sports':
      return <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[linear-gradient(to_right,#10b981_1.5px,transparent_1.5px)] bg-[size:20px_100%] [background-repeat:repeat-x]" />;
    default:
      return <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:12px_12px]" />;
  }
};

const HOVER_GLOWS: Record<string, string> = {
  rocket: 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]',
  mines: 'hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]',
  dice: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
  'coin-flip': 'hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]',
  wheel: 'hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]',
  plinko: 'hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]',
  towers: 'hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]',
  limbo: 'hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]',
  sports: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
  cases: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
};

export default function Home() {
  const router = useRouter();
  const { 
    credits, 
    level, 
    username,
    rainPool,
    rainTimer,
    rainWinner,
    rainWinnerAmount,
    isRainWinnerBot,
    depositToRain,
    summerRainPool,
    summerRainTimer,
    summerRainWinner,
    summerRainWinnerAmount,
    isSummerRainWinnerBot,
    depositToSummerRain
  } = useGameState();
  const { playClick, playPlop, playWin, playLoss } = useAudio();
  const [liveWins, setLiveWins] = useState<LiveWin[]>(INITIAL_LIVE_WINS);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'wins' | 'chat'>('wins');
  const [jackpot, setJackpot] = useState<number>(1284912.43);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'original' | 'slots' | 'sports'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 'c1', username: 'Aurelius', level: 8, message: "Dice is paying good multipliers today!", time: '2m ago' },
    { id: 'c2', username: 'RoyalFlush', level: 12, message: "Who's up for some plinko drops?", time: '1m ago' },
    { id: 'c3', username: 'Centurion', level: 5, message: "Pump balloon clicked 15 times before pop, close one!", time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [customDonation, setCustomDonation] = useState<string>('');
  const [customSummerDonation, setCustomSummerDonation] = useState<string>('');
  const [currentAdIdx, setCurrentAdIdx] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIdx(prev => (prev + 1) % CAROUSEL_GAMES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    playClick();
    setCurrentAdIdx(prev => (prev + 1) % CAROUSEL_GAMES.length);
  };

  const prevSlide = () => {
    playClick();
    setCurrentAdIdx(prev => (prev - 1 + CAROUSEL_GAMES.length) % CAROUSEL_GAMES.length);
  };

  useEffect(() => {
    const loadFavorites = () => {
      const saved = localStorage.getItem('rainmoney-favorites');
      if (saved) {
        try {
          setFavoriteIds(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };
    loadFavorites();
    window.addEventListener('favorites-changed', loadFavorites);
    return () => window.removeEventListener('favorites-changed', loadFavorites);
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClick();
    let updated;
    if (favoriteIds.includes(id)) {
      updated = favoriteIds.filter(favId => favId !== id);
    } else {
      updated = [...favoriteIds, id];
    }
    localStorage.setItem('rainmoney-favorites', JSON.stringify(updated));
    setFavoriteIds(updated);
    window.dispatchEvent(new Event('favorites-changed'));
  };

  const formatRainTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatSummerRainTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDonation = (amount: number, target: 'regular' | 'summer' = 'regular') => {
    if (credits < amount) {
      alert('Insufficient virtual credits to donate.');
      return;
    }
    const success = target === 'summer' ? depositToSummerRain(amount) : depositToRain(amount);
    if (success) {
      playClick();
    }
  };

  const handleCustomDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customDonation);
    if (isNaN(amount) || amount <= 0) return;
    if (credits < amount) {
      alert('Insufficient virtual credits to donate.');
      return;
    }
    const success = depositToRain(amount);
    if (success) {
      playClick();
      setCustomDonation('');
    }
  };

  const handleCustomSummerDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customSummerDonation);
    if (isNaN(amount) || amount <= 0) return;
    if (credits < amount) {
      alert('Insufficient virtual credits to donate.');
      return;
    }
    const success = depositToSummerRain(amount);
    if (success) {
      playClick();
      setCustomSummerDonation('');
    }
  };

  const [stats, setStats] = useState({
    activePlayers: 2481,
    totalBets: 148204,
    houseVolume: 8429184
  });

  // Ticking jackpot pool
  useEffect(() => {
    const jackpotInterval = setInterval(() => {
      setJackpot(prev => prev + 0.05 + Math.random() * 0.15);
    }, 200);
    return () => clearInterval(jackpotInterval);
  }, []);

  // Simulating live wins
  useEffect(() => {
    const winsInterval = setInterval(() => {
      const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
      const randomUser = FICTIONOUS_NAMES[Math.floor(Math.random() * FICTIONOUS_NAMES.length)];
      const bet = Math.round((Math.random() * 800 + 50) * 100) / 100;
      const isLargeWin = Math.random() > 0.8;
      const multiplier = isLargeWin 
        ? parseFloat((Math.random() * 8 + 2).toFixed(2)) 
        : parseFloat((Math.random() * 1.5 + 1.1).toFixed(2));
      const payout = Math.round(bet * multiplier * 100) / 100;

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

  // Simulating live chat
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const randomName = FICTIONOUS_NAMES[Math.floor(Math.random() * FICTIONOUS_NAMES.length)];
      const randomMsg = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
      const randomLevel = Math.floor(Math.random() * 15) + 1;
      const newMsg = {
        id: Math.random().toString(36).substring(2, 9),
        username: randomName,
        level: randomLevel,
        message: randomMsg,
        time: 'Just now'
      };
      setChatMessages(prev => {
        const next = [...prev.map(m => m.time === 'Just now' ? { ...m, time: '1m ago' } : m), newMsg];
        return next.slice(-20);
      });
      playPlop();
    }, 6000);

    return () => clearInterval(chatInterval);
  }, [playPlop]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    playClick();
    const newMsg = {
      id: Math.random().toString(36).substring(2, 9),
      username: username || 'You',
      level: level,
      message: chatInput.trim(),
      time: 'Just now'
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  // Filtered games count
  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      game.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const originalsCount = GAMES.filter(g => g.category === 'original').length;
  const slotsCount = GAMES.filter(g => g.category === 'slots').length;
  const sportsCount = GAMES.filter(g => g.category === 'sports').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 flex-grow">
      
      {/* Live Ticker Bar */}
      <div className="w-full bg-luxury-surface/80 border border-blue-500/20 backdrop-blur-md rounded-2xl px-5 py-2.5 flex flex-wrap items-center justify-between text-xs font-bold text-neutral-300 shadow-[0_0_20px_rgba(59,130,246,0.1)] gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-white font-extrabold">{stats.activePlayers.toLocaleString()}</span>
          <span className="text-neutral-400 font-medium">Players Online</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 border-x border-white/10 px-6">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-white font-extrabold">{stats.totalBets.toLocaleString()}</span>
          <span className="text-neutral-400 font-medium">Total Rounds Played</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-neutral-400 font-medium">Grand Jackpot:</span>
          <span className="gold-gradient-text font-black text-sm font-mono">${jackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#0a1535]/90 via-[#030712]/95 to-[#020617] py-12 px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full filter blur-[120px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="max-w-xl flex flex-col gap-5 relative z-10">
          <span className="self-start px-3.5 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold rounded-full uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            RainMoney Premium Platform
          </span>
          <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Next-Gen Virtual <br />
            <span className="gold-gradient-text">Casino & Sports Hub</span>
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-medium">
            Experience high-octane thrill with original provably fair titles, neon slots, and live ESPN sportsbook betting. Virtual stakes, ultimate luxury design.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <Link href={CAROUSEL_GAMES[currentAdIdx]?.path || '/games/rocket'}>
              <Button variant="gold" size="lg" className="flex items-center gap-2.5 px-8 py-3 text-sm font-black uppercase tracking-wider shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:shadow-[0_0_35px_rgba(234,179,8,0.6)] transition-all">
                <span>Play {CAROUSEL_GAMES[currentAdIdx]?.name || 'Rocket'}</span>
                <ArrowUpRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/games/sports">
              <Button variant="outline" size="lg" className="flex items-center gap-2 px-6 py-3 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-sm font-bold uppercase tracking-wider">
                <span>Sportsbook</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Carousel Display */}
        <div className="w-full md:w-[460px] relative z-10 flex flex-col gap-3">
          <div className="relative w-full h-[240px] rounded-3xl overflow-hidden border border-blue-500/30 bg-gradient-to-br from-[#0c1024]/90 via-[#060814]/98 to-[#02030a] shadow-[0_0_40px_rgba(59,130,246,0.2)] select-none transition-all duration-500">
            {/* Automatic & Manual Slide Display */}
            {CAROUSEL_GAMES.map((ad, idx) => {
              const isActive = idx === currentAdIdx;
              const gradClass = COVER_GRADIENTS[ad.id] || 'bg-[#0c1024]';
              return (
                <div 
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    isActive 
                      ? 'opacity-100 scale-100 pointer-events-auto' 
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  {/* Background display */}
                  {ad.thumbnail ? (
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105" style={{ backgroundImage: `url(${ad.thumbnail})` }} />
                  ) : (
                    <div className={`absolute inset-0 ${gradClass} flex items-center justify-center overflow-hidden`}>
                      <GameIcon id={ad.id} className="w-40 h-40 opacity-20 transform -rotate-12 scale-110" />
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-10" />

                  {/* Content overlay */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end gap-2.5 z-25">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[9px] font-black rounded-full uppercase tracking-widest leading-none">
                        {ad.tag}
                      </span>
                      <span className="text-[9px] text-neutral-300 font-extrabold uppercase tracking-widest bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/[0.08]">
                        {ad.category === 'slots' ? 'Slot Game' : ad.category === 'sports' ? 'Live Sports' : 'Rain Original'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white tracking-tight mt-1 leading-none uppercase">{ad.name}</h2>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed font-medium line-clamp-2 pr-10">
                      {ad.desc}
                    </p>
                    <Link href={ad.path} className="self-start">
                      <Button variant="gold" size="sm" className="text-[10px] uppercase font-black tracking-wider py-2 px-5 flex items-center gap-2 shadow-lg">
                        <span>Play Game</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Carousel Controls */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <button onClick={prevSlide} className="p-1.5 rounded-full bg-black/70 border border-white/10 hover:border-blue-500/50 text-white transition-all cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-black tracking-widest text-neutral-300">
                {currentAdIdx + 1}/{CAROUSEL_GAMES.length}
              </span>
              <button onClick={nextSlide} className="p-1.5 rounded-full bg-black/70 border border-white/10 hover:border-blue-500/50 text-white transition-all cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Rain Pools Center */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Regular Rain Pool Card */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#0a1535]/80 via-[#030712]/95 to-[#020617] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
          <div className="absolute top-0 left-0 w-48 h-full bg-blue-500/5 filter blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 w-full">
            <div className="flex items-center gap-4.5">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl shadow-inner shrink-0">
                <CloudRain className="w-8 h-8 animate-bounce text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-300">Regular Rain Pool</h3>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black tracking-tight text-white font-mono">
                    ${rainPool.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-extrabold uppercase">Ticking (+$1/s)</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <span>Next Rain In:</span>
                  <span className="text-blue-400 font-black font-mono text-xs">{formatRainTime(rainTimer)}</span>
                </p>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-luxury-border/60 pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-center select-none shrink-0 min-w-[150px]">
              <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest leading-none">Last Rain Winner</span>
              {rainWinner ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[9px] text-blue-400 font-black">
                    {rainWinner.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white leading-tight block truncate max-w-[80px]">{rainWinner}</span>
                      <span className={`text-[7px] font-black uppercase px-1 rounded-md border ${
                        isRainWinnerBot 
                          ? 'bg-neutral-900 border-neutral-700 text-neutral-400' 
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {isRainWinnerBot ? 'Bot' : 'VIP'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-extrabold block mt-0.5">+${rainWinnerAmount?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <span className="text-neutral-600 text-[10px] font-bold uppercase mt-2.5">No winners recorded</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full relative z-10 border-t border-luxury-border/60 pt-4 mt-2">
            <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Donate Virtual Funds</span>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleDonation(10, 'regular')} 
                  className="px-2.5 py-1.5 bg-black border border-luxury-border hover:border-blue-500/30 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  +$10
                </button>
                <button 
                  onClick={() => handleDonation(50, 'regular')} 
                  className="px-2.5 py-1.5 bg-black border border-luxury-border hover:border-blue-500/30 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  +$50
                </button>
                <button 
                  onClick={() => handleDonation(100, 'regular')} 
                  className="px-2.5 py-1.5 bg-black border border-luxury-border hover:border-blue-500/30 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  +$100
                </button>
              </div>

              <form onSubmit={handleCustomDonation} className="flex items-center gap-1 mt-1 sm:mt-0">
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-[10px] font-bold text-neutral-500">$</span>
                  <input
                    type="number"
                    value={customDonation}
                    onChange={(e) => setCustomDonation(e.target.value)}
                    placeholder="Custom"
                    className="w-20 pl-5 pr-1.5 py-1 bg-black border border-luxury-border focus:border-blue-500/30 text-[10px] text-white font-extrabold rounded-lg focus:outline-none"
                    min="1"
                    step="any"
                  />
                </div>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-blue-600/15 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500/40 text-[10px] text-blue-400 hover:text-white font-bold rounded-lg transition-all duration-300 cursor-pointer shrink-0"
                >
                  Donate
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 2. Summer Rain Pool Card */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 border-t-yellow-400/60 bg-gradient-to-b from-[#1a1102]/90 via-[#0d0701]/95 to-[#020617] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-[0_0_40px_rgba(245,158,11,0.20)]">
          <div className="absolute top-0 left-0 w-48 h-full bg-amber-500/5 filter blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 w-full">
            <div className="flex items-center gap-4.5">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shadow-inner shrink-0 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)]">
                <Sun className="w-8 h-8 animate-spin-slow text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-300">☀️ Summer Rain Pool ☀️</h3>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black tracking-tight text-amber-400 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                    ${summerRainPool.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-500 font-extrabold uppercase animate-pulse">Hot (+$100/s)</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <span>Payout In:</span>
                  <span className="text-yellow-400 font-black font-mono text-xs drop-shadow-[0_0_4px_rgba(234,179,8,0.2)]">
                    {formatSummerRainTime(summerRainTimer)}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-luxury-border/60 pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-center select-none shrink-0 min-w-[150px]">
              <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest leading-none">Last Summer Winner</span>
              {summerRainWinner ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[9px] text-amber-400 font-black">
                    {summerRainWinner.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white leading-tight block truncate max-w-[80px]">{summerRainWinner}</span>
                      <span className={`text-[7px] font-black uppercase px-1 rounded-md border ${
                        isSummerRainWinnerBot 
                          ? 'bg-neutral-900 border-neutral-700 text-neutral-400' 
                          : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                      }`}>
                        {isSummerRainWinnerBot ? 'Bot' : 'VIP'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-extrabold block mt-0.5">+${summerRainWinnerAmount?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <span className="text-neutral-600 text-[10px] font-bold uppercase mt-2.5">No winners recorded</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full relative z-10 border-t border-luxury-border/60 pt-4 mt-2">
            <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Donate Virtual Funds</span>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleDonation(10, 'summer')} 
                  className="px-2.5 py-1.5 bg-black border border-luxury-border hover:border-amber-500/30 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  +$10
                </button>
                <button 
                  onClick={() => handleDonation(50, 'summer')} 
                  className="px-2.5 py-1.5 bg-black border border-luxury-border hover:border-amber-500/30 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  +$50
                </button>
                <button 
                  onClick={() => handleDonation(100, 'summer')} 
                  className="px-2.5 py-1.5 bg-black border border-luxury-border hover:border-amber-500/30 text-[10px] text-neutral-400 hover:text-white font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  +$100
                </button>
              </div>

              <form onSubmit={handleCustomSummerDonation} className="flex items-center gap-1 mt-1 sm:mt-0">
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-[10px] font-bold text-neutral-500">$</span>
                  <input
                    type="number"
                    value={customSummerDonation}
                    onChange={(e) => setCustomSummerDonation(e.target.value)}
                    placeholder="Custom"
                    className="w-20 pl-5 pr-1.5 py-1 bg-black border border-luxury-border focus:border-amber-500/30 text-[10px] text-white font-extrabold rounded-lg focus:outline-none"
                    min="1"
                    step="any"
                  />
                </div>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-amber-600/15 hover:bg-amber-600 border border-amber-500/20 hover:border-amber-500/40 text-[10px] text-amber-400 hover:text-white font-bold rounded-lg transition-all duration-300 cursor-pointer shrink-0"
                >
                  Donate
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Games catalog on the left, feeds on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Games Catalog Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Category Tabs & Instant Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-luxury-surface/70 border border-luxury-border/80 backdrop-blur-md rounded-2xl">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => { setSelectedCategory('all'); playClick(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'bg-black/30 border border-white/5 text-neutral-400 hover:text-white hover:border-white/10'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>All Games</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full">{GAMES.length}</span>
              </button>

              <button
                onClick={() => { setSelectedCategory('original'); playClick(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'original'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'bg-black/30 border border-white/5 text-neutral-400 hover:text-white hover:border-white/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-blue-400" />
                <span>Originals</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full">{originalsCount}</span>
              </button>

              <button
                onClick={() => { setSelectedCategory('slots'); playClick(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'slots'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'bg-black/30 border border-white/5 text-neutral-400 hover:text-white hover:border-white/10'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Slots</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full">{slotsCount}</span>
              </button>

              <button
                onClick={() => { setSelectedCategory('sports'); playClick(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'sports'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'bg-black/30 border border-white/5 text-neutral-400 hover:text-white hover:border-white/10'
                }`}
              >
                <Dices className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sportsbook</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full">{sportsCount}</span>
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search 30+ games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 bg-black/60 border border-luxury-border/80 focus:border-blue-500/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Render Games Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredGames.length === 0 ? (
              <div className="col-span-full py-16 text-center text-neutral-400 flex flex-col items-center gap-3">
                <Search className="w-8 h-8 text-neutral-500" />
                <span className="text-sm font-bold">No games match your search query "{searchQuery}".</span>
                <button onClick={() => setSearchQuery('')} className="text-xs text-blue-400 hover:underline font-extrabold uppercase">Clear search filter</button>
              </div>
            ) : (
              filteredGames.map((game) => {
                const gradClass = COVER_GRADIENTS[game.id] || 'bg-luxury-surface';
                const hoverGlow = HOVER_GLOWS[game.id] || 'hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]';
                const isFavorite = favoriteIds.includes(game.id);

                return (
                  <div key={game.id} className="relative group hover:-translate-y-1.5 transition-all duration-300">
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-xl bg-black/70 border border-white/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-500 transition-all cursor-pointer"
                      title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'}`} />
                    </button>

                    <Link href={game.path} className="block w-full h-full">
                      <div className={`relative aspect-[3/4] flex flex-col justify-between p-4 overflow-hidden rounded-2xl border border-luxury-border/80 transition-all duration-300 cursor-pointer shadow-lg shine-effect ${game.thumbnail ? 'bg-luxury-surface' : gradClass} ${hoverGlow}`}>
                        
                        {game.thumbnail ? (
                          <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${game.thumbnail})` }} />
                        ) : (
                          <>
                            <div className="absolute -bottom-10 w-28 h-28 rounded-full blur-2xl opacity-30 group-hover:scale-125 transition-transform duration-500 bg-[#3b82f6]" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out z-0" />
                            {renderThumbnailPattern(game.id)}
                          </>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10" />
                        
                        <div className="absolute top-3 left-3 z-15">
                          <span className="text-[7px] font-extrabold tracking-wider text-white/90 bg-black/80 border border-white/10 px-2 py-0.5 rounded-full uppercase backdrop-blur-md">
                            {game.tag}
                          </span>
                        </div>

                        {!game.thumbnail && (
                          <div className="flex-grow flex items-center justify-center mb-2 mt-6 z-15">
                            <GameIcon id={game.id} className="w-18 h-18 sm:w-20 sm:h-20 group-hover:scale-115 group-hover:rotate-3 transition-transform duration-300 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]" />
                          </div>
                        )}

                        <div className="relative z-20 flex flex-col w-full bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/[0.08] mt-auto">
                          <span className="font-sans font-black text-[10px] sm:text-xs tracking-wider text-white uppercase text-center truncate">
                            {game.name}
                          </span>
                          <span className="text-[7px] font-black text-blue-400 group-hover:text-blue-300 uppercase tracking-widest mt-0.5 text-center transition-colors">
                            {game.category === 'slots' ? 'Slot Machine' : game.category === 'sports' ? 'Live Sports' : 'Rain Original'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Feeds */}
        <div className="flex flex-col gap-6">
          
          {/* Live Bets Feed / Chat Container */}
          <Card className="bg-[#0b0f19]/60 border-luxury-border/80 backdrop-blur-md flex flex-col h-[420px] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-luxury-border/60 flex items-center justify-between bg-black/40">
              <div className="flex gap-1.5 bg-black/60 p-1 rounded-full border border-luxury-border/40">
                <button
                  onClick={() => { playClick(); setActiveSidebarTab('wins'); }}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                    activeSidebarTab === 'wins'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Live Bets
                </button>
                <button
                  onClick={() => { playClick(); setActiveSidebarTab('chat'); }}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSidebarTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[9px] text-neutral-300 font-extrabold uppercase tracking-wider">Real-time</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-3 flex flex-col gap-2">
              {activeSidebarTab === 'wins' ? (
                liveWins.map((win) => (
                  <div key={win.id} className="flex justify-between items-center p-3 bg-black/40 hover:bg-black/60 transition-colors text-xs rounded-xl border border-luxury-border/30">
                    <div className="flex flex-col">
                      <span className="text-neutral-200 font-bold">{win.username}</span>
                      <span className="text-[10px] text-neutral-400 font-medium mt-0.5">on {win.game}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wide bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{win.multiplier}x</span>
                      <span className="text-emerald-400 font-extrabold mt-1">+${win.payout.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-2 h-full justify-between">
                  <div className="flex-grow overflow-y-auto flex flex-col gap-2 pr-1 max-h-[290px]">
                    {chatMessages.length === 0 ? (
                      <span className="text-[10px] text-neutral-500 text-center py-4">No messages yet.</span>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col gap-1 p-2.5 bg-black/30 hover:bg-black/50 border border-luxury-border/20 transition-colors rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                Lvl {msg.level}
                              </span>
                              <span className="text-[11px] text-neutral-200 font-bold">{msg.username}</span>
                            </div>
                            <span className="text-[8px] text-neutral-400 font-medium">{msg.time}</span>
                          </div>
                          <p className="text-[11px] text-neutral-300 leading-normal pl-0.5 break-words">
                            {msg.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-luxury-border/40">
                    <input
                      type="text"
                      placeholder="Say something in chat..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      maxLength={100}
                      className="flex-grow bg-black/50 border border-luxury-border/80 focus:border-blue-500/60 rounded-full px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all font-medium"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all active:scale-95 shrink-0 flex items-center justify-center border border-blue-400/30 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </Card>

          {/* Leaderboard Preview Card */}
          <Card className="bg-[#0b0f19]/60 border-luxury-border/80 backdrop-blur-md shadow-xl">
            <CardHeader className="p-4 border-b border-luxury-border/60 flex flex-row items-center justify-between bg-black/40">
              <div>
                <CardTitle className="text-xs font-extrabold flex items-center gap-2 tracking-widest text-neutral-200 uppercase">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  VIP Leaderboard
                </CardTitle>
                <CardDescription className="text-[9px] text-neutral-400 mt-0.5">Top performing accounts this week.</CardDescription>
              </div>
              <Link href="/leaderboard" className="text-[9px] text-blue-400 hover:text-blue-300 hover:underline font-extrabold uppercase tracking-widest">
                View All
              </Link>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs p-2.5 bg-black/30 rounded-xl border border-luxury-border/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-400 font-black w-4 text-center">1</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[9px] text-amber-400 font-extrabold">JD</div>
                  <span className="text-neutral-200 font-bold">John_DuPont</span>
                </div>
                <span className="text-emerald-400 font-extrabold">$142,500</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 bg-black/30 rounded-xl border border-luxury-border/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-300 font-black w-4 text-center">2</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-500/10 border border-slate-500/30 flex items-center justify-center text-[9px] text-slate-300 font-extrabold">MR</div>
                  <span className="text-neutral-200 font-bold">MelonMusk</span>
                </div>
                <span className="text-emerald-400 font-extrabold">$98,200</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 bg-black/30 rounded-xl border border-luxury-border/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-600 font-black w-4 text-center">3</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-700/10 border border-amber-700/30 flex items-center justify-center text-[9px] text-amber-500 font-extrabold">RB</div>
                  <span className="text-neutral-200 font-bold">Richard_Brans</span>
                </div>
                <span className="text-emerald-400 font-extrabold">$76,150</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
