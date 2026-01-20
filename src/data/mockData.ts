import { Match, League, MoroccanPlayer } from '@/types/match';

export const leagues: League[] = [
  { id: 'ligue1', name: 'Ligue 1', shortName: 'L1', country: 'France', logo: '🇫🇷' },
  { id: 'laliga', name: 'La Liga', shortName: 'LL', country: 'Spain', logo: '🇪🇸' },
  { id: 'premier', name: 'Premier League', shortName: 'PL', country: 'England', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'seriea', name: 'Serie A', shortName: 'SA', country: 'Italy', logo: '🇮🇹' },
  { id: 'superlig', name: 'Süper Lig', shortName: 'SL', country: 'Turkey', logo: '🇹🇷' },
  { id: 'mls', name: 'MLS', shortName: 'MLS', country: 'USA', logo: '🇺🇸' },
  { id: 'ucl', name: 'Champions League', shortName: 'UCL', country: 'Europe', logo: '⭐' },
  { id: 'uel', name: 'Europa League', shortName: 'UEL', country: 'Europe', logo: '🌟' },
];

const moroccanPlayers: MoroccanPlayer[] = [
  { id: '1', name: 'Achraf Hakimi', position: 'RB', teamId: 'psg' },
  { id: '2', name: 'Youssef En-Nesyri', position: 'ST', teamId: 'fenerbahce' },
  { id: '3', name: 'Sofyan Amrabat', position: 'CM', teamId: 'fenerbahce' },
  { id: '4', name: 'Hakim Ziyech', position: 'RW', teamId: 'galatasaray' },
  { id: '5', name: 'Noussair Mazraoui', position: 'RB', teamId: 'manutd' },
  { id: '6', name: 'Azzedine Ounahi', position: 'CM', teamId: 'marseille' },
  { id: '7', name: 'Yassine Bounou', position: 'GK', teamId: 'alahli' },
  { id: '8', name: 'Sofiane Boufal', position: 'LW', teamId: 'alhilal' },
  { id: '9', name: 'Nayef Aguerd', position: 'CB', teamId: 'realsociedad' },
  { id: '10', name: 'Brahim Díaz', position: 'AM', teamId: 'realmadrid' },
  { id: '11', name: 'Ilias Akhomach', position: 'RW', teamId: 'villarreal' },
  { id: '12', name: 'Abde Ezzalzouli', position: 'LW', teamId: 'betis' },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const setTime = (date: Date, hours: number, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

export const mockMatches: Match[] = [
  {
    id: '1',
    homeTeam: { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', logo: '🔵🔴' },
    awayTeam: { id: 'lyon', name: 'Olympique Lyon', shortName: 'OL', logo: '🦁' },
    league: leagues[0],
    kickoffTime: setTime(today, 21, 0),
    status: 'live',
    score: { home: 2, away: 1 },
    moroccanPlayers: [moroccanPlayers[0]],
  },
  {
    id: '2',
    homeTeam: { id: 'fenerbahce', name: 'Fenerbahçe', shortName: 'FB', logo: '💛💙' },
    awayTeam: { id: 'besiktas', name: 'Beşiktaş', shortName: 'BJK', logo: '🦅' },
    league: leagues[4],
    kickoffTime: setTime(today, 19, 0),
    status: 'scheduled',
    moroccanPlayers: [moroccanPlayers[1], moroccanPlayers[2]],
  },
  {
    id: '3',
    homeTeam: { id: 'galatasaray', name: 'Galatasaray', shortName: 'GS', logo: '🦁🟡🔴' },
    awayTeam: { id: 'trabzon', name: 'Trabzonspor', shortName: 'TS', logo: '🔵🔴' },
    league: leagues[4],
    kickoffTime: setTime(today, 17, 30),
    status: 'finished',
    score: { home: 3, away: 0 },
    moroccanPlayers: [moroccanPlayers[3]],
  },
  {
    id: '4',
    homeTeam: { id: 'manutd', name: 'Manchester United', shortName: 'MUN', logo: '🔴👹' },
    awayTeam: { id: 'chelsea', name: 'Chelsea', shortName: 'CHE', logo: '🔵' },
    league: leagues[2],
    kickoffTime: setTime(tomorrow, 17, 30),
    status: 'scheduled',
    moroccanPlayers: [moroccanPlayers[4]],
  },
  {
    id: '5',
    homeTeam: { id: 'marseille', name: 'Olympique Marseille', shortName: 'OM', logo: '🔵⚪' },
    awayTeam: { id: 'monaco', name: 'AS Monaco', shortName: 'ASM', logo: '🔴⚪' },
    league: leagues[0],
    kickoffTime: setTime(tomorrow, 21, 0),
    status: 'scheduled',
    moroccanPlayers: [moroccanPlayers[5]],
  },
  {
    id: '6',
    homeTeam: { id: 'realsociedad', name: 'Real Sociedad', shortName: 'RSO', logo: '🔵⚪' },
    awayTeam: { id: 'athletic', name: 'Athletic Bilbao', shortName: 'ATH', logo: '🔴⚪' },
    league: leagues[1],
    kickoffTime: setTime(tomorrow, 20, 0),
    status: 'scheduled',
    moroccanPlayers: [moroccanPlayers[8]],
  },
  {
    id: '7',
    homeTeam: { id: 'betis', name: 'Real Betis', shortName: 'BET', logo: '💚⚪' },
    awayTeam: { id: 'realmadrid', name: 'Real Madrid', shortName: 'RMA', logo: '⚪👑' },
    league: leagues[1],
    kickoffTime: setTime(tomorrow, 21, 0),
    status: 'scheduled',
    moroccanPlayers: [moroccanPlayers[11], moroccanPlayers[9]],
  },
  {
    id: '8',
    homeTeam: { id: 'villarreal', name: 'Villarreal', shortName: 'VIL', logo: '💛🔵' },
    awayTeam: { id: 'sevilla', name: 'Sevilla', shortName: 'SEV', logo: '🔴⚪' },
    league: leagues[1],
    kickoffTime: setTime(today, 18, 30),
    status: 'finished',
    score: { home: 2, away: 2 },
    moroccanPlayers: [moroccanPlayers[10]],
  },
];

export const getMatchesByDate = (filter: 'today' | 'tomorrow' | 'week'): Match[] => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return mockMatches.filter(match => {
    const matchDate = new Date(match.kickoffTime);
    if (filter === 'today') {
      return matchDate >= todayStart && matchDate < tomorrowStart;
    } else if (filter === 'tomorrow') {
      const dayAfterTomorrow = new Date(tomorrowStart);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      return matchDate >= tomorrowStart && matchDate < dayAfterTomorrow;
    } else {
      return matchDate >= todayStart && matchDate < weekEnd;
    }
  });
};

export const getMatchesByLeague = (matches: Match[], leagueId: string | null): Match[] => {
  if (!leagueId) return matches;
  return matches.filter(match => match.league.id === leagueId);
};
