import React, { Suspense, lazy, useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { LogOut, Menu } from "lucide-react";
import { LoadingScreen } from "@/components/ui-core";
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
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
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
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="border-t border-border/30 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {user ? `${user.name} · ${user.role} · L${user.clearanceLevel}` : "Mobile Command View"}
        </div>
      </header>

      <main className="w-full max-w-full overflow-x-hidden p-4">
        {children}
      </main>
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
