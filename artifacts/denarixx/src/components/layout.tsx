import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Zap, Shield, Globe, Bell, MapPin, Users, Settings, LogOut, Menu, Search, Languages, Cpu, ChevronDown } from 'lucide-react';
import { cn } from './ui-core';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth, roleLabel } from '@/context/auth';

type LangEntry = { code: string; label: string; name: string; dir: 'ltr' | 'rtl'; nativeName: string };

type RegionGroup = {
  region: string;
  languages: LangEntry[];
};

const LANGUAGE_GROUPS: RegionGroup[] = [
  {
    region: 'Africa',
    languages: [
      { code: 'en', label: 'EN', name: 'English', nativeName: 'English', dir: 'ltr' },
      { code: 'fr', label: 'FR', name: 'Français', nativeName: 'Français', dir: 'ltr' },
      { code: 'sw', label: 'SW', name: 'Kiswahili', nativeName: 'Kiswahili', dir: 'ltr' },
      { code: 'pt', label: 'PT', name: 'Português', nativeName: 'Português', dir: 'ltr' },
      { code: 'ar', label: 'AR', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
    ],
  },
  {
    region: 'Europe',
    languages: [
      { code: 'de', label: 'DE', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
      { code: 'es', label: 'ES', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
      { code: 'it', label: 'IT', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
      { code: 'nl', label: 'NL', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
      { code: 'pl', label: 'PL', name: 'Polish', nativeName: 'Polski', dir: 'ltr' },
      { code: 'ru', label: 'RU', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
      { code: 'tr', label: 'TR', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
    ],
  },
  {
    region: 'Asia',
    languages: [
      { code: 'zh', label: 'ZH', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
      { code: 'ja', label: 'JA', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
      { code: 'ko', label: 'KO', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
      { code: 'hi', label: 'HI', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
    ],
  },
  {
    region: 'Middle East',
    languages: [
      { code: 'fa', label: 'FA', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
      { code: 'he', label: 'HE', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
    ],
  },
];

const ALL_LANGUAGES: LangEntry[] = LANGUAGE_GROUPS.flatMap(g => g.languages);

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = ALL_LANGUAGES.find(l => l.code === i18n.resolvedLanguage) ?? ALL_LANGUAGES[0];

  const handleSelect = (lang: LangEntry) => {
    i18n.changeLanguage(lang.code);
    document.documentElement.setAttribute('dir', lang.dir);
    document.documentElement.setAttribute('lang', lang.code);
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
        <ChevronDown className={cn('w-3 h-3 transition-transform hidden sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Language</p>
              <p className="text-[10px] text-primary font-mono">{ALL_LANGUAGES.length} langs</p>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {LANGUAGE_GROUPS.map((group) => (
                <div key={group.region}>
                  <div className="px-3 py-1.5 bg-secondary/30 border-b border-t border-border/40 sticky top-0">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">{group.region}</p>
                  </div>
                  {group.languages.map((lang) => {
                    const isActive = i18n.resolvedLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleSelect(lang)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors',
                          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary hover:text-white'
                        )}
                        dir={lang.dir}
                      >
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-2 shrink-0">
                          {lang.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [time, setTime] = useState(new Date());

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Home, group: t('nav.core') },
    { href: '/command-center', label: 'Command Center', icon: Cpu, group: t('nav.core') },
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
    const lang = ALL_LANGUAGES.find(l => l.code === saved) ?? ALL_LANGUAGES[0];
    document.documentElement.setAttribute('dir', lang.dir);
    document.documentElement.setAttribute('lang', lang.code);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const groups = Array.from(new Set(navItems.map(item => item.group)));

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'CP';
  const displayName = user?.name ?? 'Cmdr. Prime';
  const clearanceLevel = user?.clearanceLevel ?? 5;

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative top-0 left-0 h-full w-[280px] bg-sidebar data-grid bg-tech-grid border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out group/sidebar",
        !sidebarOpen && "-translate-x-full md:translate-x-0 md:w-[72px]"
      )}>
        <div className="h-20 flex items-center px-4 border-b border-sidebar-border bg-background/50 shrink-0">
          <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} className="h-9 w-9 shrink-0 ml-1" alt="Logo" />
          <div className={cn("ml-4 flex flex-col justify-center transition-opacity duration-200 overflow-hidden whitespace-nowrap", !sidebarOpen && "md:opacity-0 md:w-0")}>
            <span className="font-display font-bold text-xl tracking-[0.15em] text-primary leading-tight">DENARIXX</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">OneEarth Command</span>
          </div>
        </div>

        <nav className="flex-1 py-5 px-3 space-y-5 overflow-y-auto custom-scrollbar">
          {groups.map((group) => (
            <div key={group} className="space-y-0.5">
              <div className={cn("px-4 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 transition-opacity", !sidebarOpen && "md:opacity-0")}>
                {group}
              </div>
              {navItems.filter(item => item.group === group).map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} title={!sidebarOpen ? item.label : undefined} className={cn(
                    "flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 relative group/item",
                    isActive ? "bg-primary/10 text-primary border border-primary/20 gold-glow" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  )}>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r" />}
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover/item:scale-110", isActive && "text-primary")} />
                    <span className={cn("ml-3.5 font-medium tracking-wide transition-opacity whitespace-nowrap text-sm", !sidebarOpen && "md:opacity-0 md:hidden")}>
                      {item.label}
                    </span>
                    {item.href === '/command-center' && (
                      <span className={cn("ml-auto text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 uppercase tracking-widest", !sidebarOpen && "md:hidden")}>
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
          <div className={cn("mb-3 transition-opacity", !sidebarOpen && "md:opacity-0 md:hidden")}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 tracking-widest uppercase">{t('header.systemOnline')}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">{format(time, 'yyyy-MM-dd HH:mm:ss')} UTC</div>
          </div>

          {user && (
            <div className={cn("mb-3 p-2.5 rounded-xl bg-secondary/40 border border-border/50", !sidebarOpen && "md:hidden")}>
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-secondary transition-colors border border-transparent hover:border-border/50"
              title={sidebarOpen ? "Collapse" : "Expand"}
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className={cn("p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/30", !sidebarOpen && "md:mx-auto")}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-secondary transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t('header.search')}
                className="bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-secondary/80 w-72 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                  {initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-none">{displayName}</div>
                  <div className="text-[9px] text-primary capitalize tracking-wider mt-0.5">{roleLabel(user.role)}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: `url(${import.meta.env.BASE_URL}africa-night-hero.png)`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)' }}
          />
          <div className="relative z-10 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
