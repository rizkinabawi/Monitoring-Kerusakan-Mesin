import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Cog,
  Factory,
  History,
  LogOut,
  Menu,
} from "lucide-react";
import {
  useGetMe,
  useHealthCheck,
  useLogout,
  getGetMeQueryKey,
  getHealthCheckQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "@/components/shared/common";
import LoginPage from "@/pages/login";

export function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const client = useQueryClient();
  const me = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });
  const health = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 60000,
      retry: 1,
    },
  });
  const logout = useLogout();
  const [mobileNav, setMobileNav] = useState(false);

  if (me.isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="w-64 space-y-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!me.data?.success) {
    return <LoginPage />;
  }

  const user = me.data.data;
  const links = [
    { href: "/dashboard", label: "Ringkasan", testId: "overview", icon: Activity },
    { href: "/machines", label: "Mesin", testId: "machines", icon: Cog },
    { href: "/breakdowns", label: "Kerusakan", testId: "breakdowns", icon: AlertTriangle },
    { href: "/history", label: "Riwayat", testId: "history", icon: History },
    { href: "/analytics", label: "Analitik", testId: "analytics", icon: BarChart2 },
  ];

  const nav = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="grid size-9 place-items-center rounded-lg bg-amber-400 text-[#203b49]">
          <Factory className="size-5" />
        </div>
        <div>
          <div className="text-[12px] font-bold tracking-[.12em] text-white">
            SHIFT / MONITOR
          </div>
          <div className="mt-0.5 font-mono text-[9px] tracking-[.16em] text-slate-400">
            OPERASI PABRIK
          </div>
        </div>
      </div>

      <div className="mx-4 mb-3 border-t border-white/10" />
      <div className="px-4 pb-2 font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">
        Area kerja
      </div>

      <nav className="space-y-1 px-3">
        {links.map(({ href, label, testId, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            data-testid={`link-${testId}`}
            onClick={() => setMobileNav(false)}
            className={cx(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
              location === href || (href === "/breakdowns" && location.startsWith("/breakdowns/"))
                ? "bg-white/10 font-semibold text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="size-[17px]" />
            {label}
            {href === "/breakdowns" && (
              <span className="ml-auto size-1.5 rounded-full bg-amber-400" />
            )}
          </Link>
        ))}
      </nav>

      <div className="mx-4 mt-6 border-t border-white/10" />
      <div className="mt-auto p-4">
        <div className="mb-4 rounded-lg bg-white/[.045] p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-full bg-[#d7e0dd] text-xs font-bold text-[#244858]">
              {user.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0">
              <div
                className="truncate text-xs font-semibold text-white"
                data-testid="text-user-name"
              >
                {user.name}
              </div>
              <div className="truncate text-[10px] capitalize text-slate-400">
                {user.role}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-9 w-full justify-start gap-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: async () => {
                await client.removeQueries({ queryKey: getGetMeQueryKey() });
                setLocation("/login");
              },
            })
          }
          disabled={logout.isPending}
          data-testid="button-logout"
        >
          <LogOut className="size-4" />
          {logout.isPending ? "Sedang keluar…" : "Keluar"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f5f4ef] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col bg-[#203b49] lg:flex">
        {nav}
      </aside>
      {mobileNav && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileNav(false)}
        >
          <aside
            className="flex h-full w-[270px] flex-col bg-[#203b49]"
            onClick={(e) => e.stopPropagation()}
          >
            {nav}
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1 lg:ml-[238px]">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-[#e5e3da] bg-[#f8f7f2]/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Buka navigasi"
              data-testid="button-open-navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span>Operasional</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                {links.find((l) => l.href === location)?.label ||
                  (location.startsWith("/breakdowns/")
                    ? "Detail kerusakan"
                    : "Area kerja")}
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-2 text-[11px] text-muted-foreground"
            data-testid="status-api-health"
          >
            <span
              className={cx(
                "relative mr-1 flex size-2 rounded-full",
                health.isError ? "bg-rose-600" : "bg-emerald-600"
              )}
            />
            {health.isError
              ? "Data pabrik tidak tersedia"
              : health.isLoading
              ? "Memeriksa koneksi data…"
              : "Terhubung ke data pabrik"}{" "}
            <span className="ml-2 hidden font-mono text-[10px] text-slate-400 sm:inline">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-9">
          {children}
        </main>
      </div>
    </div>
  );
}

