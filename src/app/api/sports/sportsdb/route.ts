import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event');
    if (eventId) {
      const url = `https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${eventId}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch from SportsDB: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    const nextLeagueId = searchParams.get('next');
    if (nextLeagueId) {
      const url = `https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=${nextLeagueId}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch from SportsDB: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    const sportLeagues = searchParams.get('sportLeagues');
    if (sportLeagues) {
      const url = `https://www.thesportsdb.com/api/v1/json/123/search_all_leagues.php?s=${sportLeagues}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch from SportsDB: ${res.statusText}` }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    const id = searchParams.get('id');
    const season = searchParams.get('s') || '2023-2024';

    if (!id) {
      return NextResponse.json({ error: 'Missing league id or event id' }, { status: 400 });
    }

    const url = `https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=${id}&s=${season}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch from SportsDB: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('SportsDB API proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
