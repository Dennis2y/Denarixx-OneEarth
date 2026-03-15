import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";

import { AppLayout } from "./components/layout";
import { AuthProvider, useAuth } from "./context/auth";

import Landing from "./pages/landing";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import CommandCenter from "./pages/command-center";
import Energy from "./pages/energy";
import LifeMesh from "./pages/lifemesh";
import EarthShield from "./pages/earthshield";
import Alerts from "./pages/alerts";
import Sites from "./pages/sites";
import SiteDetail from "./pages/site-detail";
import Users from "./pages/users";
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
