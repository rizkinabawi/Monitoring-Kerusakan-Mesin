import { type ReactNode, type InputHTMLAttributes } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useListMachines } from "@workspace/api-client-react";

export const cx = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ");

export const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export const minutes = (n?: number | null) =>
  n == null ? "—" : `${Math.floor(n / 60)} jam ${n % 60} mnt`;

export const errorText = (_err: unknown) => {
  return "Permintaan tidak dapat diproses. Periksa kembali data, lalu coba lagi.";
};

export function Status({ value }: { value: string }) {
  const colors: Record<string, string> = {
    open: "bg-amber-100 text-amber-900 border-amber-200",
    down: "bg-rose-100 text-rose-900 border-rose-200",
    active: "bg-emerald-100 text-emerald-900 border-emerald-200",
    inactive: "bg-stone-100 text-stone-600 border-stone-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <Badge
      data-testid={`status-${value}`}
      className={cx(
        "rounded-full border px-2.5 py-1 font-medium capitalize shadow-none",
        colors[value] || colors.inactive
      )}
    >
      {value}
    </Badge>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">
          {eyebrow}
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-.04em] text-foreground sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

export function LoadError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <b>Tampilan tidak dapat dimuat</b>
          <p className="mt-1 text-rose-800/80">{message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={retry}
          data-testid="button-retry"
        >
          Coba lagi
        </Button>
      </div>
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-3 p-5">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className={cx(
        "h-10 rounded-lg border-[#d8d9d2] bg-white text-sm shadow-none focus-visible:ring-amber-600/30",
        props.className
      )}
    />
  );
}

export function Empty({
  icon: Icon = Activity,
  title,
  message,
}: {
  icon?: typeof Activity;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-xl bg-[#f2efe7] text-slate-500">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function RangeFilters({
  value,
  onChange,
  line,
  setLine,
}: {
  value: { start_date?: string; end_date?: string };
  onChange: (v: { start_date?: string; end_date?: string }) => void;
  line: string;
  setLine: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e4e1d8] bg-white p-3">
      <Field label="Mulai">
        <TextInput
          type="date"
          value={value.start_date || ""}
          onChange={(e) =>
            onChange({ ...value, start_date: e.target.value || undefined })
          }
          data-testid="input-filter-start"
        />
      </Field>
      <Field label="Sampai">
        <TextInput
          type="date"
          value={value.end_date || ""}
          onChange={(e) =>
            onChange({ ...value, end_date: e.target.value || undefined })
          }
          data-testid="input-filter-end"
        />
      </Field>
      <Field label="Lini produksi">
        <TextInput
          placeholder="Semua lini"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          data-testid="input-filter-line"
        />
      </Field>
      <Button
        variant="ghost"
        size="sm"
        className="h-10"
        onClick={() => {
          onChange({});
          setLine("");
        }}
        data-testid="button-clear-filters"
      >
        Hapus filter
      </Button>
    </div>
  );
}

export function MachineSelect({ selected }: { selected: number }) {
  const machines = useListMachines();
  return (
    <select
      name="machine_id"
      defaultValue={selected}
      className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
      data-testid="select-edit-machine"
    >
      {machines.data?.success &&
        machines.data.data.map((m) => (
          <option key={m.id} value={m.id}>
            {m.machine_code} — {m.name}
          </option>
        ))}
    </select>
  );
}

