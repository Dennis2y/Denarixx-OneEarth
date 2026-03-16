import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Zap, Shield, Globe, Bell, MapPin, Users, Settings, LogOut, Menu, Search, Cpu, X } from 'lucide-react';
import { cn } from './ui-core';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth, roleLabel } from '@/context/auth';
import { apiUrl } from "@/lib/api";

function SystemRibbon({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch(apiUrl('/api/dashboard/stats'), { credentials: 'include' });
        if (r.ok) setStats(await r.json());
      } catch { /* non-blocking */ }
    };
    if (user) fetchStats();
    const si = setInterval(() => { if (user) fetchStats(); }, 30000);
    const ti = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(si); clearInterval(ti); };
  }, [user]);

  const criticalCount = stats?.criticalAlerts ?? 0;
  const threatLevel = criticalCount > 5 ? 'CRITICAL' : criticalCount > 2 ? 'ELEVATED' : criticalCount > 0 ? 'GUARDED' : 'NOMINAL';
  const threatColor = threatLevel === 'CRITICAL' ? 'text-destructive' : threatLevel === 'ELEVATED' ? 'text-amber-500' : threatLevel === 'GUARDED' ? 'text-blue-400' : 'text-green-400';
  const threatDot = threatLevel === 'CRITICAL' ? 'bg-destructive' : threatLevel === 'ELEVATED' ? 'bg-amber-500' : threatLevel === 'GUARDED' ? 'bg-blue-400' : 'bg-green-500';

  const recentAlerts: any[] = stats?.recentAlerts ?? [];
  const tickerText = recentAlerts.slice(0, 10)
    .map((a: any) => `${(a.severity ?? 'INFO').toUpperCase()} · ${a.title ?? 'SYSTEM EVENT'} · ${a.location ?? a.module?.toUpperCase() ?? 'GLOBAL'}`)
    .join('  ◆  ');
  const ticker = tickerText ? tickerText + '  ◆  ' + tickerText : '';

  const sessionId = user ? `SES-${String((user.id ?? 1) * 4829 + 1337).slice(-4).toUpperCase()}` : '—';

  return (
    <div className="shrink-0 border-b border-border/50 bg-sidebar/70 backdrop-blur-md relative overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 h-7">
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] font-mono font-bold uppercase tracking-widest overflow-hidden">
          <div className={cn('flex items-center gap-1.5 shrink-0', threatColor)}>
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', threatDot)} />
            <span className="hidden xs:inline">THREAT:</span> <span>{threatLevel}</span>
          </div>
          <span className="text-border/40 shrink-0">│</span>
          <span className="text-muted-foreground shrink-0">
            CRITICAL: <span className="text-destructive">{stats ? criticalCount : '—'}</span>
          </span>
          <span className="text-border/40 hidden sm:inline shrink-0">│</span>
          <span className="hidden sm:inline text-muted-foreground shrink-0">
            NODES: <span className="text-green-400">{stats ? stats.activeSites : '—'}</span>
          </span>
          <span className="text-border/40 hidden md:inline shrink-0">│</span>
          <span className="hidden md:inline text-muted-foreground shrink-0">
            ENERGY: <span className="text-primary">{stats ? `${Number(stats.energyAvailability).toFixed(1)}%` : '—'}</span>
          </span>
          <span className="text-border/40 hidden lg:inline shrink-0">│</span>
          <span className="hidden lg:inline text-muted-foreground shrink-0">
            PROTECTED: <span className="text-blue-400">{stats ? stats.protectedPeople : '—'}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
          <span className="classified-badge hidden sm:inline">CLASSIFIED</span>
          <span className="text-border/40 hidden sm:inline">│</span>
          <span className="text-primary font-bold">L{user?.clearanceLevel ?? '—'}</span>
          <span className="text-border/40">│</span>
          <span className="text-muted-foreground/60 hidden md:inline">{sessionId}</span>
          <span className="text-border/40 hidden md:inline">│</span>
          <span className="tabular-nums text-muted-foreground">{format(time, 'HH:mm:ss')} UTC</span>
        </div>
      </div>

      <div className="flex items-center h-[18px] border-t border-border/20 overflow-hidden">
        <div className="shrink-0 px-2 sm:px-3 h-full flex items-center bg-primary/10 border-r border-primary/30">
          <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">LIVE</span>
        </div>
        {ticker ? (
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap text-[9px] font-mono text-muted-foreground/60 inline-block px-4">
              {ticker}
            </div>
          </div>
        ) : (
          <span className="ml-3 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
            NO ACTIVE THREAT SIGNALS — ALL SYSTEMS NOMINAL
          </span>
        )}
      </div>
    </div>
  );
}

const BOTTOM_NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/sites', icon: MapPin, label: 'Sites' },
  { href: '/command-center', icon: Cpu, label: 'Command' },
];

const RTL_LANGS = new Set(['ar', 'fa', 'he']);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Home, group: t('nav.core') },
    { href: '/command-center', label: 'Command Center', icon: Cpu, group: t('nav.core') },
    { href: '/global-map', label: 'Global Map', icon: Globe, group: t('nav.core') },
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
    document.documentElement.setAttribute('dir', RTL_LANGS.has(saved) ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', saved);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const groups = Array.from(new Set(navItems.map(item => item.group)));
  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'CP';
  const displayName = user?.name ?? 'Cmdr. Prime';
  const clearanceLevel = user?.clearanceLevel ?? 5;

  const sidebarContent = (
    <>
      <div className="h-14 md:h-16 flex items-center px-4 border-b border-sidebar-border bg-background/50 shrink-0 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} className="h-8 w-8 shrink-0" alt="Logo" />
          <div className="flex flex-col justify-center overflow-hidden whitespace-nowrap">
            <span className="font-display font-bold text-lg tracking-[0.15em] text-primary leading-tight">DENARIXX</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">OneEarth Command</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-secondary transition-colors shrink-0 md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {groups.map((group) => (
          <div key={group} className="space-y-0.5">
            <div className="px-4 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">
              {group}
            </div>
            {navItems.filter(item => item.group === group).map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 relative group/item",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 gold-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r" />}
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover/item:scale-110", isActive && "text-primary")} />
                  <span className="ml-3.5 font-medium tracking-wide whitespace-nowrap text-sm">{item.label}</span>
                  {item.href === '/command-center' && (
                    <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 uppercase tracking-widest">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-sidebar/80 backdrop-blur-md shrink-0">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 tracking-widest uppercase">{t('header.systemOnline')}</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">{format(time, 'yyyy-MM-dd HH:mm:ss')} UTC</div>
        </div>

        {user && (
          <div className="mb-3 p-2.5 rounded-xl bg-secondary/40 border border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{displayName}</div>
                <div className="text-[9px] text-primary capitalize tracking-wider">{user.role} · L{clearanceLevel}</div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/30 text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] bg-background text-foreground font-sans overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="hidden md:flex flex-col w-[260px] shrink-0 h-full bg-sidebar data-grid bg-tech-grid border-r border-sidebar-border z-30">
        {sidebarContent}
      </aside>

      <aside className={cn(
        "fixed top-0 left-0 h-full w-[280px] bg-sidebar data-grid bg-tech-grid border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300 ease-in-out md:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0">
        <SystemRibbon user={user} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
