import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, X } from "lucide-react";
import {
  useGetMe,
  useListMachines,
  useListBreakdowns,
  useCreateBreakdown,
  getGetMeQueryKey,
  getListBreakdownsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListMachinesQueryKey,
  type BreakdownInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  date,
  minutes,
  errorText,
  Status,
  PageHeading,
  LoadError,
  LoadingRows,
  Empty,
  Field,
  TextInput,
} from "@/components/shared/common";

export default function BreakdownPage() {
  const [filter, setFilter] = useState("open");
  const [showForm, setShowForm] = useState(false);

  const client = useQueryClient();
  const me = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  const currentUser = me.data?.success ? me.data.data : null;
  const machines = useListMachines({ status: "active" });

  const listParams = {
    status: filter === "all" ? undefined : (filter as "open" | "completed"),
    limit: 50,
    page: 1,
  };
  const list = useListBreakdowns(listParams);
  const create = useCreateBreakdown();

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: BreakdownInput = {
      machine_id: Number(f.get("machine_id")),
      problem: String(f.get("problem")),
      cause: String(f.get("cause")),
      started_at: new Date(String(f.get("started_at"))).toISOString(),
    };
    create.mutate(
      { data: payload },
      {
        onSuccess: () => {
          client.invalidateQueries({ queryKey: getListBreakdownsQueryKey() });
          client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          client.invalidateQueries({ queryKey: getListMachinesQueryKey() });
          setShowForm(false);
        },
      }
    );
  };

  const data = list.data?.success ? list.data.data : [];

  return (
    <>
      <PageHeading
        eyebrow="Penanganan insiden"
        title="Kerusakan"
        description="Catat gangguan produksi dan pantau tindak lanjut perawatannya."
      >
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-10 rounded-lg bg-[#244858] hover:bg-[#1b3948]"
          data-testid="button-new-breakdown"
        >
          <Plus className="size-4" />
          Laporkan kerusakan
        </Button>
      </PageHeading>

      {showForm && (
        <Card className="mb-5 rounded-xl border-amber-200 bg-[#fffdf8] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm">Laporan kerusakan baru</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilih mesin, jelaskan masalah, dan catat dugaan penyebabnya.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowForm(false)}
              aria-label="Tutup formulir laporan"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <Field label="Mesin">
                <select
                  required
                  name="machine_id"
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
                  data-testid="select-breakdown-machine"
                >
                  <option value="">Pilih mesin</option>
                  {machines.data?.success &&
                    machines.data.data.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.machine_code} — {m.name} ({m.line})
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Waktu mulai">
                <TextInput
                  type="datetime-local"
                  name="started_at"
                  required
                  defaultValue={new Date(
                    Date.now() - new Date().getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .slice(0, 16)}
                  data-testid="input-breakdown-started"
                />
              </Field>
              <Field label="Masalah">
                <TextInput
                  name="problem"
                  required
                  maxLength={255}
                  placeholder="Jelaskan gangguan yang ditemukan"
                  data-testid="input-breakdown-problem"
                />
              </Field>
              <Field label="Dugaan penyebab">
                <TextInput
                  name="cause"
                  required
                  maxLength={255}
                  placeholder="Apa kemungkinan penyebabnya?"
                  data-testid="input-breakdown-cause"
                />
              </Field>
              <Field label="Dilaporkan oleh">
                <div
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#d8d9d2] bg-[#f5f4ef] px-3 text-sm"
                  data-testid="input-breakdown-reporter"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-[#d7e0dd] text-[10px] font-bold text-[#244858]">
                    {currentUser?.name
                      ?.split(" ")
                      .map((x: string) => x[0])
                      .slice(0, 2)
                      .join("") || "?"}
                  </span>
                  <span className="font-medium text-slate-700">
                    {currentUser?.name || "—"}
                  </span>
                  <span className="ml-auto text-[10px] capitalize text-muted-foreground">
                    {currentUser?.role || ""}
                  </span>
                </div>
              </Field>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button
                  type="submit"
                  disabled={create.isPending || machines.isLoading}
                  data-testid="button-submit-breakdown"
                >
                  {create.isPending ? "Mencatat…" : "Catat kerusakan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </Button>
                {(create.isError || machines.isError) && (
                  <span className="text-xs text-rose-700">
                    {errorText(create.error || machines.error)}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border-[#e5e2d9] shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efede7] p-4">
          <div>
            <h2 className="text-sm font-semibold">Daftar insiden</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Kerusakan yang terakhir dicatat
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-white px-3 text-xs"
            data-testid="select-breakdown-status"
          >
            <option value="open">Insiden terbuka</option>
            <option value="completed">Insiden selesai</option>
            <option value="all">Semua status</option>
          </select>
        </div>
        {list.isLoading ? (
          <LoadingRows />
        ) : list.isError ? (
          <div className="p-4">
            <LoadError
              message={errorText(list.error)}
              retry={() => list.refetch()}
            />
          </div>
        ) : data.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insiden</TableHead>
                  <TableHead>Mesin / lini</TableHead>
                  <TableHead>Pelapor</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Waktu henti</TableHead>
                  <TableHead>Tindakan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((b) => (
                  <TableRow key={b.id} data-testid={`row-breakdown-${b.id}`}>
                    <TableCell>
                      <Link
                        href={`/breakdowns/${b.id}`}
                        className="block max-w-[280px] truncate font-medium text-[#244858] hover:underline"
                      >
                        {b.problem}
                      </Link>
                      <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                        INC-{String(b.id).padStart(5, "0")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[11px]">{b.machine_code}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{b.line}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {b.reporter_name || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {date(b.started_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {b.status === "open"
                        ? "Sedang ditangani"
                        : minutes(b.downtime_minutes)}
                    </TableCell>
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
            icon={AlertTriangle}
            title="Tidak ada insiden pada tampilan ini"
            message="Pilih status lain atau catat kerusakan saat mesin berhenti."
          />
        )}
      </Card>
    </>
  );
}

