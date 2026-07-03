import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const nameMapping: Record<string, string> = {
  'DR Congo': 'Democratic Republic of the Congo',
  'DR Congo Basketball': 'Democratic Republic of the Congo',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'USA': 'United States',
};

function normalizeName(name: string): string {
  if (!name) return '';
  const mapped = nameMapping[name];
  const target = mapped || name;
  return target
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

function formatScorers(goals: any[]): string {
  if (!goals || goals.length === 0) return 'null';
  const formatted = goals.map((g: any) => {
    let min = g.minute || '';
    if (min && !min.endsWith("'")) {
      min = min + "'";
    }
    const nameClean = (g.name || '').replace(/"/g, '\\"');
    return `"${nameClean} ${min}"`;
  });
  return `{${formatted.join(',')}}`;
}

function formatLocalDate(dateStr: string, timeStr: string): string {
  try {
    if (!dateStr) return '06/11/2026 13:00';
    const dateParts = dateStr.split('-');
    const timePart = timeStr ? timeStr.split(' ')[0] : '12:00';
    return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]} ${timePart}`;
  } catch (e) {
    return '06/11/2026 13:00';
  }
}

export async function GET() {
  try {
    // Load local templates
    const matchesPath = path.join(process.cwd(), 'src/app/games/sports/football.matches.json');
    const matchesContent = fs.readFileSync(matchesPath, 'utf8');
    const localMatchesData = JSON.parse(matchesContent);
    const localMatches = localMatchesData.value;

    const teamsPath = path.join(process.cwd(), 'src/app/games/sports/football.teams.json');
    const teamsContent = fs.readFileSync(teamsPath, 'utf8');
    const localTeamsData = JSON.parse(teamsContent);
    const localTeams = localTeamsData.value;

    // Create team name mapping to IDs
    const teamNameMap = new Map<string, string>();
    localTeams.forEach((t: any) => {
      teamNameMap.set(normalizeName(t.name_en), t.id);
    });

    // Fetch live feed
    let liveMatches: any[] = [];
    try {
      const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.matches)) {
          liveMatches = data.matches;
        }
      } else {
        console.warn(`Live feed returned status ${res.status}: ${res.statusText}`);
      }
    } catch (fetchErr) {
      console.error('Failed to fetch live matches from openfootball, using offline fallback:', fetchErr);
    }

    if (liveMatches.length === 0) {
      return NextResponse.json({ games: localMatches });
    }

    // Map openfootball matches onto our local template structure
    const mappedGames = liveMatches.map((liveMatch: any, idx: number) => {
      const matchNum = liveMatch.num || (idx + 1);
      const template = localMatches.find((m: any) => m.id === String(matchNum)) || {};

      const normTeam1 = normalizeName(liveMatch.team1);
      const normTeam2 = normalizeName(liveMatch.team2);
      
      const home_team_id = teamNameMap.get(normTeam1) || '0';
      const away_team_id = teamNameMap.get(normTeam2) || '0';

      const isFinished = liveMatch.score && Array.isArray(liveMatch.score.ft);
      const homeScore = isFinished ? String(liveMatch.score.ft[0]) : '0';
      const awayScore = isFinished ? String(liveMatch.score.ft[1]) : '0';

      const finished = isFinished ? 'TRUE' : 'FALSE';
      const timeElapsed = isFinished ? 'finished' : 'notstarted';

      const homeScorers = formatScorers(liveMatch.goals1);
      const awayScorers = formatScorers(liveMatch.goals2);

      return {
        ...template,
        id: String(matchNum),
        home_team_id,
        away_team_id,
        home_score: homeScore,
        away_score: awayScore,
        home_scorers: homeScorers,
        away_scorers: awayScorers,
        finished,
        time_elapsed: timeElapsed,
        group: template.group || (liveMatch.group ? liveMatch.group.replace('Group ', '') : ''),
        matchday: template.matchday || '1',
        local_date: template.local_date || formatLocalDate(liveMatch.date, liveMatch.time),
        type: template.type || (liveMatch.group ? 'group' : 'knockout'),
        home_team_name_en: liveMatch.team1,
        away_team_name_en: liveMatch.team2
      };
    });

    return NextResponse.json({ games: mappedGames });
  } catch (err: any) {
    console.error('Games API route error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
