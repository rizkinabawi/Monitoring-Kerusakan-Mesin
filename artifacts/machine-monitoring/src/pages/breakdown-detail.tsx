import { useState, type FormEvent } from "react";
import { Link, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock3,
  Plus,
  Settings2,
  Wrench,
} from "lucide-react";
import {
  useGetBreakdown,
  useAddMaintenance,
  useUpdateMaintenance,
  useUpdateBreakdown,
  useCompleteBreakdown,
  getGetBreakdownQueryKey,
  getListBreakdownsQueryKey,
  getGetHistoryQueryKey,
  getGetDashboardSummaryQueryKey,
  getListMachinesQueryKey,
  type BreakdownUpdate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  date,
  minutes,
  errorText,
  Status,
  PageHeading,
  LoadError,
  Empty,
  Field,
  TextInput,
  MachineSelect,
} from "@/components/shared/common";

export default function BreakdownDetailPage() {
  const [, params] = useRoute("/breakdowns/:id");
  const id = Number(params?.id || 0);
  const query = useGetBreakdown(id);
  const detail = query.data?.success ? query.data.data : undefined;
  const client = useQueryClient();

  const add = useAddMaintenance();
  const update = useUpdateMaintenance();
  const edit = useUpdateBreakdown();
  const complete = useCompleteBreakdown();

  const [editOpen, setEditOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<number | null>(null);

  const invalidate = () => {
    client.invalidateQueries({ queryKey: getGetBreakdownQueryKey(id) });
    client.invalidateQueries({ queryKey: getListBreakdownsQueryKey() });
    client.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
    client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    client.invalidateQueries({ queryKey: getListMachinesQueryKey() });
  };

  const submitMaintenance = (
    e: FormEvent<HTMLFormElement>,
    maintenanceId?: number
  ) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      action: String(f.get("action")),
      component_replaced: String(f.get("component_replaced") || "") || null,
      notes: String(f.get("notes") || "") || null,
    };
    const opts = {
      onSuccess: () => {
        invalidate();
        setEditingMaintenance(null);
      },
    };
    if (maintenanceId) {
      update.mutate({ id: maintenanceId, data: payload }, opts);
    } else {
      add.mutate({ id, data: payload }, opts);
    }
  };

  const submitEdit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: BreakdownUpdate = {
      machine_id: Number(f.get("machine_id")),
      problem: String(f.get("problem")),
      cause: String(f.get("cause")),
      started_at: new Date(String(f.get("started_at"))).toISOString(),
    };
    edit.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          invalidate();
          setEditOpen(false);
        },
      }
    );
  };

  if (query.isLoading) {
    return (
      <>
        <Skeleton className="mb-5 h-8 w-72" />
        <Skeleton className="h-80 rounded-xl" />
      </>
    );
  }

  if (query.isError || !detail) {
    return (
      <>
        <PageHeading
          eyebrow="Detail insiden"
          title="Catatan kerusakan"
          description="Tinjau masalah yang dilaporkan dan riwayat perawatannya."
        />
        <LoadError message={errorText(query.error)} retry={() => query.refetch()} />
      </>
    );
  }

  const open = detail.status === "open";

  return (
    <>
      <div className="mb-6">
        <Link
          href="/breakdowns"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-[#244858]"
          data-testid="link-back-breakdowns"
        >
          <ArrowRight className="size-3 rotate-180" />
          Semua kerusakan
        </Link>
        <PageHeading
          eyebrow={`Insiden / INC-${String(detail.id).padStart(5, "0")}`}
          title={detail.problem}
          description={`${detail.machine_code} · ${detail.machine_name} · ${detail.line}`}
        >
          <Status value={detail.status} />
        </PageHeading>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_350px]">
        <div className="space-y-4">
          <Card className="rounded-xl border-[#e5e2d9] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#efede7] px-5 py-4">
              <div>
                <CardTitle className="text-sm">Detail insiden</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dilaporkan {date(detail.created_at)}
                </p>
              </div>
              {open && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(!editOpen)}
                  data-testid="button-edit-breakdown"
                >
                  <Settings2 className="mr-1 size-3.5" />
                  Ubah laporan
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dugaan penyebab
                </div>
                <div className="mt-1.5 text-sm">{detail.cause}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Waktu mulai
                </div>
                <div className="mt-1.5 font-mono text-sm">{date(detail.started_at)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Waktu selesai
                </div>
                <div className="mt-1.5 font-mono text-sm">{date(detail.completed_at)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Waktu henti
                </div>
                <div className="mt-1.5 font-mono text-sm font-semibold">
                  {open ? "Masih berlangsung" : minutes(detail.downtime_minutes)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dilaporkan oleh
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-[#d7e0dd] text-[10px] font-bold text-[#244858]">
                    {(detail.reporter_name || "?")
                      .split(" ")
                      .map((x: string) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="text-sm font-medium">
                    {detail.reporter_name || "—"}
                  </span>
                </div>
              </div>
            </CardContent>
            {editOpen && open && (
              <div className="border-t border-[#efede7] bg-[#fffdf8] p-5">
                <form onSubmit={submitEdit} className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mesin">
                    <MachineSelect selected={detail.machine_id} />
                  </Field>
                  <Field label="Waktu mulai">
                    <TextInput
                      name="started_at"
                      type="datetime-local"
                      required
                      defaultValue={new Date(
                        new Date(detail.started_at).getTime() -
                          new Date(detail.started_at).getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, 16)}
                      data-testid="input-edit-started"
                    />
                  </Field>
                  <Field label="Masalah">
                    <TextInput
                      name="problem"
                      required
                      defaultValue={detail.problem}
                      maxLength={255}
                      data-testid="input-edit-problem"
                    />
                  </Field>
                  <Field label="Penyebab">
                    <TextInput
                      name="cause"
                      required
                      defaultValue={detail.cause}
                      maxLength={255}
                      data-testid="input-edit-cause"
                    />
                  </Field>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button
                      type="submit"
                      disabled={edit.isPending}
                      data-testid="button-save-breakdown"
                    >
                      {edit.isPending ? "Menyimpan…" : "Simpan perubahan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditOpen(false)}
                    >
                      Batal
                    </Button>
                    {edit.isError && (
                      <span className="text-xs text-rose-700">
                        {errorText(edit.error)}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}
          </Card>

          <Card className="rounded-xl border-[#e5e2d9] shadow-none">
            <CardHeader className="border-b border-[#efede7] px-5 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Log perawatan</CardTitle>
                <span className="font-mono text-xs text-muted-foreground">
                  {detail.maintenance.length} tindakan
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Catatan setiap perbaikan atau pemeriksaan untuk insiden ini
              </p>
            </CardHeader>
            {detail.maintenance.length ? (
              <div className="divide-y divide-[#efede7]">
                {detail.maintenance.map((m, i) => (
                  <div
                    className="relative px-5 py-4"
                    key={m.id}
                    data-testid={`maintenance-${m.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#edf2f3] text-[#244858]">
                        <Wrench className="size-4" />
                        {i < detail.maintenance.length - 1 && (
                          <span className="absolute left-1/2 top-8 h-[calc(100%+8px)] w-px bg-[#e7e4db]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium text-sm">{m.action}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {date(m.created_at)}
                            {open && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() =>
                                  setEditingMaintenance(
                                    editingMaintenance === m.id ? null : m.id
                                  )
                                }
                                data-testid={`button-edit-maintenance-${m.id}`}
                              >
                                Ubah
                              </Button>
                            )}
                          </div>
                        </div>
                        {m.component_replaced && (
                          <p className="mt-1 text-xs">
                            <span className="text-muted-foreground">Komponen:</span>{" "}
                            {m.component_replaced}
                          </p>
                        )}
                        {m.notes && (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {m.notes}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          Dicatat oleh {m.user_name}
                        </p>
                        {editingMaintenance === m.id && (
                          <form
                            className="mt-3 grid gap-2 rounded-lg bg-[#f8f7f2] p-3"
                            onSubmit={(e) => submitMaintenance(e, m.id)}
                          >
                            <Field label="Tindakan">
                              <TextInput
                                name="action"
                                required
                                defaultValue={m.action}
                                maxLength={255}
                                data-testid={`input-maintenance-action-${m.id}`}
                              />
                            </Field>
                            <Field label="Komponen yang diganti">
                              <TextInput
                                name="component_replaced"
                                defaultValue={m.component_replaced || ""}
                                maxLength={150}
                                data-testid={`input-maintenance-component-${m.id}`}
                              />
                            </Field>
                            <Field label="Catatan">
                              <Textarea
                                name="notes"
                                defaultValue={m.notes || ""}
                                className="min-h-20 bg-white"
                                data-testid={`input-maintenance-notes-${m.id}`}
                              />
                            </Field>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={update.isPending}
                                data-testid={`button-save-maintenance-${m.id}`}
                              >
                                Simpan tindakan
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMaintenance(null)}
                              >
                                Batal
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                icon={Wrench}
                title="Belum ada tindakan perawatan"
                message="Tambahkan pemeriksaan atau perbaikan pertama sebelum menyelesaikan insiden."
              />
            )}
            {open && (
              <div className="border-t border-[#efede7] p-5">
                <form className="grid gap-3" onSubmit={(e) => submitMaintenance(e)}>
                  <div className="mb-1 text-xs font-semibold">
                    Catat tindakan perawatan
                  </div>
                  <Field label="Tindakan">
                    <TextInput
                      name="action"
                      required
                      maxLength={255}
                      placeholder="Contoh: Periksa ketegangan sabuk penggerak"
                      data-testid="input-maintenance-action"
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Komponen yang diganti">
                      <TextInput
                        name="component_replaced"
                        maxLength={150}
                        placeholder="Opsional"
                        data-testid="input-maintenance-component"
                      />
                    </Field>
                    <Field label="Catatan">
                      <Textarea
                        name="notes"
                        className="min-h-[40px] bg-white"
                        placeholder="Detail tambahan"
                        data-testid="input-maintenance-notes"
                      />
                    </Field>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={add.isPending}
                      data-testid="button-add-maintenance"
                    >
                      <Plus className="size-3.5" />
                      {add.isPending ? "Mencatat…" : "Tambah tindakan"}
                    </Button>
                    {add.isError && (
                      <span className="text-xs text-rose-700">
                        {errorText(add.error)}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-xl border-[#e5e2d9] shadow-none">
            <CardHeader className="border-b border-[#efede7] px-5 py-4">
              <CardTitle className="text-sm">Status insiden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status saat ini</span>
                <Status value={detail.status} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tindakan perawatan</span>
                <span className="font-mono font-semibold">
                  {detail.maintenance_count}
                </span>
              </div>
              {open ? (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                    <Clock3 className="mr-1.5 inline size-3.5" />
                    Waktu penyelesaian akan dicatat dan durasi henti dihitung oleh server.
                  </div>
                  <Button
                    className="w-full bg-[#244858] hover:bg-[#1b3948]"
                    disabled={!detail.maintenance.length || complete.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Selesaikan kerusakan ini? Durasi henti akan dihitung dari waktu yang tercatat."
                        )
                      )
                        complete.mutate(
                          { id, data: { completed_at: new Date().toISOString() } },
                          { onSuccess: invalidate }
                        );
                    }}
                    data-testid="button-complete-breakdown"
                  >
                    <Check className="size-4" />
                    {complete.isPending ? "Menyelesaikan…" : "Selesaikan insiden"}
                  </Button>
                  {!detail.maintenance.length && (
                    <p className="text-center text-[11px] text-amber-800">
                      Tambahkan minimal satu tindakan perawatan sebelum menyelesaikan.
                    </p>
                  )}
                  {complete.isError && (
                    <p className="text-xs text-rose-700">
                      {errorText(complete.error)}
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
                  <Check className="mr-1.5 inline size-3.5" />
                  Insiden ini telah selesai dan tidak dapat diubah.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl border-[#e5e2d9] shadow-none">
            <CardHeader className="px-5 py-4">
              <CardTitle className="text-sm">Peralatan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              <div>
                <div className="font-mono text-sm font-semibold text-[#244858]">
                  {detail.machine_code}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {detail.machine_name}
                </div>
              </div>
              <div className="flex justify-between border-t border-[#efede7] pt-3 text-xs">
                <span className="text-muted-foreground">Lini produksi</span>
                <span>{detail.line}</span>
              </div>
              <Link
                href="/machines"
                className="inline-flex items-center text-xs font-semibold text-[#28556a] hover:underline"
              >
                Daftar mesin <ArrowRight className="ml-1 size-3" />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

