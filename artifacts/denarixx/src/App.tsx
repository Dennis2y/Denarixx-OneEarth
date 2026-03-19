import React, { Suspense, lazy, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout";
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

const RTL_LANGS = new Set(["ar", "fa", "he"]);

function LanguageDocumentSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
    const dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
  }, [i18n.language, i18n.resolvedLanguage]);

  return null;
}


function ForceSystemEnglish() {
  const [location] = useLocation();

  useEffect(() => {
    const isProtectedRoute = location !== "/" && location !== "/login";
    if (!isProtectedRoute) return;

    if (i18n.language !== "en") {
      void i18n.changeLanguage("en");
    }
    document.documentElement.setAttribute("lang", "en");
    document.documentElement.setAttribute("dir", "ltr");
  }, [location]);

  return null;
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

function AppShell() {
  return (
    <>
      <LanguageDocumentSync />
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
