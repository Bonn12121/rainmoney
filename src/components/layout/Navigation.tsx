'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { Button } from '@/components/ui/Button';
import { Coins, User, Trophy, Store, Menu, X, Gift, RotateCcw, CloudRain } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

export function Navigation() {
  const { credits, level, claimDailyReward, dailyRewardClaimedAt, resetProgress, username, deductCredits } = useGameState();
  const pathname = usePathname();
  const { playClick, playLoss } = useAudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Cashout Modal State
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutError, setCashoutError] = useState<string | null>(null);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [lastCashoutAmount, setLastCashoutAmount] = useState(0);

  const processCashout = () => {
    const amt = parseFloat(cashoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setCashoutError('Please enter a valid amount.');
      return;
    }
    if (amt > credits) {
      setCashoutError('Insufficient balance.');
      return;
    }

    const success = deductCredits(amt);
    if (success) {
      setLastCashoutAmount(amt);
      setCashoutSuccess(true);
      setCashoutError(null);
      setCashoutAmount('');
      playLoss(); // Play sound of money going away
    } else {
      setCashoutError('Failed to process. Please try again.');
    }
  };

  // Daily reward countdown timer
  useEffect(() => {
    if (!dailyRewardClaimedAt) {
      setCountdown('CLAIM NOW');
      return;
    }

    const interval = setInterval(() => {
      const lastClaim = new Date(dailyRewardClaimedAt);
      const now = new Date();
      const timeDiff = now.getTime() - lastClaim.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      if (hoursDiff >= 24) {
        setCountdown('CLAIM NOW');
        clearInterval(interval);
      } else {
        const remainingMs = (24 * 3600 * 1000) - timeDiff;
        const h = Math.floor(remainingMs / (3600 * 1000));
        const m = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
        const s = Math.floor((remainingMs % (60 * 1000)) / 1000);
        setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dailyRewardClaimedAt]);

  const handleClaim = () => {
    const result = claimDailyReward();
    setRewardMessage(result.message);
    setTimeout(() => setRewardMessage(null), 4000);
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Store },
    { href: '/store', label: 'Store', icon: Coins },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-luxury-border glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Elegant Wordmark Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" onClick={handleLinkClick}>
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300 shrink-0">
            <CloudRain className="w-4.5 h-4.5 text-blue-400 group-hover:text-blue-300 transition-all duration-300" />
            <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span className="font-sans text-xl tracking-wider font-black text-white transition-colors duration-300 select-none">
            Rain<span className="gold-gradient-text">Money</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'text-gold-500 bg-gold-500/5'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Daily Reward Button */}
          <div className="relative">
            <Button
              variant={countdown === 'CLAIM NOW' ? 'gold' : 'dark'}
              size="sm"
              onClick={countdown === 'CLAIM NOW' ? handleClaim : undefined}
              disabled={countdown !== 'CLAIM NOW'}
              className="flex items-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="text-xs">{countdown}</span>
            </Button>
            {rewardMessage && (
              <div className="absolute right-0 top-12 bg-black border border-gold-500/30 text-gold-200 text-xs px-3 py-2 rounded-xl shadow-2xl z-50 whitespace-nowrap animate-float font-medium">
                {rewardMessage}
              </div>
            )}
          </div>

          {/* Balance Display */}
          <Link
            href="/store"
            className="flex items-center gap-2.5 bg-black border border-gold-500/20 hover:border-gold-500/40 rounded-xl px-4 py-2 hover:bg-gold-500/5 transition-all duration-300 shadow-inner group"
          >
            <div className="bg-gold-500/10 p-1.5 rounded-lg group-hover:bg-gold-500/20 transition-all duration-300">
              <Coins className="w-4 h-4 text-gold-500 animate-spin-slow" />
            </div>
            <div className="flex flex-col items-start pr-1">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider leading-none">Balance</span>
              <span className="text-sm font-extrabold text-white leading-none mt-1">
                ${credits.toLocaleString()}
              </span>
            </div>
          </Link>

          {/* Cash Out Button */}
          <Button
            variant="glass"
            size="sm"
            onClick={() => { playClick(); setIsCashoutModalOpen(true); }}
            className="border border-red-500/15 hover:border-red-500/35 hover:bg-red-500/5 text-red-400 hover:text-red-300 font-extrabold"
          >
            Cash Out
          </Button>

          {/* Profile Level Circle */}
          <Link
            href="/profile"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title={`${username} - VIP Level ${level}`}
          >
            <div className="h-9 w-9 rounded-xl bg-luxury-surface border border-luxury-border flex items-center justify-center font-bold text-xs text-gold-500 uppercase">
              {username.slice(0, 2)}
            </div>
            <span className="bg-gold-500/10 text-gold-500 border border-gold-500/20 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Lvl {level}
            </span>
          </Link>
        </div>

        {/* Mobile Actions: Balance + Menu Toggle */}
        <div className="flex md:hidden items-center gap-2.5">
          {/* Quick Balance Display */}
          <Link
            href="/store"
            className="flex items-center gap-1.5 bg-black border border-gold-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white hover:bg-gold-500/5 font-extrabold"
          >
            <Coins className="w-3.5 h-3.5 text-gold-500 animate-spin-slow" />
            <span>${credits.toLocaleString()}</span>
          </Link>

          <Button
            variant="glass"
            size="sm"
            onClick={() => { playClick(); setIsCashoutModalOpen(true); }}
            className="px-2.5 py-1 text-[10px] border border-red-500/15 text-red-400 font-extrabold"
          >
            Out
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-luxury-border transition-all duration-200"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-luxury-border bg-luxury-bg/95 backdrop-blur-xl animate-fade-in absolute w-full left-0 p-5 flex flex-col gap-5 shadow-2xl z-50">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-gold-500 bg-gold-500/5 border-l-2 border-gold-500 pl-4'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <hr className="border-luxury-border" />

          {/* Mobile Actions Drawer Bottom */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Level Progress</span>
              <span className="bg-gold-500/10 text-gold-500 text-[10px] font-extrabold px-2 py-0.5 rounded border border-gold-500/20">
                VIP LEVEL {level}
              </span>
            </div>

            {/* Mobile Daily Claim */}
            <Button
              variant={countdown === 'CLAIM NOW' ? 'gold' : 'dark'}
              size="md"
              fullWidth
              onClick={countdown === 'CLAIM NOW' ? () => { handleClaim(); handleLinkClick(); } : undefined}
              disabled={countdown !== 'CLAIM NOW'}
              className="flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>{countdown === 'CLAIM NOW' ? 'CLAIM DAILY REWARD (+$100)' : `REWARD READY IN: ${countdown}`}</span>
            </Button>
            
            {rewardMessage && (
              <div className="bg-black border border-gold-500/30 text-gold-200 text-xs p-3 rounded-xl text-center shadow-lg animate-pulse font-medium">
                {rewardMessage}
              </div>
            )}

            {/* Reset Progress Developer Button */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all virtual funds, stats, and achievements?')) {
                  resetProgress();
                  handleLinkClick();
                }
              }}
              className="flex items-center justify-center gap-1.5 text-[10px] text-red-500 hover:text-red-400 py-2 border border-red-500/10 hover:border-red-500/30 rounded-xl hover:bg-red-500/5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET PROGRESS DATA
            </button>
          </div>
        </div>
      )}
      {/* Virtual Cash Out Modal */}
      {isCashoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-[#0b0f19] border border-luxury-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-luxury-border/60 flex justify-between items-center bg-[#070b14]">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">VIRTUAL CASH OUT</h3>
              <button onClick={() => setIsCashoutModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex justify-between text-xs font-bold text-neutral-400">
                <span>Available Balance</span>
                <span className="text-white">${credits.toLocaleString()}</span>
              </div>

              {cashoutError && (
                <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium">
                  {cashoutError}
                </div>
              )}

              {cashoutSuccess ? (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center animate-bounce">
                    <Coins className="w-8 h-8" />
                  </div>
                  <h4 className="text-emerald-500 font-extrabold text-base">Cash Out Initiated!</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    Simulated withdrawal of <strong className="text-white">${lastCashoutAmount.toLocaleString()}</strong> completed successfully.
                  </p>
                  <p className="text-[10px] text-neutral-500 border border-luxury-border/40 bg-black/40 p-2.5 rounded-xl mt-2 leading-relaxed">
                    IMPORTANT: This is a virtual entertainment platform. Fictional ledger funds are removed from your balance. No real money will be transferred or paid out.
                  </p>
                  <Button variant="gold" size="sm" onClick={() => { setCashoutSuccess(false); setIsCashoutModalOpen(false); }} className="mt-2">
                    Close Window
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-neutral-500">Amount to Cash Out ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-neutral-500 font-extrabold text-sm">$</span>
                      <input
                        type="number"
                        value={cashoutAmount}
                        onChange={(e) => setCashoutAmount(e.target.value)}
                        placeholder="Enter amount..."
                        className="w-full bg-black border border-luxury-border focus:border-red-500/30 rounded-xl pl-8 pr-16 py-3 text-sm text-white font-extrabold focus:outline-none"
                      />
                      <button
                        onClick={() => setCashoutAmount(credits.toString())}
                        className="absolute right-2 top-2 px-2.5 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[10px] text-neutral-400 font-extrabold rounded-lg cursor-pointer"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                    * Cash out will deduct the selected balance amount from your account. This is a non-refundable, virtual gameplay action.
                  </p>

                  <Button
                    variant="danger"
                    fullWidth
                    size="lg"
                    onClick={processCashout}
                    className="bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/30 hover:border-red-500/40 font-bold"
                  >
                    Confirm Cash Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
