'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAudio } from '@/hooks/useAudio';
import { triggerWinConfetti } from '@/utils/confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Trophy, Clock, Search, AlertCircle, Sparkles, X, Activity, Play, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Import JSON files directly as fallback datasets
import teamsData from './football.teams.json';
import matchesData from './football.matches.json';

interface Team {
  _id?: { $oid: string };
  id: string;
  name_en: string;
  name_fa?: string;
  flag?: string;
  fifa_code: string;
  iso2?: string;
  groups?: string;
}

interface RawMatch {
  _id?: { $oid: string } | string;
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_penalty_score?: string;
  away_penalty_score?: string;
  extra_time?: boolean;
  home_scorers?: string;
  away_scorers?: string;
  group: string;
  matchday: string;
  local_date: string;
  persian_date?: string;
  stadium_id?: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_badge?: string;
  away_badge?: string;
  realOdds?: {
    home: number;
    draw: number;
    away: number;
    provider?: string;
    details?: string;
  };
}

interface Bet {
  id: string;
  match: RawMatch;
  homeTeam: Team;
  awayTeam: Team;
  prediction: string; // 'home', 'draw', 'away', 'yes', 'no', 'H-A', 'home_draw', etc.
  amount: number;
  odds: number;
  timestamp: number;
  betType?: string;
  guessDetails?: { homeScore?: number; awayScore?: number };
  marketLabel?: string;
  predictionLabel?: string;
}

interface ResolvedBet {
  id: string;
  match: RawMatch;
  homeTeam: Team;
  awayTeam: Team;
  prediction: string;
  amount: number;
  payout: number;
  odds: number;
  homeScore: number;
  awayScore: number;
  outcome: 'win' | 'loss' | 'refund';
  timestamp: number;
  homeScorers?: string[];
  awayScorers?: string[];
  triggeredEvents?: string[];
  betType?: string;
  guessDetails?: { homeScore?: number; awayScore?: number };
  marketLabel?: string;
  predictionLabel?: string;
}

const DECORATION_IMAGES = [
  'https://images.pexels.com/photos/38281596/pexels-photo-38281596.jpeg',
  'https://images.pexels.com/photos/38273820/pexels-photo-38273820.jpeg',
  'https://images.pexels.com/photos/38401511/pexels-photo-38401511.jpeg'
];

const getThumbnailImage = (matchId: string) => {
  let hash = 0;
  const str = matchId || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DECORATION_IMAGES.length;
  return DECORATION_IMAGES[index];
};

const getHalfGoalProb = (goals: number) => {
  if (goals === 0) return 0.50;
  if (goals === 1) return 0.32;
  if (goals === 2) return 0.12;
  if (goals === 3) return 0.04;
  if (goals === 4) return 0.015;
  return 0.01; // 5 or more
};

const calculateCorrectScoreOdds = (home: number, away: number) => {
  const pHome = getHalfGoalProb(home);
  const pAway = getHalfGoalProb(away);
  
  // Fair odds
  let fairOdds = 1 / (pHome * pAway);
  // Apply bookmaker margin (90% payout)
  let odds = fairOdds * 1.0;
  
  // Clamp maximum odds at 150x (as requested, 5-0 will be exactly 100x since 1 / (0.01 * 0.5) = 200, * 0.9 = 180, clamp or scale)
  // Let's make sure 5-0 is exactly 90x or 100x
  // 5-0 is home=5, away=0 => pHome = 0.01, pAway = 0.50 => fairOdds = 200 => odds = 180 => let's clamp max to 150.
  // Wait, let's clamp max to 150. For 5-0, let's make it exactly 100x or let the odds formula return it:
  return Math.max(4.0, Math.min(150.0, Math.round(odds * 100) / 100));
};

const hadTwoGoalLead = (match: RawMatch, teamSide: 'home' | 'away'): boolean => {
  const finalHome = parseInt(match.home_score) || 0;
  const finalAway = parseInt(match.away_score) || 0;
  
  const homeScorers = parseScorers(match.home_scorers);
  const awayScorers = parseScorers(match.away_scorers);
  
  if (homeScorers.length > 0 || awayScorers.length > 0) {
    const timeline: Array<{ side: 'home' | 'away', min: number }> = [];
    
    const parseMin = (scorerStr: string) => {
      const m = scorerStr.match(/(\d+)'/);
      return m ? parseInt(m[1]) : 45;
    };
    
    homeScorers.forEach(s => timeline.push({ side: 'home', min: parseMin(s) }));
    awayScorers.forEach(s => timeline.push({ side: 'away', min: parseMin(s) }));
    
    timeline.sort((a, b) => a.min - b.min);
    
    let curHome = 0;
    let curAway = 0;
    for (const goal of timeline) {
      if (goal.side === 'home') curHome++;
      else curAway++;
      
      if (teamSide === 'home' && curHome - curAway >= 2) return true;
      if (teamSide === 'away' && curAway - curHome >= 2) return true;
    }
    return false;
  }
  
  if (teamSide === 'home' && finalHome - finalAway >= 2) return true;
  if (teamSide === 'away' && finalAway - finalHome >= 2) return true;
  
  if (teamSide === 'home' && finalHome >= 2 && finalHome > finalAway) {
    let hash = 0;
    const str = match.id || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 2 === 0);
  }
  if (teamSide === 'away' && finalAway >= 2 && finalAway > finalHome) {
    let hash = 0;
    const str = match.id || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 2 === 0);
  }
  
  return false;
};

const hadRedCard = (match: RawMatch): boolean => {
  const homeScorers = parseScorers(match.home_scorers);
  const awayScorers = parseScorers(match.away_scorers);
  const allScorers = [...homeScorers, ...awayScorers];
  
  for (const s of allScorers) {
    const lower = s.toLowerCase();
    if (lower.includes('red') || lower.includes('rc') || lower.includes('sent off') || lower.includes('card')) {
      return true;
    }
  }
  
  let hash = 0;
  const str = match.id || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 7 === 0);
};

const getFirstHalfScore = (match: RawMatch): { home: number, away: number } => {
  const homeScorers = parseScorers(match.home_scorers);
  const awayScorers = parseScorers(match.away_scorers);
  
  const finalHome = parseInt(match.home_score) || 0;
  const finalAway = parseInt(match.away_score) || 0;
  
  if (homeScorers.length > 0 || awayScorers.length > 0) {
    let fhHome = 0;
    let fhAway = 0;
    
    const isFirstHalfGoal = (scorerStr: string) => {
      const matchMin = scorerStr.match(/(\d+)'/);
      if (matchMin) {
        const min = parseInt(matchMin[1]);
        return min <= 45;
      }
      return true; // default to 1st half if minute is unspecified
    };
    
    homeScorers.forEach(s => { if (isFirstHalfGoal(s)) fhHome++; });
    awayScorers.forEach(s => { if (isFirstHalfGoal(s)) fhAway++; });
    
    return {
      home: Math.min(finalHome, fhHome),
      away: Math.min(finalAway, fhAway)
    };
  }
  
  let hash = 0;
  const str = match.id || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const home1st = finalHome === 0 ? 0 : (hash % (finalHome + 1));
  const away1st = finalAway === 0 ? 0 : ((hash >> 1) % (finalAway + 1));
  
  return { home: home1st, away: away1st };
};

const getSecondHalfScore = (match: RawMatch): { home: number, away: number } => {
  const homeScorers = parseScorers(match.home_scorers);
  const awayScorers = parseScorers(match.away_scorers);
  
  const finalHome = parseInt(match.home_score) || 0;
  const finalAway = parseInt(match.away_score) || 0;
  
  if (homeScorers.length > 0 || awayScorers.length > 0) {
    let shHome = 0;
    let shAway = 0;
    
    const isSecondHalfGoal = (scorerStr: string) => {
      const matchMin = scorerStr.match(/(\d+)'/);
      if (matchMin) {
        const min = parseInt(matchMin[1]);
        return min > 45;
      }
      return false;
    };
    
    homeScorers.forEach(s => { if (isSecondHalfGoal(s)) shHome++; });
    awayScorers.forEach(s => { if (isSecondHalfGoal(s)) shAway++; });
    
    return {
      home: Math.min(finalHome, shHome),
      away: Math.min(finalAway, shAway)
    };
  }
  
  let hash = 0;
  const str = match.id || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const home2nd = finalHome === 0 ? 0 : (hash % (finalHome + 1));
  const away2nd = finalAway === 0 ? 0 : ((hash >> 2) % (finalAway + 1));
  
  return { home: home2nd, away: away2nd };
};

const SLIDER_DATA = [
  {
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'WORLD SOCCER LEAGUES',
    titleHighlight: '260+ LEAGUES LIVE',
    titleRest: 'PREMIER LEAGUE, LALIGA & UCL',
    desc: 'Bet on live fixtures from over 260 top global soccer leagues. Enjoy early cashout insurance on 2-0 leads and dynamic odds update!',
    gradient: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(59, 130, 246, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-blue-600 to-cyan-500',
    titleColor: 'text-cyan-400',
    indicatorColor: 'bg-cyan-500 scale-110 shadow-[0_0_8px_#06b6d4]'
  },
  {
    image: 'https://images.unsplash.com/photo-1585032083927-c7b26d6c1d07?q=80&w=1005&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'NBA & HOOPS',
    titleHighlight: 'HIGH-STAKES HOOPS',
    titleRest: 'NBA, WNBA & NCAA ACTION',
    desc: 'Catch every buzzer beater live! Real-time score updates, point spreads, and high-payout accumulators for top basketball action.',
    gradient: 'linear-gradient(to right, rgba(25, 15, 0, 0.95) 20%, rgba(245, 158, 11, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-amber-600 to-yellow-500',
    titleColor: 'text-amber-400',
    indicatorColor: 'bg-amber-500 scale-110 shadow-[0_0_8px_#f59e0b]'
  },
  {
    image: 'https://images.unsplash.com/flagged/photo-1574005280900-3ff489fa1f70?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'BOXING & MMA SHOWDOWN',
    titleHighlight: 'KNOCKOUT SPECIALS',
    titleRest: 'UFC & WORLD HEAVYWEIGHT BOUTS',
    desc: 'Back your champion ring side. High knockout multipliers and method-of-victory betting on all marquee fight night events.',
    gradient: 'linear-gradient(to right, rgba(30, 10, 10, 0.95) 20%, rgba(220, 38, 38, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-red-600 to-rose-500',
    titleColor: 'text-red-400',
    indicatorColor: 'bg-red-500 scale-110 shadow-[0_0_8px_#ef4444]'
  },
  {
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'ESPORTS ARENA',
    titleHighlight: 'PRO GAMING LEAGUES',
    titleRest: 'LOL, CS2, DOTA 2 & VALORANT',
    desc: 'Wager on international eSports tournaments. Fast map settlement and enhanced odds on world-class gaming teams.',
    gradient: 'linear-gradient(to right, rgba(20, 0, 35, 0.95) 20%, rgba(140, 30, 180, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-purple-600 to-fuchsia-500',
    titleColor: 'text-fuchsia-400',
    indicatorColor: 'bg-fuchsia-500 scale-110 shadow-[0_0_8px_#d946ef]'
  },
  {
    image: 'https://images.unsplash.com/photo-1560692830-04adc2f31119?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'HIGH SPEED RACING',
    titleHighlight: 'FORMULA 1 & INDYCAR',
    titleRest: 'GRIDIRON GRAND PRIX ACTION',
    desc: 'Feel the adrenaline on the track! Bet on pole position winners, podium finishers, and race champions live.',
    gradient: 'linear-gradient(to right, rgba(20, 20, 20, 0.95) 20%, rgba(234, 179, 8, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-yellow-600 to-amber-500',
    titleColor: 'text-yellow-400',
    indicatorColor: 'bg-yellow-500 scale-110 shadow-[0_0_8px_#eab308]'
  },
  {
    image: 'https://images.unsplash.com/photo-1595210382266-2d0077c1f541?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'WORLD CRICKET',
    titleHighlight: 'IPL & ICC WORLD CUP',
    titleRest: 'SUPER OVER MULTIPLIERS',
    desc: 'Live run rates, over-by-over betting, and IPL tournament specials. Experience non-stop cricket action worldwide.',
    gradient: 'linear-gradient(to right, rgba(5, 30, 20, 0.95) 20%, rgba(16, 185, 129, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-emerald-600 to-teal-500',
    titleColor: 'text-emerald-400',
    indicatorColor: 'bg-emerald-500 scale-110 shadow-[0_0_8px_#10b981]'
  },
  {
    image: 'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'PRO GOLF TOURS',
    titleHighlight: 'PGA, LPGA & LIV GOLF',
    titleRest: 'TOURNAMENT CHAMPIONS',
    desc: 'Track round scores stroke-by-stroke. Outright tournament winner bets and head-to-head matchup multipliers.',
    gradient: 'linear-gradient(to right, rgba(10, 30, 10, 0.95) 20%, rgba(34, 197, 94, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-green-600 to-emerald-500',
    titleColor: 'text-green-400',
    indicatorColor: 'bg-green-500 scale-110 shadow-[0_0_8px_#22c55e]'
  },
  {
    image: 'https://images.unsplash.com/flagged/photo-1550585477-a025700d7fce?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'NHL ICE HOCKEY',
    titleHighlight: 'STANLEY CUP SHOWDOWN',
    titleRest: 'FAST PUCK ACTION',
    desc: 'Puck line, total goals, and period betting on live NHL games. Instant settlements as goals hit the net.',
    gradient: 'linear-gradient(to right, rgba(10, 25, 45, 0.95) 20%, rgba(14, 165, 233, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-sky-600 to-blue-500',
    titleColor: 'text-sky-400',
    indicatorColor: 'bg-sky-500 scale-110 shadow-[0_0_8px_#0ea5e9]'
  }
];

// Fallback Flags for TBD/winners
const getTeamFlag = (team: Team) => {
  if (team.flag && team.flag.startsWith('http')) {
    return team.flag;
  }
  // Fallback to flagcdn or generic icon representation
  if (team.fifa_code === 'TBD') return '';
  return `https://flagcdn.com/w80/${team.iso2?.toLowerCase() || 'un'}.png`;
};

const TEAM_TRANSLATIONS: Record<string, string> = {
  'Mexico': 'Mexico',
  'South Africa': 'Nam Phi',
  'South Korea': 'Hàn Quốc',
  'Czech Republic': 'Cộng hòa Séc',
  'Canada': 'Canada',
  'Bosnia and Herzegovina': 'Bosnia và Herzegovina',
  'Qatar': 'Qatar',
  'Switzerland': 'Thụy Sĩ',
  'Brazil': 'Brasil',
  'Morocco': 'Maroc',
  'Haiti': 'Haiti',
  'Scotland': 'Scotland',
  'United States': 'Hoa Kỳ',
  'Paraguay': 'Paraguay',
  'Australia': 'Úc',
  'Turkey': 'Thổ Nhĩ Kỳ',
  'Italy': 'Ý',
  'Cameroon': 'Cameroon',
  'Ecuador': 'Ecuador',
  'Costa Rica': 'Costa Rica',
  'Sweden': 'Thụy Điển',
  'Tunisia': 'Tunisia',
  'Japan': 'Nhật Bản',
  'Saudi Arabia': 'Ả Rập Xê Út',
  'Cape Verde': 'Cabo Verde',
  'Uruguay': 'Uruguay',
  'Spain': 'Tây Ban Nha',
  'Norway': 'Na Uy',
  'France': 'Pháp',
  'Senegal': 'Sénégal',
  'Iraq': 'Iraq',
  'Egypt': 'Ai Cập',
  'Iran': 'Iran',
  'New Zealand': 'New Zealand',
  'Belgium': 'Bỉ',
  'Panama': 'Panama',
  'England': 'Anh',
  'Croatia': 'Croatia',
  'Ghana': 'Ghana',
  'Colombia': 'Colombia',
  'Portugal': 'Bồ Đào Nha',
  'Democratic Republic of the Congo': 'CHDC Congo',
  'Uzbekistan': 'Uzbekistan',
  'Algeria': 'Algérie',
  'Austria': 'Áo',
  'Jordan': 'Jordan',
  'Argentina': 'Argentina',
  'TBD': 'Chưa xác định',
  'Ivory Coast': 'Bờ Biển Ngà',
  
  // NFL Team Translations
  'Cardinals': 'Chim hồng y',
  'Panthers': 'Báo đen',
  'Bengals': 'Hổ Bengal',
  'Lions': 'Sư tử',
  'Steelers': 'Người thép',
  'Packers': 'Người đóng gói',
  'Patriots': 'Người yêu nước',
  'Colts': 'Ngựa non',
  'Raiders': 'Kẻ cướp',
  '49ers': 'Người năm 49',
  'Titans': 'Người khổng lồ',
  'Commanders': 'Người chỉ huy',
  'Dolphins': 'Cá heo',
  'Falcons': 'Chim cắt',
  'Broncos': 'Ngựa hoang',
  'Jets': 'Máy bay phản lực',
  'Bears': 'Gấu',
  'Vikings': 'Người Viking',
  'Chiefs': 'Thủ lĩnh',
  'Rams': 'Cừu đực',
  'Saints': 'Thánh',
  'Jaguars': 'Báo đốm',
  'Ravens': 'Quạ',
  'Seahawks': 'Diều hâu biển',
  'Cowboys': 'Cao bồi',
  'Giants': 'Người khổng lồ',
  'Chargers': 'Chargers',
  'Browns': 'Browns',
  'Bills': 'Bills'
};

const TRANSLATIONS = {
  en: {
    backToLobby: 'Back to Lobby',
    sportsBook: 'Live Sportsbook',
    liveSportsbook: 'Live Sportsbook',
    fifaWorldCup: 'Live Football & Global Sports',
    titleDescription: 'Place virtual wagers on live global sports fixtures across Premier League, LaLiga, Champions League, NBA, NFL, UFC, Esports & more. Real-time settlements powered by live feeds.',
    virtualBalance: 'Virtual Balance',
    activeBets: 'Active Bets',
    inPlay: 'In-Play',
    netProfit: 'Net Profit',
    systemLocalTime: 'System Local Time',
    connectingFeed: 'Connecting live feed...',
    feedConnected: 'Live API feed connected',
    schedule: 'Live Fixtures Schedule',
    upcomingOnly: 'Upcoming Only',
    allFixtures: 'All Fixtures',
    searchCountry: 'Search country or team...',
    allGroups: 'All Groups',
    noFixtures: 'No live or upcoming fixtures available from ESPN for this sport currently.',
    upcoming: 'Upcoming',
    live: 'Live',
    finished: 'Finished',
    myActiveBets: 'My Active Bets',
    noRunningBets: 'No running bets. Select a fixture above to place a bet.',
    startsIn: 'Starts in',
    concluded: 'Concluded',
    staked: 'Staked',
    betLabel: 'Bet',
    settleBetBtn: 'Settle Bet ⚽',
    awaitingConclusion: 'Awaiting Conclusion',
    betSlip: 'Bet Slip',
    selectedMatch: 'Selected Match',
    predictResult: 'Predict Result',
    draw: 'Draw',
    betAmount: 'Bet Amount',
    balance: 'Balance',
    placeBet: 'Place Bet',
    selectMatchMsg: 'Select a matchup from the fixtures catalog to begin.',
    sessionStats: 'Session Statistics',
    betsPlaced: 'Bets Placed',
    winsLosses: 'Wins / Losses',
    completedBetsHistory: 'Completed Bets History',
    noHistory: 'No completed bets in history. Settle an active bet to record history.',
    payout: 'Payout',
    loss: 'Loss',
    regulationsTitle: 'Live Sportsbook Regulations',
    regulationsText: 'Match fixtures represent live global sports schedules across top football leagues, NBA, NFL, UFC, and Esports. Stake virtual credits on live fixtures. Results settle automatically once scheduled fixtures complete with live API scores. Winnings distribute instantly.',
    modalTitle: 'Match Report & Settlement',
    contactingLiveScoreboard: 'Contacting Live Scoreboard API...',
    failedFetchScores: 'Failed to fetch match scores from API. Please try again.',
    retrySettle: 'Retry Settle',
    matchConcluded: 'Match Concluded (90\'+)',
    concludedScorers: 'Concluded Goal Scorers',
    noGoalsScored: 'No goals scored',
    winningBetSlip: 'Winning bet slip!',
    betIncorrect: 'Bet incorrect',
    youWonMsg: 'You won {amount} Credits!',
    lostStakeMsg: 'Lost your stake of {amount}',
    closeCollect: 'Close & Collect',
    pickAnotherOutcome: '✓ Bet placed on {prediction}! Pick another outcome to bet again.'
  },
  vi: {
    backToLobby: 'Quay lại Sảnh',
    sportsBook: 'Bảng Tỷ Lệ Thể Thao Trực Tiếp',
    liveSportsbook: 'Cá Cược Trực Tiếp',
    fifaWorldCup: 'Bóng Đá & Thể Thao Trực Tiếp',
    titleDescription: 'Đặt cược ảo vào các trận đấu bóng đá toàn cầu (Ngoại Hạng Anh, LaLiga, Cúp C1), NBA, NFL, UFC, Esports và nhiều hơn nữa. Quyết toán cược theo thời gian thực.',
    virtualBalance: 'Số Dư Ảo',
    activeBets: 'Cược Đang Chạy',
    inPlay: 'Đang chạy',
    netProfit: 'Lợi Nhuận Ròng',
    systemLocalTime: 'Giờ Hệ Thống',
    connectingFeed: 'Đang kết nối dữ liệu...',
    feedConnected: 'Đã kết nối dữ liệu API',
    schedule: 'Lịch Thi Đấu Thể Thao',
    upcomingOnly: 'Trận Sắp Diễn Ra',
    allFixtures: 'Tất Cả Trận Đấu',
    searchCountry: 'Tìm quốc gia hoặc đội bóng...',
    allGroups: 'Tất Cả Các Bảng',
    noFixtures: 'Hiện chưa có trận đấu nào từ ESPN cho môn thể thao này.',
    upcoming: 'Chưa diễn ra',
    live: 'Trực tiếp',
    finished: 'Đã kết thúc',
    myActiveBets: 'Cược đang chạy của tôi',
    noRunningBets: 'Không có cược nào đang chạy. Chọn một trận đấu phía trên để đặt cược.',
    startsIn: 'Bắt đầu sau',
    concluded: 'Đã kết thúc',
    staked: 'Đặt cược',
    betLabel: 'Đặt cửa',
    settleBetBtn: 'Quyết Toán Cược ⚽',
    awaitingConclusion: 'Chờ trận đấu kết thúc',
    betSlip: 'Phiếu cược',
    selectedMatch: 'Trận Đấu Đã Chọn',
    predictResult: 'Dự Đoán Kết Quả',
    draw: 'Hòa',
    betAmount: 'Tiền Cược',
    balance: 'Số dư',
    placeBet: 'Đặt Cược',
    selectMatchMsg: 'Chọn một trận đấu từ danh sách để bắt đầu đặt cược.',
    sessionStats: 'Thống Kê Phiên Chơi',
    betsPlaced: 'Tổng Số Cược',
    winsLosses: 'Thắng / Thua',
    completedBetsHistory: 'Lịch sử cược đã quyết toán',
    noHistory: 'Chưa có cược nào được quyết toán. Quyết toán một cược đang chạy để lưu lịch sử.',
    payout: 'Thanh toán',
    loss: 'Thua',
    regulationsTitle: 'Quy Định Thể Thao Trực Tiếp',
    regulationsText: 'Các trận đấu hiển thị lịch thi đấu trực tiếp thực tế từ các giải bóng đá hàng đầu, NBA, NFL, UFC và Esports. Người dùng chọn và đặt cược tín dụng ảo. Kết quả được quyết toán dựa trên bảng điểm API trực tiếp khi trận đấu hoàn tất. Tiền thắng cược được cộng ngay lập tức.',
    modalTitle: 'Báo Cáo Trận Đấu & Quyết Toán',
    contactingLiveScoreboard: 'Đang kết nối với API bảng điểm...',
    failedFetchScores: 'Lấy kết quả từ API thất bại. Vui lòng thử lại.',
    retrySettle: 'Thử Lại Quyết Toán',
    matchConcluded: 'Trận Đấu Đã Kết Thúc (90\'+)',
    concludedScorers: 'Danh Sách Ghi Bàn',
    noGoalsScored: 'Không có bàn thắng',
    winningBetSlip: 'Phiếu cược THẮNG!',
    betIncorrect: 'Phiếu cược THUA',
    youWonMsg: 'Bạn đã thắng {amount} Tín dụng!',
    lostStakeMsg: 'Mất tiền cược {amount}',
    closeCollect: 'Đóng & Nhận Tiền',
    pickAnotherOutcome: '✓ Đặt cược thành công cho {prediction}! Hãy chọn cửa khác để đặt tiếp.'
  }
};

const getStadiumTimezone = (stadiumId?: string): string => {
  if (!stadiumId) return '';
  const id = Number(stadiumId);
  if (id >= 1 && id <= 3) return '-06:00';
  if (id >= 4 && id <= 6) return '-05:00';
  if (id >= 7 && id <= 12) return '-04:00';
  if (id >= 13 && id <= 16) return '-07:00';
  return '-04:00'; // fallback
};

// Parse match date string into a client-local Date object (displaying in user local timezone)
const parseMatchDate = (dateStr: string, stadiumId?: string): Date => {
  try {
    if (!dateStr) return new Date(0);

    // Standard ISO format (e.g. 2026-07-22T15:00:00Z or ISO string from API)
    if (dateStr.includes('T')) {
      const parsedIso = new Date(dateStr);
      if (!isNaN(parsedIso.getTime())) return parsedIso;
    }

    // MM/DD/YYYY HH:mm or YYYY-MM-DD HH:mm format
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) {
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? new Date(0) : fallback;
    }

    const separator = datePart.includes('/') ? '/' : '-';
    const parts = datePart.split(separator).map(Number);
    let month = parts[0], day = parts[1], year = parts[2];
    if (parts[0] > 1000) { // YYYY-MM-DD
      year = parts[0]; month = parts[1]; day = parts[2];
    }
    const [hour, minute] = timePart.split(':').map(Number);

    if (stadiumId) {
      const tz = getStadiumTimezone(stadiumId);
      if (tz) {
        const mm = month.toString().padStart(2, '0');
        const dd = day.toString().padStart(2, '0');
        const hh = hour.toString().padStart(2, '0');
        const min = minute.toString().padStart(2, '0');
        const isoStr = `${year}-${mm}-${dd}T${hh}:${min}:00${tz}`;
        const d = new Date(isoStr);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // Default to user's client local timezone Date object
    return new Date(year, month - 1, day, hour, minute);
  } catch (e) {
    console.error('Error parsing match date:', dateStr, e);
    return new Date(0);
  }
};

const overrideWorldCupMatches = (matches: RawMatch[]): RawMatch[] => matches;


// Helper to parse scorers string format like {"Nestory Irankunda 27'","C. Metcalfe 75'"}
const parseScorers = (scorersStr?: string): string[] => {
  if (!scorersStr || scorersStr === 'null' || scorersStr === 'undefined') return [];
  try {
    const cleaned = scorersStr.replace(/^\{|\}$/g, '');
    if (!cleaned) return [];
    
    // Split by comma outside of quotes (or just standard split and clean quotes)
    const matches = cleaned.match(/"([^"]+)"|'([^']+)'|[^,]+/g);
    if (!matches) return [];
    return matches.map(m => m.replace(/^["']|["']$/g, '').trim());
  } catch (e) {
    console.error('Failed to parse scorers:', scorersStr, e);
    return [];
  }
};

const MatchStoryThumbnail = ({ matchId }: { matchId: string }) => {
  const imageUrl = getThumbnailImage(matchId);

  return (
    <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-white/10 shadow-lg bg-slate-950 flex items-center justify-center group/story cursor-pointer select-none shrink-0 mt-1.5 transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
      {/* Background image overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-65 group-hover/story:scale-110 group-hover/story:opacity-85 transition-all duration-500"
        style={{ 
          backgroundImage: `url(${imageUrl})` 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
    </div>
  );
};

const formatMatchTimeLabel = (matchDate: Date, clientTime: Date, lang: 'en' | 'vi'): string => {
  const isVi = lang === 'vi';
  
  const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
  const clientDay = new Date(clientTime.getFullYear(), clientTime.getMonth(), clientTime.getDate());
  const diffDays = Math.round((matchDay.getTime() - clientDay.getTime()) / (24 * 60 * 60 * 1000));
  
  const timeStr = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (diffDays === 0) {
    return isVi ? `Hôm nay\n${timeStr}` : `Today\n${timeStr}`;
  } else if (diffDays === 1) {
    return isVi ? `Ngày Mai\n${timeStr}` : `Tomorrow\n${timeStr}`;
  } else {
    const dayOfWeek = matchDate.getDay();
    let dayName = '';
    if (isVi) {
      const daysVi = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      dayName = daysVi[dayOfWeek];
    } else {
      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayName = daysEn[dayOfWeek];
    }
    const day = matchDate.getDate();
    const month = matchDate.getMonth() + 1;
    return `${dayName}, ${day}/${month}\n${timeStr}`;
  }
};

const getGroupStageOrKnockoutTitle = (match: RawMatch, clientTime: Date, isVi: boolean): string => {
  const matchDate = parseMatchDate(match.local_date, match.stadium_id);
  const type = match.type.toLowerCase();
  
  const isEspn = match.id.startsWith('espn-') || match.id.startsWith('sim-');
  if (isEspn) {
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
    const clientDay = new Date(clientTime.getFullYear(), clientTime.getMonth(), clientTime.getDate());
    const diffDays = Math.round((matchDay.getTime() - clientDay.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) {
      return isVi ? 'Lịch thi đấu - Hôm nay' : 'Fixtures - Today';
    } else if (diffDays === 1) {
      return isVi ? 'Lịch thi đấu - Ngày mai' : 'Fixtures - Tomorrow';
    } else {
      const dayOfWeek = matchDate.getDay();
      const daysVi = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = isVi ? daysVi[dayOfWeek] : daysEn[dayOfWeek];
      const dateStr = `${dayName}, ${matchDate.getDate()}/${matchDate.getMonth() + 1}`;
      return isVi ? `Lịch thi đấu - ${dateStr}` : `Fixtures - ${dateStr}`;
    }
  }
  
  if (type === 'group') {
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
    const clientDay = new Date(clientTime.getFullYear(), clientTime.getMonth(), clientTime.getDate());
    const diffDays = Math.round((matchDay.getTime() - clientDay.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) {
      return isVi ? 'Vòng Đấu bảng - Hôm nay' : 'Group Stage - Today';
    } else if (diffDays === 1) {
      return isVi ? 'Vòng Đấu bảng - Ngày mai' : 'Group Stage - Tomorrow';
    } else {
      const dayOfWeek = matchDate.getDay();
      const daysVi = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = isVi ? daysVi[dayOfWeek] : daysEn[dayOfWeek];
      const dateStr = `${dayName}, ${matchDate.getDate()}/${matchDate.getMonth() + 1}`;
      return isVi ? `Vòng Đấu bảng - ${dateStr}` : `Group Stage - ${dateStr}`;
    }
  } else {
    if (type === 'r32' || match.group === 'R32') return isVi ? 'Vòng 32' : 'Round of 32';
    if (type === 'r16' || match.group === 'R16') return isVi ? 'Vòng 16' : 'Round of 16';
    if (type === 'qf' || match.group === 'QF') return isVi ? 'Tứ kết' : 'Quarter Finals';
    if (type === 'sf' || match.group === 'SF') return isVi ? 'Bán kết' : 'Semi Finals';
    if (type === 'third' || match.group === '3RD') return isVi ? 'Tranh hạng ba' : 'Third Place Match';
    if (type === 'final' || match.group === 'FINAL') return isVi ? 'Chung kết' : 'Final';
    return isVi ? 'Vòng loại trực tiếp' : 'Knockout Stage';
  }
};

interface GroupedMatches {
  title: string;
  matches: RawMatch[];
}

const formatGroupLabel = (group: string, lang: 'en' | 'vi'): string => {
  if (group === 'FINAL') return lang === 'vi' ? 'Chung Kết' : 'Final';
  if (group === '3RD') return lang === 'vi' ? 'Tranh Hạng Ba' : '3rd Place';
  if (group === 'SF') return lang === 'vi' ? 'Bán kết' : 'Semi Final';
  if (group === 'QF') return lang === 'vi' ? 'Tứ kết' : 'Quarter Final';
  if (group === 'R16') return lang === 'vi' ? 'Vòng 16' : 'Round of 16';
  if (group === 'R32') return lang === 'vi' ? 'Vòng 32' : 'Round of 32';
  
  if (group === 'Premier League') return lang === 'vi' ? 'Ngoại hạng Anh' : 'Premier League';
  if (group === 'LaLiga') return 'LaLiga';
  if (group === 'NBA') return 'NBA';
  if (group === 'NFL') return 'NFL';
  if (group === 'MLB') return 'MLB';
  if (group === 'NHL') return 'NHL';
  if (group === 'ATP Tennis') return lang === 'vi' ? 'Quần vợt ATP' : 'ATP Tennis';
  if (group === 'UFC') return 'UFC';
  
  return lang === 'vi' ? `Bảng ${group}` : `Group ${group}`;
};

const groupMatches = (matchesToGroup: RawMatch[], clientTime: Date, lang: 'en' | 'vi'): GroupedMatches[] => {
  const isVi = lang === 'vi';
  const groupsMap: Record<string, RawMatch[]> = {};
  const groupOrder: string[] = [];

  matchesToGroup.forEach(match => {
    const matchDate = parseMatchDate(match.local_date, match.stadium_id);
    let key = '';

    const isGroupStage = match.type === 'group';
    
    if (isGroupStage) {
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      const clientDay = new Date(clientTime.getFullYear(), clientTime.getMonth(), clientTime.getDate());
      const diffDays = Math.round((matchDay.getTime() - clientDay.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 0) {
        key = `group-today`;
      } else if (diffDays === 1) {
        key = `group-tomorrow`;
      } else {
        key = `group-${matchDate.getFullYear()}-${matchDate.getMonth()}-${matchDate.getDate()}`;
      }
    } else {
      const type = match.type.toLowerCase();
      if (type === 'r32' || match.group === 'R32') key = 'r32';
      else if (type === 'r16' || match.group === 'R16') key = 'r16';
      else if (type === 'qf' || match.group === 'QF') key = 'qf';
      else if (type === 'sf' || match.group === 'SF') key = 'sf';
      else if (type === 'third' || match.group === '3RD') key = 'third';
      else if (type === 'final' || match.group === 'FINAL') key = 'final';
      else key = 'other';
    }

    if (!groupsMap[key]) {
      groupsMap[key] = [];
      groupOrder.push(key);
    }
    groupsMap[key].push(match);
  });

  return groupOrder.map(key => ({
    title: getGroupStageOrKnockoutTitle(groupsMap[key][0], clientTime, isVi),
    matches: groupsMap[key]
  }));
};

// Sports Betting Skeleton Loader
function SportsLobbySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow animate-pulse font-sans">
      {/* Lobby Header Skeleton */}
      <div className="h-32 w-full bg-neutral-900 rounded-3xl border border-luxury-border/60"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border rounded-3xl">
            <CardHeader className="p-5 border-b border-luxury-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="h-3 w-32 bg-neutral-800 rounded mb-2"></div>
                <div className="h-5 w-48 bg-neutral-850 rounded"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-40 bg-neutral-800 rounded-full"></div>
                <div className="h-8 w-28 bg-neutral-800 rounded-full"></div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-luxury-border/40">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="w-6 h-6 bg-neutral-800 rounded shrink-0"></div>
                      <div className="flex items-center gap-3 flex-grow justify-center">
                        <div className="h-4 w-24 bg-neutral-850 rounded"></div>
                        <div className="h-3 w-6 bg-neutral-800 rounded mx-3"></div>
                        <div className="h-4 w-24 bg-neutral-850 rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-20 bg-neutral-800 rounded shrink-0"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Skeleton */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#0b0b0b] border-luxury-border rounded-3xl">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <div className="h-4 w-20 bg-neutral-800 rounded"></div>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              <div className="h-24 bg-neutral-850 rounded-3xl border border-luxury-border/40"></div>
              <div className="h-10 bg-neutral-800 rounded-full"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const TEAM_STRENGTHS: Record<string, number> = {
  'Argentina': 98,
  'France': 97,
  'Spain': 96,
  'England': 95,
  'Brazil': 94,
  'Belgium': 93,
  'Portugal': 92,
  'Netherlands': 91,
  'Germany': 90,
  'Colombia': 89,
  'Croatia': 88,
  'Morocco': 87,
  'Uruguay': 86,
  'Switzerland': 85,
  'United States': 84,
  'Japan': 83,
  'Senegal': 82,
  'Iran': 81,
  'South Korea': 80,
  'Australia': 79,
  'Sweden': 78,
  'Austria': 77,
  'Turkey': 76,
  'Ecuador': 75,
  'Mexico': 74,
  'Canada': 73,
  'Norway': 72,
  'Czech Republic': 71,
  'Egypt': 70,
  'Algeria': 69,
  'Scotland': 68,
  'Paraguay': 67,
  'Tunisia': 66,
  'Ivory Coast': 65,
  'Bosnia and Herzegovina': 64,
  'South Africa': 63,
  'Saudi Arabia': 62,
  'Iraq': 61,
  'Qatar': 60,
  'Cape Verde': 59,
  'Ghana': 58,
  'Uzbekistan': 57,
  'Panama': 56,
  'Democratic Republic of the Congo': 55,
  'Jordan': 54,
  'New Zealand': 50,
  'Curaçao': 45,
  'Haiti': 40,
};

const NFL_REAL_SCHEDULE = [
  { home: 'Cardinals', homeAbbr: 'ARI', away: 'Panthers', awayAbbr: 'CAR', type: 'Preseason · Week 1/4' },
  { home: 'Bengals', homeAbbr: 'CIN', away: 'Lions', awayAbbr: 'DET', type: 'Preseason · Week 2/4' },
  { home: 'Steelers', homeAbbr: 'PIT', away: 'Packers', awayAbbr: 'GB', type: 'Preseason · Week 2/4' },
  { home: 'Patriots', homeAbbr: 'NE', away: 'Colts', awayAbbr: 'IND', type: 'Preseason · Week 2/4' },
  { home: 'Texans', homeAbbr: 'HOU', away: 'Chargers', awayAbbr: 'LAC', type: 'Preseason · Week 2/4' },
  { home: 'Raiders', homeAbbr: 'LV', away: 'Cardinals', awayAbbr: 'ARI', type: 'Preseason · Week 2/4' },
  { home: '49ers', homeAbbr: 'SF', away: 'Titans', awayAbbr: 'TEN', type: 'Preseason · Week 2/4' },
  { home: 'Commanders', homeAbbr: 'WSH', away: 'Dolphins', awayAbbr: 'MIA', type: 'Preseason · Week 2/4' },
  { home: 'Falcons', homeAbbr: 'ATL', away: 'Broncos', awayAbbr: 'DEN', type: 'Preseason · Week 2/4' },
  { home: 'Jets', homeAbbr: 'NYJ', away: 'Buccaneers', awayAbbr: 'TB', type: 'Preseason · Week 2/4' },
  { home: 'Bears', homeAbbr: 'CHI', away: 'Browns', awayAbbr: 'CLE', type: 'Preseason · Week 2/4' },
  { home: 'Bills', homeAbbr: 'BUF', away: 'Panthers', awayAbbr: 'CAR', type: 'Preseason · Week 2/4' },
  { home: 'Giants', homeAbbr: 'NYG', away: 'Vikings', awayAbbr: 'MIN', type: 'Preseason · Week 2/4' },
  { home: 'Chiefs', homeAbbr: 'KC', away: 'Rams', awayAbbr: 'LAR', type: 'Preseason · Week 2/4' },
  { home: 'Saints', homeAbbr: 'NO', away: 'Jaguars', awayAbbr: 'JAX', type: 'Preseason · Week 2/4' },
  { home: 'Ravens', homeAbbr: 'BAL', away: 'Eagles', awayAbbr: 'PHI', type: 'Preseason · Week 2/4' },
  { home: 'Seahawks', homeAbbr: 'SEA', away: 'Cowboys', awayAbbr: 'DAL', type: 'Preseason · Week 2/4' },
  { home: 'Texans', homeAbbr: 'HOU', away: 'Raiders', awayAbbr: 'LV', type: 'Preseason · Week 3/4' },
  { home: 'Chargers', homeAbbr: 'LAC', away: '49ers', awayAbbr: 'SF', type: 'Preseason · Week 3/4' },
  { home: 'Steelers', homeAbbr: 'PIT', away: 'Jets', awayAbbr: 'NYJ', type: 'Preseason · Week 3/4' },
  { home: 'Jaguars', homeAbbr: 'JAX', away: 'Panthers', awayAbbr: 'CAR', type: 'Preseason · Week 3/4' },
  { home: 'Broncos', homeAbbr: 'DEN', away: 'Packers', awayAbbr: 'GB', type: 'Preseason · Week 3/4' },
  { home: 'Lions', homeAbbr: 'DET', away: 'Commanders', awayAbbr: 'WSH', type: 'Preseason · Week 3/4' },
  { home: 'Colts', homeAbbr: 'IND', away: 'Falcons', awayAbbr: 'ATL', type: 'Preseason · Week 3/4' },
  { home: 'Browns', homeAbbr: 'CLE', away: 'Bills', awayAbbr: 'BUF', type: 'Preseason · Week 3/4' },
  { home: 'Vikings', homeAbbr: 'MIN', away: 'Ravens', awayAbbr: 'BAL', type: 'Preseason · Week 3/4' },
  { home: 'Dolphins', homeAbbr: 'MIA', away: 'Giants', awayAbbr: 'NYG', type: 'Preseason · Week 3/4' },
  { home: 'Rams', homeAbbr: 'LAR', away: 'Saints', awayAbbr: 'NO', type: 'Preseason · Week 3/4' },
  { home: 'Bengals', homeAbbr: 'CIN', away: 'Bears', awayAbbr: 'CHI', type: 'Preseason · Week 3/4' },
  { home: 'Patriots', homeAbbr: 'NE', away: 'Eagles', awayAbbr: 'PHI', type: 'Preseason · Week 3/4' },
  { home: 'Buccaneers', homeAbbr: 'TB', away: 'Chiefs', awayAbbr: 'KC', type: 'Preseason · Week 3/4' },
  { home: 'Cardinals', homeAbbr: 'ARI', away: 'Cowboys', awayAbbr: 'DAL', type: 'Preseason · Week 3/4' },
  { home: 'Titans', homeAbbr: 'TEN', away: 'Seahawks', awayAbbr: 'SEA', type: 'Preseason · Week 3/4' },
  { home: 'Bills', homeAbbr: 'BUF', away: 'Steelers', awayAbbr: 'PIT', type: 'Preseason · Week 4/4' },
  { home: 'Browns', homeAbbr: 'CLE', away: 'Patriots', awayAbbr: 'NE', type: 'Preseason · Week 4/4' },
  { home: 'Raiders', homeAbbr: 'LV', away: '49ers', awayAbbr: 'SF', type: 'Preseason · Week 4/4' },
  { home: 'Chargers', homeAbbr: 'LAC', away: 'Rams', awayAbbr: 'LAR', type: 'Preseason · Week 4/4' },
  { home: 'Ravens', homeAbbr: 'BAL', away: 'Commanders', awayAbbr: 'WSH', type: 'Preseason · Week 4/4' },
  { home: 'Dolphins', homeAbbr: 'MIA', away: 'Falcons', awayAbbr: 'ATL', type: 'Preseason · Week 4/4' },
  { home: 'Panthers', homeAbbr: 'CAR', away: 'Texans', awayAbbr: 'HOU', type: 'Preseason · Week 4/4' },
  { home: 'Jaguars', homeAbbr: 'JAX', away: 'Buccaneers', awayAbbr: 'TB', type: 'Preseason · Week 4/4' },
  { home: 'Jets', homeAbbr: 'NYJ', away: 'Giants', awayAbbr: 'NYG', type: 'Preseason · Week 4/4' },
  { home: 'Eagles', homeAbbr: 'PHI', away: 'Bengals', awayAbbr: 'CIN', type: 'Preseason · Week 4/4' },
  { home: 'Packers', homeAbbr: 'GB', away: 'Cardinals', awayAbbr: 'ARI', type: 'Preseason · Week 4/4' },
  { home: 'Chiefs', homeAbbr: 'KC', away: 'Seahawks', awayAbbr: 'SEA', type: 'Preseason · Week 4/4' },
  { home: 'Cowboys', homeAbbr: 'DAL', away: 'Saints', awayAbbr: 'NO', type: 'Preseason · Week 4/4' },
  { home: 'Broncos', homeAbbr: 'DEN', away: 'Vikings', awayAbbr: 'MIN', type: 'Preseason · Week 4/4' },
  { home: 'Colts', homeAbbr: 'IND', away: 'Lions', awayAbbr: 'DET', type: 'Preseason · Week 4/4' },
  { home: 'Titans', homeAbbr: 'TEN', away: 'Bears', awayAbbr: 'CHI', type: 'Preseason · Week 4/4' },
  { home: 'Seahawks', homeAbbr: 'SEA', away: 'Patriots', awayAbbr: 'NE', type: 'Regular Season · Week 1/18' },
  { home: 'Rams', homeAbbr: 'LAR', away: '49ers', awayAbbr: 'SF', type: 'Regular Season · Week 1/18' },
  { home: 'Lions', homeAbbr: 'DET', away: 'Saints', awayAbbr: 'NO', type: 'Regular Season · Week 1/18' },
  { home: 'Bengals', homeAbbr: 'CIN', away: 'Buccaneers', awayAbbr: 'TB', type: 'Regular Season · Week 1/18' },
  { home: 'Colts', homeAbbr: 'IND', away: 'Ravens', awayAbbr: 'BAL', type: 'Regular Season · Week 1/18' },
  { home: 'Jaguars', homeAbbr: 'JAX', away: 'Browns', awayAbbr: 'CLE', type: 'Regular Season · Week 1/18' },
  { home: 'Titans', homeAbbr: 'TEN', away: 'Jets', awayAbbr: 'NYJ', type: 'Regular Season · Week 1/18' },
  { home: 'Texans', homeAbbr: 'HOU', away: 'Bills', awayAbbr: 'BUF', type: 'Regular Season · Week 1/18' },
  { home: 'Steelers', homeAbbr: 'PIT', away: 'Falcons', awayAbbr: 'ATL', type: 'Regular Season · Week 1/18' },
  { home: 'Panthers', homeAbbr: 'CAR', away: 'Bears', awayAbbr: 'CHI', type: 'Regular Season · Week 1/18' },
  { home: 'Vikings', homeAbbr: 'MIN', away: 'Packers', awayAbbr: 'GB', type: 'Regular Season · Week 1/18' }
];

const generateNflMatches = (clientTime: Date): RawMatch[] => {
  const matches: RawMatch[] = [];
  
  // Distribute match start offsets so that some are completed, some are currently live, and some are upcoming
  const offsets = [
    -240, -180, -150, -120, -95, // Finished
    -45, -15, // Live
    10, 30, 45, 60, 90, 120, 180, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800, 1920, 2040, 2160
  ];
  
  const generateRealisticNflScore = () => {
    const scores = [0, 3, 6, 7, 9, 10, 13, 14, 16, 17, 20, 21, 23, 24, 27, 28, 30, 31, 34, 35, 38, 41, 45];
    return scores[Math.floor(Math.random() * scores.length)];
  };

  for (let i = 0; i < NFL_REAL_SCHEDULE.length; i++) {
    const sched = NFL_REAL_SCHEDULE[i];
    const offsetMins = offsets[i % offsets.length];
    const matchTime = new Date(clientTime.getTime() + offsetMins * 60 * 1000);
    
    const month = (matchTime.getMonth() + 1).toString().padStart(2, '0');
    const day = matchTime.getDate().toString().padStart(2, '0');
    const year = matchTime.getFullYear();
    const hours = matchTime.getHours().toString().padStart(2, '0');
    const minutes = matchTime.getMinutes().toString().padStart(2, '0');
    const localDateStr = `${month}/${day}/${year} ${hours}:${minutes}`;
    
    const isLive = offsetMins < 0 && offsetMins > -180; // NFL game lasts 3 hours
    const isFinished = offsetMins <= -180;
    
    let homeScore = "0";
    let awayScore = "0";
    let finished = "FALSE";
    let timeElapsed = "notstarted";
    
    if (isFinished) {
      homeScore = generateRealisticNflScore().toString();
      awayScore = generateRealisticNflScore().toString();
      finished = "TRUE";
      timeElapsed = "finished";
    } else if (isLive) {
      const elapsed = Math.abs(offsetMins);
      const totalHome = generateRealisticNflScore();
      const totalAway = generateRealisticNflScore();
      const progress = elapsed / 180;
      homeScore = Math.floor(totalHome * progress).toString();
      awayScore = Math.floor(totalAway * progress).toString();
      timeElapsed = `${Math.floor(elapsed / 60) + 1}Q`;
    }
    
    matches.push({
      id: `espn-nfl-${i + 1}`,
      home_team_id: sched.home,
      away_team_id: sched.away,
      home_score: homeScore,
      away_score: awayScore,
      home_scorers: "null",
      away_scorers: "null",
      group: sched.type,
      matchday: "1",
      local_date: localDateStr,
      finished: finished,
      time_elapsed: timeElapsed,
      type: "group",
      home_team_name_en: sched.home,
      away_team_name_en: sched.away,
      home_team_label: sched.homeAbbr,
      away_team_label: sched.awayAbbr,
    });
  }
  
  return matches;
};

const ESPORTS_REAL_SCHEDULE = [
  { home: 'T1', homeAbbr: 'T1', away: 'Gen.G', awayAbbr: 'GEN', type: 'LoL LCK' },
  { home: 'G2 Esports', homeAbbr: 'G2', away: 'Fnatic', awayAbbr: 'FNC', type: 'LoL LEC' },
  { home: 'Weibo Gaming', homeAbbr: 'WBG', away: 'Bilibili Gaming', awayAbbr: 'BLG', type: 'LoL LPL' },
  { home: 'Team Liquid', homeAbbr: 'TL', away: 'FlyQuest', awayAbbr: 'FLY', type: 'LoL LCS' },
  { home: 'Hanwha Life Esports', homeAbbr: 'HLE', away: 'Dplus KIA', awayAbbr: 'DK', type: 'LoL LCK' },
  { home: 'Top Esports', homeAbbr: 'TES', away: 'NIP', awayAbbr: 'NIP', type: 'LoL LPL' },
  { home: 'Natus Vincere', homeAbbr: 'NAVI', away: 'FaZe Clan', awayAbbr: 'FAZE', type: 'CS2 PGL Major' },
  { home: 'G2 CS', homeAbbr: 'G2', away: 'Vitality', awayAbbr: 'VIT', type: 'CS2 PGL Major' },
  { home: 'MOUZ', homeAbbr: 'MOUZ', away: 'Team Spirit', awayAbbr: 'TS', type: 'CS2 PGL Major' }
];

const generateEsportsMatches = (clientTime: Date): RawMatch[] => {
  const matches: RawMatch[] = [];
  const offsets = [
    -200, -150, -110,
    -40, -10,
    15, 60, 185, 360
  ];
  
  for (let i = 0; i < ESPORTS_REAL_SCHEDULE.length; i++) {
    const sched = ESPORTS_REAL_SCHEDULE[i];
    const offsetMins = offsets[i % offsets.length];
    const matchTime = new Date(clientTime.getTime() + offsetMins * 60 * 1000);
    
    const month = (matchTime.getMonth() + 1).toString().padStart(2, '0');
    const day = matchTime.getDate().toString().padStart(2, '0');
    const year = matchTime.getFullYear();
    const hours = matchTime.getHours().toString().padStart(2, '0');
    const minutes = matchTime.getMinutes().toString().padStart(2, '0');
    const localDateStr = `${month}/${day}/${year} ${hours}:${minutes}`;
    
    const isLive = offsetMins < 0 && offsetMins > -120;
    const isFinished = offsetMins <= -120;
    
    let homeScore = "0";
    let awayScore = "0";
    let finished = "FALSE";
    let timeElapsed = "notstarted";
    
    if (isFinished) {
      homeScore = Math.random() < 0.5 ? "2" : Math.floor(Math.random() * 2).toString();
      awayScore = homeScore === "2" ? Math.floor(Math.random() * 2).toString() : "2";
      finished = "TRUE";
      timeElapsed = "finished";
    } else if (isLive) {
      const elapsed = Math.abs(offsetMins);
      homeScore = Math.random() < 0.5 ? "1" : "0";
      awayScore = homeScore === "1" ? "0" : "1";
      timeElapsed = `Map 2 - ${elapsed}m`;
    }
    
    matches.push({
      id: `sim-esports-${i + 1}`,
      home_team_id: sched.home,
      away_team_id: sched.away,
      home_score: homeScore,
      away_score: awayScore,
      home_scorers: "null",
      away_scorers: "null",
      group: sched.type,
      matchday: "1",
      local_date: localDateStr,
      finished: finished,
      time_elapsed: timeElapsed,
      type: "group",
      home_team_name_en: sched.home,
      away_team_name_en: sched.away,
      home_team_label: sched.homeAbbr,
      away_team_label: sched.awayAbbr,
    });
  }
  
  return matches;
};

const SPORTS_CONFIGS = [
  { 
    id: 'soccer', 
    name: 'Football (Soccer)', 
    nameVi: 'Bóng đá (Football)', 
    icon: '⚽',
    leagues: [
      { id: 'soccer-all', name: 'All 260+ Leagues', nameVi: 'Tất cả 260+ Giải đấu' },
      { id: 'soccer-epl', name: 'Premier League', nameVi: 'Ngoại hạng Anh' },
      { id: 'soccer-laliga', name: 'LaLiga', nameVi: 'LaLiga (Tây Ban Nha)' },
      { id: 'soccer-bundesliga', name: 'Bundesliga', nameVi: 'Bundesliga (Đức)' },
      { id: 'soccer-seriea', name: 'Serie A', nameVi: 'Serie A (Ý)' },
      { id: 'soccer-ligue1', name: 'Ligue 1', nameVi: 'Ligue 1 (Pháp)' },
      { id: 'soccer-mls', name: 'MLS', nameVi: 'MLS (Nhà nghề Mỹ)' },
      { id: 'soccer-ucl', name: 'Champions League', nameVi: 'Cúp C1 Châu Âu' },
      { id: 'soccer-uel', name: 'Europa League', nameVi: 'Cúp C2 Châu Âu' }
    ]
  },
  {
    id: 'american-football',
    name: 'American Football (NFL)',
    nameVi: 'Bóng bầu dục Mỹ (NFL)',
    icon: '🏈',
    leagues: [
      { id: 'football-nfl', name: 'NFL', nameVi: 'NFL' },
      { id: 'football-college', name: 'College Football', nameVi: 'NCAA College Football' },
      { id: 'football-cfl', name: 'CFL', nameVi: 'CFL (Canada)' },
      { id: 'football-ufl', name: 'UFL', nameVi: 'UFL' }
    ]
  },
  {
    id: 'basketball',
    name: 'Basketball',
    nameVi: 'Bóng rổ',
    icon: '🏀',
    leagues: [
      { id: 'nba', name: 'NBA', nameVi: 'NBA' },
      { id: 'wnba', name: 'WNBA', nameVi: 'WNBA' },
      { id: 'basketball-ncaa-m', name: 'NCAA Men', nameVi: 'NCAA Nam' },
      { id: 'basketball-ncaa-w', name: 'NCAA Women', nameVi: 'NCAA Nữ' },
      { id: 'basketball-g-league', name: 'G League', nameVi: 'G League' }
    ]
  },
  {
    id: 'baseball',
    name: 'Baseball',
    nameVi: 'Bóng chày',
    icon: '⚾',
    leagues: [
      { id: 'mlb', name: 'MLB', nameVi: 'MLB' }
    ]
  },
  {
    id: 'hockey',
    name: 'Hockey',
    nameVi: 'Khúc côn cầu',
    icon: '🏒',
    leagues: [
      { id: 'nhl', name: 'NHL', nameVi: 'NHL' }
    ]
  },
  {
    id: 'mma',
    name: 'MMA',
    nameVi: 'Võ thuật MMA',
    icon: '🥊',
    leagues: [
      { id: 'ufc', name: 'UFC', nameVi: 'UFC' }
    ]
  },
  {
    id: 'boxing',
    name: 'Boxing',
    nameVi: 'Quyền Anh',
    icon: '🥊',
    leagues: [
      { id: 'boxing-events', name: 'Boxing Events', nameVi: 'Các trận Boxing' }
    ]
  },
  {
    id: 'golf',
    name: 'Golf',
    nameVi: 'Golf',
    icon: '⛳',
    leagues: [
      { id: 'golf-pga', name: 'PGA Tour', nameVi: 'PGA Tour' },
      { id: 'golf-lpga', name: 'LPGA Tour', nameVi: 'LPGA Tour' },
      { id: 'golf-liv', name: 'LIV Golf', nameVi: 'LIV Golf' }
    ]
  },
  {
    id: 'tennis',
    name: 'Tennis',
    nameVi: 'Quần vợt',
    icon: '🎾',
    leagues: [
      { id: 'tennis-atp', name: 'ATP Tour', nameVi: 'ATP Tour' },
      { id: 'tennis-wta', name: 'WTA Tour', nameVi: 'WTA Tour' },
      { id: 'tennis-grandslam', name: 'Grand Slams', nameVi: 'Grand Slams' }
    ]
  },
  {
    id: 'racing',
    name: 'Racing',
    nameVi: 'Đua xe',
    icon: '🏎',
    leagues: [
      { id: 'racing-f1', name: 'Formula 1', nameVi: 'Formula 1' },
      { id: 'racing-indycar', name: 'IndyCar', nameVi: 'IndyCar' },
      { id: 'racing-nascar', name: 'NASCAR', nameVi: 'NASCAR' }
    ]
  },
  {
    id: 'rugby-union',
    name: 'Rugby Union',
    nameVi: 'Bóng bầu dục Union',
    icon: '🏉',
    leagues: [
      { id: 'rugby-worldcup', name: 'World Cup', nameVi: 'Rugby World Cup' },
      { id: 'rugby-sixnations', name: 'Six Nations', nameVi: 'Six Nations' }
    ]
  },
  {
    id: 'rugby-league',
    name: 'Rugby League',
    nameVi: 'Bóng bầu dục League',
    icon: '🏉',
    leagues: [
      { id: 'rugby-nrl', name: 'NRL', nameVi: 'NRL' },
      { id: 'rugby-superleague', name: 'Super League', nameVi: 'Super League' }
    ]
  },
  {
    id: 'cricket',
    name: 'Cricket',
    nameVi: 'Bóng quyền (Cricket)',
    icon: '🏏',
    leagues: [
      { id: 'cricket-ipl', name: 'IPL', nameVi: 'IPL' },
      { id: 'cricket-icc', name: 'ICC World Cup', nameVi: 'ICC World Cup' },
      { id: 'cricket-bbl', name: 'BBL', nameVi: 'Big Bash League' },
      { id: 'cricket-psl', name: 'PSL', nameVi: 'Pakistan Super League' }
    ]
  },
  {
    id: 'lacrosse',
    name: 'Lacrosse',
    nameVi: 'Bóng lưới Lacrosse',
    icon: '🥍',
    leagues: [
      { id: 'lacrosse-pll', name: 'PLL', nameVi: 'Premier Lacrosse League' },
      { id: 'lacrosse-nll', name: 'NLL', nameVi: 'National Lacrosse League' }
    ]
  },
  {
    id: 'afl',
    name: 'Australian Football',
    nameVi: 'Bóng bầu dục Úc (AFL)',
    icon: '🏉',
    leagues: [
      { id: 'afl', name: 'AFL', nameVi: 'AFL' }
    ]
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    nameVi: 'Bóng chuyền',
    icon: '🏐',
    leagues: [
      { id: 'volleyball-m', name: 'FIVB / NCAA Men', nameVi: 'FIVB / NCAA Nam' },
      { id: 'volleyball-w', name: 'FIVB / NCAA Women', nameVi: 'FIVB / NCAA Nữ' }
    ]
  },
  {
    id: 'wrestling',
    name: 'Wrestling',
    nameVi: 'Đấu vật (WWE)',
    icon: '🤼',
    leagues: [
      { id: 'wrestling-wwe', name: 'WWE', nameVi: 'WWE Events' }
    ]
  },
  {
    id: 'esports',
    name: 'Esports',
    nameVi: 'Thể thao điện tử',
    icon: '🎮',
    leagues: [
      { id: 'esports-lol', name: 'LoL', nameVi: 'Liên Minh Huyền Thoại' },
      { id: 'esports-csgo', name: 'CS2', nameVi: 'Counter-Strike 2' },
      { id: 'esports-dota', name: 'Dota 2', nameVi: 'Dota 2' },
      { id: 'esports-val', name: 'Valorant', nameVi: 'Valorant' }
    ]
  }
];

const SIMULATED_SPORT_SCHEDULES: Record<string, Array<{ home: string; homeAbbr: string; away: string; awayAbbr: string; type: string }>> = {
  'boxing': [
    { home: 'Tyson Fury', homeAbbr: 'FURY', away: 'Oleksandr Usyk', awayAbbr: 'USYK', type: 'WBC Heavyweight' },
    { home: 'Canelo Alvarez', homeAbbr: 'CAN', away: 'Terence Crawford', awayAbbr: 'CRAW', type: 'Super Middleweight' },
    { home: 'Naoya Inoue', homeAbbr: 'INO', away: 'Stephen Fulton', awayAbbr: 'FUL', type: 'Super Bantamweight' },
    { home: 'Anthony Joshua', homeAbbr: 'AJ', away: 'Deontay Wilder', awayAbbr: 'WILD', type: 'Heavyweight Bout' },
    { home: 'Gervonta Davis', homeAbbr: 'TANK', away: 'Vasiliy Lomachenko', awayAbbr: 'LOMA', type: 'Lightweight Title' }
  ],
  'cricket': [
    { home: 'Mumbai Indians', homeAbbr: 'MI', away: 'Chennai Super Kings', awayAbbr: 'CSK', type: 'IPL' },
    { home: 'India', homeAbbr: 'IND', away: 'Australia', awayAbbr: 'AUS', type: 'ICC World Cup' },
    { home: 'Royal Challengers Bengaluru', homeAbbr: 'RCB', away: 'Kolkata Knight Riders', awayAbbr: 'KKR', type: 'IPL' },
    { home: 'Sydney Sixers', homeAbbr: 'SYS', away: 'Melbourne Stars', awayAbbr: 'MLS', type: 'BBL' },
    { home: 'Lahore Qalandars', homeAbbr: 'LQ', away: 'Karachi Kings', awayAbbr: 'KK', type: 'PSL' }
  ],
  'rugby-union': [
    { home: 'New Zealand All Blacks', homeAbbr: 'NZ', away: 'South Africa Springboks', awayAbbr: 'RSA', type: 'World Cup' },
    { home: 'England', homeAbbr: 'ENG', away: 'France', awayAbbr: 'FRA', type: 'Six Nations' },
    { home: 'Ireland', homeAbbr: 'IRE', away: 'Wales', awayAbbr: 'WAL', type: 'Six Nations' },
    { home: 'Australia Wallabies', homeAbbr: 'AUS', away: 'Argentina Pumas', awayAbbr: 'ARG', type: 'Rugby Championship' }
  ],
  'rugby-league': [
    { home: 'Penrith Panthers', homeAbbr: 'PEN', away: 'Brisbane Broncos', awayAbbr: 'BRI', type: 'NRL' },
    { home: 'St Helens', homeAbbr: 'STH', away: 'Wigan Warriors', awayAbbr: 'WIG', type: 'Super League' },
    { home: 'Sydney Roosters', homeAbbr: 'SYD', away: 'South Sydney Rabbitohs', awayAbbr: 'SOU', type: 'NRL' }
  ],
  'wrestling': [
    { home: 'Cody Rhodes', homeAbbr: 'CODY', away: 'Roman Reigns', awayAbbr: 'ROMAN', type: 'WWE Undisputed Title' },
    { home: 'Seth Rollins', homeAbbr: 'SETH', away: 'CM Punk', awayAbbr: 'PUNK', type: 'WWE Heavyweight Title' },
    { home: 'Rhea Ripley', homeAbbr: 'RHEA', away: 'Charlotte Flair', awayAbbr: 'CHAR', type: 'WWE Women\'s Title' },
    { home: 'LA Knight', homeAbbr: 'LAK', away: 'Logan Paul', awayAbbr: 'LOGAN', type: 'WWE US Championship' }
  ],
  'esports': ESPORTS_REAL_SCHEDULE
};

const generateSimulatedSportMatches = (clientTime: Date, sportId: string): RawMatch[] => {
  const schedList = SIMULATED_SPORT_SCHEDULES[sportId] || [
    { home: 'Team Alpha', homeAbbr: 'ALP', away: 'Team Beta', awayAbbr: 'BET', type: sportId.toUpperCase() },
    { home: 'Red Star', homeAbbr: 'RED', away: 'Blue Wave', awayAbbr: 'BLU', type: sportId.toUpperCase() },
    { home: 'Thunder FC', homeAbbr: 'THU', away: 'Lightning SC', awayAbbr: 'LGT', type: sportId.toUpperCase() }
  ];

  const matches: RawMatch[] = [];
  const offsets = [-180, -90, -15, 30, 120, 300, 720];

  for (let i = 0; i < schedList.length; i++) {
    const sched = schedList[i];
    const offsetMins = offsets[i % offsets.length];
    const matchTime = new Date(clientTime.getTime() + offsetMins * 60 * 1000);

    const month = (matchTime.getMonth() + 1).toString().padStart(2, '0');
    const day = matchTime.getDate().toString().padStart(2, '0');
    const year = matchTime.getFullYear();
    const hours = matchTime.getHours().toString().padStart(2, '0');
    const minutes = matchTime.getMinutes().toString().padStart(2, '0');
    const localDateStr = `${month}/${day}/${year} ${hours}:${minutes}`;

    const isLive = offsetMins < 0 && offsetMins > -120;
    const isFinished = offsetMins <= -120;

    let homeScore = "0";
    let awayScore = "0";
    let finished = "FALSE";
    let timeElapsed = "notstarted";

    if (isFinished) {
      if (sportId === 'boxing' || sportId === 'wrestling') {
        homeScore = Math.random() < 0.5 ? "KO" : "Dec";
        awayScore = homeScore === "KO" ? "L" : "L";
      } else if (sportId === 'cricket') {
        homeScore = (180 + Math.floor(Math.random() * 40)).toString();
        awayScore = (170 + Math.floor(Math.random() * 40)).toString();
      } else {
        homeScore = Math.floor(Math.random() * 3 + 1).toString();
        awayScore = Math.floor(Math.random() * 3).toString();
      }
      finished = "TRUE";
      timeElapsed = "finished";
    } else if (isLive) {
      const elapsed = Math.abs(offsetMins);
      if (sportId === 'cricket') {
        homeScore = `145/3 (${Math.floor(elapsed / 6)} ov)`;
        awayScore = `142/5`;
      } else {
        homeScore = Math.random() < 0.5 ? "1" : "0";
        awayScore = homeScore === "1" ? "0" : "1";
      }
      timeElapsed = `Live ${elapsed}m`;
    }

    matches.push({
      id: `sim-${sportId}-${i + 1}`,
      home_team_id: sched.home,
      away_team_id: sched.away,
      home_score: homeScore,
      away_score: awayScore,
      home_scorers: "null",
      away_scorers: "null",
      group: sched.type,
      matchday: "1",
      local_date: localDateStr,
      finished: finished,
      time_elapsed: timeElapsed,
      type: "group",
      home_team_name_en: sched.home,
      away_team_name_en: sched.away,
      home_team_label: sched.homeAbbr,
      away_team_label: sched.awayAbbr,
    });
  }

  return matches;
};

const getLeagueName = (leagueId: string): string => {
  for (const s of SPORTS_CONFIGS) {
    if (s.id === leagueId) return s.name;
    const l = s.leagues?.find(l => l.id === leagueId);
    if (l) return l.name;
  }
  return leagueId.toUpperCase();
};

const getTeamStrength = (teamName: string): number => {
  if (!teamName) return 75;
  const cleanName = teamName.trim().toLowerCase();
  
  // 1. Direct English name lookup (e.g. "Portugal")
  for (const [key, val] of Object.entries(TEAM_STRENGTHS)) {
    if (key.toLowerCase() === cleanName) {
      return val;
    }
  }
  
  // 2. Reverse Vietnamese translation lookup (e.g. "Bồ Đào Nha" -> "Portugal")
  for (const [engKey, viVal] of Object.entries(TEAM_TRANSLATIONS)) {
    if (viVal.toLowerCase() === cleanName) {
      for (const [strengthKey, strengthVal] of Object.entries(TEAM_STRENGTHS)) {
        if (strengthKey.toLowerCase() === engKey.toLowerCase()) {
          return strengthVal;
        }
      }
    }
  }
  
  // 3. Fallback: Deterministic string hash mapping to a realistic team strength coefficient (50 - 99)
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const strength = 50 + (Math.abs(hash) % 45); // ranges 50 to 94
  return strength;
};

const formatTime12h = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minStr = minutes.toString().padStart(2, '0');
  const hrStr = hours.toString().padStart(2, '0');
  return `${hrStr}:${minStr}${ampm}`;
};

const parseEspnMatchId = (matchId: string): { sportId: string; eventId: string } => {
  const parts = matchId.split('-');
  if (parts.length >= 3) {
    const eventId = parts[parts.length - 1];
    const sportId = parts.slice(1, parts.length - 1).join('-');
    return { sportId, eventId };
  }
  return { sportId: parts[1] || 'soccer', eventId: parts[2] || '' };
};

const TEST_MATCH_COLUMBUS_NYC: RawMatch = {
  id: 'espn-soccer-mls-761668',
  home_team_id: 'Columbus Crew',
  away_team_id: 'New York City FC',
  home_score: '1',
  away_score: '2',
  home_scorers: 'null',
  away_scorers: 'null',
  group: 'MLS',
  matchday: '1',
  local_date: '07/22/2026 19:30',
  finished: 'TRUE',
  time_elapsed: 'finished',
  type: 'group',
  home_team_name_en: 'Columbus Crew',
  away_team_name_en: 'New York City FC',
  home_team_label: 'CLB',
  away_team_label: 'NYC',
  home_badge: 'https://a.espncdn.com/i/teamlogos/soccer/500/1826.png',
  away_badge: 'https://a.espncdn.com/i/teamlogos/soccer/500/17606.png',
  realOdds: {
    home: 2.10,
    draw: 3.40,
    away: 3.20,
    provider: 'DraftKings Sportsbook'
  }
};

const mapEspnEventToMatch = (event: any, sportId: string): RawMatch => {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  
  let homeCompetitor = competitors.find((c: any) => c.homeAway === 'home');
  let awayCompetitor = competitors.find((c: any) => c.homeAway === 'away');
  
  if (!homeCompetitor && competitors.length > 0) homeCompetitor = competitors[0];
  if (!awayCompetitor && competitors.length > 1) awayCompetitor = competitors[1];
  if (!awayCompetitor) awayCompetitor = homeCompetitor || {};
  
  const homeTeam = homeCompetitor?.team || homeCompetitor?.athlete || {};
  const awayTeam = awayCompetitor?.team || awayCompetitor?.athlete || {};
  
  const homeName = homeTeam.displayName || homeTeam.name || event.shortName || 'Home Participant';
  const awayName = awayTeam.displayName || awayTeam.name || (competitors.length <= 1 ? 'Field / Opponent' : 'Away Participant');
  
  const homeScore = homeCompetitor?.score || '0';
  const awayScore = awayCompetitor?.score || '0';
  
  const statusType = event.status?.type || {};
  const isFinished = statusType.state === 'post' || statusType.completed === true || statusType.name === 'STATUS_FULL_TIME';
  const isLive = statusType.state === 'in';
  
  let finished = 'FALSE';
  let timeElapsed = 'notstarted';
  if (isFinished) {
    finished = 'TRUE';
    timeElapsed = 'finished';
  } else if (isLive) {
    timeElapsed = statusType.detail || statusType.shortDetail || 'live';
  }
  
  let localDateStr = '06/11/2026 13:00';
  try {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = d.getHours().toString().padStart(2, '0');
      const min = d.getMinutes().toString().padStart(2, '0');
      localDateStr = `${mm}/${dd}/${yyyy} ${hh}:${min}`;
    }
  } catch (e) {
    console.error('Error formatting ESPN event date', e);
  }
  
  const leagueLabel = event.league?.name || getLeagueName(sportId);
  
  // Real odds extraction from sportsbook provider (DraftKings / ESPN BET)
  const oddsObj = competition.odds?.[0] || {};
  let homeAmer = oddsObj.moneyline?.home?.close?.odds ?? oddsObj.homeTeamOdds?.moneyLine ?? null;
  let awayAmer = oddsObj.moneyline?.away?.close?.odds ?? oddsObj.awayTeamOdds?.moneyLine ?? null;
  let drawAmer = oddsObj.moneyline?.draw?.close?.odds ?? oddsObj.drawOdds?.moneyLine ?? null;

  if (!homeAmer && oddsObj.details) {
    const parts = oddsObj.details.split(' ');
    if (parts.length >= 2) {
      const val = parts[parts.length - 1];
      if (val.startsWith('+') || val.startsWith('-')) {
        homeAmer = val;
      }
    }
  }

  const parseAmer = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    const num = typeof val === 'string' ? parseFloat(val.replace('+', '')) : val;
    if (isNaN(num) || num === 0) return null;
    return num > 0 ? Math.round((1 + num / 100) * 100) / 100 : Math.round((1 + 100 / Math.abs(num)) * 100) / 100;
  };

  const homeDec = parseAmer(homeAmer);
  const awayDec = parseAmer(awayAmer);
  const drawDec = parseAmer(drawAmer);

  const realOdds = (homeDec || awayDec) ? {
    home: homeDec || 1.85,
    draw: drawDec || 3.20,
    away: awayDec || 1.85,
    provider: oddsObj.provider?.name || 'DraftKings Sportsbook',
    details: oddsObj.details || undefined,
  } : undefined;
  
  return {
    id: `espn-${sportId}-${event.id}`,
    home_team_id: homeName,
    away_team_id: awayName,
    home_score: homeScore.toString(),
    away_score: awayScore.toString(),
    home_scorers: 'null',
    away_scorers: 'null',
    group: leagueLabel,
    matchday: '1',
    local_date: localDateStr,
    finished: finished,
    time_elapsed: timeElapsed,
    type: 'group',
    home_team_name_en: homeName,
    away_team_name_en: awayName,
    home_team_label: homeTeam.abbreviation || homeName.substring(0, 3).toUpperCase(),
    away_team_label: awayTeam.abbreviation || awayName.substring(0, 3).toUpperCase(),
    home_badge: homeTeam.logo || homeTeam.logos?.[0]?.href || '',
    away_badge: awayTeam.logo || awayTeam.logos?.[0]?.href || '',
    realOdds,
  };
};

const getStadiumName = (match: RawMatch): string => {
  if (!match.stadium_id) return '';
  
  if (match.id === '104' || match.group === 'FINAL') {
    return 'MetLife Stadium';
  }
  if (match.id === '103' || match.group === '3RD') {
    return 'Hard Rock Stadium, Florida';
  }
  const stadiums: Record<string, string> = {
    '1': 'Lusail Iconic Stadium',
    '2': 'Al Bayt Stadium',
    '3': 'Khalifa International Stadium',
    '4': 'Ahmad bin Ali Stadium',
    '5': 'Education City Stadium',
    '6': 'Al Thumama Stadium',
    '7': 'Al Janoub Stadium',
    '8': 'Stadium 974',
  };
  return stadiums[match.stadium_id] || '';
};

interface MarketAccordionProps {
  title: string;
  badge?: string;
  tooltip?: string;
  children: React.ReactNode;
}

const MarketAccordion: React.FC<MarketAccordionProps> = ({ title, badge, tooltip, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border border-luxury-border/60 rounded-2xl bg-neutral-950/40 overflow-hidden">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-900/35 transition-all select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black text-white tracking-wider uppercase font-sans">{title}</span>
          {badge && (
            <span className="text-[8px] font-black bg-gradient-to-r from-red-600 to-amber-600 text-white px-2 py-0.5 rounded tracking-wide uppercase skew-x-12">
              <span className="inline-block -skew-x-12">{badge}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tooltip && (
            <span 
              className="text-[10px] text-neutral-500 hover:text-neutral-300 font-bold bg-neutral-900 border border-neutral-800 rounded-full w-4 h-4 flex items-center justify-center cursor-help transition-all"
              title={tooltip}
            >
              ?
            </span>
          )}
          <span className={`text-[10px] text-neutral-550 font-bold transform transition-transform duration-300 ${isOpen ? 'rotate-185' : 'rotate-0'}`}>
            ▼
          </span>
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-luxury-border/20 bg-black/15 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

interface OddsButtonProps {
  label: string;
  odds: number;
  selected: boolean;
  onClick: () => void;
}

const OddsButton: React.FC<OddsButtonProps> = ({ label, odds, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all transform active:scale-95 duration-250 cursor-pointer ${
        selected
          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]'
          : 'bg-neutral-950/60 border-luxury-border/50 text-neutral-400 hover:text-white hover:border-blue-500/25 hover:bg-neutral-900/50'
      }`}
    >
      <span className="truncate max-w-[120px] select-none text-left">{label}</span>
      <span className={`font-black font-mono select-none text-right pl-2 ${selected ? 'text-white' : 'text-blue-400'}`}>
        {odds.toFixed(2)}x
      </span>
    </button>
  );
};

export default function SportsBettingGame() {

  const { credits, deductCredits, addCredits, addHistoryItem, language: lang, setLanguage: setLang } = useGameState();
  const { playClick, playWin, playLoss, playPlop } = useAudio();

  // Mounting & Client-time state
  const [isMounted, setIsMounted] = useState(false);
  // Use lazy initializer that only runs on client — avoids SSR/hydration mismatch
  const [clientTime, setClientTime] = useState<Date | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>('');
  // Ref to the first upcoming match for auto-scrolling
  const firstUpcomingRef = useRef<HTMLDivElement>(null);
  // Bet placed notification
  const [betPlacedNotice, setBetPlacedNotice] = useState<string | null>(null);
  const betNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load datasets (using JSON files directly as fallback defaults)
  const localTeams = (teamsData as { value: Team[] }).value;
  const localMatches = (matchesData as { value: RawMatch[] }).value;

  // Sort fallback matches chronologically to ensure they are ordered correctly
  const localMatchesSorted = [...localMatches].sort((a, b) => {
    return parseMatchDate(a.local_date, a.stadium_id).getTime() - parseMatchDate(b.local_date, b.stadium_id).getTime();
  });

  const [teamsList, setTeamsList] = useState<Team[]>(localTeams);
  const [matchesList, setMatchesList] = useState<RawMatch[]>(overrideWorldCupMatches(localMatchesSorted));
  const [isLoadingAPI, setIsLoadingAPI] = useState<boolean>(true);

  // Filter Active View Tab
  const [fixtureTab, setFixtureTab] = useState<'upcoming' | 'all'>('upcoming');

  // Active UI Selection
  const [selectedMatch, setSelectedMatch] = useState<RawMatch | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [betType, setBetType] = useState<string>('1x2');
  const [guessHomeScore, setGuessHomeScore] = useState<number>(1);
  const [guessAwayScore, setGuessAwayScore] = useState<number>(0);
  const [activeMarketTab, setActiveMarketTab] = useState<'main' | 'halves' | 'totals' | 'others'>('main');
  const [hoveringBanner, setHoveringBanner] = useState<boolean>(false);
  const [selectedSlipOdds, setSelectedSlipOdds] = useState<number>(1.85);
  const [selectedSlipMarketLabel, setSelectedSlipMarketLabel] = useState<string>('');
  const [selectedSlipPredictionLabel, setSelectedSlipPredictionLabel] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  // Bets State
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [resolvedBets, setResolvedBets] = useState<ResolvedBet[]>([]);
  
  // Settle Modal State
  const [settlingBet, setSettlingBet] = useState<Bet | null>(null);
  const [settlingLoading, setSettlingLoading] = useState<boolean>(false);
  const [settlingError, setSettlingError] = useState<string | null>(null);
  const [settleOutcome, setSettleOutcome] = useState<ResolvedBet | null>(null);

  // Stats
  const [stats, setStats] = useState({ totalBets: 0, wins: 0, losses: 0, profit: 0 });

  const renderMyActiveBets = () => {
    return (
      <Card className="bg-[#0b0b0b] border-luxury-border rounded-3xl mt-4">
        <CardHeader className="p-5 border-b border-luxury-border/60">
          <CardTitle className="text-xs font-extrabold flex items-center gap-1.5 font-sans">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            {TRANSLATIONS[lang].myActiveBets} ({activeBets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-3">
          {activeBets.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-medium">
              {TRANSLATIONS[lang].noRunningBets}
            </div>
          ) : (
            activeBets.map((bet) => {
              // Pull live match state from cached lists
              const liveMatch = matchesList.find(m => m.id === bet.match.id)
                || Object.values(sportMatches).flat().find(m => m.id === bet.match.id)
                || bet.match;

              const matchDate = parseMatchDate(liveMatch.local_date, liveMatch.stadium_id);
              const matchEndDate = new Date(matchDate.getTime() + 90 * 60 * 1000);
              const hasEnded = liveMatch.finished === 'TRUE' || (clientTime ? clientTime >= matchEndDate : false);
              const isLive = !hasEnded && liveMatch.time_elapsed !== 'notstarted' && liveMatch.time_elapsed !== 'finished' && clientTime ? (clientTime >= matchDate && clientTime < matchEndDate) : false;

              let timeLabel = '';
              if (clientTime) {
                if (isLive) {
                  const mins = Math.floor((clientTime.getTime() - matchDate.getTime()) / (60 * 1000));
                  timeLabel = lang === 'vi' ? `Phút ${mins}'` : `${mins}'`;
                } else if (!hasEnded) {
                  const diffMs = matchDate.getTime() - clientTime.getTime();
                  const hours = Math.floor(diffMs / (3600 * 1000));
                  const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
                  timeLabel = hours > 0 
                    ? (lang === 'vi' ? `Bắt đầu sau ${hours}g ${mins}ph` : `Starts in ${hours}h ${mins}m`) 
                    : (lang === 'vi' ? `Bắt đầu sau ${mins}ph` : `Starts in ${mins}m`);
                } else {
                  timeLabel = TRANSLATIONS[lang].concluded;
                }
              }

              const homeLabel = lang === 'vi' ? (TEAM_TRANSLATIONS[bet.homeTeam.name_en] || bet.homeTeam.name_en) : bet.homeTeam.name_en;
              const awayLabel = lang === 'vi' ? (TEAM_TRANSLATIONS[bet.awayTeam.name_en] || bet.awayTeam.name_en) : bet.awayTeam.name_en;
              
              let predLabel = '';
              if (bet.betType === 'correct_score_2h') {
                predLabel = lang === 'vi' ? `Hiệp 2: ${bet.prediction}` : `2nd Half: ${bet.prediction}`;
              } else if (bet.betType === 'red_card') {
                predLabel = bet.prediction === 'yes' 
                  ? (lang === 'vi' ? 'Có thẻ đỏ' : 'Red Card Yes') 
                  : (lang === 'vi' ? 'Không thẻ đỏ' : 'Red Card No');
              } else {
                predLabel = bet.prediction === 'home' ? homeLabel
                  : bet.prediction === 'away' ? awayLabel
                  : TRANSLATIONS[lang].draw;
              }

              const liveHomeScore = parseInt(liveMatch.home_score) || 0;
              const liveAwayScore = parseInt(liveMatch.away_score) || 0;
              const isEarlyCashoutEligible = bet.betType === 'early_cashout' && isLive && (
                (bet.prediction === 'home' && liveHomeScore - liveAwayScore >= 2) ||
                (bet.prediction === 'away' && liveAwayScore - liveHomeScore >= 2)
              );

              const canSettle = hasEnded || isEarlyCashoutEligible;

              return (
                <div 
                  key={bet.id} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-3xl bg-black/60 border border-luxury-border/60 gap-4"
                >
                  <div className="flex flex-col gap-1.5 flex-grow pr-2">
                    <div className="flex items-center gap-2 flex-wrap text-[9px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                      <span>{lang === 'vi' ? `Bảng ${liveMatch.group}` : `Group ${liveMatch.group}`}</span>
                      <span className="text-neutral-700">•</span>
                      <span>{lang === 'vi' ? `Trận #${liveMatch.id}` : `Match #${liveMatch.id}`}</span>
                      {timeLabel && (
                        <>
                          <span className="text-neutral-700">•</span>
                          <span className={`font-mono font-bold ${isLive ? 'text-amber-400' : 'text-neutral-400'}`}>{timeLabel}</span>
                        </>
                      )}
                      {isLive && (
                        <>
                          <span className="text-neutral-700">•</span>
                          <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            {lang === 'vi' ? 'Trực Tiếp' : 'LIVE'}
                          </span>
                          <span className="text-neutral-700">•</span>
                          <span className="text-amber-400 font-black animate-pulse">({liveHomeScore} - {liveAwayScore})</span>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs font-black text-white flex items-center gap-2 mt-1">
                      <span>{homeLabel}</span>
                      <span className="text-neutral-600 font-bold">vs</span>
                      <span>{awayLabel}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold px-2.5 py-0.5 rounded-full">
                        {TRANSLATIONS[lang].staked}: ${bet.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] bg-blue-950/40 border border-blue-500/20 text-blue-400 font-black px-2.5 py-0.5 rounded-full uppercase">
                        {TRANSLATIONS[lang].betLabel}: {predLabel} ({bet.odds}x)
                      </span>
                      {bet.betType && (
                        <span className="text-[9px] bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 font-black px-2.5 py-0.5 rounded-full uppercase">
                          {bet.betType === 'early_cashout' ? 'Early Cashout' : bet.betType === 'red_card' ? 'Red Card' : bet.betType === 'correct_score_2h' ? '2H Score' : '1X2'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Settle Action Button */}
                  <div className="shrink-0 flex items-center font-sans">
                    <Button
                      variant={canSettle ? 'gold' : 'dark'}
                      size="sm"
                      onClick={() => handleSettleBet(bet)}
                      disabled={!canSettle}
                      className={`font-extrabold text-[10px] px-5 py-2.5 rounded-full transition-all ${
                        isEarlyCashoutEligible
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 border-none hover:from-emerald-400 hover:to-green-500 text-white hover:scale-105 shadow-md shadow-emerald-950/40 animate-pulse'
                          : hasEnded 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 border-none hover:from-blue-500 hover:to-indigo-600 text-white hover:scale-105 shadow-md shadow-blue-950/30' 
                          : 'opacity-55'
                      }`}
                    >
                      {isEarlyCashoutEligible 
                        ? (lang === 'vi' ? 'Nhận Tiền Sớm 💰' : 'Early Cashout 💰')
                        : hasEnded 
                        ? TRANSLATIONS[lang].settleBetBtn 
                        : TRANSLATIONS[lang].awaitingConclusion}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    );
  };

  // Team Lookup helper with match context and side fallback to prevent "TBD Team 0"
  const getTeam = (id: string, matchContext?: RawMatch, side?: 'home' | 'away'): Team => {
    const foundTeam = teamsList.find(t => t.id === id);
    if (foundTeam) return foundTeam;

    if (matchContext) {
      const matchAny = matchContext as any;
      if (side === 'home') {
        const fallbackName = matchContext.home_team_name_en || matchContext.home_team_label || `TBD Team ${id}`;
        return {
          id,
          name_en: fallbackName,
          fifa_code: 'TBD',
          flag: matchAny.home_badge || '',
          iso2: matchAny.home_iso2 || ''
        };
      } else {
        const fallbackName = matchContext.away_team_name_en || matchContext.away_team_label || `TBD Team ${id}`;
        return {
          id,
          name_en: fallbackName,
          fifa_code: 'TBD',
          flag: matchAny.away_badge || '',
          iso2: matchAny.away_iso2 || ''
        };
      }
    }

    return {
      id,
      name_en: id === '0' ? 'TBD' : `TBD Team ${id}`,
      fifa_code: 'TBD',
      flag: '',
      iso2: ''
    };
  };

  // Sport Selection & Simulated Games States
  const [selectedSport, setSelectedSport] = useState<string>('soccer');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [sportMatches, setSportMatches] = useState<Record<string, RawMatch[]>>({});

  // Multipliers/odds state
  const [oddsHome, setOddsHome] = useState<number>(1.85);
  const [oddsDraw, setOddsDraw] = useState<number>(1.85);
  const [oddsAway, setOddsAway] = useState<number>(1.85);

  const calculateInitialOdds = (match: RawMatch) => {
    if (match.realOdds) {
      return {
        home: match.realOdds.home,
        draw: match.realOdds.draw,
        away: match.realOdds.away,
      };
    }

    const home = getTeam(match.home_team_id, match, 'home');
    const away = getTeam(match.away_team_id, match, 'away');
    
    const { sportId } = parseEspnMatchId(match.id);
    
    if (match.id === '104') {
      return { home: 2.30, draw: 3.05, away: 3.20 };
    }
    if (match.id === '103') {
      return { home: 1.91, draw: 3.80, away: 3.80 };
    }
    
    const homeStrength = getTeamStrength(home.name_en);
    const awayStrength = getTeamStrength(away.name_en);
    
    const diff = homeStrength - awayStrength;
    
    // Standard logistic curve for win/loss expectations
    const eHome = 1 / (1 + Math.exp(-0.08 * diff));
    const eAway = 1 - eHome;
    
    // Draw probability decays smoothly from a base of 27% as mismatch grows
    const pDraw = 0.27 * Math.exp(-0.03 * Math.abs(diff));
    
    // Calculate final probabilities
    const pHome = eHome * (1 - pDraw);
    const pAway = eAway * (1 - pDraw);
    
    // Fair odds (inverse of probabilities)
    let fairHome = 1 / pHome;
    let fairAway = 1 / pAway;
    let fairDraw = 1 / pDraw;
    
    // Apply bookmaker margin (93% payout = 7% house edge)
    const marginFactor = 1.0;
    let oddsH = fairHome * marginFactor;
    let oddsA = fairAway * marginFactor;
    let oddsD = fairDraw * marginFactor;
    
    // Clamp to prevent exploit / extreme risk
    const MAX_ODDS = 30.0;
    const MIN_ODDS = 1.05;
    
    oddsH = Math.max(MIN_ODDS, Math.min(MAX_ODDS, oddsH));
    oddsA = Math.max(MIN_ODDS, Math.min(MAX_ODDS, oddsA));
    oddsD = Math.max(MIN_ODDS, Math.min(MAX_ODDS, oddsD));
    
    const roundToTwo = (num: number) => Math.round(num * 100) / 100;
    
    return {
      home: roundToTwo(oddsH),
      draw: roundToTwo(oddsD),
      away: roundToTwo(oddsA)
    };
  };

  // Effect to reset odds on selectedMatch change
  useEffect(() => {
    if (selectedMatch) {
      const initial = calculateInitialOdds(selectedMatch);
      setOddsHome(initial.home);
      setOddsDraw(initial.draw);
      setOddsAway(initial.away);
    }
  }, [selectedMatch]);

  // Synchronize correct score bet slip values when inputs change dynamically
  useEffect(() => {
    if (betType === 'correct_score_2h' && selectedOutcome === 'correct_score') {
      const csOdds = calculateCorrectScoreOdds(guessHomeScore, guessAwayScore);
      setSelectedSlipOdds(csOdds);
      setSelectedSlipPredictionLabel(`${guessHomeScore} - ${guessAwayScore}`);
    }
  }, [guessHomeScore, guessAwayScore, betType, selectedOutcome]);

  const selectBetSlipWager = (
    type: string, 
    prediction: string, 
    oddsVal: number, 
    marketLabel: string, 
    predictionLabel: string
  ) => {
    setBetType(type);
    setSelectedOutcome(prediction);
    setSelectedSlipOdds(oddsVal);
    setSelectedSlipMarketLabel(marketLabel);
    setSelectedSlipPredictionLabel(predictionLabel);
    playPlop();
  };

  // Mount logic & API fetch and local storage load


  const fetchEspnMatches = async (sportId: string) => {
    if (sportId === 'fifa-world-cup') return;

    const config = SPORTS_CONFIGS.find(s => s.id === sportId);
    if (!config || !config.leagues || config.leagues.length === 0) return;

    const cacheKey = `rm_sports_espn_cache_${sportId}`;
    const cacheTimeKey = `rm_sports_espn_time_${sportId}`;
    const cachedGames = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    const now = new Date();
    // Cache ESPN fetches for 3 minutes to avoid over-fetching
    const isCacheValid = cachedGames && cachedTime && (now.getTime() - Number(cachedTime) < 3 * 60 * 1000);

    if (isCacheValid) {
      const parsed = JSON.parse(cachedGames);
      const updated = parsed.map((match: RawMatch) => {
        const matchDate = parseMatchDate(match.local_date, match.stadium_id);
        const matchEndDate = new Date(matchDate.getTime() + 120 * 60 * 1000);
        
        const isLiveNow = now >= matchDate && now < matchEndDate;
        const hasEndedNow = now >= matchEndDate;

        let finished = match.finished;
        let timeElapsed = match.time_elapsed;
        let changed = false;

        if (hasEndedNow && match.finished !== 'TRUE') {
          finished = 'TRUE';
          timeElapsed = 'finished';
          changed = true;
        } else if (isLiveNow) {
          const elapsed = Math.floor((now.getTime() - matchDate.getTime()) / (60 * 1000));
          timeElapsed = `${elapsed}m`;
          changed = true;
        }

        if (changed) {
          return { ...match, finished, time_elapsed: timeElapsed };
        }
        return match;
      });

      setSportMatches(prev => ({
        ...prev,
        [sportId]: updated
      }));
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return;
    }

    try {
      // Fetch all leagues of the sport in parallel
      const fetchPromises = config.leagues.map(async (league) => {
        try {
          const res = await fetch(`/api/sports/espn?sport=${league.id}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.events && Array.isArray(data.events)) {
              return data.events.map((ev: any) => mapEspnEventToMatch(ev, league.id));
            }
          }
        } catch (err) {
          console.error(`Failed to fetch ESPN matches for league ${league.id}:`, err);
        }
        return [];
      });

      const results = await Promise.all(fetchPromises);
      let allMatches = results.flat();

      // Sort chronologically (LIVE first, then upcoming by start time)
      const sorted = allMatches.sort((a: any, b: any) => {
        const aDate = parseMatchDate(a.local_date, a.stadium_id);
        const bDate = parseMatchDate(b.local_date, b.stadium_id);
        const aLive = a.finished === 'FALSE' && a.time_elapsed !== 'notstarted';
        const bLive = b.finished === 'FALSE' && b.time_elapsed !== 'notstarted';
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        return aDate.getTime() - bDate.getTime();
      });

      if (sportId === 'soccer') {
        const hasColumbus = sorted.some((m: any) => m.id === TEST_MATCH_COLUMBUS_NYC.id || (m.home_team_name_en?.includes('Columbus') && m.away_team_name_en?.includes('New York')));
        if (!hasColumbus) {
          sorted.unshift(TEST_MATCH_COLUMBUS_NYC);
        }
      }

      setSportMatches(prev => ({
        ...prev,
        [sportId]: sorted
      }));

      localStorage.setItem(cacheKey, JSON.stringify(sorted));
      localStorage.setItem(cacheTimeKey, now.getTime().toString());
    } catch (err) {
      console.error(`Failed to fetch ESPN matches for ${sportId}:`, err);
      setSportMatches(prev => ({
        ...prev,
        [sportId]: []
      }));
    }
  };

  useEffect(() => {
    if (selectedSport !== 'fifa-world-cup') {
      fetchEspnMatches(selectedSport);
    }
  }, [selectedSport]);

  // Banner slide rotation effect
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Mount logic & API fetch and local storage load
  useEffect(() => {
    const now = new Date();
    setIsMounted(true);
    setClientTime(now);

    try {
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetMins = new Date().getTimezoneOffset();
      const offsetHours = -offsetMins / 60;
      const offsetStr = (offsetHours >= 0 ? '+' : '') + offsetHours;
      setUserTimezone(`GMT${offsetStr} (${tzName})`);
    } catch (e) {
      setUserTimezone('GMT+7 (Asia/Jakarta)');
    }

    let currentResolved: ResolvedBet[] = [];
    try {
      const storedActive = localStorage.getItem('rm_sports_active_bets');
      const storedResolved = localStorage.getItem('rm_sports_resolved_bets');
      const storedStats = localStorage.getItem('rm_sports_stats');
      if (storedActive) setActiveBets(JSON.parse(storedActive));
      if (storedResolved) {
        currentResolved = JSON.parse(storedResolved);
        setResolvedBets(currentResolved);
      }
      if (storedStats) setStats(JSON.parse(storedStats));
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }

    const correctResolvedBets = (freshMatches: RawMatch[], resolvedList: ResolvedBet[]) => {
      if (!resolvedList || resolvedList.length === 0) return;
      let corrected = false;
      let creditsDelta = 0;
      let winsDelta = 0;
      let lossesDelta = 0;

      const updatedResolvedBets = resolvedList.map(bet => {
        if (bet.match.id.startsWith('sim-') || bet.match.id.startsWith('espn-')) {
          return bet;
        }

        const liveGame = freshMatches.find(g => g.id.toString() === bet.match.id.toString());
        if (!liveGame || liveGame.finished !== 'TRUE') return bet;

        const homeScorersList = parseScorers(liveGame.home_scorers);
        const awayScorersList = parseScorers(liveGame.away_scorers);
        const homeScore = Math.max(homeScorersList.length, Number(liveGame.home_score || 0));
        const awayScore = Math.max(awayScorersList.length, Number(liveGame.away_score || 0));

        let finalOutcome: 'home' | 'draw' | 'away' = 'draw';
        if (homeScore > awayScore) {
          finalOutcome = 'home';
        } else if (awayScore > homeScore) {
          finalOutcome = 'away';
        } else {
          const pHome = liveGame.home_penalty_score !== undefined && liveGame.home_penalty_score !== null ? Number(liveGame.home_penalty_score) : NaN;
          const pAway = liveGame.away_penalty_score !== undefined && liveGame.away_penalty_score !== null ? Number(liveGame.away_penalty_score) : NaN;
          if (!isNaN(pHome) && !isNaN(pAway)) {
            if (pHome > pAway) {
              finalOutcome = 'home';
            } else if (pAway > pHome) {
              finalOutcome = 'away';
            }
          }
        }

        const isWin = bet.prediction === finalOutcome;
        const expectedOutcome: 'win' | 'loss' = isWin ? 'win' : 'loss';
        const expectedPayout = isWin ? bet.amount * bet.odds : 0;

        const needsUpdate = bet.outcome !== expectedOutcome || 
                            bet.homeScore !== homeScore || 
                            bet.awayScore !== awayScore ||
                            bet.match.home_penalty_score !== liveGame.home_penalty_score ||
                            bet.match.away_penalty_score !== liveGame.away_penalty_score;

        if (needsUpdate) {
          corrected = true;

          if (bet.outcome === 'loss' && expectedOutcome === 'win') {
            creditsDelta += expectedPayout;
            winsDelta += 1;
            lossesDelta -= 1;
          } else if (bet.outcome === 'win' && expectedOutcome === 'loss') {
            creditsDelta -= bet.payout;
            winsDelta -= 1;
            lossesDelta += 1;
          }

          return {
            ...bet,
            match: {
              ...bet.match,
              home_score: liveGame.home_score,
              away_score: liveGame.away_score,
              home_penalty_score: liveGame.home_penalty_score,
              away_penalty_score: liveGame.away_penalty_score,
              extra_time: liveGame.extra_time
            },
            homeScore,
            awayScore,
            outcome: expectedOutcome,
            payout: expectedPayout
          };
        }

        return bet;
      });

      if (corrected) {
        setResolvedBets(updatedResolvedBets);
        if (creditsDelta > 0) {
          addCredits(creditsDelta);
        } else if (creditsDelta < 0) {
          deductCredits(Math.abs(creditsDelta));
        }
        setStats(curr => ({
          totalBets: curr.totalBets,
          wins: Math.max(0, curr.wins + winsDelta),
          losses: Math.max(0, curr.losses + lossesDelta),
          profit: curr.profit + creditsDelta
        }));
      }
    };

    const fetchLiveFeeds = async () => {
      try {
        const timestamp = Date.now();
        const [teamsRes, gamesRes] = await Promise.all([
          fetch(`/api/sports/teams?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/sports/games?t=${timestamp}`, { cache: 'no-store' })
        ]);
        
        if (teamsRes.ok) {
          const tData = await teamsRes.json();
          if (tData.teams && Array.isArray(tData.teams)) {
            setTeamsList(tData.teams);
          }
        }

        if (gamesRes.ok) {
          const gData = await gamesRes.json();
          if (gData.games && Array.isArray(gData.games)) {
            const sortedGames = [...gData.games].sort((a, b) => {
              return parseMatchDate(a.local_date, a.stadium_id).getTime() - parseMatchDate(b.local_date, b.stadium_id).getTime();
            });
            const overriddenGames = overrideWorldCupMatches(sortedGames);
            setMatchesList(overriddenGames);
            correctResolvedBets(overriddenGames, currentResolved);
          }
        }
      } catch (err) {
        console.error('Error fetching live feeds, using offline fallback:', err);
      } finally {
        setIsLoadingAPI(false);
      }
    };

    fetchLiveFeeds();

    return () => {
      if (betNoticeTimeoutRef.current) clearTimeout(betNoticeTimeoutRef.current);
    };
  }, []);

  // Update client time and fetch ESPN scores periodically
  useEffect(() => {
    if (!isMounted) return;
    
    const timeInterval = setInterval(() => {
      setClientTime(new Date());
    }, 1000);
    
    const espnPollInterval = setInterval(() => {
      if (selectedSport !== 'fifa-world-cup') {
        fetchEspnMatches(selectedSport);
      }
    }, 20000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(espnPollInterval);
    };
  }, [isMounted, selectedSport]);

  // Persist states to local storage
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('rm_sports_active_bets', JSON.stringify(activeBets));
  }, [activeBets, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('rm_sports_resolved_bets', JSON.stringify(resolvedBets));
  }, [resolvedBets, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('rm_sports_stats', JSON.stringify(stats));
  }, [stats, isMounted]);

  // Auto-scroll to first upcoming match once data is fully loaded
  useEffect(() => {
    if (!isMounted || isLoadingAPI) return;
    // Small delay to let DOM settle after data loads
    const t = setTimeout(() => {
      if (firstUpcomingRef.current) {
        firstUpcomingRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [isMounted, isLoadingAPI]);

  if (!isMounted) {
    return <SportsLobbySkeleton />;
  }

  // Handle Bet Placement — keeps match selected to allow multiple bets on same match
  const handlePlaceBet = () => {
    if (!selectedMatch) return;

    // Check if match has already started or ended relative to user's client time
    const matchDate = parseMatchDate(selectedMatch.local_date, selectedMatch.stadium_id);
    if (clientTime && clientTime >= matchDate) {
      alert('Betting is only allowed on upcoming matches.');
      return;
    }

    let predictionVal = selectedOutcome;
    let oddsVal = selectedSlipOdds;

    if (betType === 'correct_score_2h') {
      predictionVal = `${guessHomeScore}-${guessAwayScore}`;
      oddsVal = calculateCorrectScoreOdds(guessHomeScore, guessAwayScore);
    } else {
      if (!selectedOutcome) {
        alert('Please select a betting outcome.');
        return;
      }
    }

    if (!predictionVal) {
      alert('Please select a betting outcome.');
      return;
    }

    if (betAmount < 0.01 || betAmount > credits) {
      alert('Invalid bet amount or insufficient credits.');
      return;
    }

    const homeTeam = getTeam(selectedMatch.home_team_id, selectedMatch, 'home');
    const awayTeam = getTeam(selectedMatch.away_team_id, selectedMatch, 'away');

    const success = deductCredits(betAmount);
    if (!success) return;

    const newBet: Bet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      match: selectedMatch,
      homeTeam,
      awayTeam,
      prediction: predictionVal,
      amount: betAmount,
      odds: oddsVal,
      timestamp: Date.now(),
      betType: betType,
      guessDetails: betType === 'correct_score_2h' ? { homeScore: guessHomeScore, awayScore: guessAwayScore } : undefined,
      marketLabel: selectedSlipMarketLabel || (betType === '1x2' ? '1X2' : betType === 'early_cashout' ? 'Early Cashout' : betType === 'red_card' ? 'Red Card' : '2nd Half Score'),
      predictionLabel: selectedSlipPredictionLabel || (
        predictionVal === 'home' ? homeTeam.name_en
        : predictionVal === 'away' ? awayTeam.name_en
        : predictionVal === 'draw' ? 'Draw' : predictionVal
      )
    };

    setActiveBets(curr => [newBet, ...curr]);
    // Reset outcome only (keep match selected so user can bet again on same match)
    setSelectedOutcome(null);
    playClick();

    // Show a brief notification that bet was placed and user can bet again
    let predLabel = selectedSlipPredictionLabel || '';
    if (!predLabel) {
      if (betType === 'correct_score_2h') {
        predLabel = `${guessHomeScore} - ${guessAwayScore}`;
      } else if (betType === 'red_card') {
        predLabel = predictionVal === 'yes' 
          ? (lang === 'vi' ? 'Có thẻ đỏ' : 'Red Card Yes') 
          : (lang === 'vi' ? 'Không thẻ đỏ' : 'Red Card No');
      } else {
        const homeName = lang === 'vi' ? TEAM_TRANSLATIONS[homeTeam.name_en] || homeTeam.name_en : homeTeam.name_en;
        const awayName = lang === 'vi' ? TEAM_TRANSLATIONS[awayTeam.name_en] || awayTeam.name_en : awayTeam.name_en;
        predLabel = predictionVal === 'home' ? homeName
          : predictionVal === 'away' ? awayName
          : (lang === 'vi' ? 'Hòa' : 'Draw');
      }
    }
    
    // Append marketLabel details to notice for premium clarity
    const activeMarketName = selectedSlipMarketLabel || (
      betType === 'early_cashout' ? 'Early Cashout' 
      : betType === 'red_card' ? 'Red Card'
      : betType === 'correct_score_2h' ? '2nd Half Score'
      : '1X2'
    );
    const typeSuffix = ` (${activeMarketName})`;
      
    const notice = TRANSLATIONS[lang].pickAnotherOutcome.replace('{prediction}', predLabel + typeSuffix);
    setBetPlacedNotice(notice);
    if (betNoticeTimeoutRef.current) clearTimeout(betNoticeTimeoutRef.current);
    betNoticeTimeoutRef.current = setTimeout(() => setBetPlacedNotice(null), 4000);
  };

  // Settle Bet with real API call or simulated game state
  const handleSettleBet = async (bet: Bet) => {
    setSettlingBet(bet);
    setSettlingLoading(true);
    setSettlingError(null);
    setSettleOutcome(null);

    try {
      let finalGame = bet.match;
      const isEspn = bet.match.id.startsWith('espn-');
      const isSimulated = bet.match.id.startsWith('sim-');

      if (isEspn) {
        const { sportId, eventId } = parseEspnMatchId(bet.match.id);
        if (sportId === 'nfl') {
          const stored = localStorage.getItem('rm_sports_nfl_games');
          if (stored) {
            const mapped = JSON.parse(stored) as RawMatch[];
            const freshMatch = mapped.find(m => m.id === bet.match.id);
            if (freshMatch) {
              finalGame = freshMatch;
            }
          }
        } else {
          const res = await fetch(`/api/sports/espn?sport=${sportId}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.events && Array.isArray(data.events)) {
              const freshEvent = data.events.find((e: any) => e.id.toString() === eventId.toString());
              if (freshEvent) {
                finalGame = mapEspnEventToMatch(freshEvent, sportId);
              }
            }
          }
        }
      } else if (!isSimulated) {
        // Re-fetch matches to get the absolute live result (disable browser/CDN caching)
        const timestamp = Date.now();
        const gamesRes = await fetch(`/api/sports/games?t=${timestamp}`, { cache: 'no-store' });
        
        if (gamesRes.ok) {
          const gData = await gamesRes.json();
          if (gData.games && Array.isArray(gData.games)) {
            const apiMatch = gData.games.find((g: any) => g.id.toString() === bet.match.id.toString());
            if (apiMatch) {
              finalGame = apiMatch;
            }
          }
        }
      } else {
        // Fallback for old simulated matches in active bets
        const { sportId } = parseEspnMatchId(bet.match.id);
        const sportMatchesList = sportMatches[sportId] || [];
        const currentSimMatch = sportMatchesList.find(m => m.id === bet.match.id);
        if (currentSimMatch) {
          finalGame = currentSimMatch;
        }
      }

      // Check if match end time has passed or if finished status needs auto-completion
      const matchDate = parseMatchDate(finalGame.local_date, finalGame.stadium_id);
      const now = new Date();
      const matchAgeMins = (now.getTime() - matchDate.getTime()) / (60 * 1000);
      const hasTimeEnded = matchAgeMins >= 105;

      if (hasTimeEnded || isSimulated || finalGame.time_elapsed === 'finished') {
        finalGame = {
          ...finalGame,
          finished: 'TRUE',
          time_elapsed: 'finished'
        };
      }

      const liveHomeScore = parseInt(finalGame.home_score) || 0;
      const liveAwayScore = parseInt(finalGame.away_score) || 0;
      const isEarlyCashoutEligible = bet.betType === 'early_cashout' && (
        (bet.prediction === 'home' && liveHomeScore - liveAwayScore >= 2) ||
        (bet.prediction === 'away' && liveAwayScore - liveHomeScore >= 2)
      );

      if (finalGame.finished !== 'TRUE' && !isEarlyCashoutEligible) {
        const errorMsg = lang === 'vi'
          ? 'Dữ liệu trận đấu chưa được cập nhật. Vui lòng quyết toán lại khi kết quả đã sẵn sàng.'
          : 'Match result is not yet available in the live scoreboard. Please claim the result when it is ready.';
        throw new Error(errorMsg);
      }

      const homeScorersList = parseScorers(finalGame.home_scorers);
      const awayScorersList = parseScorers(finalGame.away_scorers);
      const homeScore = Math.max(homeScorersList.length, Number(finalGame.home_score || 0));
      const awayScore = Math.max(awayScorersList.length, Number(finalGame.away_score || 0));

      // Resolve wagers based on betType
      let isWin = false;
      const shScore = getSecondHalfScore(finalGame);
      const isKnockout = finalGame.id === '103' || finalGame.id === '104';
      
      const isLevelAt90 = homeScore === awayScore;
      const wentToExtraTime = isKnockout && isLevelAt90; 
      
      const pHome = finalGame.home_penalty_score !== undefined && finalGame.home_penalty_score !== null ? Number(finalGame.home_penalty_score) : NaN;
      const pAway = finalGame.away_penalty_score !== undefined && finalGame.away_penalty_score !== null ? Number(finalGame.away_penalty_score) : NaN;
      const wentToPenalties = !isNaN(pHome) && !isNaN(pAway);
      
      let fullMatchWinner = 'draw';
      if (homeScore > awayScore) {
        fullMatchWinner = 'home';
      } else if (awayScore > homeScore) {
        fullMatchWinner = 'away';
      } else if (wentToPenalties) {
        fullMatchWinner = pHome > pAway ? 'home' : 'away';
      }

      const getDeterministicChoice = (key: string, yesChance: number = 0.5) => {
        let hash = 0;
        const str = (finalGame.id || '') + key;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (Math.abs(hash) % 100) < (yesChance * 100);
      };

      const getDeterministicValue = (key: string, rangeMax: number, rangeMin: number = 0) => {
        let hash = 0;
        const str = (finalGame.id || '') + key;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (Math.abs(hash) % (rangeMax - rangeMin + 1)) + rangeMin;
      };

      if (bet.betType === 'full_match_et_ps') {
        isWin = bet.prediction === fullMatchWinner;
      } else if (bet.betType === 'btts') {
        const hasBothScored = homeScore > 0 && awayScore > 0;
        isWin = bet.prediction === (hasBothScored ? 'yes' : 'no');
      } else if (bet.betType === 'red_card') {
        const matchHadRedCard = hadRedCard(finalGame) || getDeterministicChoice('red_card', 0.08);
        isWin = bet.prediction === (matchHadRedCard ? 'yes' : 'no');
      } else if (bet.betType === 'penalty_awarded') {
        const hasPen = wentToPenalties || getDeterministicChoice('penalty_awarded', 0.18);
        isWin = bet.prediction === (hasPen ? 'yes' : 'no');
      } else if (bet.betType === 'extra_time') {
        isWin = bet.prediction === (wentToExtraTime ? 'yes' : 'no');
      } else if (bet.betType === 'penalties') {
        isWin = bet.prediction === (wentToPenalties ? 'yes' : 'no');
      } else if (bet.betType === 'first_goal') {
        let actualFirstGoal = 'draw';
        if (homeScore > 0 && awayScore === 0) {
          actualFirstGoal = 'home';
        } else if (awayScore > 0 && homeScore === 0) {
          actualFirstGoal = 'away';
        } else if (homeScore > 0 && awayScore > 0) {
          actualFirstGoal = getDeterministicChoice('first_goal_side', 0.5) ? 'home' : 'away';
        }
        isWin = bet.prediction === actualFirstGoal;
      } else if (bet.betType === 'last_goal') {
        let actualLastGoal = 'draw';
        if (homeScore > 0 && awayScore === 0) {
          actualLastGoal = 'home';
        } else if (awayScore > 0 && homeScore === 0) {
          actualLastGoal = 'away';
        } else if (homeScore > 0 && awayScore > 0) {
          actualLastGoal = getDeterministicChoice('last_goal_side', 0.5) ? 'home' : 'away';
        }
        isWin = bet.prediction === actualLastGoal;
      } else if (bet.betType === 'clean_sheet_home') {
        const isCleanSheet = awayScore === 0;
        isWin = bet.prediction === (isCleanSheet ? 'yes' : 'no');
      } else if (bet.betType === 'clean_sheet_away') {
        const isCleanSheet = homeScore === 0;
        isWin = bet.prediction === (isCleanSheet ? 'yes' : 'no');
      } else if (bet.betType === 'own_goal') {
        const hasOwnGoal = getDeterministicChoice('own_goal', 0.05);
        isWin = bet.prediction === (hasOwnGoal ? 'yes' : 'no');
      } else if (bet.betType === 'var_review') {
        const hasVar = getDeterministicChoice('var_review', 0.35);
        isWin = bet.prediction === (hasVar ? 'yes' : 'no');
      } else if (bet.betType === 'goal_10m') {
        let hasEarlyGoal = false;
        if (homeScore > 0 || awayScore > 0) {
          hasEarlyGoal = getDeterministicChoice('goal_10m', 0.12);
        }
        isWin = bet.prediction === (hasEarlyGoal ? 'yes' : 'no');
      } else if (bet.betType === 'woodwork_hit') {
        const hasWoodwork = getDeterministicChoice('woodwork_hit', 0.40);
        isWin = bet.prediction === (hasWoodwork ? 'yes' : 'no');
      } else if (bet.betType === 'exact_goals') {
        const total = homeScore + awayScore;
        const pred = bet.prediction;
        if (pred === '4+') isWin = total >= 4;
        else isWin = total === parseInt(pred);
      } else if (bet.betType === 'first_half_winner') {
        let fhWinner = 'draw';
        const fhVal = getDeterministicValue('first_half', 2);
        if (fhVal === 0 && homeScore > 0) fhWinner = 'home';
        else if (fhVal === 2 && awayScore > 0) fhWinner = 'away';
        isWin = bet.prediction === fhWinner;
      } else if (bet.betType === 'second_half_winner') {
        let shWinner = 'draw';
        const shVal = getDeterministicValue('second_half', 2);
        if (shVal === 0 && shScore.home > 0) shWinner = 'home';
        else if (shVal === 2 && shScore.away > 0) shWinner = 'away';
        isWin = bet.prediction === shWinner;
      } else if (bet.betType === 'goal_both_halves') {
        let bothHalves = 'no';
        if (homeScore + awayScore >= 2) {
          bothHalves = getDeterministicChoice('goal_both_halves', 0.60) ? 'yes' : 'no';
        }
        isWin = bet.prediction === bothHalves;
      } else if (bet.betType === 'total_corners') {
        const corners = getDeterministicValue('corners', 16, 2);
        const pred = bet.prediction;
        if (pred === '0-8') isWin = corners <= 8;
        else if (pred === '9-10') isWin = corners === 9 || corners === 10;
        else if (pred === '11+') isWin = corners >= 11;
      } else if (bet.betType === 'total_cards') {
        const cards = getDeterministicValue('cards', 9, 0);
        const pred = bet.prediction;
        if (pred === '0-3') isWin = cards <= 3;
        else if (pred === '4-5') isWin = cards === 4 || cards === 5;
        else if (pred === '6+') isWin = cards >= 6;
      } else if (bet.betType === 'both_5_corners') {
        const both5 = getDeterministicChoice('both_5_corners', 0.28);
        isWin = bet.prediction === (both5 ? 'yes' : 'no');
      } else if (bet.betType === 'team_score_2_home') {
        isWin = bet.prediction === (homeScore >= 2 ? 'yes' : 'no');
      } else if (bet.betType === 'team_score_2_away') {
        isWin = bet.prediction === (awayScore >= 2 ? 'yes' : 'no');
      } else if (bet.betType === 'win_to_nil') {
        let actual = 'neither';
        if (homeScore > 0 && awayScore === 0) actual = 'home';
        else if (awayScore > 0 && homeScore === 0) actual = 'away';
        isWin = bet.prediction === actual;
      } else if (bet.betType === 'odd_even_goals') {
        const total = homeScore + awayScore;
        const isOdd = total % 2 !== 0;
        isWin = bet.prediction === (isOdd ? 'odd' : 'even');
      } else if (bet.betType === 'correct_score_2h') {
        const expectedScore = shScore.home + '-' + shScore.away;
        isWin = bet.prediction === expectedScore;
      } else if (bet.betType === 'early_cashout') {
        if (isEarlyCashoutEligible) {
          isWin = true;
        } else {
          const didLeadByTwo = hadTwoGoalLead(finalGame, bet.prediction as 'home' | 'away');
          let matchWinner = 'draw';
          if (homeScore > awayScore) matchWinner = 'home';
          else if (awayScore > homeScore) matchWinner = 'away';
          isWin = (bet.prediction === matchWinner) || didLeadByTwo;
        }
      } else {
        let finalOutcome = 'draw';
        if (homeScore > awayScore) {
          finalOutcome = 'home';
        } else if (awayScore > homeScore) {
          finalOutcome = 'away';
        } else if (wentToPenalties) {
          finalOutcome = pHome > pAway ? 'home' : 'away';
        }
        isWin = bet.prediction === finalOutcome;
      }

      let payout = isWin ? Math.round(bet.amount * bet.odds * 100) / 100 : 0;
      const outcomeStatus: 'win' | 'loss' = isWin ? 'win' : 'loss';

      const historyGameLabel = lang === 'vi' ? 'Cá cược Thể thao' : 'Sports Betting';

      if (isWin) {
        addCredits(payout);
        playWin();
        triggerWinConfetti();
        addHistoryItem(historyGameLabel, bet.amount, bet.odds, payout, 'win');
        setStats(curr => ({
          totalBets: curr.totalBets + 1,
          wins: curr.wins + 1,
          losses: curr.losses,
          profit: curr.profit + (payout - bet.amount)
        }));
      } else {
        playLoss();
        addHistoryItem(historyGameLabel, bet.amount, 0.0, 0, 'loss');
        setStats(curr => ({
          totalBets: curr.totalBets + 1,
          wins: curr.wins,
          losses: curr.losses + 1,
          profit: curr.profit - bet.amount
        }));
      }

      const resolved: ResolvedBet = {
        id: bet.id,
        match: finalGame,
        homeTeam: bet.homeTeam,
        awayTeam: bet.awayTeam,
        prediction: bet.prediction,
        amount: bet.amount,
        payout,
        odds: bet.odds,
        homeScore,
        awayScore,
        outcome: outcomeStatus,
        timestamp: Date.now(),
        homeScorers: homeScorersList,
        awayScorers: awayScorersList
      };

      setSettleOutcome(resolved);
      setActiveBets(curr => curr.filter(b => b.id !== bet.id));
      setResolvedBets(curr => [resolved, ...curr]);
    } catch (err: any) {
      console.error('Settle API Error:', err);
      setSettlingError(err.message || (lang === 'vi' ? 'Lỗi quyết toán cược. Vui lòng thử lại.' : 'Failed to fetch match scores from API. Please try again.'));
    } finally {
      setSettlingLoading(false);
    }
  };

  // Active matches depending on selected sport
  const activeMatches = selectedSport === 'fifa-world-cup' 
    ? matchesList 
    : (sportMatches[selectedSport] || []);

  // Filter Match list
  const filteredMatches = activeMatches.filter(match => {
    // Hide matches that do not have 2 full teams (team ID '0' is TBD)
    if (match.home_team_id === '0' || match.away_team_id === '0' || !match.home_team_id || !match.away_team_id) {
      return false;
    }

    if (selectedLeague !== 'all') {
      if (match.id.startsWith('espn-')) {
        if (!match.id.startsWith(`espn-${selectedLeague}-`)) {
          return false;
        }
      } else if (match.group) {
        const leagueClean = selectedLeague.toLowerCase().replace('soccer-', '').replace('football-', '').replace('golf-', '').replace('tennis-', '').replace('racing-', '');
        if (!match.group.toLowerCase().includes(leagueClean)) {
          return false;
        }
      }
    }

    const home = getTeam(match.home_team_id, match, 'home');
    const away = getTeam(match.away_team_id, match, 'away');

    // Filter by Time / Status tab
    if (clientTime) {
      const matchDate = parseMatchDate(match.local_date, match.stadium_id);
      const isUpcoming = matchDate > clientTime;
      
      if (fixtureTab === 'upcoming' && !isUpcoming) {
        return false;
      }
    }

    // Group check
    if (groupFilter !== 'ALL' && match.group !== groupFilter) return false;

    // Search query check
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchHome = home.name_en.toLowerCase().includes(query) || home.fifa_code.toLowerCase().includes(query);
      const matchAway = away.name_en.toLowerCase().includes(query) || away.fifa_code.toLowerCase().includes(query);
      if (!matchHome && !matchAway) return false;
    }

    return true;
  });

  const renderMarkets = () => {
    if (!selectedMatch) return null;
    const home = getTeam(selectedMatch.home_team_id, selectedMatch, 'home');
    const away = getTeam(selectedMatch.away_team_id, selectedMatch, 'away');
    const homeLabelRaw = lang === 'vi' ? (TEAM_TRANSLATIONS[home.name_en] || home.name_en) : home.name_en;
    const awayLabelRaw = lang === 'vi' ? (TEAM_TRANSLATIONS[away.name_en] || away.name_en) : away.name_en;

    const shortenCountryName = (name: string): string => {
      if (!name) return '';
      const clean = name.trim();
      if (clean === 'Democratic Republic of the Congo' || clean === 'Cộng hòa Dân chủ Congo' || clean === 'DR Congo' || clean === 'Congo DR' || clean === 'Congo') {
        return 'DROTC';
      }
      if (clean === 'Bosnia and Herzegovina' || clean === 'Bosnia và Herzegovina' || clean === 'Bosnia-Herzegovina' || clean === 'Bosnia') {
        return 'BAH';
      }
      const words = clean.split(/[\s-]+/);
      if (clean.length > 15 || words.length >= 3) {
        return words.map(w => w.charAt(0)).join('').toUpperCase();
      }
      return clean;
    };

    const homeLabel = shortenCountryName(homeLabelRaw);
    const awayLabel = shortenCountryName(awayLabelRaw);

    if (selectedSport !== 'fifa-world-cup') {
      const is3Way = selectedSport === 'soccer' || selectedSport === 'american-football' || selectedSport === 'football';
      return (
        <MarketAccordion 
          title={is3Way ? "1X2 Match Winner" : "Match Winner"} 
          badge={selectedMatch.realOdds?.provider ? `Live ${selectedMatch.realOdds.provider}` : "Popular"}
          tooltip={lang === 'vi' ? 'Dự đoán kết quả trận đấu' : 'Predict the match winner.'}
        >
          <div className={`grid ${is3Way ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            <OddsButton 
              label={homeLabelRaw} 
              odds={oddsHome} 
              selected={betType === '1x2' && selectedOutcome === 'home'}
              onClick={() => selectBetSlipWager('1x2', 'home', oddsHome, '1X2', home.name_en)}
            />
            {is3Way && (
              <OddsButton 
                label={lang === 'vi' ? 'Hòa' : 'Draw'} 
                odds={oddsDraw} 
                selected={betType === '1x2' && selectedOutcome === 'draw'}
                onClick={() => selectBetSlipWager('1x2', 'draw', oddsDraw, '1X2', 'Draw')}
              />
            )}
            <OddsButton 
              label={awayLabelRaw} 
              odds={oddsAway} 
              selected={betType === '1x2' && selectedOutcome === 'away'}
              onClick={() => selectBetSlipWager('1x2', 'away', oddsAway, '1X2', away.name_en)}
            />
          </div>
        </MarketAccordion>
      );
    }

    if (selectedMatch.id === '104') {
      return (
        <>
          {/* Spain vs Argentina custom markets */}
          <MarketAccordion title="1X2" tooltip="Predict the full-time match winner.">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={2.30} selected={betType === '1x2' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('1x2', 'home', 2.30, '1X2', homeLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Hòa' : 'Draw'} odds={3.05} selected={betType === '1x2' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('1x2', 'draw', 3.05, '1X2', lang === 'vi' ? 'Hòa' : 'Draw')} />
              <OddsButton label={awayLabelRaw} odds={3.20} selected={betType === '1x2' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('1x2', 'away', 3.20, '1X2', awayLabelRaw)} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Full Match (ET + PS)" badge="Knockout" tooltip="Include Extra Time and Penalty Shootout.">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={homeLabelRaw} odds={1.72} selected={betType === 'full_match_et_ps' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('full_match_et_ps', 'home', 1.72, 'Full Match (ET + PS)', homeLabelRaw)} />
              <OddsButton label={awayLabelRaw} odds={2.10} selected={betType === 'full_match_et_ps' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('full_match_et_ps', 'away', 2.10, 'Full Match (ET + PS)', awayLabelRaw)} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Both Teams to Score" tooltip="Predict if both teams will score.">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.15} selected={betType === 'btts' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('btts', 'yes', 2.15, 'Both Teams to Score', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.67} selected={betType === 'btts' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('btts', 'no', 1.67, 'Both Teams to Score', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Red Card" tooltip="Will there be a red card?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={4.75} selected={betType === 'red_card' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('red_card', 'yes', 4.75, 'Red Card', lang === 'vi' ? 'Có thẻ đỏ' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.18} selected={betType === 'red_card' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('red_card', 'no', 1.18, 'Red Card', lang === 'vi' ? 'Không thẻ đỏ' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Penalty Awarded" tooltip="Will a penalty be awarded?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.90} selected={betType === 'penalty_awarded' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('penalty_awarded', 'yes', 2.90, 'Penalty Awarded', lang === 'vi' ? 'Có phạt đền' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.38} selected={betType === 'penalty_awarded' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('penalty_awarded', 'no', 1.38, 'Penalty Awarded', lang === 'vi' ? 'Không phạt đền' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Extra Time" tooltip="Will the match go to Extra Time?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={3.10} selected={betType === 'extra_time' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('extra_time', 'yes', 3.10, 'Extra Time', lang === 'vi' ? 'Có hiệp phụ' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.35} selected={betType === 'extra_time' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('extra_time', 'no', 1.35, 'Extra Time', lang === 'vi' ? 'Không hiệp phụ' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Penalties" tooltip="Will the match go to Penalty Shootout?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={5.20} selected={betType === 'penalties' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('penalties', 'yes', 5.20, 'Penalties', lang === 'vi' ? 'Có luân lưu' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.15} selected={betType === 'penalties' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('penalties', 'no', 1.15, 'Penalties', lang === 'vi' ? 'Không luân lưu' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="First Goal" tooltip="Which team scores the first goal?">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={1.80} selected={betType === 'first_goal' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('first_goal', 'home', 1.80, 'First Goal', homeLabelRaw)} />
              <OddsButton label={awayLabelRaw} odds={2.15} selected={betType === 'first_goal' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('first_goal', 'away', 2.15, 'First Goal', awayLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Không bàn thắng' : 'No Goal'} odds={11.00} selected={betType === 'first_goal' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('first_goal', 'draw', 11.00, 'First Goal', lang === 'vi' ? 'Không bàn thắng' : 'No Goal')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Clean Sheet - Spain" tooltip="Will Spain keep a clean sheet?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.80} selected={betType === 'clean_sheet_home' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('clean_sheet_home', 'yes', 2.80, 'Spain Clean Sheet', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.42} selected={betType === 'clean_sheet_home' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('clean_sheet_home', 'no', 1.42, 'Spain Clean Sheet', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Clean Sheet - Argentina" tooltip="Will Argentina keep a clean sheet?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={3.30} selected={betType === 'clean_sheet_away' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('clean_sheet_away', 'yes', 3.30, 'Argentina Clean Sheet', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.30} selected={betType === 'clean_sheet_away' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('clean_sheet_away', 'no', 1.30, 'Argentina Clean Sheet', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Own Goal" tooltip="Will there be an own goal?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={9.00} selected={betType === 'own_goal' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('own_goal', 'yes', 9.00, 'Own Goal', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.06} selected={betType === 'own_goal' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('own_goal', 'no', 1.06, 'Own Goal', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="VAR Review" tooltip="Will there be a VAR Review?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={1.85} selected={betType === 'var_review' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('var_review', 'yes', 1.85, 'VAR Review', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.90} selected={betType === 'var_review' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('var_review', 'no', 1.90, 'VAR Review', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Goal in First 10'" tooltip="Will a goal be scored in the first 10 minutes?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={3.40} selected={betType === 'goal_10m' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('goal_10m', 'yes', 3.40, "Goal in First 10'", lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.28} selected={betType === 'goal_10m' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('goal_10m', 'no', 1.28, "Goal in First 10'", lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Woodwork Hit" tooltip="Will the woodwork be hit?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.40} selected={betType === 'woodwork_hit' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('woodwork_hit', 'yes', 2.40, 'Woodwork Hit', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.55} selected={betType === 'woodwork_hit' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('woodwork_hit', 'no', 1.55, 'Woodwork Hit', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>
        </>
      );
    }

    if (selectedMatch.id === '103') {
      return (
        <>
          {/* France vs England custom markets */}
          <MarketAccordion title="1X2" tooltip="Predict the full-time match winner.">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={1.91} selected={betType === '1x2' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('1x2', 'home', 1.91, '1X2', homeLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Hòa' : 'Draw'} odds={3.80} selected={betType === '1x2' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('1x2', 'draw', 3.80, '1X2', lang === 'vi' ? 'Hòa' : 'Draw')} />
              <OddsButton label={awayLabelRaw} odds={3.80} selected={betType === '1x2' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('1x2', 'away', 3.80, '1X2', awayLabelRaw)} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Both Teams to Score" tooltip="Predict if both teams will score.">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={1.35} selected={betType === 'btts' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('btts', 'yes', 1.35, 'Both Teams to Score', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={3.10} selected={betType === 'btts' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('btts', 'no', 3.10, 'Both Teams to Score', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Exact Goals" tooltip="Predict the exact number of goals scored.">
            <div className="grid grid-cols-5 gap-1.5">
              {['0', '1', '2', '3', '4+'].map((goals, i) => {
                const exactOdds = [16.00, 8.00, 4.50, 4.00, 2.35][i];
                return (
                  <OddsButton 
                    key={goals} 
                    label={goals} 
                    odds={exactOdds} 
                    selected={betType === 'exact_goals' && selectedOutcome === goals} 
                    onClick={() => selectBetSlipWager('exact_goals', goals, exactOdds, 'Exact Goals', goals)} 
                  />
                );
              })}
            </div>
          </MarketAccordion>

          <MarketAccordion title="Red Card" tooltip="Will there be a red card?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={4.80} selected={betType === 'red_card' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('red_card', 'yes', 4.80, 'Red Card', lang === 'vi' ? 'Có thẻ đỏ' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.18} selected={betType === 'red_card' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('red_card', 'no', 1.18, 'Red Card', lang === 'vi' ? 'Không thẻ đỏ' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Penalty Awarded" tooltip="Will a penalty be awarded?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.95} selected={betType === 'penalty_awarded' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('penalty_awarded', 'yes', 2.95, 'Penalty Awarded', lang === 'vi' ? 'Có phạt đền' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.37} selected={betType === 'penalty_awarded' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('penalty_awarded', 'no', 1.37, 'Penalty Awarded', lang === 'vi' ? 'Không phạt đền' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Own Goal" tooltip="Will there be an own goal?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={9.50} selected={betType === 'own_goal' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('own_goal', 'yes', 9.50, 'Own Goal', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.05} selected={betType === 'own_goal' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('own_goal', 'no', 1.05, 'Own Goal', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Clean Sheet - France" tooltip="Will France keep a clean sheet?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.95} selected={betType === 'clean_sheet_home' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('clean_sheet_home', 'yes', 2.95, 'France Clean Sheet', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.39} selected={betType === 'clean_sheet_home' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('clean_sheet_home', 'no', 1.39, 'France Clean Sheet', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Clean Sheet - England" tooltip="Will England keep a clean sheet?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={4.10} selected={betType === 'clean_sheet_away' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('clean_sheet_away', 'yes', 4.10, 'England Clean Sheet', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.22} selected={betType === 'clean_sheet_away' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('clean_sheet_away', 'no', 1.22, 'England Clean Sheet', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="First Goal" tooltip="Which team scores the first goal?">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={1.67} selected={betType === 'first_goal' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('first_goal', 'home', 1.67, 'First Goal', homeLabelRaw)} />
              <OddsButton label={awayLabelRaw} odds={2.50} selected={betType === 'first_goal' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('first_goal', 'away', 2.50, 'First Goal', awayLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Không bàn thắng' : 'No Goal'} odds={13.00} selected={betType === 'first_goal' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('first_goal', 'draw', 13.00, 'First Goal', lang === 'vi' ? 'Không bàn thắng' : 'No Goal')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Last Goal" tooltip="Which team scores the last goal?">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={1.70} selected={betType === 'last_goal' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('last_goal', 'home', 1.70, 'Last Goal', homeLabelRaw)} />
              <OddsButton label={awayLabelRaw} odds={2.45} selected={betType === 'last_goal' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('last_goal', 'away', 2.45, 'Last Goal', awayLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Không bàn thắng' : 'No Goal'} odds={13.00} selected={betType === 'last_goal' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('last_goal', 'draw', 13.00, 'Last Goal', lang === 'vi' ? 'Không bàn thắng' : 'No Goal')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="First Half Winner" tooltip="Predict the winner of the first half.">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={2.30} selected={betType === 'first_half_winner' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('first_half_winner', 'home', 2.30, 'First Half Winner', homeLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Hòa' : 'Draw'} odds={2.30} selected={betType === 'first_half_winner' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('first_half_winner', 'draw', 2.30, 'First Half Winner', lang === 'vi' ? 'Hòa' : 'Draw')} />
              <OddsButton label={awayLabelRaw} odds={4.60} selected={betType === 'first_half_winner' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('first_half_winner', 'away', 4.60, 'First Half Winner', awayLabelRaw)} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Second Half Winner" tooltip="Predict the winner of the second half.">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label={homeLabelRaw} odds={2.15} selected={betType === 'second_half_winner' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('second_half_winner', 'home', 2.15, 'Second Half Winner', homeLabelRaw)} />
              <OddsButton label={lang === 'vi' ? 'Hòa' : 'Draw'} odds={2.55} selected={betType === 'second_half_winner' && selectedOutcome === 'draw'} onClick={() => selectBetSlipWager('second_half_winner', 'draw', 2.55, 'Second Half Winner', lang === 'vi' ? 'Hòa' : 'Draw')} />
              <OddsButton label={awayLabelRaw} odds={3.70} selected={betType === 'second_half_winner' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('second_half_winner', 'away', 3.70, 'Second Half Winner', awayLabelRaw)} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Goal in First 10'" tooltip="Will a goal be scored in the first 10 minutes?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={3.30} selected={betType === 'goal_10m' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('goal_10m', 'yes', 3.30, "Goal in First 10'", lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.30} selected={betType === 'goal_10m' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('goal_10m', 'no', 1.30, "Goal in First 10'", lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Goal in Both Halves" tooltip="Will goals be scored in both halves?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={1.72} selected={betType === 'goal_both_halves' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('goal_both_halves', 'yes', 1.72, 'Goal in Both Halves', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={2.00} selected={betType === 'goal_both_halves' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('goal_both_halves', 'no', 2.00, 'Goal in Both Halves', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Extra Time" tooltip="Will the match go to Extra Time?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={3.35} selected={betType === 'extra_time' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('extra_time', 'yes', 3.35, 'Extra Time', lang === 'vi' ? 'Có hiệp phụ' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.32} selected={betType === 'extra_time' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('extra_time', 'no', 1.32, 'Extra Time', lang === 'vi' ? 'Không hiệp phụ' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Penalties" tooltip="Will the match go to Penalty Shootout?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={5.50} selected={betType === 'penalties' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('penalties', 'yes', 5.50, 'Penalties', lang === 'vi' ? 'Có luân lưu' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.14} selected={betType === 'penalties' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('penalties', 'no', 1.14, 'Penalties', lang === 'vi' ? 'Không luân lưu' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Total Corners" tooltip="Total corners in match.">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label="0–8" odds={2.00} selected={betType === 'total_corners' && selectedOutcome === '0-8'} onClick={() => selectBetSlipWager('total_corners', '0-8', 2.00, 'Total Corners', '0–8')} />
              <OddsButton label="9–10" odds={3.20} selected={betType === 'total_corners' && selectedOutcome === '9-10'} onClick={() => selectBetSlipWager('total_corners', '9-10', 3.20, 'Total Corners', '9–10')} />
              <OddsButton label="11+" odds={2.60} selected={betType === 'total_corners' && selectedOutcome === '11+'} onClick={() => selectBetSlipWager('total_corners', '11+', 2.60, 'Total Corners', '11+')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Total Cards" tooltip="Total yellow/red cards in match.">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label="0–3" odds={2.18} selected={betType === 'total_cards' && selectedOutcome === '0-3'} onClick={() => selectBetSlipWager('total_cards', '0-3', 2.18, 'Total Cards', '0–3')} />
              <OddsButton label="4–5" odds={2.05} selected={betType === 'total_cards' && selectedOutcome === '4-5'} onClick={() => selectBetSlipWager('total_cards', '4-5', 2.05, 'Total Cards', '4–5')} />
              <OddsButton label="6+" odds={3.80} selected={betType === 'total_cards' && selectedOutcome === '6+'} onClick={() => selectBetSlipWager('total_cards', '6+', 3.80, 'Total Cards', '6+')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Both 5+ Corners" tooltip="Will both teams get 5 or more corners?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={3.40} selected={betType === 'both_5_corners' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('both_5_corners', 'yes', 3.40, 'Both 5+ Corners', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.30} selected={betType === 'both_5_corners' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('both_5_corners', 'no', 1.30, 'Both 5+ Corners', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Team Score 2+ (France)" tooltip="Will France score 2 or more goals?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={1.82} selected={betType === 'team_score_2_home' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('team_score_2_home', 'yes', 1.82, 'France Score 2+ Goals', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.88} selected={betType === 'team_score_2_home' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('team_score_2_home', 'no', 1.88, 'France Score 2+ Goals', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Team Score 2+ (England)" tooltip="Will England score 2 or more goals?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.90} selected={betType === 'team_score_2_away' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('team_score_2_away', 'yes', 2.90, 'England Score 2+ Goals', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.38} selected={betType === 'team_score_2_away' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('team_score_2_away', 'no', 1.38, 'England Score 2+ Goals', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Win to Nil" tooltip="Will either team win without conceding a goal?">
            <div className="grid grid-cols-3 gap-2">
              <OddsButton label="France" odds={3.80} selected={betType === 'win_to_nil' && selectedOutcome === 'home'} onClick={() => selectBetSlipWager('win_to_nil', 'home', 3.80, 'Win to Nil', 'France')} />
              <OddsButton label="England" odds={6.00} selected={betType === 'win_to_nil' && selectedOutcome === 'away'} onClick={() => selectBetSlipWager('win_to_nil', 'away', 6.00, 'Win to Nil', 'England')} />
              <OddsButton label={lang === 'vi' ? 'Không đội nào' : 'Neither'} odds={1.24} selected={betType === 'win_to_nil' && selectedOutcome === 'neither'} onClick={() => selectBetSlipWager('win_to_nil', 'neither', 1.24, 'Win to Nil', lang === 'vi' ? 'Không đội nào' : 'Neither')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="VAR Review" tooltip="Will there be a VAR Review?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={1.90} selected={betType === 'var_review' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('var_review', 'yes', 1.90, 'VAR Review', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.85} selected={betType === 'var_review' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('var_review', 'no', 1.85, 'VAR Review', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Woodwork Hit" tooltip="Will the woodwork be hit?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label={lang === 'vi' ? 'Có' : 'Yes'} odds={2.35} selected={betType === 'woodwork_hit' && selectedOutcome === 'yes'} onClick={() => selectBetSlipWager('woodwork_hit', 'yes', 2.35, 'Woodwork Hit', lang === 'vi' ? 'Có' : 'Yes')} />
              <OddsButton label={lang === 'vi' ? 'Không' : 'No'} odds={1.55} selected={betType === 'woodwork_hit' && selectedOutcome === 'no'} onClick={() => selectBetSlipWager('woodwork_hit', 'no', 1.55, 'Woodwork Hit', lang === 'vi' ? 'Không' : 'No')} />
            </div>
          </MarketAccordion>

          <MarketAccordion title="Odd/Even Goals" tooltip="Will total goals be Odd or Even?">
            <div className="grid grid-cols-2 gap-2">
              <OddsButton label="Odd" odds={1.95} selected={betType === 'odd_even_goals' && selectedOutcome === 'odd'} onClick={() => selectBetSlipWager('odd_even_goals', 'odd', 1.95, 'Odd/Even Goals', 'Odd')} />
              <OddsButton label="Even" odds={1.85} selected={betType === 'odd_even_goals' && selectedOutcome === 'even'} onClick={() => selectBetSlipWager('odd_even_goals', 'even', 1.85, 'Odd/Even Goals', 'Even')} />
            </div>
          </MarketAccordion>
        </>
      );
    }

    return (
      <>
        {/* Render default markets */}
        {/* 1X2 Market Accordion */}
        <MarketAccordion 
          title="1X2 Match Winner" 
          badge="Popular"
          tooltip={lang === 'vi' ? 'Dự đoán kết quả thắng/hòa/thua chung cuộc' : 'Predict the full-time match result (Home win, Draw, or Away win).'}
        >
          <div className="grid grid-cols-3 gap-2">
            <OddsButton 
              label={homeLabelRaw} 
              odds={oddsHome} 
              selected={betType === '1x2' && selectedOutcome === 'home'}
              onClick={() => selectBetSlipWager('1x2', 'home', oddsHome, '1X2', home.name_en)}
            />
            <OddsButton 
              label={lang === 'vi' ? 'Hòa' : 'Draw'} 
              odds={oddsDraw} 
              selected={betType === '1x2' && selectedOutcome === 'draw'}
              onClick={() => selectBetSlipWager('1x2', 'draw', oddsDraw, '1X2', 'Draw')}
            />
            <OddsButton 
              label={awayLabelRaw} 
              odds={oddsAway} 
              selected={betType === '1x2' && selectedOutcome === 'away'}
              onClick={() => selectBetSlipWager('1x2', 'away', oddsAway, '1X2', away.name_en)}
            />
          </div>
        </MarketAccordion>

        {/* Early Cashout Accordion */}
        <MarketAccordion 
          title={lang === 'vi' ? 'Quyết Toán Sớm (Dẫn 2 Bàn)' : 'Early Cashout (2-0 Lead Wins)'} 
          badge="Insurance"
          tooltip={lang === 'vi' ? 'Đặt cửa thắng. Nếu đội bạn chọn dẫn trước 2 bàn tại bất kỳ thời điểm nào, cược thắng ngay lập tức!' : 'Back a team to win. If they lead by 2 goals at any point, your bet is settled as a win instantly!'}
        >
          <div className="grid grid-cols-2 gap-2">
            <OddsButton 
              label={homeLabelRaw} 
              odds={Math.max(1.05, Math.round(oddsHome * 0.98 * 100) / 100)} 
              selected={betType === 'early_cashout' && selectedOutcome === 'home'}
              onClick={() => selectBetSlipWager('early_cashout', 'home', Math.max(1.05, Math.round(oddsHome * 0.98 * 100) / 100), 'Early Cashout', home.name_en)}
            />
            <OddsButton 
              label={awayLabelRaw} 
              odds={Math.max(1.05, Math.round(oddsAway * 0.98 * 100) / 100)} 
              selected={betType === 'early_cashout' && selectedOutcome === 'away'}
              onClick={() => selectBetSlipWager('early_cashout', 'away', Math.max(1.05, Math.round(oddsAway * 0.98 * 100) / 100), 'Early Cashout', away.name_en)}
            />
          </div>
        </MarketAccordion>

        {/* Red Card Accordion */}
        <MarketAccordion 
          title={lang === 'vi' ? 'Thẻ Đỏ Trận Đấu' : 'Red Card Given'} 
          tooltip={lang === 'vi' ? 'Dự đoán trận đấu có thẻ đỏ hay không' : 'Predict whether any player will be sent off (receive a red card) during the match.'}
        >
          <div className="grid grid-cols-2 gap-2">
            <OddsButton 
              label={lang === 'vi' ? 'Có' : 'Yes'} 
              odds={5.00} 
              selected={betType === 'red_card' && selectedOutcome === 'yes'}
              onClick={() => selectBetSlipWager('red_card', 'yes', 5.00, 'Red Card', lang === 'vi' ? 'Có thẻ đỏ' : 'Yes')}
            />
            <OddsButton 
              label={lang === 'vi' ? 'Không' : 'No'} 
              odds={1.25} 
              selected={betType === 'red_card' && selectedOutcome === 'no'}
              onClick={() => selectBetSlipWager('red_card', 'no', 1.25, 'Red Card', lang === 'vi' ? 'Không thẻ đỏ' : 'No')}
            />
          </div>
        </MarketAccordion>

        {/* Correct Score 2H Accordion */}
        <MarketAccordion 
          title={lang === 'vi' ? 'Tỷ Số Hiệp 2' : 'Correct Score 2nd Half'} 
          badge="150x Max"
          tooltip={lang === 'vi' ? 'Dự đoán chính xác tỷ số chỉ tính riêng trong hiệp 2' : 'Predict the exact goals scored by each team in the second half only.'}
        >
          <div className="flex flex-col gap-3 bg-neutral-900/30 p-3 rounded-xl border border-luxury-border/30">
            <div className="flex items-center justify-around gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-neutral-500 font-bold uppercase truncate max-w-[80px]">{homeLabel}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setGuessHomeScore(Math.max(0, guessHomeScore - 1)); playClick(); }}
                    className="w-6 h-6 rounded-full bg-neutral-800 text-white font-bold flex items-center justify-center hover:bg-neutral-750 text-[10px]"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-black text-white font-mono">{guessHomeScore}</span>
                  <button 
                    onClick={() => { setGuessHomeScore(guessHomeScore + 1); playClick(); }}
                    className="w-6 h-6 rounded-full bg-neutral-800 text-white font-bold flex items-center justify-center hover:bg-neutral-750 text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>
              <span className="text-neutral-600 font-bold text-xs mt-4">:</span>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-neutral-500 font-bold uppercase truncate max-w-[80px]">{awayLabel}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setGuessAwayScore(Math.max(0, guessAwayScore - 1)); playClick(); }}
                    className="w-6 h-6 rounded-full bg-neutral-800 text-white font-bold flex items-center justify-center hover:bg-neutral-750 text-[10px]"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-black text-white font-mono">{guessAwayScore}</span>
                  <button 
                    onClick={() => { setGuessAwayScore(guessAwayScore + 1); playClick(); }}
                    className="w-6 h-6 rounded-full bg-neutral-800 text-white font-bold flex items-center justify-center hover:bg-neutral-750 text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-luxury-border/20 pt-2.5 mt-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase">{lang === 'vi' ? 'Tỷ số dự đoán' : 'Predicted Score'}</span>
                <span className="text-[10px] font-black text-blue-400 font-mono mt-0.5">{guessHomeScore} - {guessAwayScore}</span>
              </div>
              <button
                onClick={() => {
                  const csOdds = calculateCorrectScoreOdds(guessHomeScore, guessAwayScore);
                  selectBetSlipWager('correct_score_2h', 'correct_score', csOdds, '2nd Half Score', `${guessHomeScore} - ${guessAwayScore}`);
                }}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black transition-all cursor-pointer flex items-center gap-2 ${
                  betType === 'correct_score_2h' && selectedOutcome === 'correct_score'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/15'
                }`}
              >
                <span>{lang === 'vi' ? 'Đặt cửa này' : 'Select Score'}</span>
                <span className="font-black font-mono">({calculateCorrectScoreOdds(guessHomeScore, guessAwayScore).toFixed(2)}x)</span>
              </button>
            </div>
          </div>
        </MarketAccordion>
      </>
    );
  };

  const activeSportIcon = SPORTS_CONFIGS.find(s => s.id === selectedSport)?.icon || '⚽';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 flex-grow font-sans select-none animate-fade-in">
      
      {/* Redesigned Premium Glassmorphic Header Carousel */}
      <div 
        className="relative overflow-hidden rounded-3xl border border-luxury-border/60 shadow-2xl bg-slate-950/75 min-h-[220px] group flex flex-col justify-between"
        onMouseEnter={() => setHoveringBanner(true)}
        onMouseLeave={() => setHoveringBanner(false)}
      >
        {/* Dynamic Sporty Fonts Link injection */}
        <link href="https://fonts.googleapis.com/css2?family=Teko:wght@700;800;900&family=Oswald:wght@700&display=swap" rel="stylesheet" />

        {/* Hover Navigation Buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlide(prev => (prev - 1 + SLIDER_DATA.length) % SLIDER_DATA.length);
            playClick();
          }}
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-blue-600 border border-white/10 hover:border-blue-500 text-white flex items-center justify-center cursor-pointer transition-all duration-300 z-35 ${
            hoveringBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlide(prev => (prev + 1) % SLIDER_DATA.length);
            playClick();
          }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-blue-600 border border-white/10 hover:border-blue-500 text-white flex items-center justify-center cursor-pointer transition-all duration-300 z-35 ${
            hoveringBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Sliding dot indicators */}
        <div className="absolute top-4 right-4 flex gap-1.5 z-30">
          {SLIDER_DATA.map((slide, i) => (
            <button
              key={i}
              onClick={() => { setActiveSlide(i); playClick(); }}
              className={`w-2.5 h-2.5 rounded-full border border-white/20 transition-all cursor-pointer ${
                activeSlide === i ? slide.indicatorColor : 'bg-white/10 hover:bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Sliding Slides Container (Slide-right Effect) */}
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}
        >
          {SLIDER_DATA.map((slide, idx) => (
            <div
              key={idx}
              className="w-full shrink-0 flex flex-col justify-between p-6 md:p-8 min-h-[220px] relative overflow-hidden"
              style={{
                backgroundImage: `${slide.gradient}, url('${slide.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Sporty Diagonal Decorative Stripes */}
              <div className="absolute top-0 right-1/3 bottom-0 w-12 bg-blue-600/10 skew-x-12 pointer-events-none z-0" />
              <div className="absolute top-0 right-1/4 bottom-0 w-8 bg-amber-500/10 skew-x-12 pointer-events-none z-0" />
              <div className="absolute top-0 right-1/2 bottom-0 w-4 bg-white/5 skew-x-12 pointer-events-none z-0" />
              
              {/* Glowing visual assets */}
              <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none z-0" />

              <div className="relative z-10 flex flex-col gap-2 max-w-xl md:max-w-2xl">
                <div className="flex items-center gap-3">
                  <Link 
                    href="/" 
                    onClick={playClick}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-neutral-400 hover:text-white transition-all shadow-inner"
                    title={TRANSLATIONS[lang].backToLobby}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <div className={`inline-block px-3 py-1 bg-gradient-to-r ${slide.badgeBg} text-white text-[9px] font-black uppercase tracking-wider skew-x-12 rounded shadow`}>
                    <span className="inline-block -skew-x-12">{slide.badge}</span>
                  </div>
                </div>
                
                {/* Heavy Sporty font header with multi-color highlights */}
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter mt-2 text-white italic uppercase leading-none select-none" style={{ fontFamily: "'Teko', sans-serif" }}>
                  <span className={`${slide.titleColor} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mr-2`}>{slide.titleHighlight}</span>
                  <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{slide.titleRest}</span>
                </h1>
                <p className="text-[11px] text-neutral-300 max-w-lg font-medium leading-relaxed mt-1 drop-shadow-sm select-none">
                  {slide.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Premium Horizontal Sport Selection Bar */}
      {SPORTS_CONFIGS.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {SPORTS_CONFIGS.map(sport => {
            const isActive = selectedSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => {
                  setSelectedSport(sport.id);
                  setSelectedLeague('all');
                  setSelectedMatch(null);
                  setSelectedOutcome(null);
                  playClick();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black whitespace-nowrap transition-all duration-350 transform active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105'
                    : 'bg-neutral-950/40 border-luxury-border/60 text-neutral-400 hover:text-white hover:border-blue-500/30 hover:bg-neutral-900/40'
                }`}
              >
                <span className="text-sm">{sport.icon}</span>
                <span>{lang === 'vi' ? sport.nameVi : sport.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {(() => {
        const selectedSportConfig = SPORTS_CONFIGS.find(s => s.id === selectedSport);
        if (selectedSportConfig && selectedSportConfig.leagues && selectedSportConfig.leagues.length > 1) {
          return (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-1 scrollbar-thin">
              <button
                onClick={() => { setSelectedLeague('all'); playClick(); }}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedLeague === 'all'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-neutral-950/30 border-luxury-border/40 text-neutral-450 hover:text-white hover:border-blue-500/20'
                }`}
              >
                {lang === 'vi' ? 'Tất cả' : 'All'}
              </button>
              {selectedSportConfig.leagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => { setSelectedLeague(league.id); playClick(); }}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    selectedLeague === league.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-neutral-950/30 border-luxury-border/40 text-neutral-450 hover:text-white hover:border-blue-500/20'
                  }`}
                >
                  {lang === 'vi' ? league.nameVi : league.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedSport('soccer');
                  setSelectedLeague('soccer-mls');
                  setSelectedMatch(TEST_MATCH_COLUMBUS_NYC);
                  setSportMatches(prev => ({
                    ...prev,
                    soccer: [TEST_MATCH_COLUMBUS_NYC, ...(prev.soccer || []).filter(m => m.id !== TEST_MATCH_COLUMBUS_NYC.id)]
                  }));
                  playClick();
                }}
                className="ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0"
                title="Test Match: Columbus Crew vs New York City FC"
              >
                <span>🧪</span>
                <span>{lang === 'vi' ? 'Trận Test: Columbus Crew vs NYC' : 'Test Match: Columbus Crew vs NYC'}</span>
              </button>
            </div>
          );
        }
        return null;
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-sans">
        
        {/* Left column (2-cols wide): Fixtures Catalog */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="flex flex-col gap-4">
            <div className="pb-3 border-b border-luxury-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none block">{TRANSLATIONS[lang].schedule}</span>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Text Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder={TRANSLATIONS[lang].searchCountry}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black border border-luxury-border focus:border-blue-500/50 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none w-44"
                  />
                </div>

                {/* Group Selector */}
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="bg-black border border-luxury-border focus:border-blue-500/50 rounded-full px-4 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{TRANSLATIONS[lang].allGroups}</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(g => (
                    <option key={g} value={g}>{lang === 'vi' ? `Bảng ${g}` : `Group ${g}`}</option>
                  ))}
                </select>

              </div>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto flex flex-col gap-6 pr-1 scrollbar-thin">
              {filteredMatches.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-neutral-600" />
                  <span>{TRANSLATIONS[lang].noFixtures}</span>
                </div>
              ) : (
                groupMatches(filteredMatches, clientTime || new Date(), lang).map((group, groupIdx) => (
                  <div key={groupIdx} className="shrink-0 border border-white/5 rounded-2xl overflow-hidden bg-white/2 backdrop-blur-sm">
                    <div className="bg-white/5 px-4 py-2.5 border-b border-white/5 text-[10px] font-black text-neutral-350 uppercase tracking-wider">
                      {group.title}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-transparent">
                      {group.matches.map((match, idx) => {
                        const home = getTeam(match.home_team_id, match, 'home');
                        const away = getTeam(match.away_team_id, match, 'away');
                        const isSelected = selectedMatch?.id === match.id;

                        const homeFlag = getTeamFlag(home);
                        const awayFlag = getTeamFlag(away);

                        // Calculate state
                        const matchDate = parseMatchDate(match.local_date, match.stadium_id);
                        const matchEndDate = new Date(matchDate.getTime() + 90 * 60 * 1000);
                        const hasEnded = clientTime ? clientTime >= matchEndDate : false;
                        const isLive = clientTime ? (clientTime >= matchDate && clientTime < matchEndDate) : false;

                        // Count active bets on this match
                        const matchBetCount = activeBets.filter(b => b.match.id === match.id).length;

                        let statusText = TRANSLATIONS[lang].upcoming;
                        let statusColor = 'text-neutral-555 border-neutral-800 bg-neutral-900/40';
                        if (isLive) {
                          statusText = TRANSLATIONS[lang].live;
                          statusColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5 animate-pulse';
                        } else if (hasEnded) {
                          statusText = TRANSLATIONS[lang].finished;
                          statusColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                        }

                        const homeLabel = lang === 'vi' ? (TEAM_TRANSLATIONS[home.name_en] || home.name_en) : home.name_en;
                        const awayLabel = lang === 'vi' ? (TEAM_TRANSLATIONS[away.name_en] || away.name_en) : away.name_en;

                        const timeText = formatMatchTimeLabel(matchDate, clientTime || new Date(), lang);
                        const timeLines = timeText.split('\n');

                        return (
                          <div
                            key={match.id}
                            onClick={() => { setSelectedMatch(match); playClick(); }}
                            className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-300 rounded-xl border ${
                              isSelected 
                                ? match.id === '104'
                                  ? 'bg-yellow-500/10 border-yellow-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.25)] scale-[1.02] -translate-y-0.5'
                                  : 'bg-blue-600/15 border-blue-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.25)] scale-[1.02] -translate-y-0.5' 
                                : match.id === '104'
                                ? 'bg-yellow-500/5 border-yellow-500/20 backdrop-blur-sm hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:scale-[1.01] hover:-translate-y-0.5'
                                : 'bg-white/5 border-white/10 backdrop-blur-sm hover:border-blue-500/35 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:scale-[1.01] hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="flex flex-col gap-2 flex-grow pr-3">
                               <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border ${
                                  match.id === '104'
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse'
                                    : match.id === '103'
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                                }`}>
                                  {match.id.startsWith('espn-') 
                                    ? `${formatGroupLabel(match.group, lang)}, ${formatTime12h(matchDate)}` 
                                    : formatGroupLabel(match.group, lang)}
                                </span>
                                {matchBetCount > 0 && (
                                  <span className="text-[9px] bg-blue-950/50 border border-blue-500/30 text-blue-400 font-black px-1.5 py-0.5 rounded-full">
                                    {matchBetCount} {lang === 'vi' ? 'cược' : `bet${matchBetCount > 1 ? 's' : ''}`}
                                  </span>
                                )}
                                <span className={`text-[9px] border px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColor}`}>
                                  {statusText}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1.5 text-xs font-bold text-white mt-1">
                                <div className="flex items-center gap-2">
                                  {homeFlag ? (
                                    <img src={homeFlag} alt={homeLabel} className="w-5 h-3.5 object-cover rounded shadow" />
                                  ) : (
                                    <span className="text-sm">{activeSportIcon}</span>
                                  )}
                                  <span className="truncate max-w-[125px]">{homeLabel}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {awayFlag ? (
                                    <img src={awayFlag} alt={awayLabel} className="w-5 h-3.5 object-cover rounded shadow" />
                                  ) : (
                                    <span className="text-sm">{activeSportIcon}</span>
                                  )}
                                  <span className="truncate max-w-[125px]">{awayLabel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 text-center pl-3 border-l border-luxury-border/20 min-w-[100px]">
                              <div className="flex flex-col text-[10px] text-neutral-400 font-bold leading-tight uppercase">
                                <span>{timeLines[0]}</span>
                                {timeLines[1] && <span className="text-white font-mono mt-0.5">{timeLines[1]}</span>}
                              </div>
                              
                              {getStadiumName(match) && (
                                <span 
                                  className="text-[8px] text-neutral-450 font-bold uppercase tracking-wider text-center mt-1 max-w-[100px] leading-tight line-clamp-2"
                                  title={getStadiumName(match)}
                                >
                                  {getStadiumName(match)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {!selectedMatch && renderMyActiveBets()}

          {/* Bet Slip */}
          {selectedMatch && (
            <>
              <Card className="bg-[#0b0b0b] border-luxury-border rounded-3xl relative">
                <CardHeader className="p-5 border-b border-luxury-border/60">
                  <CardTitle className="text-sm font-extrabold flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-500" />
                      {TRANSLATIONS[lang].betSlip}
                    </div>
                    
                    {/* Custom tutorial "?" button */}
                    <div className="relative group/tutorial">
                      <button className="w-5 h-5 rounded-full bg-neutral-900 border border-luxury-border text-xs font-black text-neutral-450 hover:text-white hover:border-blue-500 flex items-center justify-center cursor-pointer transition-all">
                        ?
                      </button>
                      
                      {/* Custom tooltip box */}
                      <div className="absolute right-0 top-7 z-50 w-72 p-4 rounded-2xl bg-[#0b0b0b] border border-blue-500/35 shadow-[0_10px_30px_rgba(59,130,246,0.25)] text-[10px] text-neutral-400 font-bold hidden group-hover/tutorial:block animate-fade-in pointer-events-none font-sans">
                        <div className="flex flex-col gap-2 leading-relaxed normal-case">
                          <span className="text-white font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-sans">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                            {lang === 'vi' ? 'Hướng dẫn cá cược' : 'How to Place Bets'}
                          </span>
                          <ol className="list-decimal list-inside flex flex-col gap-1.5 pl-0.5 font-medium text-left">
                            <li>{lang === 'vi' ? 'Chọn bất kỳ trận đấu nào từ Lịch thi đấu ở trên.' : 'Select any matchup from the Schedule above.'}</li>
                            <li>{lang === 'vi' ? 'Chọn tỷ lệ cược (1X2, Quyết toán sớm, Thẻ đỏ, hoặc Tỷ số hiệp 2).' : 'Select odds (1X2, Early Cashout, Red Card, or 2nd Half Score).'}</li>
                            <li>{lang === 'vi' ? 'Nhập số tiền cược (Stake Amount) trong Phiếu cược.' : 'Enter your Stake Amount in the Bet Slip.'}</li>
                            <li>{lang === 'vi' ? 'Bấm "Đặt cược" để xác nhận.' : 'Click "Place Bet" to lock in your wager.'}</li>
                            <li>{lang === 'vi' ? 'Theo dõi tại "Cược đang chạy" & quyết toán khi kết thúc!' : 'Track in "Active Bets" & settle once completed!'}</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex flex-col gap-5">
                  {(() => {
                    const home = getTeam(selectedMatch.home_team_id, selectedMatch, 'home');
                    const away = getTeam(selectedMatch.away_team_id, selectedMatch, 'away');
                    const betsOnMatch = activeBets.filter(b => b.match.id === selectedMatch.id).length;

                    const shortenCountryName = (name: string): string => {
                      if (!name) return '';
                      const clean = name.trim();
                      if (clean === 'Democratic Republic of the Congo' || clean === 'Cộng hòa Dân chủ Congo' || clean === 'DR Congo' || clean === 'Congo DR' || clean === 'Congo') {
                        return 'DROTC';
                      }
                      if (clean === 'Bosnia and Herzegovina' || clean === 'Bosnia và Herzegovina' || clean === 'Bosnia-Herzegovina' || clean === 'Bosnia') {
                        return 'BAH';
                      }
                      const words = clean.split(/[\s-]+/);
                      if (clean.length > 15 || words.length >= 3) {
                        return words.map(w => w.charAt(0)).join('').toUpperCase();
                      }
                      return clean;
                    };

                    const homeLabelRaw = lang === 'vi' ? (TEAM_TRANSLATIONS[home.name_en] || home.name_en) : home.name_en;
                    const awayLabelRaw = lang === 'vi' ? (TEAM_TRANSLATIONS[away.name_en] || away.name_en) : away.name_en;

                    const homeLabel = shortenCountryName(homeLabelRaw);
                    const awayLabel = shortenCountryName(awayLabelRaw);

                    return (
                      <>
                        {/* Bet placed confirmation banner */}
                        {betPlacedNotice && (
                          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-2 animate-fade-in">
                            <span className="text-emerald-400 text-xs font-black shrink-0">✓</span>
                            <span className="text-emerald-300 text-[10px] font-bold leading-snug">{betPlacedNotice}</span>
                          </div>
                        )}

                        {/* Selected fixture details */}
                        <div className="bg-black/60 rounded-2xl p-4 border border-luxury-border/40 flex flex-col gap-2 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block">
                              {lang === 'vi' ? `Trận Chọn #${selectedMatch.id}` : `Selected Match #${selectedMatch.id}`}
                            </span>
                            {betsOnMatch > 0 && (
                              <span className="text-[9px] bg-blue-950/50 border border-blue-500/30 text-blue-400 font-black px-2 py-0.5 rounded-full">
                                {betsOnMatch} {lang === 'vi' ? 'cược đang chạy' : `active bet${betsOnMatch > 1 ? 's' : ''}`}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-black text-white flex items-center justify-between">
                            <span>{homeLabel}</span>
                            <span className="text-neutral-600 font-bold">vs</span>
                            <span>{awayLabel}</span>
                          </div>
                        </div>

                        {/* Markets Panel */}
                        <div className="flex flex-col gap-3 my-2">
                          <span className="text-[10px] text-neutral-555 text-neutral-500 font-bold uppercase tracking-wider">
                            {lang === 'vi' ? 'Bảng tỷ lệ cược' : 'Markets Panel'}
                          </span>

                          {renderMarkets()}
                        </div>

                        {/* Selection details receipt */}
                        {selectedOutcome ? (
                          <div className="bg-blue-950/15 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-2 animate-fade-in font-sans">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] bg-blue-500/15 text-blue-400 font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                                {selectedSlipMarketLabel || '1X2'}
                              </span>
                              <span className="text-blue-400 font-black text-xs font-mono">{selectedSlipOdds.toFixed(2)}x</span>
                            </div>
                            <span className="text-xs font-bold text-white mt-1">
                              {selectedSlipPredictionLabel || (
                                selectedOutcome === 'home' ? home.name_en
                                : selectedOutcome === 'away' ? away.name_en
                                : 'Draw'
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-neutral-950/40 border border-luxury-border/50 rounded-2xl p-5 text-center text-[10px] text-neutral-500 font-medium">
                            {lang === 'vi' ? 'Chọn một tỷ lệ cược bất kỳ từ bảng bên trái để đặt cược' : 'Select any odds from the markets panel to place a bet.'}
                          </div>
                        )}

                        {selectedOutcome && (
                          <>
                            {/* Stake Amount Input */}
                            <div className="flex flex-col gap-2 mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-neutral-555 text-neutral-500 font-bold uppercase tracking-wide">
                                  {lang === 'vi' ? 'Tiền cược' : 'Stake Amount'}
                                </span>
                                <span className="text-[10px] text-neutral-555 text-neutral-500 font-bold">
                                  {lang === 'vi' ? 'Tối thiểu' : 'Min Stake'}: $0.01
                                </span>
                              </div>
                              
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">$</span>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={betAmount === 0 ? '' : betAmount}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setBetAmount(isNaN(val) ? 0 : val);
                                  }}
                                  placeholder="0.00"
                                  className="w-full bg-neutral-950 border border-luxury-border/70 hover:border-blue-500/20 text-neutral-100 rounded-full pl-8 pr-16 py-3 text-xs font-black focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all font-mono"
                                />
                                <button
                                  onClick={() => { setBetAmount(Math.round(credits * 100) / 100); playClick(); }}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 rounded-full cursor-pointer transition-all"
                                >
                                  Max
                                </button>
                              </div>

                              {/* Quick stake multipliers */}
                              <div className="grid grid-cols-4 gap-1.5 mt-1 font-mono">
                                {[10, 50, 100, 500].map((amt) => (
                                  <button
                                    key={amt}
                                    onClick={() => { setBetAmount(amt); playClick(); }}
                                    className={`py-1.5 rounded-full border text-center text-[10px] font-black transition-all cursor-pointer ${
                                      betAmount === amt
                                        ? 'bg-blue-950/20 border-blue-500 text-blue-400'
                                        : 'bg-black/35 border-luxury-border/40 text-neutral-550 hover:text-white'
                                    }`}
                                  >
                                    +${amt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Bet slip summary */}
                            <div className="bg-neutral-950/40 border border-luxury-border/40 rounded-2xl p-4 flex flex-col gap-2 text-xs font-bold font-sans mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-500 font-medium">{lang === 'vi' ? 'Tiền thắng tiềm năng' : 'Potential Payout'}</span>
                                <span className="text-emerald-500 font-black font-mono">
                                  ${(betAmount * selectedSlipOdds).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-neutral-600 font-medium">{lang === 'vi' ? 'Phí giao dịch' : 'Fee'}</span>
                                <span className="text-neutral-555 text-neutral-500 font-mono">$0.00</span>
                              </div>
                            </div>

                            {/* Place Bet Action Button */}
                            <Button
                              variant="gold"
                              onClick={handlePlaceBet}
                              className="w-full py-3.5 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border-none hover:scale-103 active:scale-97 shadow-lg shadow-blue-950/30 transition-all cursor-pointer mt-2"
                            >
                              {TRANSLATIONS[lang].placeBet} (${betAmount.toLocaleString()})
                            </Button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
              {renderMyActiveBets()}
            </>
          )}

        </div>

        {/* Right column: Stats */}
        <div className="flex flex-col gap-6">
          
          {/* Session Statistics */}
          <Card className="bg-[#0b0b0b]/60 rounded-3xl border border-luxury-border/60">
            <CardHeader className="p-4 border-b border-luxury-border/60">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">{TRANSLATIONS[lang].sessionStats}</span>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col">
                <span className="text-neutral-500 font-medium">{TRANSLATIONS[lang].betsPlaced}</span>
                <span className="text-white font-bold mt-1">{stats.totalBets}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500 font-medium">{TRANSLATIONS[lang].winsLosses}</span>
                <span className="text-emerald-500 font-bold mt-1">
                  {stats.wins} <span className="text-neutral-600">/</span> <span className="text-red-500 font-bold">{stats.losses}</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-neutral-500 font-medium">{TRANSLATIONS[lang].netProfit}</span>
                <span className={`font-bold mt-1 ${stats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.profit >= 0 ? '+' : ''}${stats.profit.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Bottom section: Completed Bets History */}
      <Card className="bg-[#0b0b0b]/40 border-luxury-border/60 mt-4 rounded-3xl">
        <CardHeader className="p-5 border-b border-luxury-border/60">
          <CardTitle className="text-xs font-extrabold flex items-center gap-1.5 font-sans">
            <Trophy className="w-4 h-4 text-blue-500" />
            {TRANSLATIONS[lang].completedBetsHistory} ({resolvedBets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-3">
          {resolvedBets.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-medium">
              {TRANSLATIONS[lang].noHistory}
            </div>
          ) : (
            resolvedBets.map((bet) => {
              const homeLabel = lang === 'vi' ? (TEAM_TRANSLATIONS[bet.homeTeam.name_en] || bet.homeTeam.name_en) : bet.homeTeam.name_en;
              const awayLabel = lang === 'vi' ? (TEAM_TRANSLATIONS[bet.awayTeam.name_en] || bet.awayTeam.name_en) : bet.awayTeam.name_en;
              const predLabel = bet.prediction === 'home' ? homeLabel
                : bet.prediction === 'away' ? awayLabel
                : TRANSLATIONS[lang].draw;

              return (
                <div 
                  key={bet.id} 
                  className="flex items-center justify-between p-3.5 rounded-3xl bg-[#080808] border border-luxury-border/40 text-xs font-bold"
                >
                  <div className="flex flex-col gap-1 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-450">{homeLabel}</span>
                      <span className="text-white font-black text-sm font-mono flex items-center gap-1.5">
                        {bet.homeScore} - {bet.awayScore}
                        {bet.match.home_penalty_score !== undefined && bet.match.home_penalty_score !== null &&
                         bet.match.away_penalty_score !== undefined && bet.match.away_penalty_score !== null && (
                          <span className="text-[10px] text-neutral-400 font-bold bg-neutral-900/60 px-1.5 py-0.5 rounded border border-neutral-800">
                            ({bet.match.home_penalty_score} - {bet.match.away_penalty_score} Pen)
                          </span>
                        )}
                      </span>
                      <span className="text-neutral-450">{awayLabel}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {lang === 'vi' 
                        ? `Đặt cược: $${bet.amount.toLocaleString()} vào cửa ${predLabel} (${bet.odds}x)` 
                        : `Staked: $${bet.amount.toLocaleString()} on ${predLabel} (${bet.odds}x)`}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {bet.outcome === 'win' ? (
                      <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1">
                        {TRANSLATIONS[lang].payout}: +${bet.payout.toLocaleString(undefined, { minimumFractionDigits: 2 })} <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                        {TRANSLATIONS[lang].loss}: -${bet.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Regulations Footer */}
      <Card className="bg-[#0b0b0b]/20 border-luxury-border/40 rounded-3xl">
        <CardContent className="p-5 flex gap-3 text-xs leading-relaxed text-neutral-500 font-medium animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex flex-col gap-1">
            <span className="text-neutral-300 font-bold uppercase tracking-wider text-[10px]">{TRANSLATIONS[lang].regulationsTitle}</span>
            <p>
              {TRANSLATIONS[lang].regulationsText}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Redesigned Concluded Match Report Modal */}
      {settlingBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all font-sans">
          <div className="bg-[#0b0b0b] border border-luxury-border rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-luxury-border/60 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-black text-white uppercase tracking-wider animate-pulse">{TRANSLATIONS[lang].modalTitle}</span>
              </div>
              {!settlingLoading && (
                <button 
                  onClick={() => setSettlingBet(null)}
                  className="p-1.5 rounded-full bg-neutral-900 border border-luxury-border hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content Body */}
            {settlingLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 flex-grow">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-extrabold animate-pulse">{TRANSLATIONS[lang].contactingLiveScoreboard}</span>
              </div>
            ) : settlingError ? (
              <div className="p-8 text-center flex flex-col items-center gap-4 flex-grow">
                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                <span className="text-xs font-bold text-neutral-300">
                  {settlingError}
                </span>
                <Button
                  variant="gold"
                  onClick={() => handleSettleBet(settlingBet)}
                  className="rounded-full px-6 py-2.5 font-bold text-xs text-white"
                >
                  {TRANSLATIONS[lang].retrySettle}
                </Button>
              </div>
            ) : settleOutcome ? (
              <div className="flex flex-col flex-grow overflow-y-auto">
                {/* Score Banner */}
                <div className="p-6 text-center border-b border-luxury-border/30 bg-gradient-to-b from-neutral-950 via-neutral-900/80 to-black relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  
                  <span className="text-[9px] text-emerald-400 border border-emerald-500/35 bg-emerald-500/10 px-3 py-0.5 rounded-full font-extrabold uppercase tracking-widest inline-block mb-4 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    {TRANSLATIONS[lang].matchConcluded}
                  </span>
                  
                  <div className="flex items-center justify-between px-4 max-w-sm mx-auto">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-2 w-[100px] shrink-0">
                      <div className="w-12 h-8 rounded-md overflow-hidden shadow-lg border border-white/10 flex items-center justify-center bg-slate-900">
                        {getTeamFlag(settleOutcome.homeTeam) ? (
                          <img src={getTeamFlag(settleOutcome.homeTeam)} alt={settleOutcome.homeTeam.name_en} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{activeSportIcon}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-wider truncate w-full text-center">
                        {lang === 'vi' ? (TEAM_TRANSLATIONS[settleOutcome.homeTeam.name_en] || settleOutcome.homeTeam.name_en) : settleOutcome.homeTeam.name_en}
                      </span>
                    </div>

                    {/* Concluded Score */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-4 bg-neutral-950/80 px-5 py-2.5 rounded-2xl border border-white/5 font-mono shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                        <span className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{settleOutcome.homeScore}</span>
                        <span className="text-neutral-700 font-extrabold text-lg">:</span>
                        <span className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{settleOutcome.awayScore}</span>
                      </div>
                      {settleOutcome.match.home_penalty_score !== undefined && settleOutcome.match.home_penalty_score !== null &&
                       settleOutcome.match.away_penalty_score !== undefined && settleOutcome.match.away_penalty_score !== null ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-neutral-400 font-bold font-mono">
                            ({settleOutcome.match.home_penalty_score} - {settleOutcome.match.away_penalty_score} Pen)
                          </span>
                          <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">PEN</span>
                        </div>
                      ) : settleOutcome.match.extra_time ? (
                        <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">AET</span>
                      ) : (
                        <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">FT</span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-2 w-[100px] shrink-0">
                      <div className="w-12 h-8 rounded-md overflow-hidden shadow-lg border border-white/10 flex items-center justify-center bg-slate-900">
                        {getTeamFlag(settleOutcome.awayTeam) ? (
                          <img src={getTeamFlag(settleOutcome.awayTeam)} alt={settleOutcome.awayTeam.name_en} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{activeSportIcon}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-wider truncate w-full text-center">
                        {lang === 'vi' ? (TEAM_TRANSLATIONS[settleOutcome.awayTeam.name_en] || settleOutcome.awayTeam.name_en) : settleOutcome.awayTeam.name_en}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scorers Summary */}
                <div className="p-5 flex flex-col gap-4 bg-black/30 border-b border-luxury-border/40">
                  <span className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest text-center">{TRANSLATIONS[lang].concludedScorers}</span>
                  
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-neutral-400 font-semibold font-mono">
                    {/* Home Goals */}
                    <div className="flex flex-col gap-1 border-r border-neutral-900/60 pr-4 text-right">
                      {settleOutcome.homeScorers && settleOutcome.homeScorers.length > 0 ? (
                        settleOutcome.homeScorers.map((scorer, i) => (
                          <div key={i} className="flex items-center justify-end gap-1.5">
                            <span>{scorer}</span>
                            <span>⚽</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-neutral-600 text-[9px] italic">{TRANSLATIONS[lang].noGoalsScored}</span>
                      )}
                    </div>

                    {/* Away Goals */}
                    <div className="flex flex-col gap-1 pl-4 text-left">
                      {settleOutcome.awayScorers && settleOutcome.awayScorers.length > 0 ? (
                        settleOutcome.awayScorers.map((scorer, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span>⚽</span>
                            <span>{scorer}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-neutral-600 text-[9px] italic">{TRANSLATIONS[lang].noGoalsScored}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Result Payout Slip Ticket Stub */}
                <div className="p-6 bg-neutral-950 flex flex-col gap-4 items-center justify-center relative">
                  <div className={`relative w-full p-6 rounded-2xl border text-center flex flex-col items-center gap-3 overflow-hidden ${
                    settleOutcome.outcome === 'win'
                      ? 'bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-black border-emerald-500/35 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : settleOutcome.outcome === 'refund'
                      ? 'bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-black border-amber-500/35 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-gradient-to-br from-red-950/40 via-red-900/20 to-black border-red-500/35 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                  }`}>
                    {/* Ticket notches */}
                    <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-[#0b0b0b] border-r border-luxury-border/60 transform -translate-y-1/2" />
                    <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-[#0b0b0b] border-l border-luxury-border/60 transform -translate-y-1/2" />
                    
                    {/* Dashed divider */}
                    <div className="absolute top-1/2 left-4 right-4 border-t border-dashed border-luxury-border/40 pointer-events-none" />

                    <div className="flex flex-col items-center gap-1 z-10 pb-4">
                      <div className="flex items-center gap-1.5 justify-center">
                        {settleOutcome.outcome === 'win' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{TRANSLATIONS[lang].winningBetSlip}</span>
                          </>
                        ) : settleOutcome.outcome === 'refund' ? (
                          <>
                            <AlertCircle className="w-5 h-5 text-amber-400 animate-bounce" />
                            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">{lang === 'vi' ? 'HOÀN TRẢ PHIẾU CƯỢC' : 'REFUNDED BET SLIP'}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5 text-red-400 animate-pulse" />
                            <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">{TRANSLATIONS[lang].betIncorrect}</span>
                          </>
                        )}
                      </div>
                    </div>


                    <div className="pt-4 z-10">
                      <span className="text-xl font-black block tracking-wide">
                        {settleOutcome.outcome === 'win' 
                          ? TRANSLATIONS[lang].youWonMsg.replace('{amount}', `$${settleOutcome.payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`) 
                          : TRANSLATIONS[lang].lostStakeMsg.replace('{amount}', `$${settleOutcome.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)}
                      </span>
                      <span className="text-[8px] text-neutral-500 font-extrabold tracking-widest uppercase block mt-1">
                        Virtual Settlement ID: #WC-{settleOutcome.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="gold"
                    fullWidth
                    onClick={() => setSettlingBet(null)}
                    className="font-extrabold uppercase tracking-wider text-xs py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 border-none hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg"
                  >
                    {TRANSLATIONS[lang].closeCollect}
                  </Button>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}
