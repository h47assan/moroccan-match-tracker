import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, Building2, MapPin } from 'lucide-react';
import { useLeagues } from '@/hooks/useLeagues';

const Leagues = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: leagues = [], isLoading } = useLeagues();

  const filteredLeagues = leagues.filter((league) =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group leagues by country
  const leaguesByCountry = filteredLeagues.reduce((acc, league) => {
    const country = league.country || 'Unknown';
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(league);
    return acc;
  }, {} as Record<string, typeof leagues>);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
                Leagues
              </h1>
              <p className="text-muted-foreground mt-2">
                All leagues featuring Moroccan players worldwide
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leagues</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leagues.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {leagues.reduce((sum, league) => sum + Number(league.team_count || 0), 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Countries</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(leaguesByCountry).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leagues or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Leagues List */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(leaguesByCountry)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([country, countryLeagues]) => (
                  <div key={country} className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {country}
                      <Badge variant="secondary">{countryLeagues.length}</Badge>
                    </h2>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {countryLeagues
                        .sort((a, b) => b.player_count - a.player_count)
                        .map((league) => (
                          <Link
                            key={league.id}
                            to={`/players?league=${league.id}`}
                          >
                            <Card className="group hover:border-primary transition-colors cursor-pointer h-full">
                              <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      {league.logo && (
                                        <span className="text-2xl">{league.logo}</span>
                                      )}
                                      <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                                        {league.name}
                                      </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {league.short_name}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{league.team_count}</span>
                                    <span className="text-muted-foreground">
                                      {league.team_count === 1 ? 'team' : 'teams'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{league.player_count}</span>
                                    <span className="text-muted-foreground">
                                      {league.player_count === 1 ? 'player' : 'players'}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {filteredLeagues.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No leagues found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Leagues;
