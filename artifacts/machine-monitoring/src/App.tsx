"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Route, Router, Switch, useLocation } from "wouter";
import { setBaseUrl, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Shell } from "@/components/layout/Shell";

// Halaman-halaman aplikasi (Pages)
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import MachinePage from "@/pages/machines";
import BreakdownPage from "@/pages/breakdowns";
import BreakdownDetailPage from "@/pages/breakdown-detail";
import HistoryPage from "@/pages/history";
import AnalyticsPage from "@/pages/analytics";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

if (typeof window !== "undefined") {
  setBaseUrl(null);
}

function Protected({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const me = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });

  useEffect(() => {
    if (!me.isLoading && !me.data?.success) {
      setLocation("/login");
    }
  }, [me.isLoading, me.data, setLocation]);

  if (me.isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <div className="w-64 space-y-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!me.data?.success) {
    return <LoginPage />;
  }

  return <Shell>{children}</Shell>;
}

function ProtectedRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <LoginPage />
      </Route>
      <Route path="/">
        <Protected>
          <DashboardPage />
        </Protected>
      </Route>
      <Route path="/dashboard">
        <Protected>
          <DashboardPage />
        </Protected>
      </Route>
      <Route path="/machines">
        <Protected>
          <MachinePage />
        </Protected>
      </Route>
      <Route path="/breakdowns">
        <Protected>
          <BreakdownPage />
        </Protected>
      </Route>
      <Route path="/breakdowns/:id">
        <Protected>
          <BreakdownDetailPage />
        </Protected>
      </Route>
      <Route path="/history">
        <Protected>
          <HistoryPage />
        </Protected>
      </Route>
      <Route path="/analytics">
        <Protected>
          <AnalyticsPage />
        </Protected>
      </Route>
      <Route>
        <Protected>
          <div className="py-24 text-center">
            <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tampilan operasional tersebut tidak tersedia.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-[#28556a]"
            >
              Kembali ke ringkasan
            </Link>
          </div>
        </Protected>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ProtectedRoutes />
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
