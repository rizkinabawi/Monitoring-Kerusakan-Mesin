import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Cog, Plus, Search, Settings2, X } from "lucide-react";
import {
  useListMachines,
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
  getListMachinesQueryKey,
  type Machine,
  type MachineInput,
  type MachineUpdate,
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
  errorText,
  Status,
  PageHeading,
  LoadError,
  LoadingRows,
  Empty,
  Field,
  TextInput,
} from "@/components/shared/common";

export default function MachinePage() {
  const [editing, setEditing] = useState<Machine | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [line, setLine] = useState("");

  const machines = useListMachines(line ? { line } : undefined);
  const client = useQueryClient();
  const create = useCreateMachine();
  const update = useUpdateMachine();
  const remove = useDeleteMachine();

  const invalidate = () =>
    client.invalidateQueries({ queryKey: getListMachinesQueryKey() });

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      machine_code: String(f.get("machine_code")),
      name: String(f.get("name")),
      line: String(f.get("line")),
    };
    const onSuccess = () => {
      setEditing(null);
      setFormOpen(false);
      invalidate();
    };
    if (editing) {
      update.mutate({ id: editing.id, data: payload as MachineUpdate }, { onSuccess });
    } else {
      create.mutate({ data: payload as MachineInput }, { onSuccess });
    }
  };

  const filtered = (machines.data?.success ? machines.data.data : []).filter((m) =>
    `${m.name} ${m.machine_code} ${m.line}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeading
        eyebrow="Daftar aset"
        title="Mesin"
        description="Data peralatan dan status operasional terkini."
      >
        <Button
          className="h-10 rounded-lg bg-[#244858] hover:bg-[#1b3948]"
          onClick={() => {
            setEditing(null);
            setFormOpen(!formOpen);
          }}
          data-testid="button-add-machine"
        >
          <Plus className="size-4" />
          Tambah mesin
        </Button>
      </PageHeading>

      {formOpen && (
        <Card className="mb-5 rounded-xl border-amber-200 bg-[#fffdf8] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">
              {editing ? "Ubah data mesin" : "Daftarkan mesin"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormOpen(false)}
              aria-label="Tutup formulir"
              data-testid="button-close-machine-form"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-3" onSubmit={save}>
              <Field label="Kode mesin">
                <TextInput
                  name="machine_code"
                  required
                  maxLength={30}
                  defaultValue={editing?.machine_code}
                  data-testid="input-machine-code"
                />
              </Field>
              <Field label="Nama mesin">
                <TextInput
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={editing?.name}
                  data-testid="input-machine-name"
                />
              </Field>
              <Field label="Lini produksi">
                <TextInput
                  name="line"
                  required
                  maxLength={50}
                  defaultValue={editing?.line}
                  data-testid="input-machine-line"
                />
              </Field>
              <div className="flex items-center gap-2 sm:col-span-3">
                <Button
                  type="submit"
                  disabled={create.isPending || update.isPending}
                  data-testid="button-save-machine"
                >
                  {create.isPending || update.isPending
                    ? "Menyimpan…"
                    : editing
                    ? "Simpan perubahan"
                    : "Daftarkan mesin"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                >
                  Batal
                </Button>
                {(create.isError || update.isError) && (
                  <span className="text-xs text-rose-700">
                    {errorText(create.error || update.error)}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border-[#e5e2d9] shadow-none">
        <div className="flex flex-col justify-between gap-3 border-b border-[#efede7] p-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold">Direktori peralatan</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {machines.data?.success
                ? `${machines.data.data.length} aset terdaftar`
                : "Daftar mesin"}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari peralatan"
                className="w-full pl-9 sm:w-48"
                data-testid="input-search-machines"
              />
            </div>
            <TextInput
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Filter lini"
              className="w-28"
              data-testid="input-machine-line-filter"
            />
          </div>
        </div>
        {machines.isLoading ? (
          <LoadingRows />
        ) : machines.isError ? (
          <div className="p-4">
            <LoadError
              message={errorText(machines.error)}
              retry={() => machines.refetch()}
            />
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesin</TableHead>
                  <TableHead>Lini</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} data-testid={`row-machine-${m.id}`}>
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-[#244858]">
                        {m.machine_code}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{m.name}</div>
                    </TableCell>
                    <TableCell>{m.line}</TableCell>
                    <TableCell>
                      <Status value={m.status} />
                    </TableCell>
                    <TableCell className="text-xs">{date(m.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(m);
                            setFormOpen(true);
                          }}
                          data-testid={`button-edit-machine-${m.id}`}
                        >
                          <Settings2 className="mr-1 size-3.5" />
                          Ubah
                        </Button>
                        {m.status !== "inactive" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (window.confirm(`Nonaktifkan ${m.machine_code}?`))
                                remove.mutate(
                                  { id: m.id },
                                  { onSuccess: () => invalidate() }
                                );
                            }}
                            data-testid={`button-deactivate-machine-${m.id}`}
                          >
                            <X className="mr-1 size-3.5" />
                            Nonaktifkan
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty
            icon={Cog}
            title="Mesin tidak ditemukan"
            message={
              query || line
                ? "Sesuaikan pencarian atau filter lini."
                : "Daftarkan peralatan untuk mulai memantau kondisi mesin."
            }
          />
        )}
      </Card>
      {remove.isError && (
        <p className="mt-3 text-sm text-rose-700">{errorText(remove.error)}</p>
      )}
    </>
  );
}

