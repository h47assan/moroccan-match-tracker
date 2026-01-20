import { useQuery } from '@tanstack/react-query';
import { Match, League, DateFilter } from '@/types/match';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useMatches = (dateFilter: DateFilter, leagueFilter: string | null) => {
  return useQuery<Match[]>({
    queryKey: ['matches', dateFilter, leagueFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (leagueFilter) params.append('league', leagueFilter);

      const response = await fetch(`${API_URL}/matches?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      return data.data.map((match: any) => ({
        ...match,
        kickoffTime: new Date(match.kickoffTime),
      }));
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Refetch every minute for live updates
  });
};

export const useLeagues = () => {
  return useQuery<League[]>({
    queryKey: ['leagues'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/matches/leagues`);
      if (!response.ok) {
        throw new Error('Failed to fetch leagues');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (leagues don't change often)
  });
};
