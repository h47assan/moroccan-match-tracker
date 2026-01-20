import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransferFilters from '@/components/TransferFilters';
import TransferTable from '@/components/TransferTable';
import { mockTransfers, getTransfersByLeague } from '@/data/transferData';

const Transfers = () => {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [transferType, setTransferType] = useState<'all' | 'in' | 'out'>('all');

  const filteredTransfers = useMemo(() => {
    let transfers = [...mockTransfers];
    
    // Sort by most recent first
    transfers.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Filter by league
    transfers = getTransfersByLeague(transfers, selectedLeague);
    
    return transfers;
  }, [selectedLeague, transferType]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
                  TRANSFER<span className="text-primary">CENTER</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Track all Moroccan player transfers
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-6 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{mockTransfers.length}</span>
                <span className="text-muted-foreground">Total Transfers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-secondary">
                  {mockTransfers.filter(t => t.type === 'loan').length}
                </span>
                <span className="text-muted-foreground">Loans</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {mockTransfers.filter(t => t.type === 'permanent').length}
                </span>
                <span className="text-muted-foreground">Permanent</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters & Table */}
        <section className="container pb-12">
          <TransferFilters
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
            transferType={transferType}
            onTransferTypeChange={setTransferType}
          />

          <TransferTable transfers={filteredTransfers} />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Transfers;
