import React, { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { LoadingScreen } from "@/components/ui-core";
import { AuthProvider, useAuth } from "@/context/auth";

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

  return (
    <AppLayout>
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
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WouterRouter>
        <ProtectedApp />
      </WouterRouter>
    </AuthProvider>
  );
}
