import { query } from '@/lib/db';
import { Match, League, Team, MoroccanPlayer } from '@/types/match';

/**
 * Fetch all leagues from the database
 */
export const fetchLeagues = async (): Promise<League[]> => {
  const result = await query('SELECT * FROM leagues ORDER BY name');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    country: row.country,
    logo: row.logo,
  }));
};

/**
 * Fetch matches by date filter
 */
export const fetchMatchesByDate = async (dateFilter: 'today' | 'tomorrow' | 'week'): Promise<Match[]> => {
  let dateCondition = '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  switch (dateFilter) {
    case 'today':
      dateCondition = `kickoff_time >= $1 AND kickoff_time < $2`;
      break;
    case 'tomorrow':
      dateCondition = `kickoff_time >= $2 AND kickoff_time < $3`;
      break;
    case 'week':
      dateCondition = `kickoff_time >= $1 AND kickoff_time < $4`;
      break;
  }

  const queryText = `
    SELECT 
      m.*,
      ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
      at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo,
      l.id as league_id, l.name as league_name, l.short_name as league_short, l.country as league_country, l.logo as league_logo
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    JOIN leagues l ON m.league_id = l.id
    WHERE ${dateCondition}
    ORDER BY m.kickoff_time
  `;

  const params = [today, tomorrow, new Date(tomorrow.getTime() + 86400000), nextWeek];
  const result = await query(queryText, params);

  // Fetch Moroccan players for each match
  const matches = await Promise.all(
    result.rows.map(async (row) => {
      const playersResult = await query(
        `SELECT p.* FROM players p
         JOIN match_players mp ON p.id = mp.player_id
         WHERE mp.match_id = $1`,
        [row.id]
      );

      const moroccanPlayers: MoroccanPlayer[] = playersResult.rows.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        teamId: p.team_id,
        imageUrl: p.image_url,
      }));

      return {
        id: row.id,
        homeTeam: {
          id: row.home_team_id,
          name: row.home_team_name,
          shortName: row.home_team_short,
          logo: row.home_team_logo,
        },
        awayTeam: {
          id: row.away_team_id,
          name: row.away_team_name,
          shortName: row.away_team_short,
          logo: row.away_team_logo,
        },
        league: {
          id: row.league_id,
          name: row.league_name,
          shortName: row.league_short,
          country: row.league_country,
          logo: row.league_logo,
        },
        kickoffTime: new Date(row.kickoff_time),
        status: row.status,
        score: row.home_score !== null && row.away_score !== null ? {
          home: row.home_score,
          away: row.away_score,
        } : undefined,
        moroccanPlayers,
      } as Match;
    })
  );

  return matches;
};

/**
 * Fetch matches by league
 */
export const fetchMatchesByLeague = async (leagueId: string | null): Promise<Match[]> => {
  const queryText = leagueId
    ? `
      SELECT 
        m.*,
        ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo,
        l.id as league_id, l.name as league_name, l.short_name as league_short, l.country as league_country, l.logo as league_logo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN leagues l ON m.league_id = l.id
      WHERE m.league_id = $1
      ORDER BY m.kickoff_time
    `
    : `
      SELECT 
        m.*,
        ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short, ht.logo as home_team_logo,
        at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short, at.logo as away_team_logo,
        l.id as league_id, l.name as league_name, l.short_name as league_short, l.country as league_country, l.logo as league_logo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN leagues l ON m.league_id = l.id
      ORDER BY m.kickoff_time
    `;

  const result = await query(queryText, leagueId ? [leagueId] : []);

  const matches = await Promise.all(
    result.rows.map(async (row) => {
      const playersResult = await query(
        `SELECT p.* FROM players p
         JOIN match_players mp ON p.id = mp.player_id
         WHERE mp.match_id = $1`,
        [row.id]
      );

      const moroccanPlayers: MoroccanPlayer[] = playersResult.rows.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        teamId: p.team_id,
        imageUrl: p.image_url,
      }));

      return {
        id: row.id,
        homeTeam: {
          id: row.home_team_id,
          name: row.home_team_name,
          shortName: row.home_team_short,
          logo: row.home_team_logo,
        },
        awayTeam: {
          id: row.away_team_id,
          name: row.away_team_name,
          shortName: row.away_team_short,
          logo: row.away_team_logo,
        },
        league: {
          id: row.league_id,
          name: row.league_name,
          shortName: row.league_short,
          country: row.league_country,
          logo: row.league_logo,
        },
        kickoffTime: new Date(row.kickoff_time),
        status: row.status,
        score: row.home_score !== null && row.away_score !== null ? {
          home: row.home_score,
          away: row.away_score,
        } : undefined,
        moroccanPlayers,
      } as Match;
    })
  );

  return matches;
};

/**
 * Fetch all Moroccan players
 */
export const fetchMoroccanPlayers = async (): Promise<MoroccanPlayer[]> => {
  const result = await query(
    `SELECT * FROM players WHERE nationality = 'Morocco' ORDER BY name`
  );
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    position: row.position,
    teamId: row.team_id,
    imageUrl: row.image_url,
  }));
};
