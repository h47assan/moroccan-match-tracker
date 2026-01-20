export interface MoroccanPlayer {
  id: string;
  name: string;
  position: string;
  teamId: string;
  imageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  kickoffTime: Date;
  status: 'scheduled' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
  };
  moroccanPlayers: MoroccanPlayer[];
}

export interface League {
  id: string;
  name: string;
  shortName: string;
  country: string;
  logo?: string;
}

export type DateFilter = 'today' | 'tomorrow' | 'week';

export interface Transfer {
  id: string;
  player: MoroccanPlayer;
  fromTeam: Team;
  toTeam: Team;
  league: League;
  fee: string;
  contractStart: string;
  contractEnd: string;
  marketValue: string;
  date: Date;
  type: 'permanent' | 'loan';
}
