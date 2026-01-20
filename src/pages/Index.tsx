import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DateFilter from '@/components/DateFilter';
import LeagueFilter from '@/components/LeagueFilter';
import MatchList from '@/components/MatchList';
import Footer from '@/components/Footer';
import { DateFilter as DateFilterType } from '@/types/match';
import { useMatches, useLeagues } from '@/hooks/useMatches';

const Index = () => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);

  const { data: matches = [], isLoading: matchesLoading } = useMatches(dateFilter, leagueFilter);
  const { data: leagues = [], isLoading: leaguesLoading } = useLeagues();

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
          {matchesLoading || leaguesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading matches...</p>
            </div>
          ) : (
            <MatchList 
              matches={matches} 
              title={getDateTitle()}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
