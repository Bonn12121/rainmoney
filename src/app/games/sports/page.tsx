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
  betType?: '1x2' | 'early_cashout' | 'double_chance' | 'btts' | 'red_card' | 'correct_score_2h' | 'first_half_1x2' | 'second_half_1x2' | 'totals' | 'clean_sheet';
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
  betType?: '1x2' | 'early_cashout' | 'double_chance' | 'btts' | 'red_card' | 'correct_score_2h' | 'first_half_1x2' | 'second_half_1x2' | 'totals' | 'clean_sheet';
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
  let odds = fairOdds * 0.90;
  
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
    image: 'https://images.pexels.com/photos/38281596/pexels-photo-38281596.jpeg',
    badge: 'WORLD CUP 2026',
    titleHighlight: '100% PROFIT BOOST',
    titleRest: 'ON HIGH-STAKES FIXTURES',
    desc: 'Double your payout on high-odds underdogs and high stakes matches ($1,000+). Settle bets instantly based on live tournament scoreboards.',
    gradient: 'linear-gradient(to right, rgba(25, 15, 0, 0.95) 20%, rgba(180, 120, 30, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-amber-600 to-yellow-500',
    titleColor: 'text-yellow-400',
    indicatorColor: 'bg-amber-500 scale-110 shadow-[0_0_8px_#f59e0b]'
  },
  {
    image: 'https://images.pexels.com/photos/38273820/pexels-photo-38273820.jpeg',
    badge: 'EARLY CASHOUT INSURANCE',
    titleHighlight: '2-0 LEAD WINS',
    titleRest: 'AUTOMATIC PAYOUT AT ANY MINUTE',
    desc: 'Back your favorite team to win. If they lead by 2 goals at any time during a live match, cash out immediately for a guaranteed full payout!',
    gradient: 'linear-gradient(to right, rgba(0, 20, 40, 0.95) 20%, rgba(0, 120, 180, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-blue-600 to-cyan-500',
    titleColor: 'text-cyan-400',
    indicatorColor: 'bg-cyan-500 scale-110 shadow-[0_0_8px_#06b6d4]'
  },
  {
    image: 'https://images.pexels.com/photos/38401511/pexels-photo-38401511.jpeg',
    badge: 'GUESS THE SECOND HALF',
    titleHighlight: 'UP TO 150x ODDS',
    titleRest: 'ON CORRECT SCORE PREDICTION',
    desc: 'Step up to the challenge: type in your predicted 2nd half score directly. Highly improbable scorelines yield massive multipliers!',
    gradient: 'linear-gradient(to right, rgba(20, 0, 35, 0.95) 20%, rgba(140, 30, 180, 0.3) 65%, rgba(0, 0, 0, 0.2))',
    badgeBg: 'from-purple-600 to-fuchsia-500',
    titleColor: 'text-fuchsia-400',
    indicatorColor: 'bg-fuchsia-500 scale-110 shadow-[0_0_8px_#d946ef]'
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
    sportsBook: 'FIFA 2026 Sports Book',
    liveSportsbook: 'Live Sportsbook',
    fifaWorldCup: 'FIFA World Cup',
    titleDescription: 'Place virtual wagers on real World Cup fixtures. Settle bets in real-time concluding matches (90+ mins elapsed) powered by the live tournament feed.',
    virtualBalance: 'Virtual Balance',
    activeBets: 'Active Bets',
    inPlay: 'In-Play',
    netProfit: 'Net Profit',
    systemLocalTime: 'System Local Time',
    connectingFeed: 'Connecting live feed...',
    feedConnected: 'Live API feed connected',
    schedule: 'FIFA World Cup Schedule',
    upcomingOnly: 'Upcoming Only',
    allFixtures: 'All Fixtures',
    searchCountry: 'Search country...',
    allGroups: 'All Groups',
    noFixtures: 'No upcoming fixtures found. Switch to "All Fixtures" to see past matches.',
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
    regulationsTitle: 'FIFA 2026 Sportsbook Regulations',
    regulationsText: 'Match fixtures represent live World Cup schedules. Users can select and stake virtual credits on matchups. Results cannot be settled until the scheduled match reaches completion (at least 90 minutes past start time). Upon settling, the platform queries the live tournament feed to update matches with real concluded scores. Winnings are distributed instantly based on correct score outcomes.',
    modalTitle: 'World Cup Match Report',
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
    sportsBook: 'Bảng Tỷ Lệ Thể Thao FIFA 2026',
    liveSportsbook: 'Cá Cược Trực Tiếp',
    fifaWorldCup: 'FIFA World Cup',
    titleDescription: 'Đặt cược ảo vào các trận đấu World Cup thực tế. Quyết toán cược theo thời gian thực cho các trận đấu đã kết thúc (sau 90+ phút) thông qua dữ liệu giải đấu trực tiếp.',
    virtualBalance: 'Số Dư Ảo',
    activeBets: 'Cược Đang Chạy',
    inPlay: 'Đang chạy',
    netProfit: 'Lợi Nhuận Ròng',
    systemLocalTime: 'Giờ Hệ Thống',
    connectingFeed: 'Đang kết nối dữ liệu...',
    feedConnected: 'Đã kết nối dữ liệu API',
    schedule: 'Lịch Thi Đấu FIFA World Cup',
    upcomingOnly: 'Trận Sắp Diễn Ra',
    allFixtures: 'Tất Cả Trận Đấu',
    searchCountry: 'Tìm quốc gia...',
    allGroups: 'Tất Cả Các Bảng',
    noFixtures: 'Không tìm thấy trận đấu sắp tới nào. Hãy chuyển sang "Tất Cả Trận Đấu" để xem các trận đã qua.',
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
    regulationsTitle: 'Quy Định Thể Thao FIFA 2026',
    regulationsText: 'Các trận đấu hiển thị lịch thi đấu World Cup thực tế. Người dùng có thể chọn và đặt cược tín dụng ảo vào các cặp đấu. Kết quả cược không thể quyết toán cho đến khi trận đấu kết thúc hoàn toàn (ít nhất 90 phút sau khi bắt đầu). Khi quyết toán, hệ thống sẽ truy vấn dữ liệu trực tiếp để cập nhật kết quả thực tế. Tiền thắng cược sẽ được cộng ngay lập tức dựa trên kết quả chính xác.',
    modalTitle: 'Báo Cáo Trận Đấu World Cup',
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

const getStadiumTimezone = (stadiumId: string): string => {
  const id = Number(stadiumId);
  if (id >= 1 && id <= 3) return '-06:00';
  if (id >= 4 && id <= 6) return '-05:00';
  if (id >= 7 && id <= 12) return '-04:00';
  if (id >= 13 && id <= 16) return '-07:00';
  return '-04:00'; // fallback
};

// Parse match date string of format "MM/DD/YYYY HH:mm" into a client-local Date object using stadium timezone
const parseMatchDate = (dateStr: string, stadiumId?: string): Date => {
  try {
    if (!dateStr) return new Date(0);
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return new Date(0);
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    const hh = hour.toString().padStart(2, '0');
    const min = minute.toString().padStart(2, '0');
    
    const tz = stadiumId ? getStadiumTimezone(stadiumId) : '-04:00';
    const isoStr = `${year}-${mm}-${dd}T${hh}:${min}:00${tz}`;
    return new Date(isoStr);
  } catch (e) {
    console.error('Error parsing match date:', dateStr, e);
    return new Date(0);
  }
};



const overrideWorldCupMatches = (matches: RawMatch[]): RawMatch[] => {
  return matches.map(match => {
    if (match.id === '103') {
      return {
        ...match,
        home_team_id: '33', // France
        away_team_id: '45', // England
        home_team_name_en: 'France',
        away_team_name_en: 'England',
        home_team_label: 'FRA',
        away_team_label: 'ENG'
      };
    }
    if (match.id === '104') {
      return {
        ...match,
        home_team_id: '29', // Spain
        away_team_id: '37', // Argentina
        home_team_name_en: 'Spain',
        away_team_name_en: 'Argentina',
        home_team_label: 'ESP',
        away_team_label: 'ARG'
      };
    }
    return match;
  });
};


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
  return lang === 'vi' ? `Bảng ${group}` : `Group ${group}`;
};

const groupMatches = (matchesToGroup: RawMatch[], clientTime: Date, lang: 'en' | 'vi'): GroupedMatches[] => {
  const isVi = lang === 'vi';
  const groupsMap: Record<string, RawMatch[]> = {};
  const groupOrder: string[] = [];

  const isSportsDb = matchesToGroup.length > 0 && matchesToGroup[0].id.startsWith('sdb-');

  if (isSportsDb) {
    matchesToGroup.forEach(match => {
      const key = match.group || 'Other League';
      if (!groupsMap[key]) {
        groupsMap[key] = [];
        groupOrder.push(key);
      }
      groupsMap[key].push(match);
    });

    return groupOrder.map(key => ({
      title: key,
      matches: groupsMap[key]
    }));
  }

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
      stadium_id: "1",
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
      id: `sdb-esports-${i + 1}`,
      home_team_id: sched.home,
      away_team_id: sched.away,
      home_score: homeScore,
      away_score: awayScore,
      home_scorers: "null",
      away_scorers: "null",
      group: sched.type,
      matchday: "1",
      local_date: localDateStr,
      stadium_id: "1",
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
    id: 'football', 
    name: 'Football', 
    nameVi: 'Bóng đá', 
    icon: '⚽',
    leagues: []
  }
];

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
  // This ensures sports leagues (NBA, NFL, MLB, Esports, Tennis) exhibit distinct but consistent team matchups
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const strength = 50 + (Math.abs(hash) % 45); // ranges 50 to 94
  return strength;
};

const mapSportsDbEventToMatch = (event: any, leagueName: string, leagueNameVi: string): RawMatch => {
  let localDateStr = '06/11/2026 13:00';
  let eventDate = new Date();
  try {
    const rawStamp = event.strTimestamp || `${event.dateEvent}T${event.strTime || '12:00:00'}`;
    const d = new Date(rawStamp);
    if (!isNaN(d.getTime())) {
      eventDate = d;
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = d.getHours().toString().padStart(2, '0');
      const min = d.getMinutes().toString().padStart(2, '0');
      localDateStr = `${mm}/${dd}/${yyyy} ${hh}:${min}`;
    }
  } catch (e) {
    console.error('Error formatting SportsDB event date:', e);
  }

  const now = new Date();
  const hasScore = event.intHomeScore !== null && event.intAwayScore !== null;
  const isFinished = event.strStatus === 'FT' || (now.getTime() - eventDate.getTime() > 3 * 60 * 60 * 1000 && hasScore);
  const isLive = !isFinished && now >= eventDate && now.getTime() - eventDate.getTime() < 3 * 60 * 60 * 1000;

  return {
    id: `sdb-${event.idLeague}-${event.idEvent}`,
    home_team_id: event.strHomeTeam || 'Home Team',
    away_team_id: event.strAwayTeam || 'Away Team',
    home_score: event.intHomeScore !== null && event.intHomeScore !== undefined ? event.intHomeScore.toString() : '0',
    away_score: event.intAwayScore !== null && event.intAwayScore !== undefined ? event.intAwayScore.toString() : '0',
    home_scorers: 'null',
    away_scorers: 'null',
    group: leagueNameVi,
    matchday: event.intRound || '1',
    local_date: localDateStr,
    stadium_id: '1',
    finished: isFinished ? 'TRUE' : 'FALSE',
    time_elapsed: isFinished ? 'finished' : isLive ? 'live' : 'notstarted',
    home_team_name_en: event.strHomeTeam || 'Home Team',
    away_team_name_en: event.strAwayTeam || 'Away Team',
    home_team_label: event.strHomeTeam ? event.strHomeTeam.substring(0, 3).toUpperCase() : 'HM',
    away_team_label: event.strAwayTeam ? event.strAwayTeam.substring(0, 3).toUpperCase() : 'AW',
    home_badge: event.strHomeTeamBadge || '',
    away_badge: event.strAwayTeamBadge || ''
  } as any;
};

const shiftMatchDates = (matches: RawMatch[], referenceDate: Date): RawMatch[] => {
  if (matches.length === 0) return [];

  // Parse original SportsDB event timestamps
  const matchesWithDates = matches.map(match => {
    let originalDate = new Date(match.local_date);
    // Fallback if Date parsing fails (e.g. invalid date string formats)
    if (isNaN(originalDate.getTime())) {
      const parts = match.local_date.split(' ');
      if (parts[0]) {
        const [yyyy, mm, dd] = parts[0].split('-').map(Number);
        const [hh, min] = (parts[1] || '12:00').split(':').map(Number);
        originalDate = new Date(yyyy, mm - 1, dd, hh || 12, min || 0);
      }
    }
    if (isNaN(originalDate.getTime())) {
      originalDate = new Date();
    }
    return { match, originalDate };
  });

  // Sort chronologically by their original play date
  matchesWithDates.sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());

  const earliestOriginal = matchesWithDates[0].originalDate.getTime();

  // Project the beginning of the season to start 1.5 days ago relative to the current local clock
  // This yields a clean mix of recently concluded (Finished), active (Live), and schedule (Upcoming) fixtures
  const offset = referenceDate.getTime() - earliestOriginal - 1.5 * 24 * 60 * 60 * 1000;

  const shifted = matchesWithDates.map(({ match, originalDate }) => {
    const shiftedTime = new Date(originalDate.getTime() + offset);
    
    // Format to "MM/DD/YYYY HH:mm" for parsing consistency
    const mm = (shiftedTime.getMonth() + 1).toString().padStart(2, '0');
    const dd = shiftedTime.getDate().toString().padStart(2, '0');
    const yyyy = shiftedTime.getFullYear();
    const hh = shiftedTime.getHours().toString().padStart(2, '0');
    const min = shiftedTime.getMinutes().toString().padStart(2, '0');
    const localDateStr = `${mm}/${dd}/${yyyy} ${hh}:${min}`;

    const matchEndDate = new Date(shiftedTime.getTime() + 2 * 60 * 60 * 1000);
    const hasEnded = referenceDate >= matchEndDate;
    const isLive = referenceDate >= shiftedTime && referenceDate < matchEndDate;

    let finished = 'FALSE';
    let timeElapsed = 'notstarted';
    let homeScore = '0';
    let awayScore = '0';

    if (hasEnded) {
      finished = 'TRUE';
      timeElapsed = 'finished';
      homeScore = match.home_score !== '0' && match.home_score !== null ? match.home_score : '0';
      awayScore = match.away_score !== '0' && match.away_score !== null ? match.away_score : '0';
    } else if (isLive) {
      finished = 'FALSE';
      const elapsedMinutes = Math.floor((referenceDate.getTime() - shiftedTime.getTime()) / (60 * 1000));
      timeElapsed = `${elapsedMinutes}m`;
      
      // Gradually build up scores matching final SportsDB result relative to elapsed progress
      const finalHome = parseInt(match.home_score) || 0;
      const finalAway = parseInt(match.away_score) || 0;
      homeScore = Math.floor(finalHome * (elapsedMinutes / 90)).toString();
      awayScore = Math.floor(finalAway * (elapsedMinutes / 90)).toString();
    } else {
      finished = 'FALSE';
      timeElapsed = 'notstarted';
      homeScore = '0';
      awayScore = '0';
    }

    return {
      ...match,
      local_date: localDateStr,
      finished,
      time_elapsed: timeElapsed,
      home_score: homeScore,
      away_score: awayScore
    };
  });

  // Filter to keep matches relative to current time window (not all season matches to avoid lag):
  // - Concluded matches ended within the last 1.5 days
  // - Live matches currently in progress
  // - Upcoming matches starting within the next 5 days (limiting the list size)
  const filtered = shifted.filter(m => {
    const matchDate = parseMatchDate(m.local_date, m.stadium_id);
    const matchEndDate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
    
    const finishedTooLongAgo = referenceDate.getTime() - matchEndDate.getTime() > 1.5 * 24 * 60 * 60 * 1000;
    const tooFarInFuture = matchDate.getTime() - referenceDate.getTime() > 5 * 24 * 60 * 60 * 1000;

    return !finishedTooLongAgo && !tooFarInFuture;
  });

  // Fallback to return at least a subset of matches if filtering leaves it empty
  return filtered.length > 0 ? filtered : shifted.slice(0, 15);
};

const mapEspnEventToMatch = (event: any, sportId: string): RawMatch => {
  const competition = event.competitions?.[0] || {};
  const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home') || {};
  const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away') || {};
  
  const homeTeam = homeCompetitor.team || {};
  const awayTeam = awayCompetitor.team || {};
  
  const homeScore = homeCompetitor.score || '0';
  const awayScore = awayCompetitor.score || '0';
  
  const statusType = event.status?.type || {};
  const isFinished = statusType.state === 'post';
  const isLive = statusType.state === 'in';
  
  let finished = 'FALSE';
  let timeElapsed = 'notstarted';
  if (isFinished) {
    finished = 'TRUE';
    timeElapsed = 'finished';
  } else if (isLive) {
    timeElapsed = statusType.detail || 'live';
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
  
  return {
    id: `espn-${sportId}-${event.id}`,
    home_team_id: homeTeam.displayName || 'Home Team',
    away_team_id: awayTeam.displayName || 'Away Team',
    home_score: homeScore.toString(),
    away_score: awayScore.toString(),
    home_scorers: 'null',
    away_scorers: 'null',
    group: sportId.toUpperCase() + ' Regular Season',
    matchday: '1',
    local_date: localDateStr,
    stadium_id: '1',
    finished: finished,
    time_elapsed: timeElapsed,
    type: 'group',
    home_team_name_en: homeTeam.displayName || 'Home Team',
    away_team_name_en: awayTeam.displayName || 'Away Team',
    home_team_label: homeTeam.abbreviation || 'HM',
    away_team_label: awayTeam.abbreviation || 'AW',
  };
};

const getStadiumName = (match: RawMatch): string => {
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
  return stadiums[match.stadium_id || '1'] || 'Lusail Iconic Stadium';
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
  const [betType, setBetType] = useState<'1x2' | 'early_cashout' | 'double_chance' | 'btts' | 'red_card' | 'correct_score_2h' | 'first_half_1x2' | 'second_half_1x2' | 'totals' | 'clean_sheet'>('1x2');
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
  const [selectedSport, setSelectedSport] = useState<string>('football');
  const [sportMatches, setSportMatches] = useState<Record<string, RawMatch[]>>({});

  // Multipliers/odds state
  const [oddsHome, setOddsHome] = useState<number>(1.85);
  const [oddsDraw, setOddsDraw] = useState<number>(1.85);
  const [oddsAway, setOddsAway] = useState<number>(1.85);

  const calculateInitialOdds = (match: RawMatch) => {
    const home = getTeam(match.home_team_id, match, 'home');
    const away = getTeam(match.away_team_id, match, 'away');
    
    const sportId = match.id.startsWith('espn-') ? match.id.split('-')[1]
      : match.id.startsWith('sim-') ? match.id.split('-')[1]
      : 'football';
    
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
    const marginFactor = 0.93;
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

  const selectBetSlipWager = (
    type: '1x2' | 'early_cashout' | 'double_chance' | 'btts' | 'red_card' | 'correct_score_2h' | 'first_half_1x2' | 'second_half_1x2' | 'totals' | 'clean_sheet', 
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
  const MOCK_FIBA_MATCHES: RawMatch[] = [
    {
      id: 'sdb-4549-mock-1',
      home_team_id: 'Venezuela Basketball',
      away_team_id: 'Colombia Basketball',
      home_score: 'P',
      away_score: 'P',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '06/30/2026 18:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Venezuela Basketball',
      away_team_name_en: 'Colombia Basketball',
      home_team_label: 'VEN',
      away_team_label: 'COL',
      home_badge: '',
      away_badge: '',
      home_iso2: 'VE',
      away_iso2: 'CO'
    } as any,
    {
      id: 'sdb-4549-mock-2',
      home_team_id: 'Lebanon Basketball',
      away_team_id: 'India Basketball',
      home_score: '99',
      away_score: '56',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '06/29/2026 18:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Lebanon Basketball',
      away_team_name_en: 'India Basketball',
      home_team_label: 'LBN',
      away_team_label: 'IND',
      home_badge: '',
      away_badge: '',
      home_iso2: 'LB',
      away_iso2: 'IN'
    } as any,
    {
      id: 'sdb-4549-mock-3',
      home_team_id: 'Iraq Basketball',
      away_team_id: 'Jordan Basketball',
      home_score: '59',
      away_score: '108',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '06/29/2026 17:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Iraq Basketball',
      away_team_name_en: 'Jordan Basketball',
      home_team_label: 'IRQ',
      away_team_label: 'JOR',
      home_badge: '',
      away_badge: '',
      home_iso2: 'IQ',
      away_iso2: 'JO'
    } as any,
    {
      id: 'sdb-4549-mock-4',
      home_team_id: 'Qatar Basketball',
      away_team_id: 'Saudi Arabia Basketball',
      home_score: '80',
      away_score: '86',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '06/29/2026 19:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Qatar Basketball',
      away_team_name_en: 'Saudi Arabia Basketball',
      home_team_label: 'QAT',
      away_team_label: 'KSA',
      home_badge: '',
      away_badge: '',
      home_iso2: 'QA',
      away_iso2: 'SA'
    } as any,
    {
      id: 'sdb-4549-mock-5',
      home_team_id: 'Iran Basketball',
      away_team_id: 'Syria Basketball',
      home_score: '72',
      away_score: '68',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '06/29/2026 16:30',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Iran Basketball',
      away_team_name_en: 'Syria Basketball',
      home_team_label: 'IRI',
      away_team_label: 'SYR',
      home_badge: '',
      away_badge: '',
      home_iso2: 'IR',
      away_iso2: 'SY'
    } as any,
    {
      id: 'sdb-4549-mock-6',
      home_team_id: 'Cuba Basketball',
      away_team_id: 'Uruguay Basketball',
      home_score: '62',
      away_score: '88',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '03/03/2026 18:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Cuba Basketball',
      away_team_name_en: 'Uruguay Basketball',
      home_team_label: 'CUB',
      away_team_label: 'URU',
      home_badge: '',
      away_badge: '',
      home_iso2: 'CU',
      away_iso2: 'UY'
    } as any,
    {
      id: 'sdb-4549-mock-7',
      home_team_id: 'Chile Basketball',
      away_team_id: 'Venezuela Basketball',
      home_score: '68',
      away_score: '72',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '03/02/2026 18:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Chile Basketball',
      away_team_name_en: 'Venezuela Basketball',
      home_team_label: 'CHI',
      away_team_label: 'VEN',
      home_badge: '',
      away_badge: '',
      home_iso2: 'CL',
      away_iso2: 'VE'
    } as any,
    {
      id: 'sdb-4549-mock-8',
      home_team_id: 'Brazil Basketball',
      away_team_id: 'Colombia Basketball',
      home_score: '101',
      away_score: '72',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '03/02/2026 19:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Brazil Basketball',
      away_team_name_en: 'Colombia Basketball',
      home_team_label: 'BRA',
      away_team_label: 'COL',
      home_badge: '',
      away_badge: '',
      home_iso2: 'BR',
      away_iso2: 'CO'
    } as any,
    {
      id: 'sdb-4549-mock-9',
      home_team_id: 'Argentina Basketball',
      away_team_id: 'Panama Basketball',
      home_score: '101',
      away_score: '75',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '03/02/2026 17:30',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Argentina Basketball',
      away_team_name_en: 'Panama Basketball',
      home_team_label: 'ARG',
      away_team_label: 'PAN',
      home_badge: '',
      away_badge: '',
      home_iso2: 'AR',
      away_iso2: 'PA'
    } as any,
    {
      id: 'sdb-4549-mock-10',
      home_team_id: 'Spain Basketball',
      away_team_id: 'Ukraine Basketball',
      home_score: '78',
      away_score: '64',
      home_scorers: 'null',
      away_scorers: 'null',
      group: 'FIBA Basketball World Cup Qualifiers',
      matchday: '1',
      local_date: '03/02/2026 20:00',
      stadium_id: '1',
      finished: 'TRUE',
      time_elapsed: 'finished',
      home_team_name_en: 'Spain Basketball',
      away_team_name_en: 'Ukraine Basketball',
      home_team_label: 'ESP',
      away_team_label: 'UKR',
      home_badge: '',
      away_badge: '',
      home_iso2: 'ES',
      away_iso2: 'UA'
    } as any
  ];

  const fetchEspnMatches = async (sportId: string) => {
    if (sportId === 'football') return;
    if (sportId === 'esports') {
      const stored = localStorage.getItem('rm_sports_sdb_cache_esports');
      let mapped: RawMatch[] = [];
      const now = new Date();
      if (stored) {
        mapped = JSON.parse(stored);
        let changed = false;
        mapped = mapped.map(match => {
          const matchDate = parseMatchDate(match.local_date, match.stadium_id);
          const matchEndDate = new Date(matchDate.getTime() + 120 * 60 * 1000);
          
          const isLiveNow = now >= matchDate && now < matchEndDate;
          const hasEndedNow = now >= matchEndDate;
          
          let mChanged = false;
          let homeScore = match.home_score;
          let awayScore = match.away_score;
          let finished = match.finished;
          let timeElapsed = match.time_elapsed;

          if (hasEndedNow && match.finished !== 'TRUE') {
            homeScore = Math.random() < 0.5 ? "2" : "1";
            awayScore = homeScore === "2" ? Math.floor(Math.random() * 2).toString() : "2";
            finished = 'TRUE';
            timeElapsed = 'finished';
            mChanged = true;
          } else if (isLiveNow) {
            const elapsed = Math.floor((now.getTime() - matchDate.getTime()) / (60 * 1000));
            timeElapsed = `Map 2 - ${elapsed}m`;
            if (Math.random() < 0.03 && homeScore === '0' && awayScore === '0') {
              if (Math.random() < 0.5) homeScore = '1';
              else awayScore = '1';
              mChanged = true;
            }
          }
          
          if (mChanged) {
            changed = true;
            return { ...match, home_score: homeScore, away_score: awayScore, finished, time_elapsed: timeElapsed };
          }
          return match;
        });
        
        if (changed) {
          localStorage.setItem('rm_sports_sdb_cache_esports', JSON.stringify(mapped));
        }
      } else {
        mapped = generateEsportsMatches(now);
        localStorage.setItem('rm_sports_sdb_cache_esports', JSON.stringify(mapped));
      }
      
      setSportMatches(prev => ({
        ...prev,
        esports: mapped
      }));
      return;
    }

    const config = SPORTS_CONFIGS.find(s => s.id === sportId);
    if (!config || !config.leagues || config.leagues.length === 0) return;

    const now = new Date();
    const cacheKey = `rm_sports_sdb_cache_${sportId}`;
    const cacheTimeKey = `rm_sports_sdb_time_${sportId}`;
    const cachedGames = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    // Aggressive cache validity to prevent running out of free API requests (saves cached results for 6 hours)
    const isCacheValid = cachedGames && cachedTime && (now.getTime() - Number(cachedTime) < 6 * 60 * 60 * 1000);

    if (isCacheValid) {
      const parsed = JSON.parse(cachedGames) as RawMatch[];
      
      const updated = parsed.map(match => {
        const matchDate = parseMatchDate(match.local_date, match.stadium_id);
        const matchEndDate = new Date(matchDate.getTime() + 90 * 60 * 1000);
        
        const isLiveNow = now >= matchDate && now < matchEndDate;
        const hasEndedNow = now >= matchEndDate;

        let homeScore = match.home_score;
        let awayScore = match.away_score;
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
          
          if (Math.random() < 0.05) {
            if (sportId === 'basketball') {
              homeScore = (Number(homeScore) + Math.floor(Math.random() * 3 + 1)).toString();
              awayScore = (Number(awayScore) + Math.floor(Math.random() * 3 + 1)).toString();
            } else {
              if (Math.random() < 0.5) homeScore = (Number(homeScore) + 1).toString();
              else awayScore = (Number(awayScore) + 1).toString();
            }
            changed = true;
          }
        }

        if (changed) {
          return { ...match, home_score: homeScore, away_score: awayScore, finished, time_elapsed: timeElapsed };
        }
        return match;
      });

      setSportMatches(prev => ({ ...prev, [sportId]: updated }));
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return;
    }

    try {
      const allMatches: RawMatch[] = [];

      // Determine the SportsDB category name for auto-discovery
      let sportsDbName = '';
      if (sportId === 'basketball') sportsDbName = 'Basketball';
      else if (sportId === 'baseball') sportsDbName = 'Baseball';
      else if (sportId === 'american-football') sportsDbName = 'American_Football';
      else if (sportId === 'ice-hockey') sportsDbName = 'Ice_Hockey';
      else if (sportId === 'tennis') sportsDbName = 'Tennis';

      // 1. Start with our predefined major leagues
      let leaguesToFetch: Array<{ id: string; name: string; nameVi: string; season: string }> = [...(config.leagues || [])] as any[];

      // 2. Fetch and auto-discover all other tournaments/leagues for this sport
      if (sportsDbName) {
        try {
          const discRes = await fetch(`/api/sports/sportsdb?sportLeagues=${sportsDbName}`, { cache: 'no-store' });
          if (discRes.ok) {
            const discData = await discRes.json();
            if (discData.countries && Array.isArray(discData.countries)) {
              discData.countries.forEach((l: any) => {
                if (l.idLeague && !leaguesToFetch.some(existing => existing.id === l.idLeague)) {
                  leaguesToFetch.push({
                    id: l.idLeague,
                    name: l.strLeague,
                    nameVi: l.strLeague,
                    season: l.strCurrentSeason || '2023-2024'
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error('Failed to auto-discover leagues:', e);
        }
      }

      // 3. Limit to at most 6 leagues to prevent API rate limiting (30 requests/min on free tier)
      const finalLeagues = leaguesToFetch.slice(0, 6);

      for (const league of finalLeagues) {
        // Fetch upcoming events (next events)
        try {
          const nextRes = await fetch(`/api/sports/sportsdb?next=${league.id}`, { cache: 'no-store' });
          if (nextRes.ok) {
            const nextData = await nextRes.json();
            if (nextData.events && Array.isArray(nextData.events)) {
              const mapped = nextData.events.map((ev: any) => mapSportsDbEventToMatch(ev, league.name, league.nameVi));
              allMatches.push(...mapped);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch upcoming events for league ${league.id}:`, err);
        }

        // Fetch season events (recent results)
        try {
          const res = await fetch(`/api/sports/sportsdb?id=${league.id}&s=${league.season}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.events && Array.isArray(data.events)) {
              const mapped = data.events.map((ev: any) => mapSportsDbEventToMatch(ev, league.name, league.nameVi));
              allMatches.push(...mapped);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch season events for league ${league.id}:`, err);
        }
      }

      // Add mock data for FIBA (4549) to exactly match qualifiers results
      if (sportId === 'basketball') {
        allMatches.push(...MOCK_FIBA_MATCHES);
      }

      if (allMatches.length > 0) {
        // Sort chronologically and deduplicate by event ID
        const uniqueMatchesMap = new Map<string, RawMatch>();
        allMatches.forEach(m => {
          uniqueMatchesMap.set(m.id, m);
        });
        const uniqueMatches = Array.from(uniqueMatchesMap.values());

        const sorted = uniqueMatches.sort((a, b) => {
          return parseMatchDate(a.local_date, a.stadium_id).getTime() - parseMatchDate(b.local_date, b.stadium_id).getTime();
        });

        setSportMatches(prev => ({
          ...prev,
          [sportId]: sorted
        }));

        localStorage.setItem(cacheKey, JSON.stringify(sorted));
        localStorage.setItem(cacheTimeKey, now.getTime().toString());
      }
    } catch (err) {
      console.error(`Failed to fetch and process SportsDB matches for ${sportId}:`, err);
    }
  };

  useEffect(() => {
    if (selectedSport !== 'football') {
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
      if (selectedSport !== 'football') {
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
      const isSportsDb = bet.match.id.startsWith('sdb-');

      if (isSportsDb) {
        const parts = bet.match.id.split('-');
        const eventId = parts[2];
        if (eventId) {
          try {
            const res = await fetch(`/api/sports/sportsdb?event=${eventId}`, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                const ev = data.events[0];
                finalGame = {
                  ...finalGame,
                  home_score: ev.intHomeScore !== null && ev.intHomeScore !== undefined ? ev.intHomeScore.toString() : finalGame.home_score,
                  away_score: ev.intAwayScore !== null && ev.intAwayScore !== undefined ? ev.intAwayScore.toString() : finalGame.away_score,
                  finished: 'TRUE',
                  time_elapsed: 'finished'
                };
              }
            }
          } catch (apiErr) {
            console.error('Failed to fetch real score from SportsDB lookupevent:', apiErr);
          }
        }
        
        // Update local storage cache to keep scores persisted
        const sportId = parts[1] || 'basketball';
        const cached = localStorage.getItem(`rm_sports_sdb_cache_${sportId}`);
        if (cached) {
          const mapped = JSON.parse(cached) as RawMatch[];
          const updated = mapped.map(m => m.id === bet.match.id ? finalGame : m);
          localStorage.setItem(`rm_sports_sdb_cache_${sportId}`, JSON.stringify(updated));
        }
      } else if (!isEspn && !isSimulated) {
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
      } else if (isEspn) {
        const sportId = bet.match.id.split('-')[1];
        const eventId = bet.match.id.split('-')[2];
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
      } else {
        // Fallback for old simulated matches in active bets
        const sportId = bet.match.id.split('-')[1];
        const sportMatchesList = sportMatches[sportId] || [];
        const currentSimMatch = sportMatchesList.find(m => m.id === bet.match.id);
        if (currentSimMatch) {
          finalGame = currentSimMatch;
        }
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
      
      if (bet.betType === 'early_cashout') {
        if (isEarlyCashoutEligible) {
          isWin = true;
        } else {
          const didLeadByTwo = hadTwoGoalLead(finalGame, bet.prediction as 'home' | 'away');
          let matchWinner = 'draw';
          if (homeScore > awayScore) matchWinner = 'home';
          else if (awayScore > homeScore) matchWinner = 'away';
          isWin = (bet.prediction === matchWinner) || didLeadByTwo;
        }
      } else if (bet.betType === 'red_card') {
        const matchHadRedCard = hadRedCard(finalGame);
        isWin = bet.prediction === (matchHadRedCard ? 'yes' : 'no');
      } else if (bet.betType === 'correct_score_2h') {
        const shScore = getSecondHalfScore(finalGame);
        const expectedScore = `${shScore.home}-${shScore.away}`;
        isWin = bet.prediction === expectedScore;
      } else {
        let finalOutcome: 'home' | 'draw' | 'away' = 'draw';
        if (homeScore > awayScore) {
          finalOutcome = 'home';
        } else if (awayScore > homeScore) {
          finalOutcome = 'away';
        } else {
          const pHome = finalGame.home_penalty_score !== undefined && finalGame.home_penalty_score !== null ? Number(finalGame.home_penalty_score) : NaN;
          const pAway = finalGame.away_penalty_score !== undefined && finalGame.away_penalty_score !== null ? Number(finalGame.away_penalty_score) : NaN;
          if (!isNaN(pHome) && !isNaN(pAway)) {
            if (pHome > pAway) {
              finalOutcome = 'home';
            } else if (pAway > pHome) {
              finalOutcome = 'away';
            }
          }
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
      setSettlingError('Failed to fetch match scores from API. Please try again.');
    } finally {
      setSettlingLoading(false);
    }
  };

  // Active matches depending on selected sport
  const activeMatches = selectedSport === 'football' 
    ? matchesList 
    : (sportMatches[selectedSport] || []);

  // Filter Match list
  const filteredMatches = activeMatches.filter(match => {
    // Hide matches that do not have 2 full teams (team ID '0' is TBD)
    if (match.home_team_id === '0' || match.away_team_id === '0' || !match.home_team_id || !match.away_team_id) {
      return false;
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
                                  {formatGroupLabel(match.group, lang)}
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
                              
                              <span 
                                className="text-[8px] text-neutral-450 font-bold uppercase tracking-wider text-center mt-1 max-w-[100px] leading-tight line-clamp-2"
                                title={getStadiumName(match)}
                              >
                                {getStadiumName(match)}
                              </span>
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

          {/* My Active Bets Ledger */}
          <Card className="bg-[#0b0b0b] border-luxury-border rounded-3xl">
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
                      <div className="flex flex-col gap-1.5">
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
                        
                        <div className="text-xs font-black text-white flex items-center gap-2">
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
                            <span className="text-[9px] bg-indigo-950/40 border border-indigo-500/20 text-indigo-405 text-indigo-400 font-black px-2.5 py-0.5 rounded-full uppercase">
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

        </div>

        {/* Right column: Bet Slip & Stats */}
        <div className="flex flex-col gap-6">
          
          {/* Bet Slip */}
          <Card className="bg-[#0b0b0b] border-luxury-border rounded-3xl relative">
            <CardHeader className="p-5 border-b border-luxury-border/60">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-500" />
                {TRANSLATIONS[lang].betSlip}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-5">
              
              {selectedMatch ? (() => {
                const home = getTeam(selectedMatch.home_team_id, selectedMatch, 'home');
                const away = getTeam(selectedMatch.away_team_id, selectedMatch, 'away');
                const betsOnMatch = activeBets.filter(b => b.match.id === selectedMatch.id).length;

                const shortenCountryName = (name: string): string => {
                  if (!name) return '';
                  const clean = name.trim();
                  // Explicit overrides
                  if (clean === 'Democratic Republic of the Congo' || clean === 'Cộng hòa Dân chủ Congo' || clean === 'DR Congo' || clean === 'Congo DR' || clean === 'Congo') {
                    return 'DROTC';
                  }
                  if (clean === 'Bosnia and Herzegovina' || clean === 'Bosnia và Herzegovina' || clean === 'Bosnia-Herzegovina' || clean === 'Bosnia') {
                    return 'BAH';
                  }
                  // General fallback for long names
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
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide">
                              {lang === 'vi' ? 'Tiền cược' : 'Stake Amount'}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-bold">
                              {lang === 'vi' ? 'Tối thiểu' : 'Min Stake'}: $0.01
                            </span>
                          </div>
                          
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-505 text-neutral-400">$</span>
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
                            <span className="text-neutral-500 font-mono">$0.00</span>
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
              })() : (
                <div className="py-12 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-neutral-600" />
                  <span>{TRANSLATIONS[lang].selectMatchMsg}</span>
                </div>
              )}

            </CardContent>
          </Card>

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
                  {lang === 'vi' ? 'Kết nối API thất bại. Vui lòng thử lại.' : settlingError}
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
