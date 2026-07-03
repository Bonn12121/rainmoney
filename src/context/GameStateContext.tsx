'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VpnBlockOverlay } from '@/components/ui/VpnBlockOverlay';


export interface HistoryItem {
  id: string;
  game: string;
  bet: number;
  multiplier: number;
  payout: number;
  status: 'win' | 'loss';
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const FICTIONOUS_NAMES = [
  'RoyalFlush', 'GildedKnight', 'Sovereign', 'GoldFingers', 'BlackCardClub',
  'Dynasty', 'Elixir', 'Centurion', 'Meridian', 'ApexTrader', 'NovaRich'
];

interface GameStateContextType {
  credits: number;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  gameHistory: HistoryItem[];
  achievements: Achievement[];
  dailyRewardClaimedAt: string | null;
  rainPool: number;
  rainTimer: number;
  rainWinner: string | null;
  rainWinnerAmount: number | null;
  isRainWinnerBot: boolean | null;
  summerRainPool: number;
  summerRainTimer: number;
  summerRainWinner: string | null;
  summerRainWinnerAmount: number | null;
  isSummerRainWinnerBot: boolean | null;
  depositToSummerRain: (amount: number) => boolean;
  rocketState: 'idle' | 'countdown' | 'flying' | 'crashed';
  rocketMultiplier: number;
  rocketCountdown: number;
  rocketRecentCrashes: number[];
  rocketHasBet: boolean;
  rocketBetAmount: number;
  rocketHasCashedOut: boolean;
  rocketWinAmount: number;
  placeRocketBet: (amount: number, autoCashout: string) => boolean;
  cancelRocketBet: () => void;
  cashOutRocket: () => { success: boolean; amount: number };
  language: 'en' | 'vi';
  setLanguage: (lang: 'en' | 'vi') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  addXP: (amount: number) => void;
  addHistoryItem: (game: string, bet: number, multiplier: number, payout: number, status: 'win' | 'loss') => void;
  claimDailyReward: () => { success: boolean; amount: number; message: string };
  updateUsername: (name: string) => void;
  updateAvatar: (avatarUrl: string) => void;
  unlockAchievement: (id: string) => void;
  resetProgress: () => void;
  depositToRain: (amount: number) => boolean;
  forceRainEvent: () => void;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-bet', title: 'First Steps', description: 'Place your first bet', unlocked: false },
  { id: 'high-roller', title: 'High Roller', description: 'Bet $1,000+ in a single turn', unlocked: false },
  { id: 'to-the-moon', title: 'To the Moon', description: 'Achieve a 10.00x multiplier or higher in Rocket', unlocked: false },
  { id: 'mine-sweeper', title: 'Mine Sweeper', description: 'Reveal 5+ gems in Mines in a single round', unlocked: false },
  { id: 'double-up', title: 'Double Trouble', description: 'Win a bet of $500+ on Coin Flip', unlocked: false },
  { id: 'lucky-spin', title: 'Golden Spin', description: 'Land a 5x multiplier or higher on the Wheel', unlocked: false },
  { id: 'peg-master', title: 'Peg Master', description: 'Land on a 10x or higher bucket in Plinko', unlocked: false },
  { id: 'tower-climber', title: 'Apex Climber', description: 'Reach Level 6 or higher in Towers', unlocked: false },
];

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  // Hydrated states
  const [isHydrated, setIsHydrated] = useState(false);
  const [credits, setCredits] = useState(1000);
  const [username, setUsername] = useState('LuxuryPlayer');
  const [avatar, setAvatar] = useState('/avatars/avatar-default.png');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [dailyRewardClaimedAt, setDailyRewardClaimedAt] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'vi'>('en');

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(100);

  // Rain States
  const [rainPool, setRainPool] = useState<number>(100);
  const [rainTimer, setRainTimer] = useState<number>(3600);
  const [rainWinner, setRainWinner] = useState<string | null>(null);
  const [rainWinnerAmount, setRainWinnerAmount] = useState<number | null>(null);
  const [isRainWinnerBot, setIsRainWinnerBot] = useState<boolean | null>(null);
  const [summerRainPool, setSummerRainPool] = useState<number>(1000);
  const [summerRainTimer, setSummerRainTimer] = useState<number>(86400);
  const [summerRainWinner, setSummerRainWinner] = useState<string | null>(null);
  const [summerRainWinnerAmount, setSummerRainWinnerAmount] = useState<number | null>(null);
  const [isSummerRainWinnerBot, setIsSummerRainWinnerBot] = useState<boolean | null>(null);

  // Rocket States
  const [rocketState, setRocketState] = useState<'idle' | 'countdown' | 'flying' | 'crashed'>('countdown');
  const [rocketMultiplier, setRocketMultiplier] = useState<number>(1.00);
  const [rocketCountdown, setRocketCountdown] = useState<number>(10);
  const [rocketRecentCrashes, setRocketRecentCrashes] = useState<number[]>([1.42, 2.85, 1.12, 5.40, 1.03, 12.50]);
  const [rocketHasBet, setRocketHasBet] = useState<boolean>(false);
  const [rocketBetAmount, setRocketBetAmount] = useState<number>(0);
  const [rocketAutoCashout, setRocketAutoCashout] = useState<number | null>(null);
  const [rocketHasCashedOut, setRocketHasCashedOut] = useState<boolean>(false);
  const [rocketWinAmount, setRocketWinAmount] = useState<number>(0);

  // VPN/Proxy Detection States
  const [isVpnBlocked, setIsVpnBlocked] = useState<boolean>(false);
  const [vpnInfo, setVpnInfo] = useState({
    ip: '',
    country: '',
    region: '',
    isp: '',
  });
  const [isCheckingVpn, setIsCheckingVpn] = useState<boolean>(false);

  const checkVpnConnection = async () => {
    if (typeof window === 'undefined') return;

    // 1. Bypass local development environments
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      console.log('Anti-VPN bypass triggered for local development hostname:', hostname);
      return;
    }

    setIsCheckingVpn(true);
    try {
      // 2. Primary attempt using ipwho.is
      const res = await fetch('https://ipwho.is/');
      if (!res.ok) throw new Error('ipwho.is failed');
      const data = await res.json();
      
      if (data && data.success) {
        const ip = data.ip || '';
        const country = data.country || '';
        const region = data.region || '';
        const isp = (data.connection?.isp || data.connection?.org || '').toLowerCase();
        
        setVpnInfo({
          ip,
          country,
          region,
          isp: data.connection?.isp || data.connection?.org || 'Unknown Provider',
        });

        // Heuristic signals for VPN/Proxy/Hosting:
        const vpnKeywords = [
          'vpn', 'proxy', 'hosting', 'vps', 'server', 'datacenter', 'cloud',
          'dedicated', 'm247', 'linode', 'digitalocean', 'ovh', 'leaseweb',
          'hetzner', 'vultr', 'choopa', 'psychz', 'packet', 'fastly', 'cloudflare',
          'surfshark', 'mullvad', 'proton', 'windscribe', 'tunnelbear', 'cyberghost',
          'ipvanish', 'privateinternetaccess', 'zenmate', 'torguard', 'ivacy',
          'hotspot shield', 'vypr', 'contabo', 'scaleway', 'colocrossing', 'quadranet'
        ];
        const isVpnIsp = vpnKeywords.some(keyword => isp.includes(keyword));

        if (isVpnIsp) {
          setIsVpnBlocked(true);
          return;
        }
        setIsVpnBlocked(false);
        return;
      }
    } catch (err) {
      console.warn('Primary VPN check failed, attempting fallback to ipinfo.io:', err);
    }

    // 3. Fallback attempt using ipinfo.io
    try {
      const res = await fetch('https://ipinfo.io/json');
      if (res.ok) {
        const data = await res.json();
        const ip = data.ip || '';
        const country = data.country || '';
        const region = data.region || '';
        const org = (data.org || '').toLowerCase();

        setVpnInfo({
          ip,
          country,
          region,
          isp: data.org || 'Unknown Provider',
        });

        const vpnKeywords = [
          'vpn', 'proxy', 'hosting', 'vps', 'server', 'datacenter', 'cloud',
          'dedicated', 'm247', 'linode', 'digitalocean', 'ovh', 'leaseweb',
          'hetzner', 'vultr', 'choopa', 'psychz', 'packet', 'fastly', 'cloudflare',
          'surfshark', 'mullvad', 'proton', 'windscribe', 'tunnelbear', 'cyberghost',
          'ipvanish', 'privateinternetaccess', 'zenmate', 'torguard', 'ivacy',
          'hotspot shield', 'vypr', 'contabo', 'scaleway', 'colocrossing', 'quadranet'
        ];
        const isVpnOrg = vpnKeywords.some(keyword => org.includes(keyword));

        if (isVpnOrg) {
          setIsVpnBlocked(true);
          return;
        }
      }
    } catch (fallbackErr) {
      console.error('All VPN check endpoints failed:', fallbackErr);
    } finally {
      setIsCheckingVpn(false);
    }
  };


  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCredits = localStorage.getItem('rm_credits');
      const storedUsername = localStorage.getItem('rm_username');
      const storedAvatar = localStorage.getItem('rm_avatar');
      const storedLevel = localStorage.getItem('rm_level');
      const storedXp = localStorage.getItem('rm_xp');
      const storedHistory = localStorage.getItem('rm_history');
      const storedAchievements = localStorage.getItem('rm_achievements');
      const storedDailyReward = localStorage.getItem('rm_daily_reward');
      const storedLanguage = localStorage.getItem('rm_language');

      // Rain stores
      const storedRainPool = localStorage.getItem('rm_rain_pool');
      const storedRainTimer = localStorage.getItem('rm_rain_timer');
      const storedRainWinner = localStorage.getItem('rm_rain_winner');
      const storedRainWinnerAmount = localStorage.getItem('rm_rain_winner_amount');
      const storedRainWinnerBot = localStorage.getItem('rm_rain_winner_bot');

      if (storedCredits !== null) setCredits(Number(storedCredits));
      if (storedUsername !== null) setUsername(storedUsername);
      if (storedAvatar !== null) setAvatar(storedAvatar);
      if (storedLevel !== null) setLevel(Number(storedLevel));
      if (storedXp !== null) setXp(Number(storedXp));
      if (storedHistory !== null) setGameHistory(JSON.parse(storedHistory));
      if (storedDailyReward !== null) setDailyRewardClaimedAt(storedDailyReward);
      if (storedLanguage === 'en' || storedLanguage === 'vi') setLanguage(storedLanguage);
      const storedSoundEnabled = localStorage.getItem('rm_sound_enabled');
      if (storedSoundEnabled !== null) {
        setSoundEnabled(storedSoundEnabled === 'true');
      }
      const storedVoiceEnabled = localStorage.getItem('rm_voice_enabled');
      if (storedVoiceEnabled !== null) {
        setVoiceEnabled(storedVoiceEnabled === 'true');
      }
      const storedVolume = localStorage.getItem('rm_volume');
      if (storedVolume !== null) {
        setVolume(Number(storedVolume));
      }

      if (storedAchievements !== null) {
        const parsed = JSON.parse(storedAchievements) as Achievement[];
        const merged = DEFAULT_ACHIEVEMENTS.map(def => {
          const matched = parsed.find(p => p.id === def.id);
          return matched ? matched : def;
        });
        setAchievements(merged);
      }

      if (storedRainPool !== null) setRainPool(Number(storedRainPool));
      if (storedRainTimer !== null) setRainTimer(Number(storedRainTimer));
      if (storedRainWinner !== null) setRainWinner(storedRainWinner);
      if (storedRainWinnerAmount !== null) setRainWinnerAmount(Number(storedRainWinnerAmount));
      if (storedRainWinnerBot !== null) setIsRainWinnerBot(storedRainWinnerBot === 'true');

      // Hydrate Summer Rain Pool States
      const storedSummerRainPool = localStorage.getItem('rm_summer_rain_pool');
      const storedSummerRainWinner = localStorage.getItem('rm_summer_rain_winner');
      const storedSummerRainWinnerAmount = localStorage.getItem('rm_summer_rain_winner_amount');
      const storedSummerRainWinnerBot = localStorage.getItem('rm_summer_rain_winner_bot');
      const storedSummerRainEndsAt = localStorage.getItem('rm_summer_rain_ends_at');

      if (storedSummerRainPool !== null) setSummerRainPool(Number(storedSummerRainPool));
      if (storedSummerRainWinner !== null) setSummerRainWinner(storedSummerRainWinner);
      if (storedSummerRainWinnerAmount !== null) setSummerRainWinnerAmount(Number(storedSummerRainWinnerAmount));
      if (storedSummerRainWinnerBot !== null) setIsSummerRainWinnerBot(storedSummerRainWinnerBot === 'true');

      let endsAt = 0;
      const now = Date.now();
      if (storedSummerRainEndsAt !== null) {
        endsAt = Number(storedSummerRainEndsAt);
        if (now >= endsAt) {
          endsAt = now + 24 * 60 * 60 * 1000;
          localStorage.setItem('rm_summer_rain_ends_at', endsAt.toString());
        }
      } else {
        endsAt = now + 24 * 60 * 60 * 1000;
        localStorage.setItem('rm_summer_rain_ends_at', endsAt.toString());
      }
      const secondsLeft = Math.max(0, Math.floor((endsAt - now) / 1000));
      setSummerRainTimer(secondsLeft);

      // Perform VPN check after hydration completes
      checkVpnConnection();
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }
    setIsHydrated(true);
  }, []);


  // Save to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_credits', credits.toString());
  }, [credits, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_username', username);
  }, [username, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_avatar', avatar);
  }, [avatar, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_level', level.toString());
  }, [level, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_xp', xp.toString());
  }, [xp, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_history', JSON.stringify(gameHistory));
  }, [gameHistory, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_achievements', JSON.stringify(achievements));
  }, [achievements, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (dailyRewardClaimedAt) {
      localStorage.setItem('rm_daily_reward', dailyRewardClaimedAt);
    } else {
      localStorage.removeItem('rm_daily_reward');
    }
  }, [dailyRewardClaimedAt, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_language', language);
  }, [language, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_sound_enabled', soundEnabled.toString());
  }, [soundEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_voice_enabled', voiceEnabled.toString());
  }, [voiceEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_volume', volume.toString());
  }, [volume, isHydrated]);

  // Rain Storage syncs
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_rain_pool', rainPool.toString());
  }, [rainPool, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_rain_timer', rainTimer.toString());
  }, [rainTimer, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (rainWinner) {
      localStorage.setItem('rm_rain_winner', rainWinner);
    } else {
      localStorage.removeItem('rm_rain_winner');
    }
  }, [rainWinner, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (rainWinnerAmount !== null) {
      localStorage.setItem('rm_rain_winner_amount', rainWinnerAmount.toString());
    } else {
      localStorage.removeItem('rm_rain_winner_amount');
    }
  }, [rainWinnerAmount, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isRainWinnerBot !== null) {
      localStorage.setItem('rm_rain_winner_bot', isRainWinnerBot.toString());
    } else {
      localStorage.removeItem('rm_rain_winner_bot');
    }
  }, [isRainWinnerBot, isHydrated]);

  // Summer Rain Storage syncs
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_summer_rain_pool', summerRainPool.toString());
  }, [summerRainPool, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rm_summer_rain_timer', summerRainTimer.toString());
  }, [summerRainTimer, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (summerRainWinner) {
      localStorage.setItem('rm_summer_rain_winner', summerRainWinner);
    } else {
      localStorage.removeItem('rm_summer_rain_winner');
    }
  }, [summerRainWinner, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (summerRainWinnerAmount !== null) {
      localStorage.setItem('rm_summer_rain_winner_amount', summerRainWinnerAmount.toString());
    } else {
      localStorage.removeItem('rm_summer_rain_winner_amount');
    }
  }, [summerRainWinnerAmount, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isSummerRainWinnerBot !== null) {
      localStorage.setItem('rm_summer_rain_winner_bot', isSummerRainWinnerBot.toString());
    } else {
      localStorage.removeItem('rm_summer_rain_winner_bot');
    }
  }, [isSummerRainWinnerBot, isHydrated]);

  const addCredits = (amount: number) => {
    setCredits(prev => Math.round((prev + amount) * 100) / 100);
  };

  const deductCredits = (amount: number): boolean => {
    if (credits < amount) return false;
    setCredits(prev => Math.round((prev - amount) * 100) / 100);
    return true;
  };

  const addXP = (amount: number) => {
    setXp(prevXp => {
      const newXp = prevXp + Math.round(amount);
      const nextLevelThreshold = level * 1000;
      if (newXp >= nextLevelThreshold) {
        setLevel(prevLevel => prevLevel + 1);
        return newXp - nextLevelThreshold;
      }
      return newXp;
    });
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prev =>
      prev.map(ach => {
        if (ach.id === id && !ach.unlocked) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('achievement_unlocked', { detail: ach }));
          }
          return { ...ach, unlocked: true, unlockedAt: Date.now() };
        }
        return ach;
      })
    );
  };

  const addHistoryItem = (
    game: string,
    bet: number,
    multiplier: number,
    payout: number,
    status: 'win' | 'loss'
  ) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game,
      bet,
      multiplier,
      payout,
      status,
      timestamp: Date.now(),
    };

    setGameHistory(prev => [newItem, ...prev].slice(0, 100));
    addXP(bet * 0.5);
    unlockAchievement('first-bet');

    if (bet >= 1000) {
      unlockAchievement('high-roller');
    }

    if (status === 'win') {
      if (game === 'Rocket' && multiplier >= 10) {
        unlockAchievement('to-the-moon');
      }
      if (game === 'Coin Flip' && bet >= 500) {
        unlockAchievement('double-up');
      }
      if (game === 'Wheel' && multiplier >= 5) {
        unlockAchievement('lucky-spin');
      }
      if (game === 'Plinko' && multiplier >= 10) {
        unlockAchievement('peg-master');
      }
    }
  };

  const claimDailyReward = () => {
    const now = new Date();
    if (dailyRewardClaimedAt) {
      const lastClaim = new Date(dailyRewardClaimedAt);
      const timeDiff = now.getTime() - lastClaim.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      if (hoursDiff < 24) {
        const remainingHours = Math.ceil(24 - hoursDiff);
        return {
          success: false,
          amount: 0,
          message: `Already claimed. Try again in ${remainingHours} hours.`,
        };
      }
    }

    const rewardAmount = 100;
    addCredits(rewardAmount);
    setDailyRewardClaimedAt(now.toISOString());
    return {
      success: true,
      amount: rewardAmount,
      message: `Successfully claimed $${rewardAmount} virtual funds!`,
    };
  };

  const updateUsername = (name: string) => {
    if (name.trim()) setUsername(name.trim());
  };

  const updateAvatar = (avatarUrl: string) => {
    setAvatar(avatarUrl);
  };

  const resetProgress = () => {
    setCredits(1000);
    setUsername('LuxuryPlayer');
    setAvatar('/avatars/avatar-default.png');
    setLevel(1);
    setXp(0);
    setGameHistory([]);
    setAchievements(DEFAULT_ACHIEVEMENTS);
    setDailyRewardClaimedAt(null);
    setRainPool(100);
    setRainTimer(3600);
    setRainWinner(null);
    setRainWinnerAmount(null);
    setIsRainWinnerBot(null);
    setSummerRainPool(1000);
    setSummerRainTimer(86400);
    setSummerRainWinner(null);
    setSummerRainWinnerAmount(null);
    setIsSummerRainWinnerBot(null);
    setRocketState('countdown');
    setRocketMultiplier(1.00);
    setRocketCountdown(10);
    setRocketHasBet(false);
    setRocketBetAmount(0);
    setRocketAutoCashout(null);
    setRocketHasCashedOut(false);
    setRocketWinAmount(0);
    setSoundEnabled(true);
    setVoiceEnabled(true);
    setVolume(100);
    const newSummerRainEndsAt = Date.now() + 24 * 60 * 60 * 1000;
    if (typeof window !== 'undefined') {
      localStorage.clear();
      localStorage.setItem('rm_summer_rain_ends_at', newSummerRainEndsAt.toString());
      localStorage.setItem('rm_summer_rain_pool', '1000');
      localStorage.setItem('rm_summer_rain_timer', '86400');
    }
  };

  // Rain trigger function
  const triggerRain = () => {
    const isPlayerWin = Math.random() < 0.01;
    let winner = '';
    let isBot = true;

    setRainPool(currentPool => {
      const payout = currentPool;
      if (isPlayerWin) {
        winner = username || 'LuxuryPlayer';
        isBot = false;
        setCredits(prev => Math.round((prev + payout) * 100) / 100);
      } else {
        winner = FICTIONOUS_NAMES[Math.floor(Math.random() * FICTIONOUS_NAMES.length)];
        isBot = true;
      }

      setRainWinner(winner);
      setRainWinnerAmount(payout);
      setIsRainWinnerBot(isBot);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rain_won', {
          detail: { winner, amount: payout, isBot }
        }));
      }

      return 10; // Reset pool to $10 base
    });
  };

  // Summer Rain trigger function
  const triggerSummerRain = () => {
    const isPlayerWin = Math.random() < 0.02; // 2% chance to win
    let winner = '';
    let isBot = true;

    setSummerRainPool(currentPool => {
      const payout = currentPool;
      if (isPlayerWin) {
        winner = username || 'LuxuryPlayer';
        isBot = false;
        setCredits(prev => Math.round((prev + payout) * 100) / 100);
      } else {
        winner = FICTIONOUS_NAMES[Math.floor(Math.random() * FICTIONOUS_NAMES.length)];
        isBot = true;
      }

      setSummerRainWinner(winner);
      setSummerRainWinnerAmount(payout);
      setIsSummerRainWinnerBot(isBot);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('summer_rain_won', {
          detail: { winner, amount: payout, isBot }
        }));
      }

      return 1000; // Reset summer pool to $1000 base
    });
  };

  // Rain Ticking Logic
  useEffect(() => {
    if (!isHydrated) return;

    const interval = setInterval(() => {
      // 1. Regular Rain Accumulation (+$1/s)
      setRainPool(prev => Math.round((prev + 1) * 100) / 100);

      // 2. Regular Rain Timer Countdown
      setRainTimer(prev => {
        if (prev <= 1) {
          setTimeout(() => {
            triggerRain();
          }, 0);
          return 3600; // Reset to 1 hour
        }
        return prev - 1;
      });

      // 3. Summer Rain Accumulation (+$100/s)
      setSummerRainPool(prev => Math.round((prev + 100) * 100) / 100);

      // 4. Summer Rain Timer Countdown
      setSummerRainTimer(prev => {
        if (prev <= 1) {
          setTimeout(() => {
            triggerSummerRain();
          }, 0);
          const newEndsAt = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem('rm_summer_rain_ends_at', newEndsAt.toString());
          return 86400; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHydrated, username]);

  const depositToRain = (amount: number): boolean => {
    if (amount <= 0 || credits < amount) return false;
    const success = deductCredits(amount);
    if (!success) return false;

    setRainPool(prev => Math.round((prev + amount) * 100) / 100);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rain_donation', {
        detail: { username: username || 'You', amount }
      }));
    }
    return true;
  };
  const depositToSummerRain = (amount: number): boolean => {
    if (amount <= 0 || credits < amount) return false;
    const success = deductCredits(amount);
    if (!success) return false;

    setSummerRainPool(prev => Math.round((prev + amount) * 100) / 100);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('summer_rain_donation', {
        detail: { username: username || 'You', amount }
      }));
    }
    return true;
  };
  // ==========================================
  // GLOBAL ROCKET GAME ENGINE (Runs 24/7 in background)
  // ==========================================

  // Refs for background loops
  const rocketStateRef = useRef(rocketState);
  const rocketMultiplierRef = useRef(rocketMultiplier);
  const rocketHasBetRef = useRef(rocketHasBet);
  const rocketBetAmountRef = useRef(rocketBetAmount);
  const rocketAutoCashoutRef = useRef(rocketAutoCashout);
  const rocketHasCashedOutRef = useRef(rocketHasCashedOut);

  useEffect(() => { rocketStateRef.current = rocketState; }, [rocketState]);
  useEffect(() => { rocketMultiplierRef.current = rocketMultiplier; }, [rocketMultiplier]);
  useEffect(() => { rocketHasBetRef.current = rocketHasBet; }, [rocketHasBet]);
  useEffect(() => { rocketBetAmountRef.current = rocketBetAmount; }, [rocketBetAmount]);
  useEffect(() => { rocketAutoCashoutRef.current = rocketAutoCashout; }, [rocketAutoCashout]);
  useEffect(() => { rocketHasCashedOutRef.current = rocketHasCashedOut; }, [rocketHasCashedOut]);

  // Rocket timers
  const countdownEndTimeRef = useRef<number>(0);
  const crashTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashedEndTimeRef = useRef<number>(0);
  const autoCashoutTimeRef = useRef<number>(0);

  // Set crash point formula: 3% instant crash, otherwise Pareto-like distribution
  const generateCrashPoint = (userBetted: boolean): number => {
    const roll = (): number => {
      if (Math.random() < 0.03) return 1.00;
      const value = 0.97 / (1.0 - Math.random());
      return Math.max(1.01, parseFloat(Math.min(100000.00, value).toFixed(2)));
    };

    if (!userBetted) {
      // 2x chance of going higher by taking the maximum of two independent rolls.
      const roll1 = roll();
      const roll2 = roll();
      return Math.max(roll1, roll2);
    }

    return roll();
  };

  // Helper to calculate the flight duration
  const getFlightDuration = (mult: number): number => {
    if (mult <= 1.00) return 0;
    if (mult < 2.583) {
      return Math.pow((mult - 1.00) / 0.07, 2 / 3);
    } else {
      return 8 + Math.log(mult / 2.583) / Math.log(1.08);
    }
  };

  // Ticking effect loop for Rocket game (100ms)
  useEffect(() => {
    if (!isHydrated) return;

    countdownEndTimeRef.current = Date.now() + 10000;

    const interval = setInterval(() => {
      const now = Date.now();
      const state = rocketStateRef.current;

      if (state === 'countdown') {
        const timeLeftMs = countdownEndTimeRef.current - now;
        const timeLeftSec = Math.max(0, Math.ceil(timeLeftMs / 1000));
        setRocketCountdown(timeLeftSec);

        if (timeLeftMs <= 0) {
          // Transition to flying
          const targetCrash = generateCrashPoint(rocketHasBetRef.current);
          crashPointRef.current = targetCrash;
          setRocketMultiplier(1.00);

          const flightDurationSec = getFlightDuration(targetCrash);
          startTimeRef.current = now;
          crashTimeRef.current = now + flightDurationSec * 1000;

          const autoMult = rocketAutoCashoutRef.current;
          if (rocketHasBetRef.current && !rocketHasCashedOutRef.current && autoMult !== null && autoMult > 1.00 && autoMult < targetCrash) {
            const cashoutDurationSec = getFlightDuration(autoMult);
            autoCashoutTimeRef.current = now + cashoutDurationSec * 1000;
          } else {
            autoCashoutTimeRef.current = 0;
          }

          rocketStateRef.current = 'flying';
          setRocketState('flying');
        }
      } else if (state === 'flying') {
        // Auto cashout check
        if (rocketHasBetRef.current && !rocketHasCashedOutRef.current && autoCashoutTimeRef.current > 0 && now >= autoCashoutTimeRef.current) {
          const autoMult = rocketAutoCashoutRef.current!;
          const payout = Math.round(rocketBetAmountRef.current * autoMult * 100) / 100;
          setCredits(prev => Math.round((prev + payout) * 100) / 100);
          setRocketHasCashedOut(true);
          setRocketWinAmount(payout);
          addHistoryItem('Rocket', rocketBetAmountRef.current, autoMult, payout, 'win');

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rocket_cashed_out', {
              detail: { multiplier: autoMult, amount: payout }
            }));
          }
        }

        if (now >= crashTimeRef.current) {
          // Crash!
          const finalCrash = crashPointRef.current;
          setRocketMultiplier(finalCrash);
          rocketStateRef.current = 'crashed';
          setRocketState('crashed');
          setRocketRecentCrashes(prev => [finalCrash, ...prev.slice(0, 5)]);

          if (rocketHasBetRef.current && !rocketHasCashedOutRef.current) {
            addHistoryItem('Rocket', rocketBetAmountRef.current, 0, 0, 'loss');
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rocket_crashed', {
              detail: { crashPoint: finalCrash, hadBet: rocketHasBetRef.current && !rocketHasCashedOutRef.current, betAmount: rocketBetAmountRef.current }
            }));
          }

          crashedEndTimeRef.current = now + 3000;
        } else {
          // Update multiplier
          const elapsedSec = (now - startTimeRef.current) / 1000;
          let mult = 1.00;
          if (elapsedSec < 8) {
            mult = 1.00 + Math.pow(elapsedSec, 1.5) * 0.07;
          } else {
            const base = 2.583;
            mult = base * Math.pow(1.08, elapsedSec - 8);
          }
          const formattedMult = parseFloat(Math.min(crashPointRef.current, mult).toFixed(2));
          setRocketMultiplier(formattedMult);
        }
      } else if (state === 'crashed') {
        if (now >= crashedEndTimeRef.current) {
          // Transition to countdown
          setRocketHasBet(false);
          setRocketHasCashedOut(false);
          setRocketWinAmount(0);
          setRocketMultiplier(1.00);

          countdownEndTimeRef.current = now + 10000;
          setRocketCountdown(10);
          rocketStateRef.current = 'countdown';
          setRocketState('countdown');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isHydrated, username]);

  const placeRocketBet = (amount: number, autoCashoutVal: string): boolean => {
    if (rocketStateRef.current !== 'countdown' || rocketHasBetRef.current) return false;
    if (amount <= 0 || credits < amount) return false;

    const success = deductCredits(amount);
    if (success) {
      setRocketHasBet(true);
      setRocketBetAmount(amount);
      const parsedAuto = parseFloat(autoCashoutVal);
      setRocketAutoCashout(isNaN(parsedAuto) || parsedAuto <= 1.00 ? null : parsedAuto);
      setRocketHasCashedOut(false);
      setRocketWinAmount(0);
      return true;
    }
    return false;
  };

  const cancelRocketBet = () => {
    if (rocketStateRef.current !== 'countdown' || !rocketHasBetRef.current) return;
    addCredits(rocketBetAmountRef.current);
    setRocketHasBet(false);
    setRocketBetAmount(0);
    setRocketAutoCashout(null);
  };

  const cashOutRocket = (): { success: boolean; amount: number } => {
    if (rocketStateRef.current !== 'flying' || !rocketHasBetRef.current || rocketHasCashedOutRef.current) {
      return { success: false, amount: 0 };
    }

    const mult = rocketMultiplierRef.current;
    const payout = Math.round(rocketBetAmountRef.current * mult * 100) / 100;
    
    setCredits(prev => Math.round((prev + payout) * 100) / 100);
    setRocketHasCashedOut(true);
    setRocketWinAmount(payout);
    addHistoryItem('Rocket', rocketBetAmountRef.current, mult, payout, 'win');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rocket_cashed_out', {
        detail: { multiplier: mult, amount: payout }
      }));
    }

    return { success: true, amount: payout };
  };

  const forceRainEvent = () => {
    triggerRain();
    setRainTimer(3600);
  };

  return (
    <GameStateContext.Provider
      value={{
        credits,
        username,
        avatar,
        level,
        xp,
        gameHistory,
        achievements,
        dailyRewardClaimedAt,
        rainPool,
        rainTimer,
        rainWinner,
        rainWinnerAmount,
        isRainWinnerBot,
        summerRainPool,
        summerRainTimer,
        summerRainWinner,
        summerRainWinnerAmount,
        isSummerRainWinnerBot,
        depositToSummerRain,
        language,
        setLanguage,
        soundEnabled,
        setSoundEnabled,
        voiceEnabled,
        setVoiceEnabled,
        volume,
        setVolume,
        addCredits,
        deductCredits,
        addXP,
        addHistoryItem,
        claimDailyReward,
        updateUsername,
        updateAvatar,
        unlockAchievement,
        resetProgress,
        depositToRain,
        forceRainEvent,
        rocketState,
        rocketMultiplier,
        rocketCountdown,
        rocketRecentCrashes,
        rocketHasBet,
        rocketBetAmount,
        rocketHasCashedOut,
        rocketWinAmount,
        placeRocketBet,
        cancelRocketBet,
        cashOutRocket,
      }}
    >
      {isVpnBlocked ? (
        <VpnBlockOverlay
          ip={vpnInfo.ip}
          country={vpnInfo.country}
          region={vpnInfo.region}
          isp={vpnInfo.isp}
          onRefresh={checkVpnConnection}
          isRefreshing={isCheckingVpn}
        />
      ) : isHydrated ? (
        children
      ) : (
        <div className="min-h-screen bg-luxury-bg text-white flex items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
            <span className="text-sm uppercase tracking-widest text-gold-500/60 font-medium">Initializing RainMoney...</span>
          </div>
        </div>
      )}
    </GameStateContext.Provider>
  );
}


export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
