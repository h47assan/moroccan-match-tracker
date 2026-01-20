import { motion } from 'framer-motion';
import { Users, X } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePlayers } from '@/hooks/usePlayers';
import { useLeagues } from '@/hooks/useLeagues';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Players = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const leagueId = searchParams.get('league');
  const { data: players = [], isLoading } = usePlayers(leagueId || undefined);
  const { data: leagues = [] } = useLeagues();
  
  const selectedLeague = leagues.find(l => l.id.toString() === leagueId);
  
  const clearFilter = () => {
    setSearchParams({});
  };

  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase();
    if (pos.includes('GK')) return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    if (pos.includes('CB') || pos.includes('LB') || pos.includes('RB')) return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    if (pos.includes('CM') || pos.includes('DM') || pos.includes('AM')) return 'bg-green-500/20 text-green-700 border-green-500/30';
    return 'bg-red-500/20 text-red-700 border-red-500/30';
  };

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
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">
                  MOROCCAN<span className="text-primary"> PLAYERS</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  {selectedLeague ? `Players in ${selectedLeague.name}` : 'All Moroccan players in top European leagues'}
                </p>
              </div>
              {selectedLeague && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilter}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filter
                </Button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-6 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{players.length}</span>
                <span className="text-muted-foreground">Total Players</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {players.filter(p => p.team).length}
                </span>
                <span className="text-muted-foreground">Active</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Players Grid */}
        <section className="container pb-12">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading players...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-16 h-16 border-2 border-primary/20">
                          <AvatarImage src={player.imageUrl} alt={player.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight mb-1">
                            {player.name}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`${getPositionColor(player.position)} text-xs mb-2`}
                          >
                            {player.position}
                          </Badge>
                          
                          {player.team && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-xl">{player.team.logo}</span>
                                <span className="text-muted-foreground truncate">
                                  {player.team.name}
                                </span>
                              </div>
                              {player.league && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{player.league.logo}</span>
                                  <span>{player.league.shortName}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {player.marketValue && (
                            <div className="mt-2 text-xs font-semibold text-primary">
                              {player.marketValue}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Players;
