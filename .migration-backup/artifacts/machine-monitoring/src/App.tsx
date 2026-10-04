"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Link, Route, Router, Switch, useLocation, useRoute } from "wouter";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3,
  Cog, Factory, History, LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Wrench, X,
} from "lucide-react";
import {
  useAddMaintenance, useCompleteBreakdown, useCreateBreakdown, useCreateMachine, useDeleteMachine,
  useGetBreakdown, useGetDashboardDowntime, useGetDashboardFrequency, useGetDashboardSummary,
  useGetHistory, useGetMe, useHealthCheck, useListBreakdowns, useListMachines, useLogin, useLogout,
  useUpdateBreakdown, useUpdateMachine, useUpdateMaintenance,
  getGetBreakdownQueryKey, getGetDashboardDowntimeQueryKey, getGetDashboardFrequencyQueryKey,
  getGetDashboardSummaryQueryKey, getGetHistoryQueryKey, getGetMeQueryKey, getHealthCheckQueryKey,
  getListBreakdownsQueryKey, getListMachinesQueryKey,
} from "@workspace/api-client-react";
import { setBaseUrl } from "@workspace/api-client-react";
import type { Breakdown, BreakdownInput, BreakdownUpdate, Machine, MachineInput, MachineUpdate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
if (typeof window !== "undefined") {
  setBaseUrl(process.env.NEXT_PUBLIC_BASE_PATH || null);
}
const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");
const date = (value?: string | null) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";
const minutes = (n?: number | null) => n == null ? "—" : `${Math.floor(n / 60)} jam ${n % 60} mnt`;
const errorText = (err: unknown) => {
  return "Permintaan tidak dapat diproses. Periksa kembali data, lalu coba lagi.";
};

function Status({ value }: { value: string }) {
  const colors: Record<string, string> = {
    open: "bg-amber-100 text-amber-900 border-amber-200",
    down: "bg-rose-100 text-rose-900 border-rose-200",
    active: "bg-emerald-100 text-emerald-900 border-emerald-200",
    inactive: "bg-stone-100 text-stone-600 border-stone-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return <Badge data-testid={`status-${value}`} className={cx("rounded-full border px-2.5 py-1 font-medium capitalize shadow-none", colors[value] || colors.inactive)}>{value}</Badge>;
}

function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">{eyebrow}</p>
      <h1 className="text-[28px] font-semibold tracking-[-.04em] text-foreground sm:text-[32px]">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p></div>{children && <div className="flex gap-2">{children}</div>}
  </div>;
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900" role="alert">
    <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div className="flex-1"><b>Tampilan tidak dapat dimuat</b><p className="mt-1 text-rose-800/80">{message}</p></div><Button variant="outline" size="sm" onClick={retry} data-testid="button-retry">Coba lagi</Button></div>
  </div>;
}
function LoadingRows() { return <div className="space-y-3 p-5">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>; }
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">{label}</Label>{children}{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>;
}
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} className={cx("h-10 rounded-lg border-[#d8d9d2] bg-white text-sm shadow-none focus-visible:ring-amber-600/30", props.className)} />;
}
function Empty({ icon: Icon = Activity, title, message }: { icon?: typeof Activity; title: string; message: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="mb-3 grid size-11 place-items-center rounded-xl bg-[#f2efe7] text-slate-500"><Icon className="size-5" /></div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p></div>;
}

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [issue, setIssue] = useState("");
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();
  const submit = (e: FormEvent) => {
    e.preventDefault(); setIssue("");
    login.mutate({ data: { username, password } }, {
      onSuccess: async () => { await client.invalidateQueries({ queryKey: getGetMeQueryKey() }); setLocation("/dashboard"); },
      onError: e => setIssue(errorText(e)),
    });
  };
  return <main className="grid min-h-[100dvh] bg-[#f2f1eb] lg:grid-cols-[1fr_1fr]">
    <section className="relative hidden overflow-hidden bg-[#203b49] p-12 text-[#f5f1e8] lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 -top-24 size-[520px] rounded-full border border-white/10" /><div className="absolute -right-7 -top-7 size-[360px] rounded-full border border-white/10" />
      <div className="relative flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-900"><Factory className="size-5" /></div><span className="text-sm font-semibold tracking-wide">SHIFT / MONITOR</span></div>
      <div className="relative max-w-lg"><div className="mb-7 flex items-center gap-2 font-mono text-xs uppercase tracking-[.17em] text-amber-300"><span className="size-2 rounded-full bg-amber-300" /> Konsol operasi pabrik</div><h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.05em]">Setiap menit<br />tercatat.</h1><p className="mt-5 max-w-md text-base leading-7 text-slate-300">Pantau kondisi mesin, kerusakan yang sedang ditangani, dan pekerjaan perawatan agar produksi terus berjalan.</p></div>
      <p className="relative font-mono text-[10px] tracking-[.14em] text-slate-400">OPERASI PERAWATAN · AKSES STAF TERLINDUNGI</p>
    </section>
    <section className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[390px]">
        <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid size-10 place-items-center rounded-xl bg-[#203b49] text-amber-300"><Factory className="size-5" /></div><b className="text-sm tracking-wide">SHIFT / MONITOR</b></div>
        <div className="mb-8"><p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">Akses staf</p><h2 className="text-3xl font-semibold tracking-[-.04em]">Masuk ke akun Anda</h2><p className="mt-2 text-sm text-muted-foreground">Gunakan akun operasional yang telah diberikan.</p></div>
        <form onSubmit={submit} className="space-y-5">
          <Field label="Nama pengguna"><TextInput autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} data-testid="input-username" placeholder="Nama pengguna Anda" /></Field>
          <Field label="Kata sandi"><TextInput type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} data-testid="input-password" placeholder="Kata sandi Anda" /></Field>
          {issue && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" data-testid="text-login-error">{issue}</div>}
          <Button type="submit" disabled={login.isPending} className="h-11 w-full rounded-lg bg-[#244858] text-sm hover:bg-[#1b3948]" data-testid="button-login">{login.isPending ? "Sedang masuk…" : "Masuk"}<ArrowRight className="size-4" /></Button>
        </form>
        <div className="mt-8 flex items-center gap-2 border-t border-[#deded6] pt-5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-700" />Sesi Anda dilindungi melalui autentikasi server yang aman.</div>
      </div>
    </section>
  </main>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const client = useQueryClient();
  const me = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 60000, retry: 1 } });
  const logout = useLogout();
  const [mobileNav, setMobileNav] = useState(false);
  if (me.isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-background"><div className="w-64 space-y-3"><Skeleton className="h-8 w-28" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div></div>;
  if (!me.data?.success) return <Login />;
  const user = me.data.data;
  const links = [{ href: "/dashboard", label: "Ringkasan", testId: "overview", icon: Activity }, { href: "/machines", label: "Mesin", testId: "machines", icon: Cog }, { href: "/breakdowns", label: "Kerusakan", testId: "breakdowns", icon: AlertTriangle }, { href: "/history", label: "Riwayat", testId: "history", icon: History }];
  const nav = <><div className="flex items-center gap-3 px-5 py-6"><div className="grid size-9 place-items-center rounded-lg bg-amber-400 text-[#203b49]"><Factory className="size-5" /></div><div><div className="text-[12px] font-bold tracking-[.12em] text-white">SHIFT / MONITOR</div><div className="mt-0.5 font-mono text-[9px] tracking-[.16em] text-slate-400">OPERASI PABRIK</div></div></div>
    <div className="mx-4 mb-3 border-t border-white/10" /><div className="px-4 pb-2 font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Area kerja</div>
    <nav className="space-y-1 px-3">{links.map(({ href, label, testId, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${testId}`} onClick={() => setMobileNav(false)} className={cx("flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors", location === href || (href === "/breakdowns" && location.startsWith("/breakdowns/")) ? "bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}><Icon className="size-[17px]" />{label}{href === "/breakdowns" && <span className="ml-auto size-1.5 rounded-full bg-amber-400" />}</Link>)}</nav>
    <div className="mx-4 mt-6 border-t border-white/10" /><div className="mt-auto p-4"><div className="mb-4 rounded-lg bg-white/[.045] p-3"><div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-full bg-[#d7e0dd] text-xs font-bold text-[#244858]">{user.name.split(" ").map(x => x[0]).slice(0, 2).join("")}</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-white" data-testid="text-user-name">{user.name}</div><div className="truncate text-[10px] capitalize text-slate-400">{user.role}</div></div></div></div><Button variant="ghost" className="h-9 w-full justify-start gap-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => logout.mutate(undefined, { onSuccess: async () => { await client.removeQueries({ queryKey: getGetMeQueryKey() }); setLocation("/login"); } })} disabled={logout.isPending} data-testid="button-logout"><LogOut className="size-4" />{logout.isPending ? "Sedang keluar…" : "Keluar"}</Button></div></>;
  return <div className="min-h-[100dvh] bg-[#f5f4ef] lg:flex">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col bg-[#203b49] lg:flex">{nav}</aside>
    {mobileNav && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileNav(false)}><aside className="flex h-full w-[270px] flex-col bg-[#203b49]" onClick={e => e.stopPropagation()}>{nav}</aside></div>}
    <div className="min-w-0 flex-1 lg:ml-[238px]">
      <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-[#e5e3da] bg-[#f8f7f2]/95 px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Buka navigasi" data-testid="button-open-navigation"><Menu className="size-5" /></Button><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span>Operasional</span><span className="text-slate-300">/</span><span className="font-medium text-slate-700">{links.find(l => l.href === location)?.label || (location.startsWith("/breakdowns/") ? "Detail kerusakan" : "Area kerja")}</span></div></div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground" data-testid="status-api-health"><span className={cx("relative mr-1 flex size-2 rounded-full", health.isError ? "bg-rose-600" : "bg-emerald-600")} />{health.isError ? "Data pabrik tidak tersedia" : health.isLoading ? "Memeriksa koneksi data…" : "Terhubung ke data pabrik"} <span className="ml-2 hidden font-mono text-[10px] text-slate-400 sm:inline">{new Date().toLocaleDateString("id-ID", { weekday: "short", month: "short", day: "numeric" })}</span></div>
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-9">{children}</main>
    </div>
  </div>;
}

function RangeFilters({ value, onChange, line, setLine }: { value: { start_date?: string; end_date?: string }; onChange: (v: { start_date?: string; end_date?: string }) => void; line: string; setLine: (s: string) => void }) {
  return <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e4e1d8] bg-white p-3">
    <Field label="Mulai"><TextInput type="date" value={value.start_date || ""} onChange={e => onChange({ ...value, start_date: e.target.value || undefined })} data-testid="input-filter-start" /></Field>
    <Field label="Sampai"><TextInput type="date" value={value.end_date || ""} onChange={e => onChange({ ...value, end_date: e.target.value || undefined })} data-testid="input-filter-end" /></Field>
    <Field label="Lini produksi"><TextInput placeholder="Semua lini" value={line} onChange={e => setLine(e.target.value)} data-testid="input-filter-line" /></Field>
    <Button variant="ghost" size="sm" className="h-10" onClick={() => { onChange({}); setLine(""); }} data-testid="button-clear-filters">Hapus filter</Button>
  </div>;
}

function Dashboard() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [line, setLine] = useState("");
  const params = { ...range, ...(line ? { line } : {}) };
  const summary = useGetDashboardSummary(params);
  const downtime = useGetDashboardDowntime(params);
  const frequency = useGetDashboardFrequency(params);
  const breakdowns = useListBreakdowns({ status: "open", limit: 6, page: 1 });
  const reload = () => { summary.refetch(); downtime.refetch(); frequency.refetch(); breakdowns.refetch(); };
  if (summary.isError || downtime.isError || frequency.isError) return <><PageHeading eyebrow="Operasional / status terkini" title="Ringkasan giliran kerja" description="Kondisi mesin dan waktu henti di seluruh area produksi." /><LoadError message={errorText(summary.error || downtime.error || frequency.error)} retry={reload} /></>;
  const s = summary.data?.success ? summary.data.data : undefined;
  const down = downtime.data?.success ? downtime.data.data : [];
  const freq = frequency.data?.success ? frequency.data.data : [];
  const open = breakdowns.data?.success ? breakdowns.data.data : [];
  const metric = (label: string, testId: string, value: ReactNode, detail: string, accent: string, Icon: typeof Activity) => <Card className="rounded-xl border-[#e5e2d9] shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><span className={cx("grid size-8 place-items-center rounded-lg", accent)}><Icon className="size-4" /></span></div><div className="mt-4 text-[28px] font-semibold tracking-[-.05em]" data-testid={`metric-${testId}`}>{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
  return <>
    <PageHeading eyebrow="Operasional / status terkini" title="Ringkasan giliran kerja" description="Pantau kondisi peralatan dan gangguan produksi dengan cepat."><Link href="/breakdowns"><Button className="h-10 rounded-lg bg-[#244858] hover:bg-[#1b3948]" data-testid="button-report-breakdown"><Plus className="size-4" />Laporkan kerusakan</Button></Link></PageHeading>
    <div className="mb-5"><RangeFilters value={range} onChange={setRange} line={line} setLine={setLine} /></div>
    {summary.isLoading ? <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div> : s && <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metric("Kerusakan terbuka", "open-breakdowns", s.open_breakdowns, `${s.machines_down} mesin sedang berhenti`, "bg-rose-50 text-rose-700", AlertTriangle)}
      {metric("Total waktu henti", "downtime-recorded", minutes(s.total_downtime), `${s.downtime_change_percent > 0 ? "+" : ""}${s.downtime_change_percent}% dibanding periode sebelumnya`, s.downtime_change_percent > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700", Clock3)}
      {metric("Mesin aktif", "active-machines", s.active_machines, `${s.machines_down} mesin saat ini berstatus berhenti`, "bg-emerald-50 text-emerald-700", Cog)}
      {metric("Total kerusakan", "breakdowns", s.total_breakdowns, `Paling sering: ${s.machine_most_broken || "Belum ada data"}`, "bg-[#edf2f3] text-[#244858]", Wrench)}
    </div>}
    <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <Card className="rounded-xl border-[#e5e2d9] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#efede7] px-5 py-4"><div><CardTitle className="text-sm">Waktu henti per mesin</CardTitle><p className="mt-1 text-xs text-muted-foreground">Total waktu produksi terhenti pada periode yang dipilih</p></div><Clock3 className="size-4 text-muted-foreground" /></CardHeader>
        <CardContent className="p-0">{downtime.isLoading ? <LoadingRows /> : down.length ? <div className="divide-y divide-[#efede7]">{down.slice(0, 7).map((item, i) => {
          const max = Math.max(...down.map(x => x.total_downtime), 1);
          return <div key={item.machine_id} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3.5" data-testid={`row-downtime-${item.machine_id}`}><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-[11px] font-semibold text-[#244858]">{item.machine_code}</span><span className="truncate text-xs text-muted-foreground">{item.machine_name}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0eee7]"><div className={cx("h-full rounded-full", i === 0 ? "bg-amber-500" : "bg-[#6e939d]")} style={{ width: `${Math.max(4, item.total_downtime / max * 100)}%` }} /></div></div><div className="text-right"><div className="font-mono text-sm font-semibold">{minutes(item.total_downtime)}</div><div className="text-[10px] text-muted-foreground">{item.line}</div></div></div>;
        })}</div> : <Empty icon={Clock3} title="Tidak ada waktu henti pada periode ini" message="Perluas rentang tanggal atau hapus filter lini produksi." />}</CardContent>
      </Card>
      <Card className="rounded-xl border-[#e5e2d9] shadow-none">
        <CardHeader className="border-b border-[#efede7] px-5 py-4"><CardTitle className="text-sm">Frekuensi kerusakan</CardTitle><p className="mt-1 text-xs text-muted-foreground">Mesin yang paling sering memerlukan perawatan</p></CardHeader>
        <CardContent className="p-0">{frequency.isLoading ? <LoadingRows /> : freq.length ? <div className="divide-y divide-[#efede7]">{freq.slice(0, 6).map((m, index) => <div key={m.machine_id} className="flex items-center gap-3 px-5 py-3.5" data-testid={`row-frequency-${m.machine_id}`}><span className={cx("grid size-7 place-items-center rounded-lg font-mono text-xs font-semibold", index === 0 ? "bg-amber-100 text-amber-800" : "bg-[#f3f2ed] text-slate-500")}>{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{m.machine_name}</div><div className="font-mono text-[10px] text-muted-foreground">{m.machine_code} · {m.line}</div></div><div className="text-right"><div className="font-mono text-sm font-semibold">{m.breakdown_count}</div><div className="text-[10px] text-muted-foreground">insiden</div></div></div>)}</div> : <Empty icon={Activity} title="Belum ada data frekuensi kerusakan" message="Pola kerusakan akan terlihat setelah insiden tercatat." />}</CardContent>
      </Card>
    </div>
    <Card className="mt-4 rounded-xl border-[#e5e2d9] shadow-none"><CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#efede7] px-5 py-4"><div><CardTitle className="text-sm">Insiden terbuka</CardTitle><p className="mt-1 text-xs text-muted-foreground">Perlu ditindaklanjuti oleh tim perawatan</p></div><Link href="/breakdowns" className="text-xs font-semibold text-[#28556a] hover:underline" data-testid="link-all-breakdowns">Lihat semua <ArrowRight className="ml-1 inline size-3" /></Link></CardHeader>
      {breakdowns.isLoading ? <LoadingRows /> : open.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Mesin</TableHead><TableHead>Masalah</TableHead><TableHead>Mulai</TableHead><TableHead>Tindakan perawatan</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{open.map(b => <TableRow key={b.id} data-testid={`row-open-breakdown-${b.id}`}><TableCell><Link href={`/breakdowns/${b.id}`} className="font-medium text-[#244858] hover:underline">{b.machine_code}<span className="ml-2 text-xs font-normal text-muted-foreground">{b.machine_name}</span></Link></TableCell><TableCell className="max-w-[260px] truncate">{b.problem}</TableCell><TableCell className="whitespace-nowrap text-xs">{date(b.started_at)}</TableCell><TableCell>{b.maintenance_count}</TableCell><TableCell><Status value={b.status} /></TableCell></TableRow>)}</TableBody></Table></div> : <Empty icon={Check} title="Semua mesin tercatat" message="Tidak ada kerusakan terbuka pada tampilan ini." />}</Card>
  </>;
}

function MachinePage() {
  const [editing, setEditing] = useState<Machine | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [line, setLine] = useState("");
  const machines = useListMachines(line ? { line } : undefined);
  const client = useQueryClient();
  const create = useCreateMachine(); const update = useUpdateMachine(); const remove = useDeleteMachine();
  const invalidate = () => client.invalidateQueries({ queryKey: getListMachinesQueryKey() });
  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = { machine_code: String(f.get("machine_code")), name: String(f.get("name")), line: String(f.get("line")) };
    const onSuccess = () => { setEditing(null); setFormOpen(false); invalidate(); };
    if (editing) update.mutate({ id: editing.id, data: payload as MachineUpdate }, { onSuccess });
    else create.mutate({ data: payload as MachineInput }, { onSuccess });
  };
  const filtered = (machines.data?.success ? machines.data.data : []).filter(m => `${m.name} ${m.machine_code} ${m.line}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="Daftar aset" title="Mesin" description="Data peralatan dan status operasional terkini."><Button className="h-10 rounded-lg bg-[#244858] hover:bg-[#1b3948]" onClick={() => { setEditing(null); setFormOpen(!formOpen); }} data-testid="button-add-machine"><Plus className="size-4" />Tambah mesin</Button></PageHeading>
    {formOpen && <Card className="mb-5 rounded-xl border-amber-200 bg-[#fffdf8] shadow-none"><CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm">{editing ? "Ubah data mesin" : "Daftarkan mesin"}</CardTitle><Button variant="ghost" size="icon" onClick={() => setFormOpen(false)} aria-label="Tutup formulir" data-testid="button-close-machine-form"><X className="size-4" /></Button></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-3" onSubmit={save}><Field label="Kode mesin"><TextInput name="machine_code" required maxLength={30} defaultValue={editing?.machine_code} data-testid="input-machine-code" /></Field><Field label="Nama mesin"><TextInput name="name" required maxLength={100} defaultValue={editing?.name} data-testid="input-machine-name" /></Field><Field label="Lini produksi"><TextInput name="line" required maxLength={50} defaultValue={editing?.line} data-testid="input-machine-line" /></Field><div className="flex items-center gap-2 sm:col-span-3"><Button type="submit" disabled={create.isPending || update.isPending} data-testid="button-save-machine">{create.isPending || update.isPending ? "Menyimpan…" : editing ? "Simpan perubahan" : "Daftarkan mesin"}</Button><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>{(create.isError || update.isError) && <span className="text-xs text-rose-700">{errorText(create.error || update.error)}</span>}</div></form></CardContent></Card>}
    <Card className="rounded-xl border-[#e5e2d9] shadow-none"><div className="flex flex-col justify-between gap-3 border-b border-[#efede7] p-4 sm:flex-row sm:items-center"><div><div className="text-sm font-semibold">Direktori peralatan</div><div className="mt-1 text-xs text-muted-foreground">{machines.data?.success ? `${machines.data.data.length} aset terdaftar` : "Daftar mesin"}</div></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><TextInput value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari peralatan" className="w-full pl-9 sm:w-48" data-testid="input-search-machines" /></div><TextInput value={line} onChange={e => setLine(e.target.value)} placeholder="Filter lini" className="w-28" data-testid="input-machine-line-filter" /></div></div>
      {machines.isLoading ? <LoadingRows /> : machines.isError ? <div className="p-4"><LoadError message={errorText(machines.error)} retry={() => machines.refetch()} /></div> : filtered.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Mesin</TableHead><TableHead>Lini</TableHead><TableHead>Status</TableHead><TableHead>Terdaftar</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow></TableHeader><TableBody>{filtered.map(m => <TableRow key={m.id} data-testid={`row-machine-${m.id}`}><TableCell><div className="font-mono text-xs font-semibold text-[#244858]">{m.machine_code}</div><div className="mt-1 text-xs text-muted-foreground">{m.name}</div></TableCell><TableCell>{m.line}</TableCell><TableCell><Status value={m.status} /></TableCell><TableCell className="text-xs">{date(m.created_at)}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => { setEditing(m); setFormOpen(true); }} data-testid={`button-edit-machine-${m.id}`}><Settings2 className="mr-1 size-3.5" />Ubah</Button>{m.status !== "inactive" && <Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => { if (window.confirm(`Nonaktifkan ${m.machine_code}?`)) remove.mutate({ id: m.id }, { onSuccess: () => invalidate() }); }} data-testid={`button-deactivate-machine-${m.id}`}><X className="mr-1 size-3.5" />Nonaktifkan</Button>}</div></TableCell></TableRow>)}</TableBody></Table></div> : <Empty icon={Cog} title="Mesin tidak ditemukan" message={query || line ? "Sesuaikan pencarian atau filter lini." : "Daftarkan peralatan untuk mulai memantau kondisi mesin."} />}</Card>
    {remove.isError && <p className="mt-3 text-sm text-rose-700">{errorText(remove.error)}</p>}
  </>;
}

function BreakdownPage() {
  const [filter, setFilter] = useState("open");
  const [showForm, setShowForm] = useState(false);
  const client = useQueryClient();
  const machines = useListMachines({ status: "active" });
  const listParams = { status: filter === "all" ? undefined : filter as "open" | "completed", limit: 50, page: 1 };
  const list = useListBreakdowns(listParams);
  const create = useCreateBreakdown();
  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload: BreakdownInput = { machine_id: Number(f.get("machine_id")), problem: String(f.get("problem")), cause: String(f.get("cause")), started_at: new Date(String(f.get("started_at"))).toISOString() };
    create.mutate({ data: payload }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListBreakdownsQueryKey() }); client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); client.invalidateQueries({ queryKey: getListMachinesQueryKey() }); setShowForm(false); } });
  };
  const data = list.data?.success ? list.data.data : [];
  return <>
    <PageHeading eyebrow="Penanganan insiden" title="Kerusakan" description="Catat gangguan produksi dan pantau tindak lanjut perawatannya."><Button onClick={() => setShowForm(!showForm)} className="h-10 rounded-lg bg-[#244858] hover:bg-[#1b3948]" data-testid="button-new-breakdown"><Plus className="size-4" />Laporkan kerusakan</Button></PageHeading>
    {showForm && <Card className="mb-5 rounded-xl border-amber-200 bg-[#fffdf8] shadow-none"><CardHeader className="flex flex-row items-center justify-between pb-3"><div><CardTitle className="text-sm">Laporan kerusakan baru</CardTitle><p className="mt-1 text-xs text-muted-foreground">Pilih mesin, jelaskan masalah, dan catat dugaan penyebabnya.</p></div><Button variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Tutup formulir laporan"><X className="size-4" /></Button></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
      <Field label="Mesin"><select required name="machine_id" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm" data-testid="select-breakdown-machine"><option value="">Pilih mesin</option>{machines.data?.success && machines.data.data.map(m => <option key={m.id} value={m.id}>{m.machine_code} — {m.name} ({m.line})</option>)}</select></Field>
      <Field label="Waktu mulai"><TextInput type="datetime-local" name="started_at" required defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} data-testid="input-breakdown-started" /></Field>
      <Field label="Masalah"><TextInput name="problem" required maxLength={255} placeholder="Jelaskan gangguan yang ditemukan" data-testid="input-breakdown-problem" /></Field>
      <Field label="Dugaan penyebab"><TextInput name="cause" required maxLength={255} placeholder="Apa kemungkinan penyebabnya?" data-testid="input-breakdown-cause" /></Field>
      <div className="flex flex-wrap items-center gap-2 md:col-span-2"><Button type="submit" disabled={create.isPending || machines.isLoading} data-testid="button-submit-breakdown">{create.isPending ? "Mencatat…" : "Catat kerusakan"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>{(create.isError || machines.isError) && <span className="text-xs text-rose-700">{errorText(create.error || machines.error)}</span>}</div>
    </form></CardContent></Card>}
    <Card className="rounded-xl border-[#e5e2d9] shadow-none"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efede7] p-4"><div><h2 className="text-sm font-semibold">Daftar insiden</h2><p className="mt-1 text-xs text-muted-foreground">Kerusakan yang terakhir dicatat</p></div><select value={filter} onChange={e => setFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-white px-3 text-xs" data-testid="select-breakdown-status"><option value="open">Insiden terbuka</option><option value="completed">Insiden selesai</option><option value="all">Semua status</option></select></div>
      {list.isLoading ? <LoadingRows /> : list.isError ? <div className="p-4"><LoadError message={errorText(list.error)} retry={() => list.refetch()} /></div> : data.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Insiden</TableHead><TableHead>Mesin / lini</TableHead><TableHead>Mulai</TableHead><TableHead>Waktu henti</TableHead><TableHead>Tindakan</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.map(b => <TableRow key={b.id} data-testid={`row-breakdown-${b.id}`}><TableCell><Link href={`/breakdowns/${b.id}`} className="block max-w-[280px] truncate font-medium text-[#244858] hover:underline">{b.problem}</Link><span className="mt-1 block font-mono text-[10px] text-muted-foreground">INC-{String(b.id).padStart(5, "0")}</span></TableCell><TableCell><span className="font-mono text-[11px]">{b.machine_code}</span><span className="ml-2 text-xs text-muted-foreground">{b.line}</span></TableCell><TableCell className="whitespace-nowrap text-xs">{date(b.started_at)}</TableCell><TableCell className="font-mono text-xs">{b.status === "open" ? "Sedang ditangani" : minutes(b.downtime_minutes)}</TableCell><TableCell>{b.maintenance_count}</TableCell><TableCell><Status value={b.status} /></TableCell></TableRow>)}</TableBody></Table></div> : <Empty icon={AlertTriangle} title="Tidak ada insiden pada tampilan ini" message="Pilih status lain atau catat kerusakan saat mesin berhenti." />}</Card>
  </>;
}

function BreakdownDetailPage() {
  const [, params] = useRoute("/breakdowns/:id");
  const id = Number(params?.id || 0);
  const query = useGetBreakdown(id);
  const detail = query.data?.success ? query.data.data : undefined;
  const client = useQueryClient();
  const add = useAddMaintenance(); const update = useUpdateMaintenance(); const edit = useUpdateBreakdown(); const complete = useCompleteBreakdown();
  const [editOpen, setEditOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<number | null>(null);
  const invalidate = () => { client.invalidateQueries({ queryKey: getGetBreakdownQueryKey(id) }); client.invalidateQueries({ queryKey: getListBreakdownsQueryKey() }); client.invalidateQueries({ queryKey: getGetHistoryQueryKey() }); client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); client.invalidateQueries({ queryKey: getListMachinesQueryKey() }); };
  const submitMaintenance = (e: FormEvent<HTMLFormElement>, maintenanceId?: number) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload = { action: String(f.get("action")), component_replaced: String(f.get("component_replaced") || "") || null, notes: String(f.get("notes") || "") || null };
    const opts = { onSuccess: () => { invalidate(); setEditingMaintenance(null); } };
    if (maintenanceId) update.mutate({ id: maintenanceId, data: payload }, opts); else add.mutate({ id, data: payload }, opts);
  };
  const submitEdit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const payload: BreakdownUpdate = { machine_id: Number(f.get("machine_id")), problem: String(f.get("problem")), cause: String(f.get("cause")), started_at: new Date(String(f.get("started_at"))).toISOString() };
    edit.mutate({ id, data: payload }, { onSuccess: () => { invalidate(); setEditOpen(false); } });
  };
  if (query.isLoading) return <><Skeleton className="mb-5 h-8 w-72" /><Skeleton className="h-80 rounded-xl" /></>;
  if (query.isError || !detail) return <><PageHeading eyebrow="Detail insiden" title="Catatan kerusakan" description="Tinjau masalah yang dilaporkan dan riwayat perawatannya." /><LoadError message={errorText(query.error)} retry={() => query.refetch()} /></>;
  const open = detail.status === "open";
  return <>
      <div className="mb-6"><Link href="/breakdowns" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-[#244858]" data-testid="link-back-breakdowns"><ArrowRight className="size-3 rotate-180" />Semua kerusakan</Link>
      <PageHeading eyebrow={`Insiden / INC-${String(detail.id).padStart(5, "0")}`} title={detail.problem} description={`${detail.machine_code} · ${detail.machine_name} · ${detail.line}`}><Status value={detail.status} /></PageHeading></div>
    <div className="grid gap-4 xl:grid-cols-[1fr_350px]">
      <div className="space-y-4">
        <Card className="rounded-xl border-[#e5e2d9] shadow-none"><CardHeader className="flex flex-row items-center justify-between border-b border-[#efede7] px-5 py-4"><div><CardTitle className="text-sm">Detail insiden</CardTitle><p className="mt-1 text-xs text-muted-foreground">Dilaporkan {date(detail.created_at)}</p></div>{open && <Button variant="outline" size="sm" onClick={() => setEditOpen(!editOpen)} data-testid="button-edit-breakdown"><Settings2 className="mr-1 size-3.5" />Ubah laporan</Button>}</CardHeader>
          <CardContent className="grid gap-5 p-5 sm:grid-cols-2"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dugaan penyebab</div><div className="mt-1.5 text-sm">{detail.cause}</div></div><div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Waktu mulai</div><div className="mt-1.5 font-mono text-sm">{date(detail.started_at)}</div></div><div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Waktu selesai</div><div className="mt-1.5 font-mono text-sm">{date(detail.completed_at)}</div></div><div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Waktu henti</div><div className="mt-1.5 font-mono text-sm font-semibold">{open ? "Masih berlangsung" : minutes(detail.downtime_minutes)}</div></div></CardContent>
          {editOpen && open && <div className="border-t border-[#efede7] bg-[#fffdf8] p-5"><form onSubmit={submitEdit} className="grid gap-3 sm:grid-cols-2"><Field label="Mesin"><MachineSelect selected={detail.machine_id} /></Field><Field label="Waktu mulai"><TextInput name="started_at" type="datetime-local" required defaultValue={new Date(new Date(detail.started_at).getTime() - new Date(detail.started_at).getTimezoneOffset() * 60000).toISOString().slice(0,16)} data-testid="input-edit-started" /></Field><Field label="Masalah"><TextInput name="problem" required defaultValue={detail.problem} maxLength={255} data-testid="input-edit-problem" /></Field><Field label="Penyebab"><TextInput name="cause" required defaultValue={detail.cause} maxLength={255} data-testid="input-edit-cause" /></Field><div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={edit.isPending} data-testid="button-save-breakdown">{edit.isPending ? "Menyimpan…" : "Simpan perubahan"}</Button><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>{edit.isError && <span className="text-xs text-rose-700">{errorText(edit.error)}</span>}</div></form></div>}
        </Card>
        <Card className="rounded-xl border-[#e5e2d9] shadow-none"><CardHeader className="border-b border-[#efede7] px-5 py-4"><div className="flex items-center justify-between"><CardTitle className="text-sm">Log perawatan</CardTitle><span className="font-mono text-xs text-muted-foreground">{detail.maintenance.length} {detail.maintenance.length === 1 ? "tindakan" : "tindakan"}</span></div><p className="mt-1 text-xs text-muted-foreground">Catatan setiap perbaikan atau pemeriksaan untuk insiden ini</p></CardHeader>
           {detail.maintenance.length ? <div className="divide-y divide-[#efede7]">{detail.maintenance.map((m, i) => <div className="relative px-5 py-4" key={m.id} data-testid={`maintenance-${m.id}`}><div className="flex items-start gap-3"><div className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#edf2f3] text-[#244858]"><Wrench className="size-4" />{i < detail.maintenance.length - 1 && <span className="absolute left-1/2 top-8 h-[calc(100%+8px)] w-px bg-[#e7e4db]" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-sm">{m.action}</div><div className="flex items-center gap-2 text-[10px] text-muted-foreground">{date(m.created_at)}{open && <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingMaintenance(editingMaintenance === m.id ? null : m.id)} data-testid={`button-edit-maintenance-${m.id}`}>Ubah</Button>}</div></div>{m.component_replaced && <p className="mt-1 text-xs"><span className="text-muted-foreground">Komponen:</span> {m.component_replaced}</p>}{m.notes && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{m.notes}</p>}<p className="mt-2 text-[10px] text-muted-foreground">Dicatat oleh {m.user_name}</p>
            {editingMaintenance === m.id && <form className="mt-3 grid gap-2 rounded-lg bg-[#f8f7f2] p-3" onSubmit={e => submitMaintenance(e, m.id)}><Field label="Tindakan"><TextInput name="action" required defaultValue={m.action} maxLength={255} data-testid={`input-maintenance-action-${m.id}`} /></Field><Field label="Komponen yang diganti"><TextInput name="component_replaced" defaultValue={m.component_replaced || ""} maxLength={150} data-testid={`input-maintenance-component-${m.id}`} /></Field><Field label="Catatan"><Textarea name="notes" defaultValue={m.notes || ""} className="min-h-20 bg-white" data-testid={`input-maintenance-notes-${m.id}`} /></Field><div className="flex gap-2"><Button size="sm" disabled={update.isPending} data-testid={`button-save-maintenance-${m.id}`}>Simpan tindakan</Button><Button type="button" size="sm" variant="outline" onClick={() => setEditingMaintenance(null)}>Batal</Button></div></form>}
           </div></div></div>)}</div> : <Empty icon={Wrench} title="Belum ada tindakan perawatan" message="Tambahkan pemeriksaan atau perbaikan pertama sebelum menyelesaikan insiden." />}
          {open && <div className="border-t border-[#efede7] p-5"><form className="grid gap-3" onSubmit={e => submitMaintenance(e)}><div className="mb-1 text-xs font-semibold">Catat tindakan perawatan</div><Field label="Tindakan"><TextInput name="action" required maxLength={255} placeholder="Contoh: Periksa ketegangan sabuk penggerak" data-testid="input-maintenance-action" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Komponen yang diganti"><TextInput name="component_replaced" maxLength={150} placeholder="Opsional" data-testid="input-maintenance-component" /></Field><Field label="Catatan"><Textarea name="notes" className="min-h-[40px] bg-white" placeholder="Detail tambahan" data-testid="input-maintenance-notes" /></Field></div><div className="flex items-center gap-2"><Button type="submit" size="sm" disabled={add.isPending} data-testid="button-add-maintenance"><Plus className="size-3.5" />{add.isPending ? "Mencatat…" : "Tambah tindakan"}</Button>{add.isError && <span className="text-xs text-rose-700">{errorText(add.error)}</span>}</div></form></div>}
        </Card>
      </div>
      <aside className="space-y-4">
        <Card className="rounded-xl border-[#e5e2d9] shadow-none"><CardHeader className="border-b border-[#efede7] px-5 py-4"><CardTitle className="text-sm">Status insiden</CardTitle></CardHeader><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Status saat ini</span><Status value={detail.status} /></div><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Tindakan perawatan</span><span className="font-mono font-semibold">{detail.maintenance_count}</span></div>{open ? <><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><Clock3 className="mr-1.5 inline size-3.5" />Waktu penyelesaian akan dicatat dan durasi henti dihitung oleh server.</div><Button className="w-full bg-[#244858] hover:bg-[#1b3948]" disabled={!detail.maintenance.length || complete.isPending} onClick={() => { if (window.confirm("Selesaikan kerusakan ini? Durasi henti akan dihitung dari waktu yang tercatat.")) complete.mutate({ id, data: { completed_at: new Date().toISOString() } }, { onSuccess: invalidate }); }} data-testid="button-complete-breakdown"><Check className="size-4" />{complete.isPending ? "Menyelesaikan…" : "Selesaikan insiden"}</Button>{!detail.maintenance.length && <p className="text-center text-[11px] text-amber-800">Tambahkan minimal satu tindakan perawatan sebelum menyelesaikan.</p>}{complete.isError && <p className="text-xs text-rose-700">{errorText(complete.error)}</p>}</> : <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900"><Check className="mr-1.5 inline size-3.5" />Insiden ini telah selesai dan tidak dapat diubah.</div>}</CardContent></Card>
        <Card className="rounded-xl border-[#e5e2d9] shadow-none"><CardHeader className="px-5 py-4"><CardTitle className="text-sm">Peralatan</CardTitle></CardHeader><CardContent className="space-y-3 px-5 pb-5"><div><div className="font-mono text-sm font-semibold text-[#244858]">{detail.machine_code}</div><div className="mt-1 text-xs text-muted-foreground">{detail.machine_name}</div></div><div className="flex justify-between border-t border-[#efede7] pt-3 text-xs"><span className="text-muted-foreground">Lini produksi</span><span>{detail.line}</span></div><Link href="/machines" className="inline-flex items-center text-xs font-semibold text-[#28556a] hover:underline">Daftar mesin <ArrowRight className="ml-1 size-3" /></Link></CardContent></Card>
      </aside>
    </div>
  </>;
}

function MachineSelect({ selected }: { selected: number }) {
  const machines = useListMachines();
  return <select name="machine_id" defaultValue={selected} className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm" data-testid="select-edit-machine">{machines.data?.success && machines.data.data.map(m => <option key={m.id} value={m.id}>{m.machine_code} — {m.name}</option>)}</select>;
}

function HistoryPage() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [line, setLine] = useState("");
  const [machine, setMachine] = useState("");
  const [status, setStatus] = useState("");
  const params = { ...range, ...(line ? { line } : {}), ...(machine ? { machine_id: Number(machine) } : {}), ...(status ? { status: status as "open" | "completed" } : {}), page: 1, limit: 50 };
  const history = useGetHistory(params); const machines = useListMachines();
  const data = history.data?.success ? history.data.data : [];
  return <>
    <PageHeading eyebrow="Catatan peralatan" title="Riwayat insiden" description="Cari kerusakan terdahulu dan tinjau hasil perawatannya." />
    <Card className="mb-4 rounded-xl border-[#e5e2d9] shadow-none"><div className="flex flex-wrap items-end gap-2 p-3"><RangeFilters value={range} onChange={setRange} line={line} setLine={setLine} /><Field label="Mesin"><select value={machine} onChange={e => setMachine(e.target.value)} className="h-10 min-w-[175px] rounded-lg border border-input bg-white px-3 text-sm" data-testid="select-history-machine"><option value="">Semua mesin</option>{machines.data?.success && machines.data.data.map(m => <option key={m.id} value={m.id}>{m.machine_code} — {m.name}</option>)}</select></Field><Field label="Status"><select value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-lg border border-input bg-white px-3 text-sm" data-testid="select-history-status"><option value="">Semua status</option><option value="open">Terbuka</option><option value="completed">Selesai</option></select></Field></div></Card>
    <Card className="rounded-xl border-[#e5e2d9] shadow-none"><div className="flex items-center justify-between border-b border-[#efede7] p-4"><div><h2 className="text-sm font-semibold">Riwayat insiden</h2><p className="mt-1 text-xs text-muted-foreground">{history.data?.success ? `${history.data.pagination.total} catatan` : "Insiden peralatan sesuai filter"}</p></div><History className="size-4 text-muted-foreground" /></div>
      {history.isLoading ? <LoadingRows /> : history.isError ? <div className="p-4"><LoadError message={errorText(history.error)} retry={() => history.refetch()} /></div> : data.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Insiden</TableHead><TableHead>Mesin</TableHead><TableHead>Lini</TableHead><TableHead>Mulai</TableHead><TableHead>Selesai</TableHead><TableHead>Waktu henti</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.map(b => <TableRow key={b.id} data-testid={`row-history-${b.id}`}><TableCell><Link href={`/breakdowns/${b.id}`} className="block max-w-[240px] truncate font-medium text-[#244858] hover:underline">{b.problem}</Link><span className="font-mono text-[10px] text-muted-foreground">INC-{String(b.id).padStart(5, "0")}</span></TableCell><TableCell><div className="font-mono text-[11px]">{b.machine_code}</div><div className="text-xs text-muted-foreground">{b.machine_name}</div></TableCell><TableCell>{b.line}</TableCell><TableCell className="whitespace-nowrap text-xs">{date(b.started_at)}</TableCell><TableCell className="whitespace-nowrap text-xs">{date(b.completed_at)}</TableCell><TableCell className="font-mono text-xs">{minutes(b.downtime_minutes)}</TableCell><TableCell><Status value={b.status} /></TableCell></TableRow>)}</TableBody></Table></div> : <Empty icon={History} title="Tidak ada riwayat yang cocok" message="Coba rentang tanggal, mesin, lini, atau status yang berbeda." />}</Card>
  </>;
}

function Protected({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const me = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  useEffect(() => { if (!me.isLoading && !me.data?.success) setLocation("/login"); }, [me.isLoading, me.data, setLocation]);
  if (me.isLoading) return <div className="grid min-h-[100dvh] place-items-center"><div className="w-64 space-y-3"><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div></div>;
  if (!me.data?.success) return <Login />;
  return <Shell>{children}</Shell>;
}
function ProtectedRoutes() {
  return <Switch>
    <Route path="/login"><Login /></Route>
    <Route path="/"><Protected><Dashboard /></Protected></Route>
    <Route path="/dashboard"><Protected><Dashboard /></Protected></Route>
    <Route path="/machines"><Protected><MachinePage /></Protected></Route>
    <Route path="/breakdowns"><Protected><BreakdownPage /></Protected></Route>
    <Route path="/breakdowns/:id"><Protected><BreakdownDetailPage /></Protected></Route>
    <Route path="/history"><Protected><HistoryPage /></Protected></Route>
    <Route><Protected><div className="py-24 text-center"><h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1><p className="mt-2 text-sm text-muted-foreground">Tampilan operasional tersebut tidak tersedia.</p><Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-[#28556a]">Kembali ke ringkasan</Link></div></Protected></Route>
  </Switch>;
}

function App() {
  return <QueryClientProvider client={qc}><TooltipProvider><Router base={process.env.NEXT_PUBLIC_BASE_PATH || ""}><ProtectedRoutes /></Router><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;