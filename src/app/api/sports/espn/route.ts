import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport') || 'nba';

    let url = '';
    if (sport === 'nba') {
      url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
    } else if (sport === 'nfl') {
      url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
    } else if (sport === 'mlb') {
      url = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';
    } else if (sport === 'nhl') {
      url = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard';
    } else {
      return NextResponse.json({ error: 'Unsupported sport' }, { status: 400 });
    }

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
