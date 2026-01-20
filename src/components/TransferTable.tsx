import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Transfer } from '@/types/match';

interface TransferTableProps {
  transfers: Transfer[];
}

const TransferTable = ({ transfers }: TransferTableProps) => {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transfers found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Player</TableHead>
            <TableHead className="text-muted-foreground">Fee</TableHead>
            <TableHead className="text-muted-foreground">From</TableHead>
            <TableHead className="text-muted-foreground text-center">Position</TableHead>
            <TableHead className="text-muted-foreground">Contract</TableHead>
            <TableHead className="text-muted-foreground">Market Value</TableHead>
            <TableHead className="text-muted-foreground text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer, index) => (
            <motion.tr
              key={transfer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-border hover:bg-muted/30"
            >
              {/* Player */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                    🇲🇦
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{transfer.player.name}</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <span>{transfer.toTeam.logo}</span>
                      <span>{transfer.toTeam.shortName}</span>
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Fee */}
              <TableCell>
                <span className={transfer.type === 'loan' ? 'text-secondary' : 'text-foreground'}>
                  {transfer.fee}
                </span>
              </TableCell>

              {/* From Team */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{transfer.fromTeam.logo}</span>
                  <span className="text-muted-foreground">{transfer.fromTeam.name}</span>
                </div>
              </TableCell>

              {/* Position */}
              <TableCell className="text-center">
                <Badge variant="outline" className="font-mono text-xs">
                  {transfer.player.position}
                </Badge>
              </TableCell>

              {/* Contract */}
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  {transfer.contractStart} - {transfer.contractEnd}
                </span>
              </TableCell>

              {/* Market Value */}
              <TableCell>
                <span className="text-primary font-medium">{transfer.marketValue}</span>
              </TableCell>

              {/* Date */}
              <TableCell className="text-right text-muted-foreground">
                {format(transfer.date, 'MMM d, yyyy')}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransferTable;
