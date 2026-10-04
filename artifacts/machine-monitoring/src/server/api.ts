import "server-only";

import {
  AddMaintenanceBody,
  CompleteBreakdownBody,
  CreateBreakdownBody,
  CreateMachineBody,
  LoginBody,
  UpdateBreakdownBody,
  UpdateMachineBody,
  UpdateMaintenanceBody,
} from "@workspace/api-zod";
import { compare } from "bcryptjs";
import {
  and,
  count,
  desc,
  eq,
  gte,
  lt,
  sql,
  type SQL,
} from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createSessionToken, clearSessionCookie, setSessionCookie } from "./auth";
import { getDatabase } from "./db";
import { breakdowns, maintenance, machines, users } from "./schema";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}

const success = (data: unknown, message?: string, status = 200) =>
  NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status },
  );

const badInput = (message: string, errors?: Record<string, string>) =>
  new HttpError(400, message, errors);

function validationErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      issue.path.map(String).join(".") || "request",
      issue.message,
    ]),
  );
}

async function body<T>(
  request: NextRequest,
  schema: {
    safeParse: (
      input: unknown,
    ) =>
      | { success: true; data: T }
      | {
          success: false;
          error: { issues: Array<{ path: PropertyKey[]; message: string }> };
        };
  },
): Promise<T> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    throw badInput("Isi permintaan harus berupa JSON yang valid.");
  }
  const result = schema.safeParse(input);
  if (!result.success) {
    throw badInput("Periksa kembali data yang dikirim.", validationErrors(result.error));
  }
  return result.data;
}

function parseId(raw: string | undefined) {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw badInput("ID harus berupa bilangan bulat positif.");
  }
  return id;
}

function parseDateQuery(value: string | null, field: string) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badInput(`Format ${field} harus YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw badInput(`Tanggal ${field} tidak valid.`);
  }
  return date;
}

function queryNumber(value: string | null, field: string) {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw badInput(`${field} harus berupa bilangan bulat positif.`);
  }
  return number;
}

function queryFilters(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const start = parseDateQuery(params.get("start_date"), "start_date");
  const end = parseDateQuery(params.get("end_date"), "end_date");
  if (start && end && end < start) {
    throw badInput("Tanggal akhir tidak boleh sebelum tanggal mulai.");
  }
  return {
    start,
    end,
    line: params.get("line")?.trim() || undefined,
    machineId: queryNumber(params.get("machine_id"), "machine_id"),
    status: params.get("status") || undefined,
  };
}

function dateConditions(
  filters: ReturnType<typeof queryFilters>,
): SQL[] {
  const conditions: SQL[] = [];
  if (filters.start) conditions.push(gte(breakdowns.startedAt, filters.start));
  if (filters.end) {
    const exclusiveEnd = new Date(filters.end.getTime() + 24 * 60 * 60 * 1000);
    conditions.push(lt(breakdowns.startedAt, exclusiveEnd));
  }
  if (filters.line) conditions.push(eq(machines.line, filters.line));
  if (filters.machineId) {
    conditions.push(eq(breakdowns.machineId, filters.machineId));
  }
  return conditions;
}

function machineFilters(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status") || undefined;
  if (status && !["active", "down", "inactive"].includes(status)) {
    throw badInput("Status mesin tidak valid.");
  }
  return {
    line: params.get("line")?.trim() || undefined,
    status: status as "active" | "down" | "inactive" | undefined,
  };
}

async function requireUser(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) throw new HttpError(401, "Tidak terautentikasi.");
  return user;
}

async function authenticate(request: NextRequest) {
  const input = await body(request, LoginBody);
  const database = getDatabase();
  const [record] = await database
    .select()
    .from(users)
    .where(eq(users.username, input.username.trim()))
    .limit(1);

  if (!record || !(await compare(input.password, record.passwordHash))) {
    throw new HttpError(401, "Username atau password salah.");
  }

  const user = {
    id: record.id,
    username: record.username,
    name: record.name,
    role: record.role,
  };
  const token = await createSessionToken(user);
  const response = NextResponse.json({
    success: true,
    token,
    user,
    message: "Login berhasil.",
  });
  setSessionCookie(response, token);
  return response;
}

function machineJson(row: typeof machines.$inferSelect) {
  return {
    id: row.id,
    machine_code: row.machineCode,
    name: row.name,
    line: row.line,
    status: row.status,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

const breakdownSelection = {
  id: breakdowns.id,
  machine_id: machines.id,
  machine_code: machines.machineCode,
  machine_name: machines.name,
  line: machines.line,
  problem: breakdowns.problem,
  cause: breakdowns.cause,
  started_at: breakdowns.startedAt,
  completed_at: breakdowns.completedAt,
  downtime_minutes: breakdowns.downtimeMinutes,
  status: breakdowns.status,
  created_by: breakdowns.createdBy,
  created_at: breakdowns.createdAt,
  updated_at: breakdowns.updatedAt,
  maintenance_count: sql<number>`(
    select count(*)::int from maintenance
    where maintenance.breakdown_id = ${breakdowns.id}
  )`,
};

async function breakdownJson(id: number) {
  const database = getDatabase();
  const [row] = await database
    .select(breakdownSelection)
    .from(breakdowns)
    .innerJoin(machines, eq(breakdowns.machineId, machines.id))
    .where(eq(breakdowns.id, id))
    .limit(1);
  return row;
}

async function listMachines(request: NextRequest) {
  const database = getDatabase();
  const filters = machineFilters(request);
  const conditions: SQL[] = [];
  if (filters.line) conditions.push(eq(machines.line, filters.line));
  if (filters.status) conditions.push(eq(machines.status, filters.status));
  const rows = await database
    .select()
    .from(machines)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(machines.line, machines.machineCode);
  return success(rows.map(machineJson));
}

async function createMachine(request: NextRequest) {
  const input = await body(request, CreateMachineBody);
  const database = getDatabase();
  try {
    const [created] = await database
      .insert(machines)
      .values({
        machineCode: input.machine_code.trim().toUpperCase(),
        name: input.name.trim(),
        line: input.line.trim(),
      })
      .returning();
    return success(machineJson(created), "Mesin berhasil ditambahkan.", 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "Kode mesin sudah digunakan.");
    }
    throw error;
  }
}

async function machineById(id: number) {
  const [machine] = await getDatabase()
    .select()
    .from(machines)
    .where(eq(machines.id, id))
    .limit(1);
  if (!machine) throw new HttpError(404, "Mesin tidak ditemukan.");
  return machine;
}

async function updateMachine(id: number, request: NextRequest) {
  const input = await body(request, UpdateMachineBody);
  const database = getDatabase();
  const existing = await machineById(id);

  if (input.status === "down" && existing.status !== "down") {
    throw new HttpError(422, "Status down hanya dapat ditetapkan saat kerusakan dicatat.");
  }
  if (input.status && input.status !== existing.status) {
    const [open] = await database
      .select({ id: breakdowns.id })
      .from(breakdowns)
      .where(and(eq(breakdowns.machineId, id), eq(breakdowns.status, "open")))
      .limit(1);
    if (open) throw new HttpError(409, "Mesin dengan kerusakan terbuka tidak dapat diubah statusnya.");
  }

  try {
    const [updated] = await database
      .update(machines)
      .set({
        ...(input.machine_code
          ? { machineCode: input.machine_code.trim().toUpperCase() }
          : {}),
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.line ? { line: input.line.trim() } : {}),
        ...(input.status ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(machines.id, id))
      .returning();
    return success(machineJson(updated), "Data mesin berhasil diperbarui.");
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "Kode mesin sudah digunakan.");
    }
    throw error;
  }
}

async function deleteMachine(id: number) {
  const database = getDatabase();
  const machine = await machineById(id);
  if (machine.status === "down") {
    throw new HttpError(409, "Selesaikan kerusakan yang masih terbuka sebelum menonaktifkan mesin.");
  }
  const [history] = await database
    .select({ id: breakdowns.id })
    .from(breakdowns)
    .where(eq(breakdowns.machineId, id))
    .limit(1);
  if (history) {
    await database
      .update(machines)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(machines.id, id));
    return success({ id, status: "inactive" }, "Mesin memiliki riwayat dan dinonaktifkan.");
  }

  await database.delete(machines).where(eq(machines.id, id));
  return success({ id, deleted: true }, "Mesin berhasil dihapus.");
}

function pageOptions(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  if (!Number.isSafeInteger(page) || page < 1) {
    throw badInput("page harus berupa bilangan bulat positif.");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw badInput("limit harus berada di antara 1 dan 100.");
  }
  return { page, limit };
}

async function listBreakdowns(request: NextRequest, paged: boolean) {
  const database = getDatabase();
  const filters = queryFilters(request);
  if (filters.status && !["open", "completed"].includes(filters.status)) {
    throw badInput("Status kerusakan tidak valid.");
  }
  const conditions = dateConditions(filters);
  if (filters.status) {
    conditions.push(eq(breakdowns.status, filters.status as "open" | "completed"));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const options = paged ? pageOptions(request) : { page: 1, limit: 100 };
  const [totalRow] = await database
    .select({ total: count() })
    .from(breakdowns)
    .innerJoin(machines, eq(breakdowns.machineId, machines.id))
    .where(where);
  const total = Number(totalRow?.total ?? 0);
  const rows = await database
    .select(breakdownSelection)
    .from(breakdowns)
    .innerJoin(machines, eq(breakdowns.machineId, machines.id))
    .where(where)
    .orderBy(desc(breakdowns.startedAt), desc(breakdowns.id))
    .limit(options.limit)
    .offset((options.page - 1) * options.limit);
  return NextResponse.json({
    success: true,
    data: rows,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      total_pages: Math.ceil(total / options.limit),
    },
  });
}

async function createBreakdown(request: NextRequest, userId: number) {
  const input = await body(request, CreateBreakdownBody);
  const database = getDatabase();
  if (Number.isNaN(input.started_at.getTime())) {
    throw badInput("Waktu mulai berhenti tidak valid.");
  }

  try {
    const id = await database.transaction(async (tx) => {
      const [machine] = await tx
        .select()
        .from(machines)
        .where(eq(machines.id, input.machine_id))
        .limit(1);
      if (!machine) throw new HttpError(404, "Mesin tidak ditemukan.");
      if (machine.status !== "active") {
        throw new HttpError(409, "Kerusakan hanya dapat dicatat pada mesin berstatus active.");
      }
      const [created] = await tx
        .insert(breakdowns)
        .values({
          machineId: machine.id,
          problem: input.problem.trim(),
          cause: input.cause.trim(),
          startedAt: input.started_at,
          status: "open",
          createdBy: userId,
        })
        .returning({ id: breakdowns.id });
      await tx
        .update(machines)
        .set({ status: "down", updatedAt: new Date() })
        .where(eq(machines.id, machine.id));
      return created.id;
    });
    return success(await breakdownJson(id), "Kerusakan berhasil dicatat.", 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "Mesin sudah memiliki kerusakan terbuka.");
    }
    throw error;
  }
}

async function updateBreakdown(id: number, request: NextRequest) {
  const input = await body(request, UpdateBreakdownBody);
  const database = getDatabase();
  const [existing] = await database
    .select()
    .from(breakdowns)
    .where(eq(breakdowns.id, id))
    .limit(1);
  if (!existing) throw new HttpError(404, "Kerusakan tidak ditemukan.");
  if (existing.status !== "open") {
    throw new HttpError(409, "Kerusakan yang sudah selesai tidak dapat diubah.");
  }

  const newMachineId = input.machine_id ?? existing.machineId;
  if (newMachineId !== existing.machineId) {
    const [nextMachine] = await database
      .select()
      .from(machines)
      .where(eq(machines.id, newMachineId))
      .limit(1);
    if (!nextMachine || nextMachine.status !== "active") {
      throw new HttpError(422, "Pilih mesin yang terdaftar dan berstatus active.");
    }
  }

  try {
    const newId = await database.transaction(async (tx) => {
      await tx
        .update(breakdowns)
        .set({
          machineId: newMachineId,
          ...(input.problem ? { problem: input.problem.trim() } : {}),
          ...(input.cause ? { cause: input.cause.trim() } : {}),
          ...(input.started_at ? { startedAt: input.started_at } : {}),
          updatedAt: new Date(),
        })
        .where(eq(breakdowns.id, id));
      if (newMachineId !== existing.machineId) {
        await tx
          .update(machines)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(machines.id, existing.machineId));
        await tx
          .update(machines)
          .set({ status: "down", updatedAt: new Date() })
          .where(eq(machines.id, newMachineId));
      }
      return id;
    });
    return success(await breakdownJson(newId), "Data kerusakan berhasil diperbarui.");
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "Mesin tujuan sudah memiliki kerusakan terbuka.");
    }
    throw error;
  }
}

async function breakdownDetail(id: number) {
  const database = getDatabase();
  const base = await breakdownJson(id);
  if (!base) throw new HttpError(404, "Kerusakan tidak ditemukan.");
  const actions = await database
    .select({
      id: maintenance.id,
      breakdown_id: maintenance.breakdownId,
      action: maintenance.action,
      component_replaced: maintenance.componentReplaced,
      notes: maintenance.notes,
      user_id: maintenance.userId,
      user_name: users.name,
      created_at: maintenance.createdAt,
      updated_at: maintenance.updatedAt,
    })
    .from(maintenance)
    .innerJoin(users, eq(maintenance.userId, users.id))
    .where(eq(maintenance.breakdownId, id))
    .orderBy(maintenance.createdAt);
  return success({ ...base, maintenance: actions });
}

async function addMaintenance(
  breakdownId: number,
  request: NextRequest,
  userId: number,
) {
  const input = await body(request, AddMaintenanceBody);
  const database = getDatabase();
  const [incident] = await database
    .select()
    .from(breakdowns)
    .where(eq(breakdowns.id, breakdownId))
    .limit(1);
  if (!incident) throw new HttpError(404, "Kerusakan tidak ditemukan.");
  if (incident.status !== "open") {
    throw new HttpError(409, "Tindakan hanya dapat ditambahkan pada kerusakan yang masih terbuka.");
  }

  const [created] = await database
    .insert(maintenance)
    .values({
      breakdownId,
      action: input.action.trim(),
      componentReplaced: input.component_replaced?.trim() || null,
      notes: input.notes?.trim() || null,
      userId,
    })
    .returning();
  const [user] = await database
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return success(
    {
      id: created.id,
      breakdown_id: created.breakdownId,
      action: created.action,
      component_replaced: created.componentReplaced,
      notes: created.notes,
      user_id: created.userId,
      user_name: user?.name ?? "Petugas",
      created_at: created.createdAt,
      updated_at: created.updatedAt,
    },
    "Maintenance berhasil dicatat.",
    201,
  );
}

async function updateMaintenance(id: number, request: NextRequest) {
  const input = await body(request, UpdateMaintenanceBody);
  const database = getDatabase();
  const [existing] = await database
    .select({ record: maintenance, status: breakdowns.status })
    .from(maintenance)
    .innerJoin(breakdowns, eq(maintenance.breakdownId, breakdowns.id))
    .where(eq(maintenance.id, id))
    .limit(1);
  if (!existing) throw new HttpError(404, "Catatan maintenance tidak ditemukan.");
  if (existing.status !== "open") {
    throw new HttpError(409, "Catatan maintenance pada kerusakan selesai tidak dapat diubah.");
  }
  const [updated] = await database
    .update(maintenance)
    .set({
      action: input.action.trim(),
      componentReplaced: input.component_replaced?.trim() || null,
      notes: input.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(maintenance.id, id))
    .returning();
  const [user] = await database
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, updated.userId))
    .limit(1);
  return success({
    id: updated.id,
    breakdown_id: updated.breakdownId,
    action: updated.action,
    component_replaced: updated.componentReplaced,
    notes: updated.notes,
    user_id: updated.userId,
    user_name: user?.name ?? "Petugas",
    created_at: updated.createdAt,
    updated_at: updated.updatedAt,
  }, "Catatan maintenance berhasil diperbarui.");
}

async function completeBreakdown(id: number, request: NextRequest) {
  const input = await body(request, CompleteBreakdownBody);
  const database = getDatabase();
  const [existing] = await database
    .select()
    .from(breakdowns)
    .where(eq(breakdowns.id, id))
    .limit(1);
  if (!existing) throw new HttpError(404, "Kerusakan tidak ditemukan.");
  if (existing.status !== "open") {
    throw new HttpError(409, "Kerusakan sudah selesai.");
  }
  if (input.completed_at <= existing.startedAt) {
    throw new HttpError(422, "Waktu selesai harus setelah waktu mulai berhenti.");
  }
  const [actionCount] = await database
    .select({ count: count() })
    .from(maintenance)
    .where(eq(maintenance.breakdownId, id));
  if (Number(actionCount?.count ?? 0) < 1) {
    throw new HttpError(422, "Catat minimal satu tindakan maintenance sebelum menyelesaikan kerusakan.");
  }

  const downtimeMinutes = Math.round(
    (input.completed_at.getTime() - existing.startedAt.getTime()) / 60_000,
  );
  await database.transaction(async (tx) => {
    await tx
      .update(breakdowns)
      .set({
        status: "completed",
        completedAt: input.completed_at,
        downtimeMinutes,
        updatedAt: new Date(),
      })
      .where(and(eq(breakdowns.id, id), eq(breakdowns.status, "open")));
    await tx
      .update(machines)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(machines.id, existing.machineId));
  });
  return success(await breakdownJson(id), "Kerusakan selesai; downtime dihitung otomatis.");
}

function aggregateFilters(filters: ReturnType<typeof queryFilters>) {
  return dateConditions(filters);
}

async function dashboardAggregates(
  request: NextRequest,
  orderBy: "frequency" | "downtime" = "frequency",
) {
  const database = getDatabase();
  const filters = queryFilters(request);
  const conditions = aggregateFilters(filters);
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await database
    .select({
      machine_id: machines.id,
      machine_code: machines.machineCode,
      machine_name: machines.name,
      line: machines.line,
      total_downtime: sql<number>`coalesce(sum(case when ${breakdowns.status} = 'completed' then ${breakdowns.downtimeMinutes} else 0 end), 0)::int`,
      breakdown_count: count(breakdowns.id),
    })
    .from(breakdowns)
    .innerJoin(machines, eq(breakdowns.machineId, machines.id))
    .where(where)
    .groupBy(machines.id, machines.machineCode, machines.name, machines.line)
    .orderBy(
      orderBy === "downtime"
        ? desc(sql`coalesce(sum(case when ${breakdowns.status} = 'completed' then ${breakdowns.downtimeMinutes} else 0 end), 0)`)
        : desc(count(breakdowns.id)),
      desc(sql`coalesce(sum(${breakdowns.downtimeMinutes}), 0)`),
    );
  return { filters, rows };
}

async function dashboardSummary(request: NextRequest) {
  const database = getDatabase();
  const { filters, rows } = await dashboardAggregates(request);
  const conditions = aggregateFilters(filters);
  const [counts] = await database
    .select({
      total_breakdowns: count(),
      total_downtime: sql<number>`coalesce(sum(case when ${breakdowns.status} = 'completed' then ${breakdowns.downtimeMinutes} else 0 end), 0)::int`,
      open_breakdowns: sql<number>`count(*) filter (where ${breakdowns.status} = 'open')::int`,
    })
    .from(breakdowns)
    .innerJoin(machines, eq(breakdowns.machineId, machines.id))
    .where(conditions.length ? and(...conditions) : undefined);

  let downtimeChangePercent = 0;
  if (filters.start && filters.end) {
    const rangeEnd = new Date(filters.end.getTime() + 24 * 60 * 60 * 1000);
    const duration = rangeEnd.getTime() - filters.start.getTime();
    const previousStart = new Date(filters.start.getTime() - duration);
    const previousConditions: SQL[] = [
      gte(breakdowns.startedAt, previousStart),
      lt(breakdowns.startedAt, filters.start),
      eq(breakdowns.status, "completed"),
    ];
    if (filters.line) previousConditions.push(eq(machines.line, filters.line));
    if (filters.machineId) {
      previousConditions.push(eq(machines.id, filters.machineId));
    }
    const [previous] = await database
      .select({
        total: sql<number>`coalesce(sum(${breakdowns.downtimeMinutes}), 0)::int`,
      })
      .from(breakdowns)
      .innerJoin(machines, eq(breakdowns.machineId, machines.id))
      .where(and(...previousConditions));
    const previousDowntime = Number(previous?.total ?? 0);
    const currentDowntime = Number(counts?.total_downtime ?? 0);
    downtimeChangePercent =
      previousDowntime === 0
        ? currentDowntime > 0
          ? 100
          : 0
        : Math.round(
            ((currentDowntime - previousDowntime) / previousDowntime) * 100,
          );
  }

  const machineConditions: SQL[] = [];
  if (filters.line) machineConditions.push(eq(machines.line, filters.line));
  if (filters.machineId) machineConditions.push(eq(machines.id, filters.machineId));
  const [machineCounts] = await database
    .select({
      active_machines: sql<number>`count(*) filter (where ${machines.status} = 'active')::int`,
      machines_down: sql<number>`count(*) filter (where ${machines.status} = 'down')::int`,
    })
    .from(machines)
    .where(machineConditions.length ? and(...machineConditions) : undefined);

  return success({
    total_breakdowns: Number(counts?.total_breakdowns ?? 0),
    total_downtime: Number(counts?.total_downtime ?? 0),
    open_breakdowns: Number(counts?.open_breakdowns ?? 0),
    active_machines: Number(machineCounts?.active_machines ?? 0),
    machines_down: Number(machineCounts?.machines_down ?? 0),
    machine_most_broken: rows[0]?.machine_code ?? null,
    downtime_change_percent: downtimeChangePercent,
  });
}

async function dashboardSeries(
  request: NextRequest,
  orderBy: "frequency" | "downtime",
) {
  const { rows } = await dashboardAggregates(request, orderBy);
  return success(
    rows.map((row) => ({
      machine_id: row.machine_id,
      machine_code: row.machine_code,
      machine_name: row.machine_name,
      line: row.line,
      total_downtime: Number(row.total_downtime ?? 0),
      breakdown_count: Number(row.breakdown_count ?? 0),
    })),
  );
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function apiPath(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const marker = pathname.indexOf("/api");
  return marker < 0 ? "/" : pathname.slice(marker + 4).replace(/\/+$/, "") || "/";
}

export async function handleApiRequest(request: NextRequest) {
  try {
    const path = apiPath(request);
    const method = request.method.toUpperCase();
    const segments = path.split("/").filter(Boolean);

    if (method === "GET" && path === "/healthz") {
      return NextResponse.json({ status: "ok" });
    }
    if (method === "POST" && path === "/auth/login") {
      return await authenticate(request);
    }
    if (method === "POST" && path === "/auth/logout") {
      const response = success({}, "Logout berhasil.");
      clearSessionCookie(response);
      return response;
    }

    const user = await requireUser(request);
    if (method === "GET" && path === "/auth/me") {
      return success(user);
    }

    if (segments[0] === "machines") {
      if (segments.length === 1 && method === "GET") return await listMachines(request);
      if (segments.length === 1 && method === "POST") return await createMachine(request);
      const id = parseId(segments[1]);
      if (segments.length === 2 && method === "GET") {
        return success(machineJson(await machineById(id)));
      }
      if (segments.length === 2 && method === "PUT") {
        return await updateMachine(id, request);
      }
      if (segments.length === 2 && method === "DELETE") return await deleteMachine(id);
    }

    if (segments[0] === "breakdowns") {
      if (segments.length === 1 && method === "GET") {
        return await listBreakdowns(request, true);
      }
      if (segments.length === 1 && method === "POST") {
        return await createBreakdown(request, user.id);
      }
      const id = parseId(segments[1]);
      if (segments.length === 2 && method === "GET") return await breakdownDetail(id);
      if (segments.length === 2 && method === "PUT") {
        return await updateBreakdown(id, request);
      }
      if (segments.length === 3 && segments[2] === "maintenance" && method === "POST") {
        return await addMaintenance(id, request, user.id);
      }
      if (segments.length === 3 && segments[2] === "complete" && method === "POST") {
        return await completeBreakdown(id, request);
      }
    }

    if (segments[0] === "maintenance" && segments.length === 2 && method === "PUT") {
      return await updateMaintenance(parseId(segments[1]), request);
    }

    if (method === "GET" && path === "/history") {
      return await listBreakdowns(request, true);
    }
    if (method === "GET" && path === "/dashboard/summary") {
      return await dashboardSummary(request);
    }
    if (
      method === "GET" &&
      (path === "/dashboard/downtime" || path === "/dashboard/frequency")
    ) {
      return await dashboardSeries(
        request,
        path === "/dashboard/downtime" ? "downtime" : "frequency",
      );
    }

    throw new HttpError(404, "Endpoint tidak ditemukan.");
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          ...(error.errors ? { errors: error.errors } : {}),
        },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error && error.message.includes("DATABASE_URL")
        ? error.message
        : error instanceof Error && error.message.includes("SESSION_SECRET")
          ? error.message
          : "Terjadi kesalahan pada server.";
    return NextResponse.json(
      { success: false, message },
      { status: message === "Terjadi kesalahan pada server." ? 500 : 503 },
    );
  }
}