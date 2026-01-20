import { Calendar, Users, Trophy } from 'lucide-react';

const HeroSection = () => {
  const stats = [
    { icon: Users, label: 'Players Tracked', value: '50+' },
    { icon: Trophy, label: 'Leagues Covered', value: '12' },
    { icon: Calendar, label: 'Daily Matches', value: '8' },
  ];

  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-50" />
      
      <div className="container relative">
        <div className="text-center space-y-6 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">Live Match Tracking</span>
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-wide">
            NEVER MISS A
            <br />
            <span className="gradient-text-primary">MOROCCAN</span> MOMENT
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Track every match featuring Moroccan players across the world's top leagues. 
            Real-time scores, schedules, and player updates.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card p-4 text-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <stat.icon className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="font-display text-2xl md:text-3xl text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
