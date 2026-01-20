import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DateFilter from '@/components/DateFilter';
import LeagueFilter from '@/components/LeagueFilter';
import MatchList from '@/components/MatchList';
import Footer from '@/components/Footer';
import { DateFilter as DateFilterType } from '@/types/match';
import { leagues, getMatchesByDate, getMatchesByLeague } from '@/data/mockData';

const Index = () => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);

  const filteredMatches = useMemo(() => {
    const byDate = getMatchesByDate(dateFilter);
    return getMatchesByLeague(byDate, leagueFilter);
  }, [dateFilter, leagueFilter]);

  const getDateTitle = () => {
    switch (dateFilter) {
      case 'today':
        return "Today's Matches";
      case 'tomorrow':
        return "Tomorrow's Matches";
      case 'week':
        return 'This Week';
      default:
        return 'Matches';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        
        <section className="container pb-12">
          {/* Filters */}
          <div className="space-y-4 mb-8">
            <DateFilter 
              activeFilter={dateFilter} 
              onFilterChange={setDateFilter} 
            />
            <LeagueFilter 
              leagues={leagues} 
              activeLeague={leagueFilter} 
              onLeagueChange={setLeagueFilter} 
            />
          </div>

          {/* Match List */}
          <MatchList 
            matches={filteredMatches} 
            title={getDateTitle()}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
