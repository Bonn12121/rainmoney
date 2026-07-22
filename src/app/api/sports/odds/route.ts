import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseAmericanToDecimal(americanVal: string | number | undefined | null): number | null {
  if (americanVal === undefined || americanVal === null) return null;
  let num: number;
  if (typeof americanVal === 'string') {
    num = parseFloat(americanVal.replace('+', ''));
  } else {
    num = americanVal;
  }
  if (isNaN(num) || num === 0) return null;
  if (num > 0) {
    return Math.round((1 + num / 100) * 100) / 100;
  } else {
    return Math.round((1 + 100 / Math.abs(num)) * 100) / 100;
  }
}

const LEAGUE_MAPPINGS: Record<string, [string, string]> = {
  'nba': ['basketball', 'nba'],
  'wnba': ['basketball', 'wnba'],
  'nfl': ['football', 'nfl'],
  'college-football': ['football', 'college-football'],
  'mlb': ['baseball', 'mlb'],
  'nhl': ['hockey', 'nhl'],
  'ufc': ['mma', 'ufc'],
  'epl': ['soccer', 'eng.1'],
  'laliga': ['soccer', 'esp.1'],
  'bundesliga': ['soccer', 'ger.1'],
  'seriea': ['soccer', 'ita.1'],
  'ligue1': ['soccer', 'fra.1'],
  'mls': ['soccer', 'usa.1'],
  'ucl': ['soccer', 'uefa.champions'],
  'soccer': ['soccer', 'eng.1'],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sportParam = searchParams.get('sport') || 'nba';
    const leagueParam = searchParams.get('league');

    let espnSport = 'basketball';
    let espnLeague = 'nba';

    if (LEAGUE_MAPPINGS[sportParam.toLowerCase()]) {
      [espnSport, espnLeague] = LEAGUE_MAPPINGS[sportParam.toLowerCase()];
    } else if (leagueParam) {
      espnSport = sportParam;
      espnLeague = leagueParam;
    } else if (sportParam.includes('/')) {
      const parts = sportParam.split('/');
      espnSport = parts[0];
      espnLeague = parts[1];
    } else {
      espnSport = sportParam;
      espnLeague = 'all';
    }

    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSport}/${espnLeague}/scoreboard`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch odds from source: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const events = data.events || [];

    const formattedEvents = events.map((ev: any) => {
      const competition = ev.competitions?.[0] || {};
      const competitors = competition.competitors || [];
      const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0] || {};
      const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1] || competitors[0] || {};

      const homeTeam = homeComp.team || homeComp.athlete || {};
      const awayTeam = awayComp.team || awayComp.athlete || {};

      const oddsObj = competition.odds?.[0] || {};

      // Parse moneyline
      let homeAmerican = oddsObj.moneyline?.home?.close?.odds ?? oddsObj.homeTeamOdds?.moneyLine ?? null;
      let awayAmerican = oddsObj.moneyline?.away?.close?.odds ?? oddsObj.awayTeamOdds?.moneyLine ?? null;
      let drawAmerican = oddsObj.moneyline?.draw?.close?.odds ?? oddsObj.drawOdds?.moneyLine ?? null;

      if (!homeAmerican && oddsObj.details) {
        // e.g. details: "SEV +120"
        const parts = oddsObj.details.split(' ');
        if (parts.length >= 2) {
          const val = parts[parts.length - 1];
          if (val.startsWith('+') || val.startsWith('-')) {
            homeAmerican = val;
          }
        }
      }

      const homeDecimal = parseAmericanToDecimal(homeAmerican);
      const awayDecimal = parseAmericanToDecimal(awayAmerican);
      const drawDecimal = parseAmericanToDecimal(drawAmerican);

      // Parse spread & total
      const homeSpread = oddsObj.pointSpread?.home?.close || null;
      const awaySpread = oddsObj.pointSpread?.away?.close || null;
      const totalOver = oddsObj.total?.over?.close || null;
      const totalUnder = oddsObj.total?.under?.close || null;

      return {
        id: ev.id,
        name: ev.name || `${homeTeam.displayName} vs ${awayTeam.displayName}`,
        shortName: ev.shortName,
        date: ev.date,
        status: ev.status?.type?.detail || ev.status?.type?.description || 'Scheduled',
        isLive: ev.status?.type?.state === 'in',
        isCompleted: ev.status?.type?.state === 'post',
        homeTeam: {
          id: homeTeam.id,
          name: homeTeam.displayName || homeTeam.name,
          abbreviation: homeTeam.abbreviation,
          logo: homeTeam.logo || homeTeam.logos?.[0]?.href,
          score: homeComp.score || '0',
        },
        awayTeam: {
          id: awayTeam.id,
          name: awayTeam.displayName || awayTeam.name,
          abbreviation: awayTeam.abbreviation,
          logo: awayTeam.logo || awayTeam.logos?.[0]?.href,
          score: awayComp.score || '0',
        },
        odds: {
          provider: oddsObj.provider?.name || 'DraftKings Sportsbook',
          details: oddsObj.details || null,
          moneyline: {
            home: { american: homeAmerican, decimal: homeDecimal },
            draw: drawDecimal ? { american: drawAmerican, decimal: drawDecimal } : null,
            away: { american: awayAmerican, decimal: awayDecimal },
          },
          spread: homeSpread && awaySpread ? {
            home: { line: homeSpread.line, american: homeSpread.odds, decimal: parseAmericanToDecimal(homeSpread.odds) },
            away: { line: awaySpread.line, american: awaySpread.odds, decimal: parseAmericanToDecimal(awaySpread.odds) },
          } : null,
          total: totalOver && totalUnder ? {
            overUnderLine: oddsObj.overUnder || null,
            over: { line: totalOver.line, american: totalOver.odds, decimal: parseAmericanToDecimal(totalOver.odds) },
            under: { line: totalUnder.line, american: totalUnder.odds, decimal: parseAmericanToDecimal(totalUnder.odds) },
          } : null,
          sportsbookLink: oddsObj.link?.href || oddsObj.header?.href || null,
        },
      };
    });

    return NextResponse.json({
      sport: espnSport,
      league: espnLeague,
      count: formattedEvents.length,
      events: formattedEvents,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Odds API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
