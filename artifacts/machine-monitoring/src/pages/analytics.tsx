import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Check,
  Clock3,
  Cog,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  useGetDashboardFrequency,
  useGetDashboardDowntime,
  useListMachines,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cx,
  minutes,
  PageHeading,
  LoadingRows,
  Empty,
  RangeFilters,
} from "@/components/shared/common";

export default function AnalyticsPage() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [line, setLine] = useState("");
  const params = { ...range, ...(line ? { line } : {}) };

  const frequency = useGetDashboardFrequency(params);
  const downtime = useGetDashboardDowntime(params);
  const machines = useListMachines();
  const summary = useGetDashboardSummary(params);

  const freqData = (frequency.data?.success ? frequency.data.data : [])
    .slice(0, 10)
    .map((d) => ({
      name: d.machine_code,
      label: d.machine_name,
      value: d.breakdown_count,
    }));

  const downtimeData = (downtime.data?.success ? downtime.data.data : [])
    .slice(0, 10)
    .map((d) => ({
      name: d.machine_code,
      label: d.machine_name,
      value: Math.floor(d.total_downtime / 60),
      minutes: d.total_downtime,
    }));

  const machineList = machines.data?.success ? machines.data.data : [];
  const active = machineList.filter((m) => m.status === "active").length;
  const down = machineList.filter((m) => m.status === "down").length;
  const inactive = machineList.filter((m) => m.status === "inactive").length;
  const pieData = [
    { name: "Aktif", value: active, color: "#10b981" },
    { name: "Down", value: down, color: "#f43f5e" },
    { name: "Tidak aktif", value: inactive, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const s = summary.data?.success ? summary.data.data : undefined;
  const topFreq = freqData[0];
  const topDowntime = downtimeData[0];

  const COLORS = [
    "#f59e0b",
    "#6e939d",
    "#244858",
    "#10b981",
    "#f43f5e",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#64748b",
  ];

  return (
    <>
      <PageHeading
        eyebrow="Wawasan operasional"
        title="Analitik mesin"
        description="Pola kerusakan, waktu henti, dan distribusi status mesin secara visual."
      />
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#e4e1d8] bg-white p-3">
        <RangeFilters value={range} onChange={setRange} line={line} setLine={setLine} />
      </div>

      {/* KPI strip */}
      {s && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total kerusakan",
              val: s.total_breakdowns,
              icon: AlertTriangle,
              accent: "bg-rose-50 text-rose-700",
            },
            {
              label: "Total waktu henti",
              val: minutes(s.total_downtime),
              icon: Clock3,
              accent: "bg-amber-50 text-amber-700",
            },
            {
              label: "Mesin aktif",
              val: s.active_machines,
              icon: Cog,
              accent: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Mesin down",
              val: s.machines_down,
              icon: TrendingDown,
              accent: "bg-rose-50 text-rose-600",
            },
          ].map(({ label, val, icon: Icon, accent }) => (
            <Card key={label} className="rounded-xl border-[#e5e2d9] shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className={cx(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    accent
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div>
                  <div className="text-lg font-semibold tracking-tight">{val}</div>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Frequency chart */}
        <Card className="rounded-xl border-[#e5e2d9] shadow-none">
          <CardHeader className="border-b border-[#efede7] px-5 py-4">
            <CardTitle className="text-sm">Frekuensi kerusakan per mesin</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Jumlah insiden yang tercatat per unit mesin
            </p>
          </CardHeader>
          <CardContent className="p-5">
            {frequency.isLoading ? (
              <LoadingRows />
            ) : freqData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={freqData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede7" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontFamily: "monospace" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e2d9",
                    }}
                    formatter={(
                      value: number,
                      _: string,
                      entry: { payload: { label: string } }
                    ) => [value + " insiden", entry.payload.label]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {freqData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? "#f59e0b" : COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                icon={BarChart2}
                title="Belum ada data frekuensi"
                message="Data akan muncul setelah kerusakan dicatat."
              />
            )}
          </CardContent>
        </Card>

        {/* Downtime chart */}
        <Card className="rounded-xl border-[#e5e2d9] shadow-none">
          <CardHeader className="border-b border-[#efede7] px-5 py-4">
            <CardTitle className="text-sm">Total waktu henti per mesin (jam)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Akumulasi downtime pada periode yang dipilih
            </p>
          </CardHeader>
          <CardContent className="p-5">
            {downtime.isLoading ? (
              <LoadingRows />
            ) : downtimeData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={downtimeData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede7" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontFamily: "monospace" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e2d9",
                    }}
                    formatter={(
                      value: number,
                      _: string,
                      entry: { payload: { label: string; minutes: number } }
                    ) => [
                      `${value} jam (${entry.payload.minutes} mnt)`,
                      entry.payload.label,
                    ]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {downtimeData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? "#f43f5e" : COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                icon={Clock3}
                title="Belum ada data downtime"
                message="Data akan muncul setelah insiden diselesaikan."
              />
            )}
          </CardContent>
        </Card>

        {/* Machine status pie */}
        <Card className="rounded-xl border-[#e5e2d9] shadow-none">
          <CardHeader className="border-b border-[#efede7] px-5 py-4">
            <CardTitle className="text-sm">Distribusi status mesin</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Kondisi saat ini dari seluruh unit yang terdaftar
            </p>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-5">
            {machines.isLoading ? (
              <LoadingRows />
            ) : pieData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number, n: string) => [v + " mesin", n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                icon={Cog}
                title="Belum ada mesin"
                message="Daftarkan mesin terlebih dahulu."
              />
            )}
          </CardContent>
        </Card>

        {/* Simple analysis */}
        <Card className="rounded-xl border-[#e5e2d9] shadow-none">
          <CardHeader className="border-b border-[#efede7] px-5 py-4">
            <CardTitle className="text-sm">Ringkasan analisis</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Wawasan otomatis berdasarkan data periode ini
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {topFreq ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <TrendingUp className="mt-0.5 size-4 shrink-0 text-amber-700" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-900">Mesin paling sering rusak</p>
                  <p className="mt-1 text-amber-800">
                    <span className="font-mono font-bold">{topFreq.name}</span> —{" "}
                    {topFreq.label} dengan <strong>{topFreq.value} insiden</strong>{" "}
                    tercatat.
                  </p>
                </div>
              </div>
            ) : null}
            {topDowntime ? (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <TrendingDown className="mt-0.5 size-4 shrink-0 text-rose-700" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-900">Downtime tertinggi</p>
                  <p className="mt-1 text-rose-800">
                    <span className="font-mono font-bold">{topDowntime.name}</span> —{" "}
                    {topDowntime.label} dengan total{" "}
                    <strong>{topDowntime.value} jam</strong> henti produksi.
                  </p>
                </div>
              </div>
            ) : null}
            {s && s.downtime_change_percent !== 0 ? (
              <div
                className={cx(
                  "flex items-start gap-3 rounded-lg border p-3",
                  s.downtime_change_percent > 0
                    ? "border-rose-200 bg-rose-50"
                    : "border-emerald-200 bg-emerald-50"
                )}
              >
                {s.downtime_change_percent > 0 ? (
                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-rose-700" />
                ) : (
                  <ArrowDownRight className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                )}
                <div className="text-xs">
                  <p
                    className={cx(
                      "font-semibold",
                      s.downtime_change_percent > 0
                        ? "text-rose-900"
                        : "text-emerald-900"
                    )}
                  >
                    Tren downtime
                  </p>
                  <p
                    className={cx(
                      "mt-1",
                      s.downtime_change_percent > 0
                        ? "text-rose-800"
                        : "text-emerald-800"
                    )}
                  >
                    Waktu henti{" "}
                    <strong>
                      {s.downtime_change_percent > 0 ? "naik" : "turun"}{" "}
                      {Math.abs(s.downtime_change_percent)}%
                    </strong>{" "}
                    dibanding periode sebelumnya.
                  </p>
                </div>
              </div>
            ) : null}
            {down > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <Wrench className="mt-0.5 size-4 shrink-0 text-orange-700" />
                <div className="text-xs">
                  <p className="font-semibold text-orange-900">Perhatian diperlukan</p>
                  <p className="mt-1 text-orange-800">
                    <strong>{down} mesin</strong> sedang dalam status <em>down</em> dan
                    memerlukan tindakan perawatan segera.
                  </p>
                </div>
              </div>
            ) : s && s.machines_down === 0 && active > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-900">Semua mesin beroperasi</p>
                  <p className="mt-1 text-emerald-800">
                    Tidak ada mesin yang sedang berhenti. Produksi berjalan normal.
                  </p>
                </div>
              </div>
            ) : null}
            {!topFreq && !topDowntime && !s && (
              <Empty
                icon={BarChart2}
                title="Belum cukup data"
                message="Isi filter atau catat kerusakan untuk melihat analisis."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

