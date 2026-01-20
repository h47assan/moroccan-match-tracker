import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Player {
  id: string;
  name: string;
  position: string;
  imageUrl?: string;
  dateOfBirth?: string;
  marketValue?: string;
  nationality: string;
  team?: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  league?: {
    id: string;
    name: string;
    shortName: string;
    country: string;
    logo: string;
  };
}

export const usePlayers = (leagueId?: string) => {
  return useQuery<Player[]>({
    queryKey: ['players', leagueId],
    queryFn: async () => {
      const url = leagueId 
        ? `${API_URL}/players?leagueId=${leagueId}`
        : `${API_URL}/players`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
