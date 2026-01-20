import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeagues } from '@/hooks/useLeagues';

interface TransferFiltersProps {
  selectedLeague: string | null;
  onLeagueChange: (leagueId: string | null) => void;
  transferType: 'all' | 'in' | 'out';
  onTransferTypeChange: (type: 'all' | 'in' | 'out') => void;
}

const TransferFilters = ({
  selectedLeague,
  onLeagueChange,
  transferType,
  onTransferTypeChange,
}: TransferFiltersProps) => {
  const { data: transferLeagues = [] } = useLeagues();
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {/* League Filter */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">League</span>
        <Select
          value={selectedLeague || 'all'}
          onValueChange={(value) => onLeagueChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="All leagues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All leagues</SelectItem>
            {transferLeagues.map((league) => (
              <SelectItem key={league.id} value={league.id}>
                {league.logo} {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transfer Type Toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Transfers</span>
        <div className="flex rounded-lg border border-border bg-card p-1">
          {(['all', 'in', 'out'] as const).map((type) => (
            <Button
              key={type}
              variant={transferType === type ? 'default' : 'ghost'}
              size="sm"
              className="capitalize px-4"
              onClick={() => onTransferTypeChange(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Clear Button */}
      <Button
        variant="ghost"
        className="ml-auto text-primary hover:text-primary/80"
        onClick={() => {
          onLeagueChange(null);
          onTransferTypeChange('all');
        }}
      >
        Clear
      </Button>
    </div>
  );
};

export default TransferFilters;
