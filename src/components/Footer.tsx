const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇲🇦</span>
            <span className="font-display text-lg tracking-wider">
              MOROCCAN<span className="text-primary">PRO</span>
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Tracking Moroccan talent across the world's top leagues
          </p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Moroccan Pro Tracker. Built with 🫶 for Moroccan football fans worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
