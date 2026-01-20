import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface League {
  id: number;
  name: string;
  short_name: string;
  country: string;
  logo: string;
  team_count: number;
  player_count: number;
  wikidata_id?: string;
}

interface LeagueDetails extends League {
  teams: Array<{
    id: number;
    name: string;
    short_name: string;
    logo: string;
    player_count: number;
  }>;
}

async function fetchLeagues(): Promise<League[]> {
  const response = await fetch(`${API_URL}/leagues`);
  if (!response.ok) {
    throw new Error('Failed to fetch leagues');
  }
  return response.json();
}

async function fetchLeagueById(id: string): Promise<LeagueDetails> {
  const response = await fetch(`${API_URL}/leagues/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch league');
  }
  return response.json();
}

export function useLeagues() {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeagues,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLeague(id: string) {
  return useQuery({
    queryKey: ['league', id],
    queryFn: () => fetchLeagueById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
