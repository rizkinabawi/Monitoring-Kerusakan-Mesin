import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Cog,
  Plus,
  Wrench,
} from "lucide-react";
import {
  useGetDashboardDowntime,
  useGetDashboardFrequency,
  useGetDashboardSummary,
  useListBreakdowns,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cx,
  date,
  minutes,
  errorText,
  Status,
  PageHeading,
  LoadError,
  LoadingRows,
  Empty,
  RangeFilters,
} from "@/components/shared/common";

export default function DashboardPage() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [line, setLine] = useState("");
  const params = { ...range, ...(line ? { line } : {}) };

  const summary = useGetDashboardSummary(params);
  const downtime = useGetDashboardDowntime(params);
  const frequency = useGetDashboardFrequency(params);
  const breakdowns = useListBreakdowns({ status: "open", limit: 6, page: 1 });

  const reload = () => {
    summary.refetch();
    downtime.refetch();
    frequency.refetch();
    breakdowns.refetch();
  };

  if (summary.isError || downtime.isError || frequency.isError) {
    return (
      <>
        <PageHeading
          eyebrow="Operasional / status terkini"
          title="Ringkasan giliran kerja"
          description="Kondisi mesin dan waktu henti di seluruh area produksi."
        />
        <LoadError
          message={errorText(summary.error || downtime.error || frequency.error)}
          retry={reload}
        />
      </>
    );
  }

  const s = summary.data?.success ? summary.data.data : undefined;
  const down = downtime.data?.success ? downtime.data.data : [];
  const freq = frequency.data?.success ? frequency.data.data : [];
  const open = breakdowns.data?.success ? breakdowns.data.data : [];

  const metric = (
    label: string,
    testId: string,
    value: ReactNode,
    detail: string,
    accent: string,
    Icon: typeof Activity
  ) => (
    <Card className="rounded-xl border-[#e5e2d9] shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={cx("grid size-8 place-items-center rounded-lg", accent)}>
            <Icon className="size-4" />
          </span>
        </div>
        <div
          className="mt-4 text-[28px] font-semibold tracking-[-.05em]"
          data-testid={`metric-${testId}`}
        >
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeading
        eyebrow="Operasional / status terkini"
        title="Ringkasan giliran kerja"
        description="Pantau kondisi peralatan dan gangguan produksi dengan cepat."
      >
        <Link href="/breakdowns">
          <Button
            className="h-10 rounded-lg bg-[#244858] hover:bg-[#1b3948]"
            data-testid="button-report-breakdown"
          >
            <Plus className="size-4" />
            Laporkan kerusakan
          </Button>
        </Link>
      </PageHeading>

      <div className="mb-5">
        <RangeFilters value={range} onChange={setRange} line={line} setLine={setLine} />
      </div>

      {summary.isLoading ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        s && (
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metric(
              "Kerusakan terbuka",
              "open-breakdowns",
              s.open_breakdowns,
              `${s.machines_down} mesin sedang berhenti`,
              "bg-rose-50 text-rose-700",
              AlertTriangle
            )}
            {metric(
              "Total waktu henti",
              "downtime-recorded",
              minutes(s.total_downtime),
              `${s.downtime_change_percent > 0 ? "+" : ""}${s.downtime_change_percent}% dibanding periode sebelumnya`,
              s.downtime_change_percent > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700",
              Clock3
            )}
            {metric(
              "Mesin aktif",
              "active-machines",
              s.active_machines,
              `${s.machines_down} mesin saat ini berstatus berhenti`,
              "bg-emerald-50 text-emerald-700",
              Cog
            )}
            {metric(
              "Total kerusakan",
              "breakdowns",
              s.total_breakdowns,
              `Paling sering: ${s.machine_most_broken || "Belum ada data"}`,
              "bg-[#edf2f3] text-[#244858]",
              Wrench
            )}
          </div>
        )
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="rounded-xl border-[#e5e2d9] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#efede7] px-5 py-4">
            <div>
              <CardTitle className="text-sm">Waktu henti per mesin</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Total waktu produksi terhenti pada periode yang dipilih
              </p>
            </div>
            <Clock3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            {downtime.isLoading ? (
              <LoadingRows />
            ) : down.length ? (
              <div className="divide-y divide-[#efede7]">
                {down.slice(0, 7).map((item, i) => {
                  const max = Math.max(...down.map((x) => x.total_downtime), 1);
                  return (
                    <div
                      key={item.machine_id}
                      className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3.5"
                      data-testid={`row-downtime-${item.machine_id}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#244858]">
                            {item.machine_code}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.machine_name}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0eee7]">
                          <div
                            className={cx(
                              "h-full rounded-full",
                              i === 0 ? "bg-amber-500" : "bg-[#6e939d]"
                            )}
                            style={{
                              width: `${Math.max(4, (item.total_downtime / max) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">
                          {minutes(item.total_downtime)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{item.line}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                icon={Clock3}
                title="Tidak ada waktu henti pada periode ini"
                message="Perluas rentang tanggal atau hapus filter lini produksi."
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[#e5e2d9] shadow-none">
          <CardHeader className="border-b border-[#efede7] px-5 py-4">
            <CardTitle className="text-sm">Frekuensi kerusakan</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Mesin yang paling sering memerlukan perawatan
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {frequency.isLoading ? (
              <LoadingRows />
            ) : freq.length ? (
              <div className="divide-y divide-[#efede7]">
                {freq.slice(0, 6).map((m, index) => (
                  <div
                    key={m.machine_id}
                    className="flex items-center gap-3 px-5 py-3.5"
                    data-testid={`row-frequency-${m.machine_id}`}
                  >
                    <span
                      className={cx(
                        "grid size-7 place-items-center rounded-lg font-mono text-xs font-semibold",
                        index === 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-[#f3f2ed] text-slate-500"
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{m.machine_name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {m.machine_code} · {m.line}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">
                        {m.breakdown_count}
                      </div>
                      <div className="text-[10px] text-muted-foreground">insiden</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                icon={Activity}
                title="Belum ada data frekuensi kerusakan"
                message="Pola kerusakan akan terlihat setelah insiden tercatat."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-xl border-[#e5e2d9] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#efede7] px-5 py-4">
          <div>
            <CardTitle className="text-sm">Insiden terbuka</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Perlu ditindaklanjuti oleh tim perawatan
            </p>
          </div>
          <Link
            href="/breakdowns"
            className="text-xs font-semibold text-[#28556a] hover:underline"
            data-testid="link-all-breakdowns"
          >
            Lihat semua <ArrowRight className="ml-1 inline size-3" />
          </Link>
        </CardHeader>
        {breakdowns.isLoading ? (
          <LoadingRows />
        ) : open.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesin</TableHead>
                  <TableHead>Masalah</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Tindakan perawatan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {open.map((b) => (
                  <TableRow key={b.id} data-testid={`row-open-breakdown-${b.id}`}>
                    <TableCell>
                      <Link
                        href={`/breakdowns/${b.id}`}
                        className="font-medium text-[#244858] hover:underline"
                      >
                        {b.machine_code}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {b.machine_name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate">{b.problem}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{date(b.started_at)}</TableCell>
                    <TableCell>{b.maintenance_count}</TableCell>
                    <TableCell>
                      <Status value={b.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty
            icon={Check}
            title="Semua mesin tercatat"
            message="Tidak ada kerusakan terbuka pada tampilan ini."
          />
        )}
      </Card>
    </>
  );
}

