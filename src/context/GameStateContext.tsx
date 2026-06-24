'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface GameStateContextType {
  credits: number;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  gameHistory: HistoryItem[];
  achievements: Achievement[];
  dailyRewardClaimedAt: string | null;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  addXP: (amount: number) => void;
  addHistoryItem: (game: string, bet: number, multiplier: number, payout: number, status: 'win' | 'loss') => void;
  claimDailyReward: () => { success: boolean; amount: number; message: string };
  updateUsername: (name: string) => void;
  updateAvatar: (avatarUrl: string) => void;
  unlockAchievement: (id: string) => void;
  resetProgress: () => void;
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

      if (storedCredits !== null) setCredits(Number(storedCredits));
      if (storedUsername !== null) setUsername(storedUsername);
      if (storedAvatar !== null) setAvatar(storedAvatar);
      if (storedLevel !== null) setLevel(Number(storedLevel));
      if (storedXp !== null) setXp(Number(storedXp));
      if (storedHistory !== null) setGameHistory(JSON.parse(storedHistory));
      if (storedDailyReward !== null) setDailyRewardClaimedAt(storedDailyReward);

      if (storedAchievements !== null) {
        const parsed = JSON.parse(storedAchievements) as Achievement[];
        // Merge stored with defaults in case we added new achievements
        const merged = DEFAULT_ACHIEVEMENTS.map(def => {
          const matched = parsed.find(p => p.id === def.id);
          return matched ? matched : def;
        });
        setAchievements(merged);
      }
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
        // Level up!
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
          // Trigger a global custom event so pages can show toast alerts
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

    setGameHistory(prev => [newItem, ...prev].slice(0, 100)); // Cap history at last 100 items
    addXP(bet * 0.5); // 0.5 XP per credit bet
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
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
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
        addCredits,
        deductCredits,
        addXP,
        addHistoryItem,
        claimDailyReward,
        updateUsername,
        updateAvatar,
        unlockAchievement,
        resetProgress,
      }}
    >
      {isHydrated ? children : <div className="min-h-screen bg-luxury-bg text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
          <span className="text-sm uppercase tracking-widest text-gold-500/60 font-medium">Initializing RainMoney...</span>
        </div>
      </div>}
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
