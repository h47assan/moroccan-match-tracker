import { Button } from '@/components/ui/button';
import { DateFilter as DateFilterType } from '@/types/match';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';

interface DateFilterProps {
  activeFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
}

const DateFilter = ({ activeFilter, onFilterChange }: DateFilterProps) => {
  const filters: { id: DateFilterType; label: string; icon: typeof Calendar }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'tomorrow', label: 'Tomorrow', icon: CalendarDays },
    { id: 'week', label: 'This Week', icon: CalendarRange },
  ];

  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'filterActive' : 'filter'}
          size="filter"
          onClick={() => onFilterChange(filter.id)}
          className="gap-1.5"
        >
          <filter.icon className="w-3.5 h-3.5" />
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default DateFilter;
