import "dotenv/config";

import { hash } from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { getDatabase, closeDatabase } from "./seed-db";
import { breakdowns, maintenance, machines, users } from "./schema";

const demoMachines = [
  { machineCode: "M001", name: "Mesin Packing", line: "Line A" },
  { machineCode: "M002", name: "Conveyor Utama", line: "Line A" },
  { machineCode: "M003", name: "Mesin Filling", line: "Line B" },
  { machineCode: "M004", name: "Labeler Otomatis", line: "Line B" },
  { machineCode: "M005", name: "Mesin Sealer", line: "Line C" },
  { machineCode: "M006", name: "Palletizer", line: "Line C" },
];

const demoIncidents = [
  { code: "M001", daysAgo: 2, hour: 8, minutes: 10, duration: 50, problem: "Mesin packing berhenti mendadak", cause: "Bearing aus", action: "Ganti bearing dan lakukan alignment", part: "Bearing 6205" },
  { code: "M003", daysAgo: 4, hour: 10, minutes: 25, duration: 35, problem: "Tekanan filling tidak stabil", cause: "Seal pneumatik bocor", action: "Ganti seal dan uji tekanan", part: "Seal kit 20 mm" },
  { code: "M002", daysAgo: 6, hour: 13, minutes: 5, duration: 72, problem: "Conveyor berhenti saat produksi", cause: "Sensor posisi kotor", action: "Bersihkan dan kalibrasi sensor", part: null },
  { code: "M004", daysAgo: 9, hour: 9, minutes: 40, duration: 28, problem: "Label tidak menempel sempurna", cause: "Roller penekan longgar", action: "Setel roller penekan", part: null },
  { code: "M001", daysAgo: 12, hour: 14, minutes: 0, duration: 94, problem: "Suhu motor packing meningkat", cause: "Kipas pendingin rusak", action: "Ganti kipas pendingin motor", part: "Fan motor 24V" },
  { code: "M005", daysAgo: 15, hour: 7, minutes: 20, duration: 43, problem: "Hasil sealing tidak rapat", cause: "Elemen pemanas melemah", action: "Ganti elemen pemanas", part: "Heater strip 300 mm" },
  { code: "M006", daysAgo: 19, hour: 11, minutes: 15, duration: 61, problem: "Palletizer gagal mengambil palet", cause: "Limit switch tidak terbaca", action: "Atur ulang posisi limit switch", part: "Limit switch" },
  { code: "M003", daysAgo: 24, hour: 15, minutes: 30, duration: 38, problem: "Pompa filling mengeluarkan suara kasar", cause: "Kopling pompa longgar", action: "Kencangkan kopling dan uji beban", part: null },
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

      for (const [index, code] of ["M002", "M005"].entries()) {
        const machineId = machineIds.get(code);
        if (!machineId) continue;
        const startedAt = new Date(now - (index + 1) * 90 * 60 * 1000);
        const [created] = await tx
          .insert(breakdowns)
          .values({
            machineId,
            problem:
              index === 0
                ? "Belt conveyor perlu pemeriksaan"
                : "Suhu sealer di luar batas operasi",
            cause:
              index === 0
                ? "Tegangan belt menurun"
                : "Sensor temperatur menunjukkan nilai tidak stabil",
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
            action: "Pemeriksaan awal dan penyetelan tegangan belt",
            componentReplaced: null,
            notes: "Menunggu pemeriksaan lanjutan.",
            userId: user.id,
          });
        }
      }
    });
  }

  console.info(
    `Seed selesai: ${demoMachines.length} mesin, akun ${username}, dan data kerusakan demo.`,
  );
  console.info("Gunakan akun demo ini hanya untuk development; ganti password sebelum produksi.");
}

seed()
  .catch((error) => {
    console.error("Seed gagal.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });