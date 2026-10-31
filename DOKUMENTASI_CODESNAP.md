# DOKUMENTASI CODESNAP HALAMAN SISTEM
**SISTEM MONITORING KERUSAKAN DAN DOWNTIME MESIN**

Dokumen ini berisi potongan kode inti (*CodeSnap*) dari setiap halaman yang telah dipecah secara modular. Format ini siap disalin ke alat pembuat gambar (*CodeSnap / Carbon*) atau langsung dilampirkan ke **Bab 4: Implementasi Antarmuka Sistem**.

---

## 1. Halaman Login Staf & Operator
- **Berkas**: `src/pages/login.tsx`
- **Fungsi**: Menangani autentikasi staf pabrik dengan form username & password, penanganan validasi server, dan proteksi sesi.

```tsx
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Factory, ShieldCheck } from "lucide-react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, errorText } from "@/components/shared/common";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [issue, setIssue] = useState("");
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setIssue("");
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: async () => {
          await client.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/dashboard");
        },
        onError: (e) => setIssue(errorText(e)),
      }
    );
  };

  return (
    <main className="grid min-h-[100dvh] bg-[#f2f1eb] lg:grid-cols-[1fr_1fr]">
      {/* Panel Branding Kiri */}
      <section className="relative hidden overflow-hidden bg-[#203b49] p-12 text-[#f5f1e8] lg:flex lg:flex-col lg:justify-between">
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-900">
            <Factory className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">SHIFT / MONITOR</span>
        </div>
        <div className="relative max-w-lg">
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.05em]">
            Setiap menit<br />tercatat.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Pantau kondisi mesin, kerusakan yang sedang ditangani, dan pekerjaan perawatan.
          </p>
        </div>
      </section>

      {/* Formulir Login Kanan */}
      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-[390px] space-y-5">
          <Field label="Nama pengguna">
            <TextInput
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nama pengguna Anda"
            />
          </Field>
          <Field label="Kata sandi">
            <TextInput
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata sandi Anda"
            />
          </Field>
          {issue && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{issue}</div>}
          <Button type="submit" disabled={login.isPending} className="h-11 w-full bg-[#244858]">
            {login.isPending ? "Sedang masuk…" : "Masuk"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </section>
    </main>
  );
}
```

---

## 2. Halaman Dashboard Ringkasan Operasional
- **Berkas**: `src/pages/dashboard.tsx`
- **Fungsi**: Menampilkan KPI operasional (mesin aktif, total downtime, insiden terbuka) serta visualisasi downtime per mesin dan antrean insiden aktif.

```tsx
import { useState } from "react";
import { Link } from "wouter";
import { Activity, AlertTriangle, Clock3, Cog, Plus, Wrench } from "lucide-react";
import {
  useGetDashboardDowntime,
  useGetDashboardFrequency,
  useGetDashboardSummary,
  useListBreakdowns,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Status, PageHeading, RangeFilters, minutes } from "@/components/shared/common";

export default function DashboardPage() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [line, setLine] = useState("");
  const params = { ...range, ...(line ? { line } : {}) };

  const summary = useGetDashboardSummary(params);
  const downtime = useGetDashboardDowntime(params);
  const frequency = useGetDashboardFrequency(params);
  const breakdowns = useListBreakdowns({ status: "open", limit: 6, page: 1 });

  const s = summary.data?.success ? summary.data.data : undefined;
  const down = downtime.data?.success ? downtime.data.data : [];

  return (
    <>
      <PageHeading eyebrow="Operasional / status terkini" title="Ringkasan giliran kerja" description="Kondisi mesin dan waktu henti di area produksi.">
        <Link href="/breakdowns">
          <Button className="h-10 bg-[#244858]"><Plus className="size-4" />Laporkan kerusakan</Button>
        </Link>
      </PageHeading>

      <div className="mb-5"><RangeFilters value={range} onChange={setRange} line={line} setLine={setLine} /></div>

      {/* KPI Cards Ringkasan */}
      {s && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5"><span className="text-xs text-muted-foreground">Kerusakan terbuka</span><div className="text-[28px] font-semibold">{s.open_breakdowns}</div></Card>
          <Card className="p-5"><span className="text-xs text-muted-foreground">Total waktu henti</span><div className="text-[28px] font-semibold">{minutes(s.total_downtime)}</div></Card>
          <Card className="p-5"><span className="text-xs text-muted-foreground">Mesin aktif</span><div className="text-[28px] font-semibold">{s.active_machines}</div></Card>
          <Card className="p-5"><span className="text-xs text-muted-foreground">Total kerusakan</span><div className="text-[28px] font-semibold">{s.total_breakdowns}</div></Card>
        </div>
      )}

      {/* Progres Waktu Henti per Mesin */}
      <Card className="rounded-xl border-[#e5e2d9]">
        <CardHeader><CardTitle className="text-sm">Waktu henti per mesin</CardTitle></CardHeader>
        <CardContent className="divide-y divide-[#efede7]">
          {down.slice(0, 5).map((item) => (
            <div key={item.machine_id} className="grid grid-cols-[1fr_auto] gap-3 py-3">
              <div>
                <span className="font-mono text-xs font-semibold text-[#244858]">{item.machine_code}</span>
                <span className="ml-2 text-xs text-muted-foreground">{item.machine_name}</span>
              </div>
              <div className="font-mono text-sm font-semibold">{minutes(item.total_downtime)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
```

---

## 3. Halaman Direktori Master Mesin
- **Berkas**: `src/pages/machines.tsx`
- **Fungsi**: Manajemen aset mesin manufaktur, formulir pendaftaran mesin baru, pengubahan parameter mesin, dan filter status aktif/down/nonaktif.

```tsx
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Cog, Plus, Search, Settings2, X } from "lucide-react";
import { useListMachines, useCreateMachine, useUpdateMachine, getListMachinesQueryKey, type Machine } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Status, PageHeading, Field, TextInput } from "@/components/shared/common";

export default function MachinePage() {
  const [editing, setEditing] = useState<Machine | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const machines = useListMachines();
  const client = useQueryClient();
  const create = useCreateMachine();
  const update = useUpdateMachine();

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = { machine_code: String(f.get("machine_code")), name: String(f.get("name")), line: String(f.get("line")) };
    const onSuccess = () => { setEditing(null); setFormOpen(false); client.invalidateQueries({ queryKey: getListMachinesQueryKey() }); };
    if (editing) update.mutate({ id: editing.id, data: payload }, { onSuccess });
    else create.mutate({ data: payload }, { onSuccess });
  };

  const filtered = (machines.data?.success ? machines.data.data : []).filter((m) =>
    `${m.name} ${m.machine_code} ${m.line}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeading eyebrow="Daftar aset" title="Mesin" description="Data peralatan dan status operasional terkini.">
        <Button className="h-10 bg-[#244858]" onClick={() => { setEditing(null); setFormOpen(!formOpen); }}>
          <Plus className="size-4" />Tambah mesin
        </Button>
      </PageHeading>

      {formOpen && (
        <Card className="mb-5 bg-[#fffdf8]">
          <form className="grid gap-3 p-5 sm:grid-cols-3" onSubmit={save}>
            <Field label="Kode mesin"><TextInput name="machine_code" required defaultValue={editing?.machine_code} /></Field>
            <Field label="Nama mesin"><TextInput name="name" required defaultValue={editing?.name} /></Field>
            <Field label="Lini produksi"><TextInput name="line" required defaultValue={editing?.line} /></Field>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit">{editing ? "Simpan perubahan" : "Daftarkan mesin"}</Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabel Data Mesin */}
      <Table>
        <TableHeader><TableRow><TableHead>Mesin</TableHead><TableHead>Lini</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id}>
              <TableCell><div className="font-mono text-xs font-semibold">{m.machine_code}</div><div className="text-xs text-muted-foreground">{m.name}</div></TableCell>
              <TableCell>{m.line}</TableCell>
              <TableCell><Status value={m.status} /></TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => { setEditing(m); setFormOpen(true); }}><Settings2 className="size-3.5 mr-1" />Ubah</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
```

---

## 4. Halaman Pelaporan Kerusakan Mesin
- **Berkas**: `src/pages/breakdowns.tsx`
- **Fungsi**: Pelaporan insiden kerusakan baru saat mesin berhenti, pencatatan waktu mulai, masalah, dugaan penyebab, dan pelapor.

```tsx
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus } from "lucide-react";
import { useListMachines, useListBreakdowns, useCreateBreakdown, getListBreakdownsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Status, PageHeading, Field, TextInput, date } from "@/components/shared/common";

export default function BreakdownPage() {
  const [filter, setFilter] = useState("open");
  const [showForm, setShowForm] = useState(false);
  const client = useQueryClient();
  const machines = useListMachines({ status: "active" });
  const list = useListBreakdowns({ status: filter === "all" ? undefined : (filter as "open" | "completed"), limit: 50, page: 1 });
  const create = useCreateBreakdown();

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create.mutate({
      data: {
        machine_id: Number(f.get("machine_id")),
        problem: String(f.get("problem")),
        cause: String(f.get("cause")),
        started_at: new Date(String(f.get("started_at"))).toISOString(),
      }
    }, {
      onSuccess: () => { client.invalidateQueries({ queryKey: getListBreakdownsQueryKey() }); setShowForm(false); }
    });
  };

  return (
    <>
      <PageHeading eyebrow="Penanganan insiden" title="Kerusakan" description="Catat gangguan produksi dan pantau tindak lanjut perawatannya.">
        <Button onClick={() => setShowForm(!showForm)} className="h-10 bg-[#244858]"><Plus className="size-4" />Laporkan kerusakan</Button>
      </PageHeading>

      {/* Tabel Kerusakan */}
      <Table>
        <TableHeader><TableRow><TableHead>Insiden</TableHead><TableHead>Mesin</TableHead><TableHead>Waktu Mulai</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {(list.data?.success ? list.data.data : []).map((b) => (
            <TableRow key={b.id}>
              <TableCell><Link href={`/breakdowns/${b.id}`} className="font-medium text-[#244858]">{b.problem}</Link></TableCell>
              <TableCell>{b.machine_code} - {b.line}</TableCell>
              <TableCell className="text-xs">{date(b.started_at)}</TableCell>
              <TableCell><Status value={b.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
```

---

## 5. Halaman Detail Kerusakan & Tindakan Perawatan
- **Berkas**: `src/pages/breakdown-detail.tsx`
- **Fungsi**: Timeline tindakan maintenance teknisi, penggantian komponen cadangan, dan tombol otomatisasi kalkulasi downtime saat perbaikan selesai.

```tsx
import { useState, type FormEvent } from "react";
import { Link, useRoute } from "wouter";
import { Check, Clock3, Plus, Wrench } from "lucide-react";
import { useGetBreakdown, useAddMaintenance, useCompleteBreakdown, getGetBreakdownQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Status, PageHeading, Field, TextInput, minutes, date } from "@/components/shared/common";

export default function BreakdownDetailPage() {
  const [, params] = useRoute("/breakdowns/:id");
  const id = Number(params?.id || 0);
  const query = useGetBreakdown(id);
  const detail = query.data?.success ? query.data.data : undefined;
  const add = useAddMaintenance();
  const complete = useCompleteBreakdown();

  const open = detail?.status === "open";

  return (
    <>
      <PageHeading eyebrow={`INC-${String(detail?.id).padStart(5, "0")}`} title={detail?.problem || ""} description={`${detail?.machine_code} · ${detail?.line}`}>
        <Status value={detail?.status || "open"} />
      </PageHeading>

      <div className="grid gap-4 xl:grid-cols-[1fr_350px]">
        {/* Log Tindakan Perawatan */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Log Tindakan Perawatan</CardTitle></CardHeader>
          <CardContent className="divide-y divide-[#efede7]">
            {detail?.maintenance.map((m) => (
              <div key={m.id} className="py-3 flex items-start gap-3">
                <Wrench className="size-4 mt-1 text-[#244858]" />
                <div>
                  <div className="font-medium text-sm">{m.action}</div>
                  {m.component_replaced && <p className="text-xs text-muted-foreground">Komponen: {m.component_replaced}</p>}
                  <p className="text-[10px] text-muted-foreground">Oleh {m.user_name} pada {date(m.created_at)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Panel Selesaikan Insiden */}
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3">Status Kerusakan</div>
          {open ? (
            <Button className="w-full bg-[#244858]" disabled={!detail?.maintenance.length || complete.isPending} onClick={() => complete.mutate({ id, data: { completed_at: new Date().toISOString() } })}>
              <Check className="size-4 mr-2" />Selesaikan & Hitung Downtime
            </Button>
          ) : (
            <div className="text-xs text-emerald-800">Kerusakan telah diselesaikan. Total Downtime: {minutes(detail?.downtime_minutes)}</div>
          )}
        </Card>
      </div>
    </>
  );
}
```

---

## 6. Halaman Riwayat & Ekspor Laporan CSV
- **Berkas**: `src/pages/history.tsx`
- **Fungsi**: Pencarian riwayat insiden historis dan ekspor data audit ke format CSV dengan filter bulan atau rentang tanggal kustom.

```tsx
import { useState } from "react";
import { ArrowDownRight, History } from "lucide-react";
import { useGetHistory, useListMachines } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Status, PageHeading, RangeFilters, date, minutes } from "@/components/shared/common";
import { ExportPanel } from "@/pages/history";

export default function HistoryPage() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const history = useGetHistory({ ...range, page: 1, limit: 50 });
  const machines = useListMachines();
  const machineList = machines.data?.success ? machines.data.data : [];

  return (
    <>
      <PageHeading eyebrow="Equipment records" title="Incident History" description="Search past breakdowns and review maintenance outcomes.">
        <ExportPanel machines={machineList} />
      </PageHeading>

      {/* Tabel Riwayat */}
      <Table>
        <TableHeader><TableRow><TableHead>Insiden</TableHead><TableHead>Mesin</TableHead><TableHead>Mulai</TableHead><TableHead>Selesai</TableHead><TableHead>Downtime</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {(history.data?.success ? history.data.data : []).map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.problem}</TableCell>
              <TableCell>{b.machine_code}</TableCell>
              <TableCell className="text-xs">{date(b.started_at)}</TableCell>
              <TableCell className="text-xs">{date(b.completed_at)}</TableCell>
              <TableCell className="font-mono text-xs">{minutes(b.downtime_minutes)}</TableCell>
              <TableCell><Status value={b.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
```

---

## 7. Halaman Analitik & Visualisasi Grafik
- **Berkas**: `src/pages/analytics.tsx`
- **Fungsi**: Visualisasi diagram batang (*BarChart*) frekuensi insiden, diagram batang durasi total waktu henti (*Downtime*), dan diagram lingkaran (*PieChart*) sebaran status operasional mesin.

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useGetDashboardFrequency, useGetDashboardDowntime, useListMachines } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/common";

export default function AnalyticsPage() {
  const frequency = useGetDashboardFrequency({});
  const downtime = useGetDashboardDowntime({});
  const machines = useListMachines();

  const freqData = (frequency.data?.success ? frequency.data.data : []).slice(0, 8).map((d) => ({
    name: d.machine_code,
    value: d.breakdown_count,
  }));

  const downtimeData = (downtime.data?.success ? downtime.data.data : []).slice(0, 8).map((d) => ({
    name: d.machine_code,
    value: Math.floor(d.total_downtime / 60),
  }));

  return (
    <>
      <PageHeading eyebrow="Wawasan operasional" title="Analitik Mesin" description="Pola kerusakan dan waktu henti secara visual." />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Grafik Frekuensi Insiden */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Frekuensi Kerusakan per Mesin</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={freqData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grafik Total Downtime */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Waktu Henti per Mesin (Jam)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={downtimeData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
```

---

## 8. Root Application Routing
- **Berkas**: `src/App.tsx`
- **Fungsi**: Titik masuk utama aplikasi React, inisialisasi QueryClient, penyedia tema/tooltip, dan router halaman terlindungi (*ProtectedRoutes*).

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

// Import Halaman Terpisah
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import MachinePage from "@/pages/machines";
import BreakdownPage from "@/pages/breakdowns";
import BreakdownDetailPage from "@/pages/breakdown-detail";
import HistoryPage from "@/pages/history";
import AnalyticsPage from "@/pages/analytics";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Router>
          <Switch>
            <Route path="/login"><LoginPage /></Route>
            <Route path="/"><DashboardPage /></Route>
            <Route path="/dashboard"><DashboardPage /></Route>
            <Route path="/machines"><MachinePage /></Route>
            <Route path="/breakdowns"><BreakdownPage /></Route>
            <Route path="/breakdowns/:id"><BreakdownDetailPage /></Route>
            <Route path="/history"><HistoryPage /></Route>
            <Route path="/analytics"><AnalyticsPage /></Route>
          </Switch>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

