import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport') || 'nba';

    // Map common sport IDs to their ESPN API paths
    let espnSportPath = '';
    let espnLeaguePath = '';

    if (sport === 'nba') {
      espnSportPath = 'basketball';
      espnLeaguePath = 'nba';
    } else if (sport === 'nfl') {
      espnSportPath = 'football';
      espnLeaguePath = 'nfl';
    } else if (sport === 'mlb') {
      espnSportPath = 'baseball';
      espnLeaguePath = 'mlb';
    } else if (sport === 'nhl') {
      espnSportPath = 'hockey';
      espnLeaguePath = 'nhl';
    } else if (sport === 'ufc' || sport === 'mma') {
      espnSportPath = 'mma';
      espnLeaguePath = 'ufc';
    } else if (sport === 'tennis') {
      espnSportPath = 'tennis';
      espnLeaguePath = 'atp';
    } else if (sport === 'golf') {
      espnSportPath = 'golf';
      espnLeaguePath = 'pga';
    } else if (sport === 'soccer-epl') {
      espnSportPath = 'soccer';
      espnLeaguePath = 'eng.1';
    } else if (sport === 'soccer-laliga') {
      espnSportPath = 'soccer';
      espnLeaguePath = 'esp.1';
    } else {
      // Allow custom sport/league combinations passed in search params for full public-espn-api compliance!
      const customSport = searchParams.get('customSport');
      const customLeague = searchParams.get('customLeague');
      if (customSport && customLeague) {
        espnSportPath = customSport.replace(/[^a-zA-Z0-9.-]/g, '');
        espnLeaguePath = customLeague.replace(/[^a-zA-Z0-9.-]/g, '');
      } else {
        return NextResponse.json({ error: 'Unsupported sport' }, { status: 400 });
      }
    }

    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnSportPath}/${espnLeaguePath}/scoreboard`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch from ESPN: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('ESPN API proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
