import { useQuery } from '@tanstack/react-query';
import { Transfer } from '@/types/match';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useTransfers = (leagueFilter: string | null) => {
  return useQuery<Transfer[]>({
    queryKey: ['transfers', leagueFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leagueFilter) params.append('league', leagueFilter);

      const response = await fetch(`${API_URL}/transfers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transfers');
      }
      const data = await response.json();
      return data.data.map((transfer: any) => ({
        ...transfer,
        date: new Date(transfer.date),
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
