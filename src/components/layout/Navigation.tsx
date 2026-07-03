'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { Button } from '@/components/ui/Button';
import { 
  Coins, User, Trophy, Menu, X, Gift, RotateCcw, CloudRain, 
  Home, Sun, Volume2, VolumeX, Heart, Headphones, Globe, 
  ChevronRight, MessageCircle, AlertCircle, HeartCrack
} from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

const FAVORITE_GAMES_INFO = [
  { id: 'rocket', name: 'Rocket', path: '/games/rocket', icon: '🚀' },
  { id: 'mines', name: 'Mines', path: '/games/mines', icon: '💣' },
  { id: 'dice', name: 'Dice', path: '/games/dice', icon: '🎲' },
  { id: 'coin-flip', name: 'Coin Flip', path: '/games/coin-flip', icon: '🪙' },
  { id: 'wheel', name: 'Wheel', path: '/games/wheel', icon: '🎡' },
  { id: 'plinko', name: 'Plinko', path: '/games/plinko', icon: '🔵' },
  { id: 'towers', name: 'Towers', path: '/games/towers', icon: '🏰' },
  { id: 'limbo', name: 'Limbo', path: '/games/limbo', icon: '⚡' },
  { id: 'keno', name: 'Keno', path: '/games/keno', icon: '🎟️' },
  { id: 'hi-lo', name: 'Hi-Lo', path: '/games/hi-lo', icon: '🎴' },
  { id: 'pump', name: 'Pump', path: '/games/pump', icon: '🎈' },
  { id: 'rps', name: 'RPS', path: '/games/rps', icon: '✊' },
  { id: 'cup', name: 'Cup', path: '/games/cup', icon: '🥛' },
  { id: 'toe', name: 'Toe', path: '/games/toe', icon: '❌' },
  { id: 'cases', name: 'Cases', path: '/games/cases', icon: '💼' },
  { id: 'blackjack', name: 'Blackjack', path: '/games/blackjack', icon: '🃏' },
  { id: 'claw', name: 'Claw Machine', path: '/games/claw', icon: '🕹️' },
  { id: 'baccarat', name: 'Baccarat', path: '/games/baccarat', icon: '👑' },
  { id: 'sports', name: 'Sports Betting', path: '/games/sports', icon: '⚽' },
  { id: 'penalty', name: 'Penalty Shootout', path: '/games/penalty', icon: '🥅' },
  { id: 'slots-neon', name: 'Neon Fruits Slots', path: '/games/slots-neon', icon: '🍋' },
  { id: 'slots-egypt', name: 'Pharaoh\'s Gold Slots', path: '/games/slots-egypt', icon: '🔱' },
  { id: 'slots-sweet', name: 'Sweet Candy Reels', path: '/games/slots-sweet', icon: '🍭' },
  { id: 'slots-pirate', name: 'Pirate\'s Bounty Slots', path: '/games/slots-pirate', icon: '🏴‍☠️' },
  { id: 'slots-zeus', name: 'Zeus Olympus Slots', path: '/games/slots-zeus', icon: '⚡' },
  { id: 'slots-cyber', name: 'Cyberpunk Reels', path: '/games/slots-cyber', icon: '🤖' },
  { id: 'slots-safari', name: 'Safari Wilds Slots', path: '/games/slots-safari', icon: '🦁' },
  { id: 'slots-dragon', name: 'Dragon\'s Fortune Slots', path: '/games/slots-dragon', icon: '🐲' },
  { id: 'slots-irish', name: 'Leprechaun Gold Slots', path: '/games/slots-irish', icon: '🍀' },
  { id: 'slots-undersea', name: 'Undersea Riches', path: '/games/slots-undersea', icon: '🔱' },
];

export function Navigation() {
  const { 
    credits, 
    level, 
    resetProgress, 
    username, 
    deductCredits, 
    rainPool, 
    rainTimer,
    summerRainPool,
    summerRainTimer,
    language,
    setLanguage,
    soundEnabled,
    setSoundEnabled,
    voiceEnabled,
    setVoiceEnabled,
    volume,
    setVolume
  } = useGameState();

  const pathname = usePathname();
  const router = useRouter();
  const { playClick, playLoss } = useAudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<{sender: 'user'|'bot', text: string, time: string}[]>([
    { sender: 'bot', text: 'Welcome to RainMoney Luxury Support! How can we assist you with your virtual credits today?', time: 'Just now' }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const checkExpanded = () => {
      setIsExpanded(localStorage.getItem('rainmoney-sidebar-expanded') === 'true');
    };
    checkExpanded();
    window.addEventListener('sidebar-toggle', checkExpanded);
    return () => window.removeEventListener('sidebar-toggle', checkExpanded);
  }, []);

  const toggleSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    playClick();
    const nextState = !isExpanded;
    localStorage.setItem('rainmoney-sidebar-expanded', String(nextState));
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  useEffect(() => {
    if (isExpanded) {
      document.documentElement.classList.add('sidebar-expanded');
    } else {
      document.documentElement.classList.remove('sidebar-expanded');
    }
  }, [isExpanded]);

  // Synchronize favorites from LocalStorage
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

  // Cashout Modal State
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutError, setCashoutError] = useState<string | null>(null);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [lastCashoutAmount, setLastCashoutAmount] = useState(0);

  const [cashoutMethod] = useState<'crypto'>('crypto');
  const [cryptoType, setCryptoType] = useState<'BTC' | 'LTC' | 'ETH' | 'USDT' | 'DOGE'>('BTC');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cashoutDetailsText, setCashoutDetailsText] = useState('');

  const navTranslations = {
    en: {
      home: 'Home',
      store: 'Store',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      rainPool: 'Rain Pool',
      summerRainPool: 'Summer Rain Pool',
      balance: 'Balance',
      cashOut: 'Cash Out',
      claimNow: 'Claim Now',
      level: 'Lvl',
      levelProgress: 'Level Progress',
      vipLevel: 'VIP Level',
      resetProgress: 'Reset Progress Data',
      virtualCashOut: 'Virtual Cash Out',
      availableBalance: 'Available Balance',
      amountToCashOut: 'Amount to Cash Out',
      confirmCashOut: 'Confirm Cash Out',
      closeWindow: 'Close Window',
      cashOutSuccess: 'Cash Out Initiated!',
      simulatedMsg: 'Simulated withdrawal of {amount} completed successfully.',
      disclaimer: 'IMPORTANT: This is a virtual entertainment platform. Fictional ledger funds are removed from your balance. No real money will be transferred or paid out.',
      invalidAmount: 'Please enter a valid amount.',
      insufficient: 'Insufficient balance.',
      failed: 'Failed to process. Please try again.',
      max: 'MAX',
      claimDailyReward: 'Claim Daily Reward',
      rewardReadyIn: 'Reward ready in',
      resetConfirm: 'Are you sure you want to reset all virtual funds, stats, and achievements?'
    },
    vi: {
      home: 'Trang Chủ',
      store: 'Cửa Hàng',
      leaderboard: 'Xếp Hạng',
      profile: 'Cá Nhân',
      rainPool: 'Bể Mưa',
      summerRainPool: 'Bể Mưa Hè',
      balance: 'Số Dư',
      cashOut: 'Rút Tiền',
      claimNow: 'Nhận Ngay',
      level: 'Cấp',
      levelProgress: 'Tiến Trình Cấp Độ',
      vipLevel: 'CẤP ĐỘ VIP',
      resetProgress: 'Thiết Lập Lại Dữ Liệu',
      virtualCashOut: 'Rút Tiền Ảo',
      availableBalance: 'Số Dư Khả Dụng',
      amountToCashOut: 'Số Tiền Muốn Rút',
      confirmCashOut: 'Xác Nhận Rút Tiền',
      closeWindow: 'Đóng Cửa Sổ',
      cashOutSuccess: 'Đã Khởi Tạo Rút Tiền!',
      simulatedMsg: 'Mô phỏng rút tiền {amount} đã hoàn thành thành công.',
      disclaimer: 'QUAN TRỌNG: Đây là nền tảng giải trí ảo. Số dư tiền ảo sẽ bị trừ khỏi tài khoản của bạn. Không có giao dịch tiền thật nào được thực hiện.',
      invalidAmount: 'Vui lòng nhập số tiền hợp lệ.',
      insufficient: 'Số dư không đủ.',
      failed: 'Xử lý thất bại. Vui lòng thử lại.',
      max: 'TỐI ĐA',
      claimDailyReward: 'Nhận Thưởng Hàng Ngày',
      rewardReadyIn: 'Thưởng sau',
      resetConfirm: 'Bạn có chắc chắn muốn thiết lập lại toàn bộ điểm ảo, thống kê và thành tựu không?'
    }
  };

  const processCashout = () => {
    const amt = parseFloat(cashoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setCashoutError(navTranslations[language].invalidAmount);
      return;
    }
    if (amt > credits) {
      setCashoutError(navTranslations[language].insufficient);
      return;
    }

    if (!cryptoAddress || cryptoAddress.trim().length < 10) {
      setCashoutError(language === 'en' ? 'Please enter a valid wallet address.' : 'Vui lòng nhập địa chỉ ví hợp lệ.');
      return;
    }
    const details = `${cryptoType} Wallet (${cryptoAddress.slice(0, 6)}...${cryptoAddress.slice(-4)})`;

    const success = deductCredits(amt);
    if (success) {
      setLastCashoutAmount(amt);
      setCashoutDetailsText(details);
      setCashoutSuccess(true);
      setCashoutError(null);
      setCashoutAmount('');
      setCryptoAddress('');
      playLoss();
    } else {
      setCashoutError(navTranslations[language].failed);
    }
  };

  const removeFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClick();
    const updated = favoriteIds.filter(favId => favId !== id);
    localStorage.setItem('rainmoney-favorites', JSON.stringify(updated));
    setFavoriteIds(updated);
    window.dispatchEvent(new Event('favorites-changed'));
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const userMsg = supportInput.trim();
    setSupportMessages(prev => [...prev, { sender: 'user', text: userMsg, time: 'Just now' }]);
    setSupportInput('');
    playClick();

    setTimeout(() => {
      let botResponse = 'Thank you for reaching out. Our support agent will connect with you shortly.';
      if (userMsg.toLowerCase().includes('credits') || userMsg.toLowerCase().includes('money')) {
        botResponse = 'All virtual credits are strictly for entertainment. You can reload your credits for free anytime at the Virtual Store page.';
      } else if (userMsg.toLowerCase().includes('game') || userMsg.toLowerCase().includes('slots')) {
        botResponse = 'We offer original multiplayer mini-games and premium slots! Simply select any game from the Lobby to start playing.';
      }
      setSupportMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: 'Just now' }]);
      playClick();
    }, 1000);
  };

const CoinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const FootballIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="12,8 15,10.5 14,14 10,14 9,10.5" fill="currentColor" />
    <line x1="12" y1="8" x2="12" y2="2" />
    <line x1="15" y1="10.5" x2="20.5" y2="8.5" />
    <line x1="14" y1="14" x2="18.5" y2="18.5" />
    <line x1="10" y1="14" x2="5.5" y2="18.5" />
    <line x1="9" y1="10.5" x2="3.5" y2="8.5" />
  </svg>
);

  const isCasinoActive = pathname === '/' || (pathname.startsWith('/games/') && pathname !== '/games/sports');
  const isSportsbookActive = pathname === '/games/sports';

  const isLinkActive = (href: string) => {
    if (href === '/') return isCasinoActive;
    if (href === '/games/sports') return isSportsbookActive;
    return pathname === href;
  };

  const desktopTopLinks = [
    { href: '/', tooltip: 'Casino', icon: CoinIcon },
    { href: '/games/sports', tooltip: 'Sportsbook', icon: FootballIcon },
  ];

  const desktopMainLinks = [
    { href: '/store', tooltip: navTranslations[language].store, icon: Coins },
    { href: '/leaderboard', tooltip: navTranslations[language].leaderboard, icon: Trophy },
    { href: '/profile', tooltip: navTranslations[language].profile, icon: User },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setFavoritesOpen(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP LEFT SIDEBAR NAVIGATION                       */}
      {/* ======================================================== */}
      <aside className={`hidden md:flex flex-col items-center justify-between py-6 ${isExpanded ? 'w-60 px-4' : 'w-20'} bg-luxury-bg border-r border-luxury-border/60 fixed left-0 top-0 bottom-0 h-screen z-40 select-none transition-all duration-300`}>
        {/* Top: Toggle Sidebar Button */}
        <button 
          onClick={toggleSidebar} 
          className="group flex flex-col items-center gap-1 shrink-0 bg-transparent border-none cursor-pointer focus:outline-none"
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300">
            <CloudRain className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-all duration-300 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-blue-500/15 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </button>
        <nav className={`flex flex-col bg-black/35 border border-white/[0.04] p-1.5 rounded-3xl backdrop-blur-md shrink-0 ${isExpanded ? 'w-full' : ''}`}>
          {/* Section 1: Casino & Sportsbook */}
          <div className="flex flex-col gap-2">
            {desktopTopLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <div key={link.href} className="relative group w-full flex justify-center">
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center transition-all duration-300 border ${
                      isExpanded 
                        ? 'w-full px-4 h-12 gap-3.5 justify-start rounded-2xl' 
                        : 'w-12 h-12 justify-center rounded-2xl'
                    } ${
                      isActive
                        ? 'bg-blue-600 border-blue-500/25 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/5 hover:border-white/[0.02]'
                    }`}
                  >
                    <link.icon className="w-5.5 h-5.5 shrink-0" />
                    {isExpanded && <span className="text-xs font-black uppercase tracking-wider animate-fade-in text-left flex-grow">{link.tooltip}</span>}
                  </Link>
                  {/* Tooltip (only when collapsed) */}
                  {!isExpanded && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-neutral-900 border border-luxury-border text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-350 z-50 whitespace-nowrap">
                      {link.tooltip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section Divider */}
          <div className="w-[85%] mx-auto h-[1px] bg-luxury-border/60 my-2.5" />

          {/* Section 2: Store, Leaderboard, Profile & Heart Spot */}
          <div className="flex flex-col gap-2">
            {desktopMainLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <div key={link.href} className="relative group w-full flex justify-center">
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center transition-all duration-300 border ${
                      isExpanded 
                        ? 'w-full px-4 h-12 gap-3.5 justify-start rounded-2xl' 
                        : 'w-12 h-12 justify-center rounded-2xl'
                    } ${
                      isActive
                        ? 'bg-blue-600 border-blue-500/25 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/5 hover:border-white/[0.02]'
                    }`}
                  >
                    <link.icon className="w-5.5 h-5.5 shrink-0" />
                    {isExpanded && <span className="text-xs font-black uppercase tracking-wider animate-fade-in text-left flex-grow">{link.tooltip}</span>}
                  </Link>
                  {/* Tooltip (only when collapsed) */}
                  {!isExpanded && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-neutral-900 border border-luxury-border text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-350 z-50 whitespace-nowrap">
                      {link.tooltip}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Heart Spot (Favorites Toggle) */}
            <div className="relative group w-full flex justify-center">
              <button
                onClick={() => { playClick(); setFavoritesOpen(!favoritesOpen); }}
                className={`flex items-center transition-all duration-300 border ${
                  isExpanded 
                    ? 'w-full px-4 h-12 gap-3.5 justify-start rounded-2xl' 
                    : 'w-12 h-12 justify-center rounded-2xl'
                } ${
                  favoritesOpen
                    ? 'bg-rose-600 border-rose-500/25 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : favoriteIds.length > 0 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-transparent border-transparent text-neutral-400 hover:text-rose-450 hover:bg-rose-500/5'
                }`}
              >
                <Heart className={`w-5.5 h-5.5 shrink-0 ${favoriteIds.length > 0 && !favoritesOpen ? 'animate-pulse' : ''}`} />
                {isExpanded && <span className="text-xs font-black uppercase tracking-wider animate-fade-in text-left flex-grow">{language === 'en' ? 'Favorites' : 'Yêu thích'}</span>}
              </button>
              {/* Tooltip */}
              {!isExpanded && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-neutral-900 border border-luxury-border text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-350 z-50 whitespace-nowrap">
                  {language === 'en' ? 'Heart Spot' : 'Điểm Yêu Thích'}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom: Utilities */}
        <div className={`flex flex-col gap-4 bg-black/20 p-1.5 rounded-3xl border border-white/[0.02] ${isExpanded ? 'w-full' : ''}`}>
          {/* Support Widget Link */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => { playClick(); setSupportOpen(!supportOpen); }}
              className={`flex items-center transition-all duration-300 rounded-xl ${
                isExpanded ? 'w-full px-3.5 h-11 gap-3 justify-start' : 'w-11 h-11 justify-center'
              } ${
                supportOpen ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones className="w-5 h-5 shrink-0" />
              {isExpanded && <span className="text-[10px] font-black uppercase tracking-wider animate-fade-in text-left flex-grow">Support</span>}
            </button>
            {!isExpanded && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-neutral-900 border border-luxury-border text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-350 z-50 whitespace-nowrap">
                {language === 'en' ? 'Support' : 'Hỗ Trợ'}
              </div>
            )}
          </div>

          {/* Volume Gear Toggle */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => { playClick(); setSettingsOpen(!settingsOpen); }}
              className={`flex items-center transition-all duration-300 rounded-xl ${
                isExpanded ? 'w-full px-3.5 h-11 gap-3 justify-start' : 'w-11 h-11 justify-center'
              } ${
                settingsOpen ? 'bg-luxury-surface border border-luxury-border text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {soundEnabled || voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <VolumeX className="w-5 h-5 text-neutral-500 shrink-0" />
              )}
              {isExpanded && <span className="text-[10px] font-black uppercase tracking-wider animate-fade-in text-left flex-grow">Audio</span>}
            </button>
            
            {settingsOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setSettingsOpen(false)} />
                <div className="absolute left-14 bottom-0 ml-2 w-60 bg-[#0c1024]/98 backdrop-blur-xl border border-luxury-border shadow-[0_10px_35px_rgba(0,0,0,0.65)] rounded-2xl p-4 z-50 flex flex-col gap-4 text-xs select-none animate-fade-in text-neutral-300">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/[0.06] pb-2 leading-none block">
                    {language === 'en' ? 'Audio Settings' : 'Thiết lập âm thanh'}
                  </span>
                  
                  {/* Volume Slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center font-bold text-[10px]">
                      <span className="text-neutral-400 uppercase tracking-wider">{language === 'en' ? 'Volume' : 'Âm lượng'}</span>
                      <span className="text-white font-mono">{volume}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Sounds Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-snug">
                      <span className="font-bold text-white">{language === 'en' ? 'Game Sounds' : 'Âm thanh'}</span>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Voice Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col leading-snug">
                      <span className="font-bold text-white">{language === 'en' ? 'Voice Announcer' : 'Phát thanh viên'}</span>
                    </div>
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${voiceEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${voiceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Language Globe Toggle */}
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => { playClick(); setLanguage(language === 'en' ? 'vi' : 'en'); }}
              className={`flex items-center transition-all duration-300 rounded-xl ${
                isExpanded ? 'w-full px-3.5 h-11 gap-3 justify-start' : 'w-11 h-11 justify-center'
              } text-neutral-400 hover:text-white hover:bg-white/5`}
            >
              <Globe className="w-5 h-5 text-blue-400 shrink-0" />
              {isExpanded && <span className="text-[10px] font-black uppercase tracking-wider animate-fade-in text-left flex-grow">{language === 'en' ? 'Tiếng Việt' : 'English'}</span>}
            </button>
            {!isExpanded && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-neutral-900 border border-luxury-border text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-350 z-50 whitespace-nowrap">
                {language === 'en' ? 'Tiếng Việt' : 'English'}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. FAVORITES SLIDING DRAWER ("HEART SPOT")               */}
      {/* ======================================================== */}
      {favoritesOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-30 transition-opacity animate-fade-in" onClick={() => setFavoritesOpen(false)} />
          <div className="fixed left-0 md:left-20 top-0 bottom-0 h-screen w-80 bg-[#0c1024]/98 border-r border-luxury-border/60 z-40 backdrop-blur-2xl shadow-2xl p-6 flex flex-col gap-6 animate-slide-in select-none">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-luxury-border/50 pb-4 mt-16 md:mt-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                  {language === 'en' ? 'Favorites Hub' : 'Điểm Yêu Thích'}
                </h3>
              </div>
              <button 
                onClick={() => setFavoritesOpen(false)} 
                className="p-1 hover:bg-white/5 rounded-lg border border-transparent hover:border-luxury-border text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3">
              {favoriteIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-black/20 border border-dashed border-luxury-border/65 rounded-2xl">
                  <HeartCrack className="w-10 h-10 text-neutral-600 mb-3" />
                  <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider">Empty Spot</span>
                  <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">
                    {language === 'en' 
                      ? 'Click the heart icon on any game card to add it to your favorites list.' 
                      : 'Nhấn vào biểu tượng trái tim ở bất kỳ thẻ game nào để thêm vào danh sách.'}
                  </p>
                </div>
              ) : (
                favoriteIds.map((favId) => {
                  const game = FAVORITE_GAMES_INFO.find(g => g.id === favId);
                  if (!game) return null;
                  return (
                    <div 
                      key={game.id}
                      onClick={() => { handleLinkClick(); router.push(game.path); }}
                      className="group flex items-center justify-between p-3 bg-luxury-surface/50 border border-luxury-border/60 hover:border-blue-500/40 rounded-2xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <div className="flex items-center gap-3">
                        <span className="text-xl flex items-center justify-center w-9 h-9 rounded-xl bg-black/40 border border-white/[0.04] shadow-inner group-hover:scale-105 transition-transform">
                          {game.icon}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider text-neutral-300 group-hover:text-white transition-colors">
                          {game.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => removeFavorite(game.id, e)}
                          className="p-1.5 text-neutral-500 hover:text-rose-500 bg-black/25 border border-transparent hover:border-rose-500/20 rounded-lg hover:bg-rose-500/5 transition-all"
                          title="Remove from favorites"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 3. DESKTOP TOP BAR / HEADER (Compact neat header)        */}
      {/* ======================================================== */}
      <header className={`sticky top-0 z-30 w-full bg-luxury-bg/95 backdrop-blur-xl border-b border-luxury-border/40 select-none ${isExpanded ? 'md:pl-60' : 'md:pl-20'} transition-all duration-300`}>
        
        {/* Top Rain Pools Tickers - desktop only */}
        <div className="hidden md:block w-full bg-black/25 border-b border-luxury-border/30 py-1.5 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[9px] font-extrabold text-neutral-400">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CloudRain className="w-3 h-3 text-blue-400 animate-pulse" />
                <span>{navTranslations[language].rainPool}: <span className="text-white font-black">${rainPool.toLocaleString()}</span></span>
                <span className="bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.2 rounded font-mono">{formatRainTime(rainTimer)}</span>
              </div>
              <div className="flex items-center gap-2 border-l border-white/[0.08] pl-6">
                <Sun className="w-3 h-3 text-amber-400 animate-spin-slow" />
                <span>{navTranslations[language].summerRainPool}: <span className="text-amber-400 font-black">${summerRainPool.toLocaleString()}</span></span>
                <span className="bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.2 rounded font-mono">{formatSummerRainTime(summerRainTimer)}</span>
                <span className="bg-amber-500 text-black px-1 py-0.2 rounded text-[7px] uppercase tracking-wider animate-pulse font-black leading-none">Summer</span>
              </div>
            </div>
            
            <div className="text-[8px] text-neutral-500 flex items-center gap-1.5 uppercase font-medium">
              <AlertCircle className="w-3 h-3 text-gold-500/50" />
              <span>100% Virtual Sandbox • No Real Withdrawals</span>
            </div>
          </div>
        </div>

        {/* Desktop Navbar Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-10">
          
          {/* Left: Mobile wordmark or desktop breadcrumb - REMOVED */}
          <div className="flex items-center gap-2"></div>

          {/* Right: Wallet pill and profile wrapper */}
          <div className="flex items-center gap-3 select-none">
            {/* Unified Wallet Pill - Cash Out Button Restored */}
            <div className="flex items-center bg-black/55 border border-white/[0.05] rounded-full p-0.5 shadow-inner">
              <Link 
                href="/store"
                onClick={playClick}
                className="flex items-center gap-2 px-3.5 py-1.5 hover:text-blue-300 transition-colors group"
              >
                <Coins className="w-4 h-4 text-yellow-500 animate-spin-slow group-hover:scale-105 transition-transform" />
                <span className="text-xs font-black text-white font-mono">
                  ${credits.toLocaleString()}
                </span>
              </Link>
              <div className="w-[1px] h-4 bg-white/[0.08] mx-1"></div>
              <button
                onClick={() => { playClick(); setIsCashoutModalOpen(true); }}
                className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white px-3 py-1.5 rounded-full transition-all cursor-pointer border border-transparent"
              >
                {navTranslations[language].cashOut}
              </button>
            </div>

            {/* Profile User Card */}
            <Link
              href="/profile"
              className="hidden sm:flex items-center gap-2 bg-[#12162a]/60 border border-white/[0.04] hover:border-blue-500/30 rounded-full pl-1 pr-3 py-1 transition-all duration-300 group shadow-md shrink-0"
              title={`${username} - VIP Level ${level}`}
            >
              <div className="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-[9px] text-blue-400 uppercase group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all shrink-0">
                {username.slice(0, 2)}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] text-neutral-300 font-bold group-hover:text-white transition-colors">{username}</span>
                <span className="text-[7px] text-blue-400 font-black tracking-wider uppercase mt-1">Lvl {level}</span>
              </div>
            </Link>

            {/* Mobile Actions Drawer trigger */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/[0.05] transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-luxury-border bg-luxury-bg/95 backdrop-blur-xl animate-fade-in absolute w-full left-0 p-5 flex flex-col gap-5 shadow-2xl z-50">
            {/* Mobile Rain Displays */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3.5 bg-black/45 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-500/10 p-1.5 rounded-full text-blue-400">
                    <CloudRain className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider leading-none">{navTranslations[language].rainPool}</span>
                    <span className="text-sm font-black text-white mt-1">${rainPool.toLocaleString()}</span>
                  </div>
                </div>
                <span className="bg-blue-500/15 text-blue-400 text-xs font-black px-2.5 py-1 rounded-lg font-mono">{formatRainTime(rainTimer)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-black/45 border border-amber-500/20 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="bg-amber-500/10 p-1.5 rounded-full text-amber-400">
                    <Sun className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-500 font-black uppercase tracking-wider leading-none">{navTranslations[language].summerRainPool}</span>
                    <span className="text-sm font-black text-amber-400 mt-1">${summerRainPool.toLocaleString()}</span>
                  </div>
                </div>
                <span className="bg-amber-500/15 text-amber-400 text-xs font-black px-2.5 py-1 rounded-lg font-mono">{formatSummerRainTime(summerRainTimer)}</span>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-2">
              {/* Section 1: Casino & Sportsbook */}
              <div className="flex flex-col gap-2">
                {desktopTopLinks.map((link) => {
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isActive
                          ? 'text-white bg-blue-600 border border-blue-500/25 shadow-md shadow-blue-500/10 pl-5'
                          : 'text-neutral-450 hover:text-neutral-200 hover:bg-white/5 pl-4'
                      }`}
                    >
                      <link.icon className="w-4.5 h-4.5" />
                      {link.tooltip}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Divider */}
              <div className="h-[1px] bg-luxury-border/60 my-1" />

              {/* Section 2: Store, Leaderboard, Profile & Favorites */}
              <div className="flex flex-col gap-2">
                {desktopMainLinks.map((link) => {
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isActive
                          ? 'text-white bg-blue-600 border border-blue-500/25 shadow-md shadow-blue-500/10 pl-5'
                          : 'text-neutral-450 hover:text-neutral-200 hover:bg-white/5 pl-4'
                      }`}
                    >
                      <link.icon className="w-4.5 h-4.5" />
                      {link.tooltip}
                    </Link>
                  );
                })}
                
                {/* Favorites trigger on mobile */}
                <button
                  onClick={() => { setMobileMenuOpen(false); setFavoritesOpen(true); }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-450 hover:text-rose-455 hover:bg-white/5 pl-4 cursor-pointer text-left w-full border border-transparent"
                >
                  <Heart className="w-4.5 h-4.5 text-rose-500" />
                  {language === 'en' ? 'Favorites Hub' : 'Điểm Yêu Thích'}
                </button>

                {/* Cash Out trigger on mobile */}
                <button
                  onClick={() => { setMobileMenuOpen(false); setIsCashoutModalOpen(true); }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-450 hover:text-white hover:bg-white/5 pl-4 cursor-pointer text-left w-full border border-transparent"
                >
                  <Coins className="w-4.5 h-4.5 text-yellow-500" />
                  {navTranslations[language].cashOut}
                </button>
              </div>
            </div>

            <hr className="border-luxury-border/60" />

            {/* Audio Settings */}
            <div className="flex flex-col gap-3.5 p-4.5 bg-black/45 border border-white/[0.04] rounded-3xl">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-white/[0.06] pb-2 leading-none block">
                {language === 'en' ? 'Audio & Voice Settings' : 'Cài đặt âm thanh'}
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center font-bold text-[9px] text-neutral-400">
                  <span>{language === 'en' ? 'Volume' : 'Âm lượng'}</span>
                  <span className="text-white font-mono">{volume}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-300">{language === 'en' ? 'Game Sounds' : 'Âm thanh'}</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-300">{language === 'en' ? 'Voice Announcer' : 'Phát thanh viên'}</span>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${voiceEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${voiceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Language Switcher mobile */}
            <div className="flex items-center justify-between text-xs font-bold p-3 bg-black/25 rounded-2xl">
              <span className="text-neutral-400 uppercase tracking-wider">{language === 'en' ? 'Language' : 'Ngôn ngữ'}</span>
              <button
                onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 font-extrabold rounded-lg uppercase tracking-wider"
              >
                {language === 'en' ? 'Việt' : 'English'}
              </button>
            </div>

            {/* Developer options */}
            <button
              onClick={() => {
                if (confirm(navTranslations[language].resetConfirm)) {
                  resetProgress();
                  handleLinkClick();
                }
              }}
              className="flex items-center justify-center gap-1.5 text-[9px] text-red-500 hover:text-red-400 py-3.5 border border-red-500/10 hover:border-red-500/35 rounded-2xl hover:bg-red-500/5 transition-all font-bold uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {navTranslations[language].resetProgress}
            </button>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 4. LIVE SUPPORT CHAT POPUP (Heart Spot reference)        */}
      {/* ======================================================== */}
      {supportOpen && (
        <div className="fixed bottom-6 right-6 w-90 h-112 bg-[#0c1024]/98 border border-luxury-border/70 rounded-3xl shadow-2xl z-50 backdrop-blur-2xl flex flex-col overflow-hidden animate-slide-up select-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
          
          {/* Header */}
          <div className="p-4 bg-[#080a14] border-b border-luxury-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white font-black uppercase tracking-wider">RainMoney Concierge</span>
                <span className="text-[7px] text-emerald-400 font-extrabold uppercase mt-0.5 tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping shrink-0" />
                  Online Support
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSupportOpen(false)} 
              className="text-neutral-500 hover:text-white p-1 hover:bg-white/5 rounded-lg border border-transparent hover:border-luxury-border transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3.5 bg-black/20">
            {supportMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div 
                  className={`px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed font-semibold ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-luxury-surface border border-luxury-border text-neutral-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[7px] text-neutral-550 font-bold uppercase tracking-wider mt-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSupportSubmit} className="p-3 bg-[#080a14] border-t border-luxury-border/60 flex items-center gap-2">
            <input
              type="text"
              value={supportInput}
              onChange={(e) => setSupportInput(e.target.value)}
              placeholder={language === 'en' ? 'Type your message...' : 'Nhập tin nhắn...'}
              className="flex-grow bg-black border border-luxury-border focus:border-blue-500/35 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
            <button 
              type="submit"
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Headset Widget Button in Bottom Right (Matches reference photo) */}
      {!supportOpen && (
        <button
          onClick={() => { playClick(); setSupportOpen(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/10 hover:shadow-blue-500/25 flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 z-40 border border-blue-400/20 group"
          title="Live Concierge Support"
        >
          <Headphones className="w-6 h-6 animate-pulse group-hover:scale-110 transition-transform" />
          {/* Subtle notification red dot */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0c1024] animate-ping pointer-events-none" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0c1024] pointer-events-none" />
        </button>
      )}

      {/* ======================================================== */}
      {/* 5. CASHOUT MODAL                                         */}
      {/* ======================================================== */}
      {isCashoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
          <div className="bg-[#0c1024]/95 border border-luxury-border/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            <div className="p-5 border-b border-luxury-border/60 flex justify-between items-center bg-[#070b14]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{navTranslations[language].virtualCashOut}</h3>
              <button onClick={() => setIsCashoutModalOpen(false)} className="p-1 hover:bg-white/5 border border-transparent hover:border-luxury-border rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex justify-between text-xs font-bold text-neutral-400">
                <span>{navTranslations[language].availableBalance}</span>
                <span className="text-white font-mono">${credits.toLocaleString()}</span>
              </div>

              {cashoutError && (
                <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                  {cashoutError}
                </div>
              )}

              {cashoutSuccess ? (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center animate-bounce">
                     <Coins className="w-8 h-8" />
                  </div>
                  <h4 className="text-emerald-500 font-black uppercase tracking-wider text-sm">{navTranslations[language].cashOutSuccess}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed font-bold">
                    {navTranslations[language].simulatedMsg.replace('{amount}', `$${lastCashoutAmount.toLocaleString()}`)}
                  </p>
                  <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
                    {language === 'en' ? 'Transferred to: ' : 'Đã chuyển tới: '}
                    <span className="text-emerald-400 font-bold">{cashoutDetailsText}</span>
                  </p>
                  <p className="text-[9px] text-neutral-500 border border-luxury-border/50 bg-black/40 p-3 rounded-2xl mt-2 leading-relaxed">
                    {navTranslations[language].disclaimer}
                  </p>
                  <Button variant="gold" size="sm" onClick={() => { setCashoutSuccess(false); setIsCashoutModalOpen(false); }} className="mt-2 text-[10px] uppercase font-black tracking-widest px-6 py-2.5">
                    {navTranslations[language].closeWindow}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">{navTranslations[language].amountToCashOut} ($)</label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-3.5 text-neutral-550 font-extrabold text-sm">$</span>
                      <input
                         type="number"
                         value={cashoutAmount}
                         onChange={(e) => setCashoutAmount(e.target.value)}
                         placeholder="0.00"
                         className="w-full bg-black border border-luxury-border focus:border-red-500/35 rounded-2xl pl-9 pr-24 py-3 text-xs text-white font-extrabold focus:outline-none font-mono"
                      />
                      <button
                        onClick={() => setCashoutAmount(credits.toString())}
                        className="absolute right-2 top-2 px-3 py-1 bg-neutral-900 border border-luxury-border hover:border-neutral-700 text-[9px] text-neutral-400 font-black rounded-lg cursor-pointer uppercase tracking-wider"
                      >
                        {navTranslations[language].max}
                      </button>
                    </div>
                  </div>

                  {/* Select Cryptocurrency */}
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">Select Cryptocurrency</label>
                      <div className="grid grid-cols-5 gap-1.5 font-mono">
                        {[
                          { type: 'BTC', label: 'BTC' },
                          { type: 'LTC', label: 'LTC' },
                          { type: 'ETH', label: 'ETH' },
                          { type: 'USDT', label: 'USDT' },
                          { type: 'DOGE', label: 'DOGE' }
                        ].map((coin) => {
                          const isActive = cryptoType === coin.type;
                          let activeStyle = '';
                          if (coin.type === 'BTC') activeStyle = 'bg-amber-500/10 border-amber-500/40 text-amber-500';
                          else if (coin.type === 'LTC') activeStyle = 'bg-blue-500/10 border-blue-500/40 text-blue-400';
                          else if (coin.type === 'ETH') activeStyle = 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400';
                          else if (coin.type === 'USDT') activeStyle = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
                          else if (coin.type === 'DOGE') activeStyle = 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500';

                          return (
                            <button
                              key={coin.type}
                              type="button"
                              onClick={() => { playClick(); setCryptoType(coin.type as any); }}
                              className={`py-2 rounded-xl text-[9px] font-black border transition-all duration-200 cursor-pointer ${
                                isActive ? activeStyle : 'bg-black/20 border-luxury-border/60 text-neutral-500'
                              }`}
                            >
                              {coin.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">{cryptoType} Destination Wallet Address</label>
                      <input
                        type="text"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        placeholder={`Enter destination ${cryptoType} address`}
                        className="w-full bg-black border border-luxury-border focus:border-amber-500/35 rounded-2xl px-4 py-3 text-xs text-white font-extrabold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <p className="text-[9px] text-neutral-500 leading-relaxed font-semibold">
                    * {navTranslations[language].disclaimer.split('.')[0]}.
                  </p>

                  <Button
                    variant="danger"
                    fullWidth
                    size="lg"
                    onClick={processCashout}
                    className="font-black uppercase tracking-widest text-[10px] py-3 rounded-2xl"
                  >
                    {navTranslations[language].confirmCashOut}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


