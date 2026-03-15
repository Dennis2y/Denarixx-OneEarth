import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Zap, Shield, Globe, Bell, MapPin, Users, Settings, LogOut, Menu, Search } from 'lucide-react';
import { cn } from './ui-core';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, group: 'CORE' },
  { href: '/energy', label: 'Energy Grid', icon: Zap, group: 'MODULES' },
  { href: '/lifemesh', label: 'LifeMesh Network', icon: Shield, group: 'MODULES' },
  { href: '/earthshield', label: 'EarthShield Intel', icon: Globe, group: 'MODULES' },
  { href: '/alerts', label: 'Unified Alerts', icon: Bell, group: 'MANAGEMENT' },
  { href: '/sites', label: 'Sites & Nodes', icon: MapPin, group: 'MANAGEMENT' },
  { href: '/users', label: 'Personnel', icon: Users, group: 'MANAGEMENT' },
  { href: '/settings', label: 'System Settings', icon: Settings, group: 'MANAGEMENT' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const handleLogout = () => {
    setLocation('/login');
  };

  const groups = Array.from(new Set(navItems.map(item => item.group)));

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
        "fixed md:relative top-0 left-0 h-full w-[280px] bg-sidebar data-grid border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out group/sidebar",
        !sidebarOpen && "-translate-x-full md:translate-x-0 md:w-[72px]"
      )}>
        <div className="h-24 flex items-center px-4 border-b border-sidebar-border bg-background/50">
          <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} className="h-10 w-10 shrink-0 ml-1" alt="Logo" />
          <div className={cn(
            "ml-4 flex flex-col justify-center transition-opacity duration-200 overflow-hidden whitespace-nowrap",
            !sidebarOpen && "md:opacity-0 md:w-0"
          )}>
            <span className="font-display font-bold text-xl tracking-[0.15em] text-primary leading-tight">
              DENARIXX
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              OneEarth Command
            </span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          {groups.map((group) => (
            <div key={group} className="space-y-1">
              <div className={cn(
                "px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 transition-opacity",
                !sidebarOpen && "md:opacity-0"
              )}>
                {group}
              </div>
              {navItems.filter(item => item.group === group).map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} title={!sidebarOpen ? item.label : undefined} className={cn(
                    "flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative group/item",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20 gold-glow" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  )}>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r" />}
                    <div className="relative">
                      <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover/item:scale-110", isActive && "text-primary")} />
                      {item.label === 'Dashboard' && isActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                    <span className={cn(
                      "ml-4 font-medium tracking-wide transition-opacity whitespace-nowrap",
                      !sidebarOpen && "md:opacity-0 md:hidden"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-sidebar/80 backdrop-blur-md">
          <div className={cn(
            "mb-4 flex flex-col items-center justify-center transition-opacity",
            !sidebarOpen && "md:opacity-0 md:hidden"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-500 tracking-widest uppercase">System Online</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {format(time, 'yyyy-MM-dd HH:mm:ss')} UTC
            </div>
          </div>
          <button onClick={handleLogout} className={cn(
            "flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group/logout",
            !sidebarOpen && "md:justify-center"
          )}>
            <LogOut className="w-5 h-5 shrink-0 group-hover/logout:scale-110 transition-transform" />
            <span className={cn("ml-4 font-medium", !sidebarOpen && "md:hidden")}>Terminate</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 md:h-18 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
           <div className="flex items-center gap-4 flex-1">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-white transition-colors"
             >
               <Menu className="w-5 h-5" />
             </button>
             
             {/* Global Status Indicators */}
             <div className="hidden lg:flex items-center gap-6 ml-4">
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 Energy Grid
               </div>
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 LifeMesh Network
               </div>
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 EarthShield Intel
               </div>
             </div>
           </div>

           <div className="flex-1 max-w-md hidden md:block mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Query global databanks..." 
                  className="w-full bg-input/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
           </div>
           
           <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
             <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                {format(time, 'HH:mm:ss')} UTC
             </div>
             <button className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-secondary">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive border-[1.5px] border-background"></span>
               </span>
             </button>
             <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-border">
               <div className="text-right hidden sm:block">
                 <div className="text-sm font-bold text-white">Cmdr. Prime</div>
                 <div className="text-[10px] text-primary tracking-widest uppercase">Level 5 Auth</div>
               </div>
               <div className="w-9 h-9 rounded-full bg-secondary border-2 border-primary/50 flex items-center justify-center text-primary font-bold overflow-hidden shadow-[0_0_10px_rgba(201,168,76,0.2)]">
                 CP
               </div>
             </div>
           </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none -z-10" />
          <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
