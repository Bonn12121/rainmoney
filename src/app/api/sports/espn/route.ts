import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sportParam = searchParams.get('sport') || 'nba';
    const leagueParam = searchParams.get('league');
    const datesParam = searchParams.get('dates');

    let espnSportPath = searchParams.get('customSport') || '';
    let espnLeaguePath = searchParams.get('customLeague') || leagueParam || '';

    if (!espnSportPath) {
      if (sportParam.includes('/')) {
        const parts = sportParam.split('/');
        espnSportPath = parts[0];
        espnLeaguePath = parts[1];
      } else if (leagueParam) {
        espnSportPath = sportParam;
        espnLeaguePath = leagueParam;
      } else {
        const mapping: Record<string, [string, string]> = {
          'nba': ['basketball', 'nba'],
          'wnba': ['basketball', 'wnba'],
          'basketball': ['basketball', 'nba'],
          'basketball-ncaa-m': ['basketball', 'mens-college-basketball'],
          'basketball-ncaa-w': ['basketball', 'womens-college-basketball'],
          'basketball-g-league': ['basketball', 'nba-g-league'],
          'nfl': ['football', 'nfl'],
          'football': ['football', 'nfl'],
          'football-nfl': ['football', 'nfl'],
          'football-college': ['football', 'college-football'],
          'football-cfl': ['football', 'cfl'],
          'football-ufl': ['football', 'ufl'],
          'mlb': ['baseball', 'mlb'],
          'baseball': ['baseball', 'mlb'],
          'nhl': ['hockey', 'nhl'],
          'hockey': ['hockey', 'nhl'],
          'ufc': ['mma', 'ufc'],
          'mma': ['mma', 'ufc'],
          'tennis': ['tennis', 'atp'],
          'tennis-atp': ['tennis', 'atp'],
          'tennis-wta': ['tennis', 'wta'],
          'golf': ['golf', 'pga'],
          'golf-pga': ['golf', 'pga'],
          'golf-lpga': ['golf', 'lpga'],
          'golf-liv': ['golf', 'liv'],
          'football-soccer': ['soccer', 'all'],
          'american-football': ['football', 'nfl'],
          'soccer': ['soccer', 'all'],
          'soccer-all': ['soccer', 'all'],
          'soccer-epl': ['soccer', 'eng.1'],
          'soccer-laliga': ['soccer', 'esp.1'],
          'soccer-bundesliga': ['soccer', 'ger.1'],
          'soccer-seriea': ['soccer', 'ita.1'],
          'soccer-ligue1': ['soccer', 'fra.1'],
          'soccer-mls': ['soccer', 'usa.1'],
          'soccer-ucl': ['soccer', 'uefa.champions'],
          'soccer-uel': ['soccer', 'uefa.europa'],
          'racing-f1': ['racing', 'f1'],
          'racing-indycar': ['racing', 'irl'],
          'racing-nascar': ['racing', 'nascar-premier'],
          'lacrosse-pll': ['lacrosse', 'pll'],
          'lacrosse-nll': ['lacrosse', 'nll'],
          'afl': ['australian-football', 'afl'],
          'volleyball-m': ['volleyball', 'mens-college-volleyball'],
          'volleyball-w': ['volleyball', 'womens-college-volleyball'],
        };

        if (mapping[sportParam.toLowerCase()]) {
          [espnSportPath, espnLeaguePath] = mapping[sportParam.toLowerCase()];
        } else {
          espnSportPath = sportParam.replace(/[^a-zA-Z0-9.-]/g, '');
          espnLeaguePath = (leagueParam || 'all').replace(/[^a-zA-Z0-9.-]/g, '');
        }
      }
    }

    let url = `https://site.api.espn.com/apis/site/v2/sports/${espnSportPath}/${espnLeaguePath}/scoreboard`;
    if (datesParam) {
      url += `?dates=${encodeURIComponent(datesParam)}`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ events: [], error: `ESPN returned status: ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('ESPN API proxy error:', err);
    return NextResponse.json({ events: [], error: err.message || 'Internal Server Error' }, { status: 200 });
  }
}

