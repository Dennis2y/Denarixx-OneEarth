import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";

// Layout & UI
import { AppLayout } from "./components/layout";

// Pages
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Energy from "./pages/energy";
import LifeMesh from "./pages/lifemesh";
import EarthShield from "./pages/earthshield";
import Alerts from "./pages/alerts";
import Sites from "./pages/sites";
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

function RouteWrapper() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Force dark mode at the root level for the luxury aesthetic
    document.documentElement.classList.add("dark");
  }, []);

  if (location === "/login") {
    return <Login />;
  }

  // If at root, redirect to login
  if (location === "/") {
    setLocation("/login");
    return null;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/energy" component={Energy} />
        <Route path="/lifemesh" component={LifeMesh} />
        <Route path="/earthshield" component={EarthShield} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/sites" component={Sites} />
        <Route path="/users" component={Users} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <RouteWrapper />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
