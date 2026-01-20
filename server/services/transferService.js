import { query } from '../config/database.js';

export const getAllTransfers = async () => {
  const queryText = `
    SELECT 
      t.id,
      t.fee,
      t.transfer_type,
      t.contract_start,
      t.contract_end,
      t.market_value,
      t.transfer_date,
      json_build_object(
        'id', p.id,
        'name', p.name,
        'position', p.position,
        'teamId', p.team_id
      ) as player,
      json_build_object(
        'id', ft.id,
        'name', ft.name,
        'shortName', ft.short_name,
        'logo', ft.logo
      ) as from_team,
      json_build_object(
        'id', tt.id,
        'name', tt.name,
        'shortName', tt.short_name,
        'logo', tt.logo
      ) as to_team,
      json_build_object(
        'id', l.id,
        'name', l.name,
        'shortName', l.short_name,
        'country', l.country,
        'logo', l.logo
      ) as league
    FROM transfers t
    JOIN players p ON t.player_id = p.id
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    JOIN leagues l ON t.league_id = l.id
    ORDER BY t.transfer_date DESC
  `;

  const result = await query(queryText);

  return result.rows.map(row => ({
    id: row.id,
    player: row.player,
    fromTeam: row.from_team,
    toTeam: row.to_team,
    league: row.league,
    fee: row.fee,
    contractStart: new Date(row.contract_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    contractEnd: new Date(row.contract_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    marketValue: row.market_value,
    date: row.transfer_date,
    type: row.transfer_type,
  }));
};

export const getTransfersByLeague = async (leagueId) => {
  if (!leagueId) {
    return getAllTransfers();
  }

  const queryText = `
    SELECT 
      t.id,
      t.fee,
      t.transfer_type,
      t.contract_start,
      t.contract_end,
      t.market_value,
      t.transfer_date,
      json_build_object(
        'id', p.id,
        'name', p.name,
        'position', p.position,
        'teamId', p.team_id
      ) as player,
      json_build_object(
        'id', ft.id,
        'name', ft.name,
        'shortName', ft.short_name,
        'logo', ft.logo
      ) as from_team,
      json_build_object(
        'id', tt.id,
        'name', tt.name,
        'shortName', tt.short_name,
        'logo', tt.logo
      ) as to_team,
      json_build_object(
        'id', l.id,
        'name', l.name,
        'shortName', l.short_name,
        'country', l.country,
        'logo', l.logo
      ) as league
    FROM transfers t
    JOIN players p ON t.player_id = p.id
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    JOIN leagues l ON t.league_id = l.id
    WHERE t.league_id = $1
    ORDER BY t.transfer_date DESC
  `;

  const result = await query(queryText, [leagueId]);

  return result.rows.map(row => ({
    id: row.id,
    player: row.player,
    fromTeam: row.from_team,
    toTeam: row.to_team,
    league: row.league,
    fee: row.fee,
    contractStart: new Date(row.contract_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    contractEnd: new Date(row.contract_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    marketValue: row.market_value,
    date: row.transfer_date,
    type: row.transfer_type,
  }));
};
