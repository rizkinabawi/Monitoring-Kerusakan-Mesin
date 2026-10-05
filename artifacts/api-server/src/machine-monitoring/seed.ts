import { hash } from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { getDatabase, closeDatabase } from "./db";
import { logger } from "../lib/logger";
import { breakdowns, maintenance, machines, users } from "./schema";

const demoMachines = [
  { machineCode: "M001", name: "Static Zinc Line", line: "Plating Equipment" },
  { machineCode: "M002", name: "Barrel Zinc Line", line: "Plating Equipment" },
  { machineCode: "M003", name: "Electroless Nickel Line", line: "Plating Equipment" },
  { machineCode: "M004", name: "Barrel Nickel Line", line: "Plating Equipment" },
  { machineCode: "M005", name: "Barrel Tin Line", line: "Plating Equipment" },
  { machineCode: "M006", name: "Composite Line", line: "Plating Equipment" },
  { machineCode: "M007", name: "Static Zinc Nickel (High Ni) Line", line: "Plating Equipment" },
  { machineCode: "M008", name: "Chromic Acid / Blackening Line", line: "Plating Equipment" },
  { machineCode: "M009", name: "Static Sn (Tin) Line (New)", line: "Plating Equipment" },
  { machineCode: "I001", name: "Fluorescent X-ray Thickness Gauge", line: "Inspection Equipment" },
  { machineCode: "I002", name: "Atomic Absorption Spectrophotometer", line: "Inspection Equipment" },
  { machineCode: "I003", name: "Salt Spray Test Equipment", line: "Inspection Equipment" },
  { machineCode: "I004", name: "Microscope", line: "Inspection Equipment" },
  { machineCode: "I005", name: "Hardness Tester", line: "Inspection Equipment" },
  { machineCode: "I006", name: "Cross-section Analyzer", line: "Inspection Equipment" },
];

const demoIncidents = [
  { code: "M001", daysAgo: 2, hour: 8, minutes: 10, duration: 50, problem: "Voltage drop during plating", cause: "Rectifier issue", action: "Replaced rectifier module", part: "Rectifier Unit 50A" },
  { code: "M003", daysAgo: 4, hour: 10, minutes: 25, duration: 35, problem: "Temperature fluctuation", cause: "Heater malfunction", action: "Replaced heater element", part: "Heater 1500W" },
  { code: "M002", daysAgo: 6, hour: 13, minutes: 5, duration: 72, problem: "Barrel rotation jammed", cause: "Motor bearing wear", action: "Cleaned and replaced bearing", part: "Bearing 6204" },
  { code: "I001", daysAgo: 9, hour: 9, minutes: 40, duration: 28, problem: "Calibration error", cause: "Software glitch", action: "Restarted and recalibrated", part: null },
  { code: "M001", daysAgo: 12, hour: 14, minutes: 0, duration: 94, problem: "Pump noise increased", cause: "Filter clog", action: "Cleaned and replaced filter", part: "Filter Cartridge 10um" },
  { code: "I003", daysAgo: 15, hour: 7, minutes: 20, duration: 43, problem: "Spray nozzle blocked", cause: "Salt buildup", action: "Cleaned nozzle", part: "Nozzle tip" },
  { code: "M006", daysAgo: 19, hour: 11, minutes: 15, duration: 61, problem: "Hoist movement error", cause: "Limit switch failed", action: "Adjusted limit switch", part: "Limit switch" },
  { code: "M003", daysAgo: 24, hour: 15, minutes: 30, duration: 38, problem: "Chemical leak", cause: "Valve seal worn", action: "Tightened valve and replaced seal", part: "Teflon seal" },
];

async function seed() {
  const database = getDatabase();
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD wajib diatur dengan minimal 12 karakter sebelum menjalankan seed.",
    );
  }
  const [existingUser] = await database
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const [user] = existingUser
    ? [existingUser]
    : await database
        .insert(users)
        .values({
          username,
          passwordHash: await hash(password, 12),
          name: "Petugas Maintenance",
          role: "maintenance",
        })
        .returning();

  const machineIds = new Map<string, number>();
  for (const machine of demoMachines) {
    const [existing] = await database
      .select()
      .from(machines)
      .where(eq(machines.machineCode, machine.machineCode))
      .limit(1);
    const [saved] = existing
      ? [existing]
      : await database.insert(machines).values(machine).returning();
    machineIds.set(machine.machineCode, saved.id);
  }

  const [breakdownCount] = await database
    .select({ value: count() })
    .from(breakdowns);
  if (Number(breakdownCount?.value ?? 0) === 0) {
    const now = Date.now();
    await database.transaction(async (tx) => {
      for (const incident of demoIncidents) {
        const machineId = machineIds.get(incident.code);
        if (!machineId) continue;
        const startedAt = new Date(
          now -
            incident.daysAgo * 24 * 60 * 60 * 1000 +
            (incident.hour - new Date(now).getHours()) * 60 * 60 * 1000 +
            (incident.minutes - new Date(now).getMinutes()) * 60 * 1000,
        );
        const completedAt = new Date(
          startedAt.getTime() + incident.duration * 60 * 1000,
        );
        const [created] = await tx
          .insert(breakdowns)
          .values({
            machineId,
            problem: incident.problem,
            cause: incident.cause,
            startedAt,
            completedAt,
            downtimeMinutes: incident.duration,
            status: "completed",
            createdBy: user.id,
          })
          .returning({ id: breakdowns.id });
        await tx.insert(maintenance).values({
          breakdownId: created.id,
          action: incident.action,
          componentReplaced: incident.part,
          notes: "Uji fungsi setelah perbaikan dinyatakan normal.",
          userId: user.id,
        });
      }

      for (const [index, code] of ["M002", "I005"].entries()) {
        const machineId = machineIds.get(code);
        if (!machineId) continue;
        const startedAt = new Date(now - (index + 1) * 90 * 60 * 1000);
        const [created] = await tx
          .insert(breakdowns)
          .values({
            machineId,
            problem:
              index === 0
                ? "Barrel rotation irregular"
                : "Display screen unresponsive",
            cause:
              index === 0
                ? "Worn drive gear"
                : "Loose connection",
            startedAt,
            status: "open",
            createdBy: user.id,
          })
          .returning({ id: breakdowns.id });
        await tx
          .update(machines)
          .set({ status: "down", updatedAt: new Date() })
          .where(eq(machines.id, machineId));
        if (index === 0) {
          await tx.insert(maintenance).values({
            breakdownId: created.id,
            action: "Initial inspection and gear alignment",
            componentReplaced: null,
            notes: "Waiting for replacement gear.",
            userId: user.id,
          });
        }
      }
    });
  }

  logger.info({ machines: demoMachines.length }, "Development seed selesai.");
}

seed()
  .catch((error) => {
    logger.error({ err: error }, "Seed gagal.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });