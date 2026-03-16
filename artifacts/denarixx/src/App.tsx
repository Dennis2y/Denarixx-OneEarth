import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, useEffect } from "react";

import { AppLayout } from "./components/layout";
import { AuthProvider, useAuth } from "./context/auth";

import Landing from "./pages/landing";
import Login from "./pages/login";
import { lazy } from "react";
const Dashboard = lazy(() => import("./pages/dashboard"));
import CommandCenter from "./pages/command-center";
const Energy = lazy(() => import("./pages/energy"));
const LifeMesh = lazy(() => import("./pages/lifemesh"));
const EarthShield = lazy(() => import("./pages/earthshield"));
const Alerts = lazy(() => import("./pages/alerts"));
const Sites = lazy(() => import("./pages/sites"));
import SiteDetail from "./pages/site-detail";
const Users = lazy(() => import("./pages/users"));
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function RouteWrapper() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (location === "/") {
    return <Landing />;
  }

  if (location === "/login") {
    return <Login />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Switch>
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/command-center" component={() => <ProtectedRoute component={CommandCenter} />} />
        <Route path="/energy" component={() => <ProtectedRoute component={Energy} />} />
        <Route path="/lifemesh" component={() => <ProtectedRoute component={LifeMesh} />} />
        <Route path="/earthshield" component={() => <ProtectedRoute component={EarthShield} />} />
        <Route path="/alerts" component={() => <ProtectedRoute component={Alerts} />} />
        <Route path="/sites" component={() => <ProtectedRoute component={Sites} />} />
        <Route path="/sites/:id" component={() => <ProtectedRoute component={SiteDetail} />} />
        <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <RouteWrapper />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
