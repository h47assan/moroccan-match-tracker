import { Match } from '@/types/match';
import MatchCard from './MatchCard';
import { Calendar } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  title?: string;
}

const MatchList = ({ matches, title }: MatchListProps) => {
  if (matches.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">No Matches Found</h3>
        <p className="text-muted-foreground">
          There are no matches featuring Moroccan players for this selection.
        </p>
      </div>
    );
  }

  // Group matches by status (live first, then scheduled, then finished)
  const sortedMatches = [...matches].sort((a, b) => {
    const statusOrder = { live: 0, scheduled: 1, finished: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="font-display text-xl text-foreground flex items-center gap-2">
          {title}
          <span className="text-muted-foreground text-sm font-sans">({matches.length} matches)</span>
        </h3>
      )}
      <div className="grid gap-4">
        {sortedMatches.map((match, index) => (
          <MatchCard key={match.id} match={match} index={index} />
        ))}
      </div>
    </div>
  );
};

export default MatchList;
