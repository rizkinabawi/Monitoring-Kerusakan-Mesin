import { useState } from "react";
import { Link } from "wouter";
import { ArrowDownRight, ChevronDown, History } from "lucide-react";
import { useGetHistory, useListMachines } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Field,
  RangeFilters,
} from "@/components/shared/common";

type BreakdownRow = {
  id: number;
  machine_code: string;
  machine_name: string;
  line: string;
  problem: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  downtime_minutes?: number | null;
  [key: string]: unknown;
};

export function exportToCsv(rows: BreakdownRow[], filename: string) {
  if (!rows.length) return;
  const headers = [
    "Incident ID",
    "Machine Code",
    "Machine Name",
    "Line",
    "Problem",
    "Cause",
    "Status",
    "Started At",
    "Completed At",
    "Downtime (Minutes)",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((b) =>
      [
        `INC-${String(b.id).padStart(5, "0")}`,
        b.machine_code,
        b.machine_name,
        b.line,
        b.problem,
        String(b.cause ?? ""),
        b.status,
        b.started_at ? new Date(b.started_at).toLocaleString("en-GB") : "",
        b.completed_at ? new Date(b.completed_at).toLocaleString("en-GB") : "",
        b.downtime_minutes ?? "",
      ]
        .map(esc)
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ExportPanel({
  machines,
}: {
  machines: { id: number; name: string; machine_code: string }[];
}) {
  const now = new Date();
  const [mode, setMode] = useState<"month" | "custom">("month");
  const [exportMonth, setExportMonth] = useState(now.getMonth());
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [exportMachine, setExportMachine] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const getDateRange = () => {
    if (mode === "month") {
      const start = new Date(exportYear, exportMonth, 1);
      const end = new Date(exportYear, exportMonth + 1, 0);
      return {
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      };
    }
    return {
      start_date: customStart || undefined,
      end_date: customEnd || undefined,
    };
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { start_date, end_date } = getDateRange();
      const params = new URLSearchParams();
      if (start_date) params.set("start_date", start_date);
      if (end_date) params.set("end_date", end_date);
      if (exportMachine) params.set("machine_id", exportMachine);
      const resp = await fetch(`/api/history/export?${params}`, {
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed to fetch data");
      const json = await resp.json();
      const rows: BreakdownRow[] = json?.data ?? [];
      const label =
        mode === "month"
          ? `${MONTHS[exportMonth]}-${exportYear}`
          : start_date ?? "all";
      exportToCsv(rows, `incident-report-${label}.csv`);
      setOpen(false);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        data-testid="button-open-export"
        className="gap-2 rounded-lg border-[#d8d9d2] bg-white text-sm font-medium shadow-none hover:bg-[#f5f4ef]"
      >
        <ArrowDownRight className="size-4 text-emerald-700" />
        Export CSV
        <ChevronDown
          className={cx("size-3.5 transition-transform", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-[#e4e1d8] bg-white p-4 shadow-lg">
          <p className="mb-3 text-xs font-semibold text-slate-700">
            Export incident report
          </p>
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setMode("month")}
              className={cx(
                "flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                mode === "month"
                  ? "border-[#244858] bg-[#244858] text-white"
                  : "border-[#d8d9d2] text-slate-600 hover:bg-slate-50"
              )}
            >
              By Month
            </button>
            <button
              onClick={() => setMode("custom")}
              className={cx(
                "flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                mode === "custom"
                  ? "border-[#244858] bg-[#244858] text-white"
                  : "border-[#d8d9d2] text-slate-600 hover:bg-slate-50"
              )}
            >
              Custom Range
            </button>
          </div>
          {mode === "month" ? (
            <div className="mb-3 flex gap-2">
              <div className="flex-1">
                <p className="mb-1 text-[10px] font-semibold text-slate-500">
                  MONTH
                </p>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-input bg-white px-2 text-xs"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <p className="mb-1 text-[10px] font-semibold text-slate-500">
                  YEAR
                </p>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-input bg-white px-2 text-xs"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="mb-3 space-y-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold text-slate-500">
                  FROM
                </p>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-white px-2 text-xs"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-slate-500">TO</p>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-white px-2 text-xs"
                />
              </div>
            </div>
          )}
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-semibold text-slate-500">
              MACHINE (optional)
            </p>
            <select
              value={exportMachine}
              onChange={(e) => setExportMachine(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-white px-2 text-xs"
            >
              <option value="">All machines</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machine_code} — {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-[#244858] text-xs hover:bg-[#1b3948]"
              onClick={handleDownload}
              disabled={downloading}
              data-testid="button-download-csv"
            >
              <ArrowDownRight className="size-3.5" />
              {downloading ? "Preparing…" : "Download"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [range, setRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [line, setLine] = useState("");
  const [machine, setMachine] = useState("");
  const [status, setStatus] = useState("");

  const params = {
    ...range,
    ...(line ? { line } : {}),
    ...(machine ? { machine_id: Number(machine) } : {}),
    ...(status ? { status: status as "open" | "completed" } : {}),
    page: 1,
    limit: 50,
  };

  const history = useGetHistory(params);
  const machinesQ = useListMachines();
  const machineList = machinesQ.data?.success ? machinesQ.data.data : [];
  const data = history.data?.success ? history.data.data : [];

  return (
    <>
      <PageHeading
        eyebrow="Equipment records"
        title="Incident History"
        description="Search past breakdowns and review maintenance outcomes."
      >
        <ExportPanel machines={machineList} />
      </PageHeading>

      <Card className="mb-4 rounded-xl border-[#e5e2d9] shadow-none">
        <div className="flex flex-wrap items-end gap-2 p-3">
          <RangeFilters
            value={range}
            onChange={setRange}
            line={line}
            setLine={setLine}
          />
          <Field label="Machine">
            <select
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              className="h-10 min-w-[175px] rounded-lg border border-input bg-white px-3 text-sm"
              data-testid="select-history-machine"
            >
              <option value="">All machines</option>
              {machineList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machine_code} — {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm"
              data-testid="select-history-status"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="rounded-xl border-[#e5e2d9] shadow-none">
        <div className="flex items-center justify-between border-b border-[#efede7] p-4">
          <div>
            <h2 className="text-sm font-semibold">Incident Records</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {history.data?.success
                ? `${history.data.pagination.total} records found`
                : "Equipment incidents matching filter"}
            </p>
          </div>
          <History className="size-4 text-muted-foreground" />
        </div>
        {history.isLoading ? (
          <LoadingRows />
        ) : history.isError ? (
          <div className="p-4">
            <LoadError
              message={errorText(history.error)}
              retry={() => history.refetch()}
            />
          </div>
        ) : data.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Downtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((b) => (
                  <TableRow key={b.id} data-testid={`row-history-${b.id}`}>
                    <TableCell>
                      <Link
                        href={`/breakdowns/${b.id}`}
                        className="block max-w-[240px] truncate font-medium text-[#244858] hover:underline"
                      >
                        {b.problem}
                      </Link>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        INC-{String(b.id).padStart(5, "0")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[11px]">{b.machine_code}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.machine_name}
                      </div>
                    </TableCell>
                    <TableCell>{b.line}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {date(b.started_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {date(b.completed_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {minutes(b.downtime_minutes)}
                    </TableCell>
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
            icon={History}
            title="No matching history"
            message="Try a different date range, machine, line, or status."
          />
        )}
      </Card>
    </>
  );
}

