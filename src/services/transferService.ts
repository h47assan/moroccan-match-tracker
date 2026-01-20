import { query } from '@/lib/db';
import { Transfer, MoroccanPlayer, Team, League } from '@/types/match';

export interface TransferRow {
  id: string;
  player_id: string;
  player_name: string;
  player_position: string;
  from_team_id: string;
  from_team_name: string;
  from_team_short: string;
  from_team_logo: string;
  to_team_id: string;
  to_team_name: string;
  to_team_short: string;
  to_team_logo: string;
  league_id: string;
  league_name: string;
  league_short: string;
  league_country: string;
  league_logo: string;
  fee: string;
  transfer_type: 'permanent' | 'loan' | 'free';
  contract_start: Date;
  contract_end: Date;
  market_value: string;
  transfer_date: Date;
}

/**
 * Fetch all transfers
 */
export const fetchTransfers = async (): Promise<Transfer[]> => {
  const queryText = `
    SELECT 
      t.*,
      p.name as player_name, p.position as player_position,
      ft.id as from_team_id, ft.name as from_team_name, ft.short_name as from_team_short, ft.logo as from_team_logo,
      tt.id as to_team_id, tt.name as to_team_name, tt.short_name as to_team_short, tt.logo as to_team_logo,
      l.id as league_id, l.name as league_name, l.short_name as league_short, l.country as league_country, l.logo as league_logo
    FROM transfers t
    JOIN players p ON t.player_id = p.id
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    JOIN leagues l ON t.league_id = l.id
    ORDER BY t.transfer_date DESC
  `;

  const result = await query(queryText);

  return result.rows.map((row: TransferRow) => ({
    id: row.id,
    player: {
      id: row.player_id,
      name: row.player_name,
      position: row.player_position,
      teamId: row.to_team_id,
    },
    fromTeam: {
      id: row.from_team_id,
      name: row.from_team_name,
      shortName: row.from_team_short,
      logo: row.from_team_logo,
    },
    toTeam: {
      id: row.to_team_id,
      name: row.to_team_name,
      shortName: row.to_team_short,
      logo: row.to_team_logo,
    },
    league: {
      id: row.league_id,
      name: row.league_name,
      shortName: row.league_short,
      country: row.league_country,
      logo: row.league_logo,
    },
    fee: row.fee,
    contractStart: new Date(row.contract_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    contractEnd: new Date(row.contract_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    marketValue: row.market_value,
    date: new Date(row.transfer_date),
    type: row.transfer_type,
  }));
};

/**
 * Fetch transfers by league
 */
export const fetchTransfersByLeague = async (leagueId: string | null): Promise<Transfer[]> => {
  if (!leagueId) {
    return fetchTransfers();
  }

  const queryText = `
    SELECT 
      t.*,
      p.name as player_name, p.position as player_position,
      ft.id as from_team_id, ft.name as from_team_name, ft.short_name as from_team_short, ft.logo as from_team_logo,
      tt.id as to_team_id, tt.name as to_team_name, tt.short_name as to_team_short, tt.logo as to_team_logo,
      l.id as league_id, l.name as league_name, l.short_name as league_short, l.country as league_country, l.logo as league_logo
    FROM transfers t
    JOIN players p ON t.player_id = p.id
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    JOIN leagues l ON t.league_id = l.id
    WHERE t.league_id = $1
    ORDER BY t.transfer_date DESC
  `;

  const result = await query(queryText, [leagueId]);

  return result.rows.map((row: TransferRow) => ({
    id: row.id,
    player: {
      id: row.player_id,
      name: row.player_name,
      position: row.player_position,
      teamId: row.to_team_id,
    },
    fromTeam: {
      id: row.from_team_id,
      name: row.from_team_name,
      shortName: row.from_team_short,
      logo: row.from_team_logo,
    },
    toTeam: {
      id: row.to_team_id,
      name: row.to_team_name,
      shortName: row.to_team_short,
      logo: row.to_team_logo,
    },
    league: {
      id: row.league_id,
      name: row.league_name,
      shortName: row.league_short,
      country: row.league_country,
      logo: row.league_logo,
    },
    fee: row.fee,
    contractStart: new Date(row.contract_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    contractEnd: new Date(row.contract_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    marketValue: row.market_value,
    date: new Date(row.transfer_date),
    type: row.transfer_type,
  }));
};
