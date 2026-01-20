import { Match } from '@/types/match';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
  index: number;
}

const MatchCard = ({ match, index }: MatchCardProps) => {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const formatKickoffTime = (date: Date) => {
    return format(date, 'HH:mm');
  };

  return (
    <div 
      className="glass-card-hover p-4 md:p-5 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* League & Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{match.league.logo}</span>
          <span className="text-sm text-muted-foreground">{match.league.name}</span>
        </div>
        {isLive ? (
          <Badge variant="live" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            LIVE
          </Badge>
        ) : isFinished ? (
          <Badge variant="league">FT</Badge>
        ) : (
          <Badge variant="league" className="gap-1">
            <Clock className="w-3 h-3" />
            {formatKickoffTime(match.kickoffTime)}
          </Badge>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-muted/50 text-2xl">
            {match.homeTeam.logo}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{match.homeTeam.shortName}</p>
            <p className="text-xs text-muted-foreground truncate hidden md:block">{match.homeTeam.name}</p>
          </div>
        </div>

        {/* Score or VS */}
        <div className="flex-shrink-0 px-4">
          {match.score ? (
            <div className="flex items-center gap-2 font-display text-2xl md:text-3xl">
              <span className={isLive ? 'text-foreground' : 'text-muted-foreground'}>{match.score.home}</span>
              <span className="text-muted-foreground/50">-</span>
              <span className={isLive ? 'text-foreground' : 'text-muted-foreground'}>{match.score.away}</span>
            </div>
          ) : (
            <span className="text-muted-foreground font-semibold">VS</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3 justify-end">
          <div className="min-w-0 text-right">
            <p className="font-semibold text-foreground truncate">{match.awayTeam.shortName}</p>
            <p className="text-xs text-muted-foreground truncate hidden md:block">{match.awayTeam.name}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-muted/50 text-2xl">
            {match.awayTeam.logo}
          </div>
        </div>
      </div>

      {/* Moroccan Players */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🇲🇦</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Moroccans in Match</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {match.moroccanPlayers.map((player) => (
            <Badge key={player.id} variant="player" className="gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {player.name}
              <span className="text-muted-foreground">({player.position})</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
