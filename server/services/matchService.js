import { query } from '../config/database.js';

// Helper to get date in Eastern Time
const getEasternDate = (date) => {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
};

export const getMatchesByDate = async (dateFilter) => {
  let dateCondition = '';
  let params = [];

  // Since system date (2026) doesn't match real API data (2024-2025),
  // we'll use the database's max/min dates to show relevant matches
  switch (dateFilter) {
    case 'today':
      // Show most recent matches (last 3 days from latest match)
      dateCondition = 'kickoff_time >= (SELECT MAX(kickoff_time) - INTERVAL \'3 days\' FROM matches) AND kickoff_time <= (SELECT MAX(kickoff_time) + INTERVAL \'1 day\' FROM matches)';
      params = [];
      break;
    case 'tomorrow':
      // Show upcoming matches
      dateCondition = 'kickoff_time > (SELECT MAX(kickoff_time) FROM matches WHERE kickoff_time < \'2025-02-01\')';
      params = [];
      break;
    case 'week':
      // Show matches from the last 7 days of available data
      dateCondition = 'kickoff_time >= (SELECT MAX(kickoff_time) - INTERVAL \'7 days\' FROM matches) AND kickoff_time <= (SELECT MAX(kickoff_time) + INTERVAL \'7 days\' FROM matches)';
      params = [];
      break;
    default:
      // Show all matches
      dateCondition = '1=1';
      params = [];
  }

  const queryText = `
    SELECT
      m.id, m.kickoff_time, m.status, m.home_score, m.away_score,
      json_build_object(
        'id', ht.id,
        'name', ht.name,
        'shortName', ht.short_name,
        'logo', ht.logo
      ) as home_team,
      json_build_object(
        'id', at.id,
        'name', at.name,
        'shortName', at.short_name,
        'logo', at.logo
      ) as away_team,
      json_build_object(
        'id', l.id,
        'name', l.name,
        'shortName', l.short_name,
        'country', l.country,
        'logo', l.logo
      ) as league
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    JOIN leagues l ON m.league_id = l.id
    WHERE ${dateCondition}
    ORDER BY m.kickoff_time DESC
    LIMIT 100
  `;

  const result = await query(queryText, params);

  // Fetch Moroccan players for each match
  const matches = await Promise.all(
    result.rows.map(async (row) => {
      const playersResult = await query(
        `SELECT p.id, p.name, p.position, p.team_id as "teamId", p.image_url as "imageUrl"
         FROM players p
         JOIN match_players mp ON p.id = mp.player_id
         WHERE mp.match_id = $1`,
        [row.id]
      );

      return {
        id: row.id,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        league: row.league,
        kickoffTime: row.kickoff_time,
        status: row.status,
        score: row.home_score !== null && row.away_score !== null ? {
          home: row.home_score,
          away: row.away_score,
        } : undefined,
        moroccanPlayers: playersResult.rows,
      };
    })
  );

  // Filter to only return matches with Moroccan players
  return matches.filter(match => match.moroccanPlayers.length > 0);
};

export const getMatchesByLeague = async (leagueId) => {
  const queryText = leagueId
    ? `
      SELECT
        m.id, m.kickoff_time, m.status, m.home_score, m.away_score,
        json_build_object(
          'id', ht.id,
          'name', ht.name,
          'shortName', ht.short_name,
          'logo', ht.logo
        ) as home_team,
        json_build_object(
          'id', at.id,
          'name', at.name,
          'shortName', at.short_name,
          'logo', at.logo
        ) as away_team,
        json_build_object(
          'id', l.id,
          'name', l.name,
          'shortName', l.short_name,
          'country', l.country,
          'logo', l.logo
        ) as league
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN leagues l ON m.league_id = l.id
      WHERE m.league_id = $1
      ORDER BY m.kickoff_time DESC
    `
    : `
      SELECT
        m.id, m.kickoff_time, m.status, m.home_score, m.away_score,
        json_build_object(
          'id', ht.id,
          'name', ht.name,
          'shortName', ht.short_name,
          'logo', ht.logo
        ) as home_team,
        json_build_object(
          'id', at.id,
          'name', at.name,
          'shortName', at.short_name,
          'logo', at.logo
        ) as away_team,
        json_build_object(
          'id', l.id,
          'name', l.name,
          'shortName', l.short_name,
          'country', l.country,
          'logo', l.logo
        ) as league
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN leagues l ON m.league_id = l.id
      ORDER BY m.kickoff_time DESC
    `;

  const result = await query(queryText, leagueId ? [leagueId] : []);

  const matches = await Promise.all(
    result.rows.map(async (row) => {
      const playersResult = await query(
        `SELECT p.id, p.name, p.position, p.team_id as "teamId", p.image_url as "imageUrl"
         FROM players p
         JOIN match_players mp ON p.id = mp.player_id
         WHERE mp.match_id = $1`,
        [row.id]
      );

      return {
        id: row.id,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        league: row.league,
        kickoffTime: row.kickoff_time,
        status: row.status,
        score: row.home_score !== null && row.away_score !== null ? {
          home: row.home_score,
          away: row.away_score,
        } : undefined,
        moroccanPlayers: playersResult.rows,
      };
    })
  );

  // Filter to only return matches with Moroccan players
  return matches.filter(match => match.moroccanPlayers.length > 0);
};

export const getAllLeagues = async () => {
  const result = await query('SELECT * FROM leagues ORDER BY name');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    country: row.country,
    logo: row.logo,
  }));
};
