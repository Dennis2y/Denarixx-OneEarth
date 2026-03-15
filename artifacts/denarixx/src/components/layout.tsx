import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Zap, Shield, Globe, Bell, MapPin, Users, Settings, LogOut, Menu, Search, Languages } from 'lucide-react';
import { cn } from './ui-core';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
  { code: 'fr', label: 'FR', name: 'Français', dir: 'ltr' },
  { code: 'sw', label: 'SW', name: 'Kiswahili', dir: 'ltr' },
  { code: 'ar', label: 'AR', name: 'العربية', dir: 'rtl' },
  { code: 'pt', label: 'PT', name: 'Português', dir: 'ltr' },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === i18n.resolvedLanguage) || LANGUAGES[0];

  const handleSelect = (code: string, dir: string) => {
    i18n.changeLanguage(code);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-white hover:bg-secondary transition-colors border border-transparent hover:border-border/50"
        title="Change Language"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline tracking-widest uppercase">{current.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Language</p>
            </div>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code, lang.dir)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors",
                  i18n.resolvedLanguage === lang.code
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary hover:text-white"
                )}
              >
                <span>{lang.name}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [time, setTime] = useState(new Date());

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Home, group: t('nav.core') },
    { href: '/energy', label: t('nav.energy'), icon: Zap, group: t('nav.modules') },
    { href: '/lifemesh', label: t('nav.lifemesh'), icon: Shield, group: t('nav.modules') },
    { href: '/earthshield', label: t('nav.earthshield'), icon: Globe, group: t('nav.modules') },
    { href: '/alerts', label: t('nav.alerts'), icon: Bell, group: t('nav.management') },
    { href: '/sites', label: t('nav.sites'), icon: MapPin, group: t('nav.management') },
    { href: '/users', label: t('nav.users'), icon: Users, group: t('nav.management') },
    { href: '/settings', label: t('nav.settings'), icon: Settings, group: t('nav.management') },
  ];

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const saved = localStorage.getItem('i18nextLng') || navigator.language.split('-')[0];
    const lang = LANGUAGES.find(l => l.code === saved) || LANGUAGES[0];
    document.documentElement.setAttribute('dir', lang.dir);
    document.documentElement.setAttribute('lang', lang.code);
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
      
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative top-0 left-0 h-full w-[280px] bg-sidebar data-grid bg-tech-grid border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out group/sidebar",
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
                      {item.href === '/dashboard' && isActive && (
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
              <span className="text-xs font-bold text-green-500 tracking-widest uppercase">{t('header.systemOnline')}</span>
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
            <span className={cn("ml-4 font-medium", !sidebarOpen && "md:hidden")}>{t('nav.terminate')}</span>
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
             
             <div className="hidden lg:flex items-center gap-6 ml-4">
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 {t('header.energyGrid')}
               </div>
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 {t('header.lifemeshNet')}
               </div>
               <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 {t('header.earthshieldIntel')}
               </div>
             </div>
           </div>

           <div className="flex-1 max-w-md hidden md:block mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder={t('header.search')}
                  className="w-full bg-input/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
           </div>
           
           <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
             <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                {format(time, 'HH:mm:ss')} UTC
             </div>
             <LanguageSwitcher />
             <button className="relative p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-secondary">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive border-[1.5px] border-background"></span>
               </span>
             </button>
             <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-border">
               <div className="text-right hidden sm:block">
                 <div className="text-sm font-bold text-white">Cmdr. Prime</div>
                 <div className="text-[10px] text-primary tracking-widest uppercase">{t('header.levelAuth')}</div>
               </div>
               <div className="w-9 h-9 rounded-full bg-secondary border-2 border-primary/50 flex items-center justify-center text-primary font-bold overflow-hidden shadow-[0_0_10px_rgba(201,168,76,0.2)]">
                 CP
               </div>
             </div>
           </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-africa-ambient">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none -z-10" />
          <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
