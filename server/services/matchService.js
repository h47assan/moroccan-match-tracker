import { query } from '../config/database.js';

export const getMatchesByDate = async (dateFilter) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let dateCondition = '';
  let params = [];

  switch (dateFilter) {
    case 'today':
      dateCondition = 'kickoff_time >= $1 AND kickoff_time < $2';
      params = [today, tomorrow];
      break;
    case 'tomorrow':
      dateCondition = 'kickoff_time >= $1 AND kickoff_time < $2';
      params = [tomorrow, dayAfterTomorrow];
      break;
    case 'week':
      dateCondition = 'kickoff_time >= $1 AND kickoff_time < $2';
      params = [today, nextWeek];
      break;
    default:
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
    ORDER BY m.kickoff_time
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

  return matches;
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
      ORDER BY m.kickoff_time
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
      ORDER BY m.kickoff_time
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

  return matches;
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
