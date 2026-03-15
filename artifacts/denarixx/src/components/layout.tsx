import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Zap, Shield, Globe, Bell, MapPin, Users, Settings, LogOut, Menu } from 'lucide-react';
import { cn } from './ui-core';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/energy', label: 'Denarixx Energy', icon: Zap },
  { href: '/lifemesh', label: 'Denarixx LifeMesh', icon: Shield },
  { href: '/earthshield', label: 'Denarixx EarthShield', icon: Globe },
  { href: '/alerts', label: 'Unified Alerts', icon: Bell },
  { href: '/sites', label: 'Sites & Nodes', icon: MapPin },
  { href: '/users', label: 'Personnel', icon: Users },
  { href: '/settings', label: 'System Settings', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const handleLogout = () => {
    setLocation('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative top-0 left-0 h-full w-72 bg-sidebar border-r border-border/50 flex flex-col z-50 transition-transform duration-300 ease-in-out",
        !sidebarOpen && "-translate-x-full md:translate-x-0 md:w-20 lg:w-72"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-border/50 bg-background/50">
          <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} className="h-10 w-10 shrink-0" alt="Logo" />
          <span className={cn(
            "font-display font-bold text-2xl tracking-[0.15em] text-primary ml-4 transition-opacity duration-200",
            !sidebarOpen && "md:opacity-0 lg:opacity-100 hidden lg:block"
          )}>
            DENARIXX
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-white"
              )}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                <span className={cn(
                  "ml-4 font-medium tracking-wide transition-opacity",
                  !sidebarOpen && "md:opacity-0 lg:opacity-100 hidden lg:block"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <button onClick={handleLogout} className={cn(
            "flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group",
            !sidebarOpen && "md:justify-center lg:justify-start"
          )}>
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className={cn("ml-4 font-medium", !sidebarOpen && "md:hidden lg:block")}>Terminate Session</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-white md:hidden transition-colors"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div className="hidden sm:block">
               <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Global Status</span>
               <div className="flex items-center mt-1">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                 <span className="text-sm text-foreground">All Systems Nominal</span>
               </div>
             </div>
           </div>
           
           <div className="flex items-center gap-6">
             <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background"></span>
             </button>
             <div className="flex items-center gap-3 pl-6 border-l border-border/50">
               <div className="text-right hidden sm:block">
                 <div className="text-sm font-bold text-white">Commander Prime</div>
                 <div className="text-xs text-primary tracking-widest uppercase">Level 5 Auth</div>
               </div>
               <div className="w-10 h-10 rounded-full bg-secondary border-2 border-primary/50 flex items-center justify-center text-primary font-bold overflow-hidden shadow-[0_0_10px_rgba(201,168,76,0.2)]">
                 CP
               </div>
             </div>
           </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none -z-10" />
          <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
