import { Button } from '@/components/ui/button';
import { League } from '@/types/match';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LeagueFilterProps {
  leagues: League[];
  activeLeague: string | null;
  onLeagueChange: (leagueId: string | null) => void;
}

const LeagueFilter = ({ leagues, activeLeague, onLeagueChange }: LeagueFilterProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-2 pb-2">
        <Button
          variant={activeLeague === null ? 'filterActive' : 'filter'}
          size="filter"
          onClick={() => onLeagueChange(null)}
        >
          All Leagues
        </Button>
        {leagues.map((league) => (
          <Button
            key={league.id}
            variant={activeLeague === league.id ? 'filterActive' : 'filter'}
            size="filter"
            onClick={() => onLeagueChange(league.id)}
            className="gap-1.5"
          >
            <span>{league.logo}</span>
            {league.shortName}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-1.5" />
    </ScrollArea>
  );
};

export default LeagueFilter;
