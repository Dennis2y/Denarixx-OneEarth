import React, { Suspense, lazy, useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { LogOut, Home, Cpu, Bell, MapPin, Settings as SettingsIcon, Shield, Zap, Activity, Globe, Users as UsersIcon, X, Menu } from "lucide-react";
import { LoadingScreen } from "@/components/ui-core";
import { apiFetch } from "@/lib/api";
import { AuthProvider, useAuth } from "@/context/auth";
import i18n from "./i18n";

const Landing = lazy(() => import("@/pages/landing"));
const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const CommandCenter = lazy(() => import("@/pages/command-center"));
const Energy = lazy(() => import("@/pages/energy"));
const LifeMesh = lazy(() => import("@/pages/lifemesh"));
const EarthShield = lazy(() => import("@/pages/earthshield"));
const Alerts = lazy(() => import("@/pages/alerts"));
const Sites = lazy(() => import("@/pages/sites"));
const SiteDetail = lazy(() => import("@/pages/site-detail"));
const Users = lazy(() => import("@/pages/users"));
const Settings = lazy(() => import("@/pages/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));
const GlobalMap = lazy(() => import("./pages/global-map"));


function ForceSystemEnglish() {
  const [location] = useLocation();

  useEffect(() => {
    if (i18n.language !== "en") {
      void i18n.changeLanguage("en");
    }
    document.documentElement.setAttribute("lang", "en");
    document.documentElement.setAttribute("dir", "ltr");
    document.body.setAttribute("dir", "ltr");
    document.body.style.overflowX = "hidden";
    document.body.style.margin = "0";
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;

    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;

      const main = document.querySelector("main");
      if (main instanceof HTMLElement) {
        main.scrollLeft = 0;
      }
    });

    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;

      const main = document.querySelector("main");
      if (main instanceof HTMLElement) {
        main.scrollLeft = 0;
      }
    }, 120);
  }, [location]);

  return null;
}


function MobileProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<{
    activeSites?: number;
    criticalAlerts?: number;
    energyAvailability?: number;
    protectedPeople?: number;
    protectedPersons?: number;
    recentAlerts?: Array<{ severity?: string; title?: string; location?: string; module?: string }>;
  } | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const data = await apiFetch("/api/dashboard/stats") as {
          activeSites?: number;
          criticalAlerts?: number;
          energyAvailability?: number;
          protectedPeople?: number;
          protectedPersons?: number;
          recentAlerts?: Array<{ severity?: string; title?: string; location?: string; module?: string }>;
        };
        if (mounted) setStats(data);
      } catch {
        if (mounted) setStats(null);
      }
    };

    void loadStats();
    const si = window.setInterval(() => void loadStats(), 30000);
    const ti = window.setInterval(() => setTime(new Date()), 1000);

    return () => {
      mounted = false;
      window.clearInterval(si);
      window.clearInterval(ti);
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const quickNavItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/command-center", label: "Command", icon: Cpu },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/sites", label: "Sites", icon: MapPin },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const groupedNav = [
    {
      title: "Core",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/command-center", label: "Command Center", icon: Cpu },
        { href: "/global-map", label: "Global Map", icon: Globe },
      ],
    },
    {
      title: "Modules",
      items: [
        { href: "/energy", label: "Energy", icon: Zap },
        { href: "/lifemesh", label: "LifeMesh", icon: Shield },
        { href: "/earthshield", label: "EarthShield", icon: Globe },
      ],
    },
    {
      title: "Management",
      items: [
        { href: "/alerts", label: "Alerts", icon: Bell },
        { href: "/sites", label: "Sites", icon: MapPin },
        { href: "/users", label: "Users", icon: UsersIcon },
        { href: "/settings", label: "Settings", icon: SettingsIcon },
      ],
    },
  ];

  const criticalCount = stats?.criticalAlerts ?? 0;
  const threatLevel = criticalCount > 5 ? "CRITICAL" : criticalCount > 2 ? "ELEVATED" : criticalCount > 0 ? "GUARDED" : "NOMINAL";
  const protectedCount = stats?.protectedPeople ?? stats?.protectedPersons ?? 0;
  const tickerText = (stats?.recentAlerts ?? [])
    .slice(0, 8)
    .map((a) => `${String(a.severity ?? "INFO").toUpperCase()} · ${a.title ?? "SYSTEM EVENT"} · ${a.location ?? a.module ?? "GLOBAL"}`)
    .join("  ◆  ");
  const ticker = tickerText ? `${tickerText}  ◆  ${tickerText}` : "LIVE COMMAND CHANNEL ACTIVE  ◆  MONITORING GLOBAL THREAT GRID  ◆  LIVE COMMAND CHANNEL ACTIVE";

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-x-hidden">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-[60] h-full w-[86%] max-w-[320px] border-r border-border/60 bg-background/98 backdrop-blur-xl transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={`${import.meta.env.BASE_URL}denarixx-logo.png`}
              alt="Denarixx"
              className="h-8 w-8 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-[0.18em] text-primary truncate">DENARIXX</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">OneEarth Command</div>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-xl border border-border/60 bg-card/70 p-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border/30 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {user ? `${user.name} · ${user.role} · L${user.clearanceLevel}` : "Mobile Command View"}
        </div>

        <div className="overflow-y-auto h-[calc(100%-132px)] px-3 py-4 space-y-5">
          {groupedNav.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {group.title}
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = location === item.href;

                  return (
                    <button
                      key={item.href}
                      onClick={() => setLocation(item.href)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                        active
                          ? "bg-primary/12 text-primary border border-primary/20"
                          : "border border-transparent bg-card/60 text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card/70 p-2 shrink-0"
            >
              <Menu className="h-4 w-4" />
            </button>

            <img
              src={`${import.meta.env.BASE_URL}denarixx-logo.png`}
              alt="Denarixx"
              className="h-8 w-8 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-[0.18em] text-primary truncate">DENARIXX</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">OneEarth Command</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm shrink-0"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="border-t border-border/30 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {user ? `${user.name} · ${user.role} · L${user.clearanceLevel}` : "Mobile Command View"}
        </div>

        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`h-2 w-2 rounded-full ${threatLevel === "CRITICAL" ? "bg-red-500" : threatLevel === "ELEVATED" ? "bg-amber-500" : threatLevel === "GUARDED" ? "bg-blue-400" : "bg-green-500"} animate-pulse`} />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{threatLevel}</div>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">{time.toISOString().slice(11, 19)} UTC</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <Bell className="h-3.5 w-3.5" /> Critical
              </div>
              <div className="mt-1 text-lg font-semibold text-red-400">{criticalCount}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <Activity className="h-3.5 w-3.5" /> Nodes
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-300">{stats?.activeSites ?? "—"}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <Zap className="h-3.5 w-3.5" /> Energy
              </div>
              <div className="mt-1 text-lg font-semibold text-emerald-400">
                {stats?.energyAvailability != null ? `${Math.round(stats.energyAvailability)}%` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> Protected
              </div>
              <div className="mt-1 text-lg font-semibold text-sky-300">{protectedCount}</div>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-primary/15 bg-card/60">
            <div className="flex items-center">
              <div className="shrink-0 border-r border-primary/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                LIVE
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="mobile-live-marquee text-amber-200 font-semibold drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]  px-4 py-2 text-xs sm:text-sm">
                  <span className="whitespace-nowrap pr-8">{ticker}</span>
                  <span className="whitespace-nowrap pr-8" aria-hidden="true">{ticker}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-full overflow-x-hidden p-4 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {quickNavItems.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;

            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] ${
                  active ? "bg-primary/12 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ProtectedShellRouter() {
  const [isMobileShell, setIsMobileShell] = useState(false);

  useEffect(() => {
    const sync = () => setIsMobileShell(window.innerWidth < 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (isMobileShell) {
    return <MobileProtectedShell><ProtectedRoutes /></MobileProtectedShell>;
  }

  return <AppLayout><ProtectedRoutes /></AppLayout>;
}

function ProtectedRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/command-center" component={CommandCenter} />
        <Route path="/energy" component={Energy} />
        <Route path="/lifemesh" component={LifeMesh} />
        <Route path="/earthshield" component={EarthShield} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/sites" component={Sites} />
        <Route path="/sites/:id" component={SiteDetail} />
        <Route path="/users" component={Users} />
        <Route path="/settings" component={Settings} />
        <Route path="/global-map" component={GlobalMap} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ProtectedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <LoadingScreen />;

  const isPublicRoute = location === "/" || location === "/login";

  if (!isAuthenticated && !isPublicRoute) {
    window.location.href = "/login";
    return <LoadingScreen />;
  }

  if (isPublicRoute) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  }

  return <ProtectedShellRouter />;
}

function AppShell() {
  return (
    <>
      <ForceSystemEnglish />
      <ProtectedApp />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WouterRouter>
        <AppShell />
      </WouterRouter>
    </AuthProvider>
  );
}
