import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDowntimeMinutes,
  validateCompleteBreakdown,
  ValidationError,
} from "./utils/monitoring-logic.mjs";

test("Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)", async (t) => {
  await t.test("UT-DT-01: Menghitung selisih downtime 1 jam dengan tepat (60 menit)", () => {
    const startedAt = "2026-03-15T08:00:00.000Z";
    const completedAt = "2026-03-15T09:00:00.000Z";

    const minutes = calculateDowntimeMinutes(startedAt, completedAt);
    assert.strictEqual(minutes, 60);
  });

  await t.test("UT-DT-02: Menghitung selisih downtime 2 jam 15 menit (135 menit)", () => {
    const startedAt = "2026-03-15T08:00:00.000Z";
    const completedAt = "2026-03-15T10:15:00.000Z";

    const minutes = calculateDowntimeMinutes(startedAt, completedAt);
    assert.strictEqual(minutes, 135);
  });

  await t.test("UT-DT-03: Menolak jika waktu selesai perbaikan sama dengan waktu mulai", () => {
    const startedAt = "2026-03-15T08:00:00.000Z";
    const completedAt = "2026-03-15T08:00:00.000Z";

    assert.throws(
      () => calculateDowntimeMinutes(startedAt, completedAt),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Waktu selesai harus setelah waktu mulai/);
        return true;
      }
    );
  });

  await t.test("UT-DT-04: Menolak jika waktu selesai lebih awal daripada waktu mulai", () => {
    const startedAt = "2026-03-15T09:00:00.000Z";
    const completedAt = "2026-03-15T08:00:00.000Z";

    assert.throws(
      () => calculateDowntimeMinutes(startedAt, completedAt),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Waktu selesai harus setelah waktu mulai/);
        return true;
      }
    );
  });

  await t.test("UT-DT-05: Menolak jika string waktu tidak valid / corrupt", () => {
    assert.throws(
      () => calculateDowntimeMinutes("invalid-date", "2026-03-15T09:00:00.000Z"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Format tanggal atau waktu tidak valid/);
        return true;
      }
    );
  });

  await t.test("UT-DT-06: Sukses menyelesaikan kerusakan dengan 1 tindakan perbaikan", () => {
    const mockBreakdown = {
      id: 101,
      machineId: 5,
      status: "open",
      startedAt: "2026-03-15T08:00:00.000Z",
    };
    const completedAt = "2026-03-15T09:30:00.000Z";
    const maintenanceCount = 1;

    const result = validateCompleteBreakdown(mockBreakdown, completedAt, maintenanceCount);

    assert.strictEqual(result.breakdownId, 101);
    assert.strictEqual(result.newBreakdownStatus, "completed");
    assert.strictEqual(result.newMachineStatus, "active");
    assert.strictEqual(result.downtimeMinutes, 90);
  });

  await t.test("UT-DT-07: Menolak penyelesaian jika belum ada catatan perbaikan (maintenance)", () => {
    const mockBreakdown = {
      id: 102,
      machineId: 5,
      status: "open",
      startedAt: "2026-03-15T08:00:00.000Z",
    };
    const completedAt = "2026-03-15T09:30:00.000Z";
    const maintenanceCount = 0; // belum ada maintenance log

    assert.throws(
      () => validateCompleteBreakdown(mockBreakdown, completedAt, maintenanceCount),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Catat minimal satu tindakan maintenance/);
        return true;
      }
    );
  });

  await t.test("UT-DT-08: Menolak penyelesaian jika status kerusakan sudah completed sebelumnya", () => {
    const mockBreakdown = {
      id: 103,
      machineId: 5,
      status: "completed", // sudah selesai
      startedAt: "2026-03-15T08:00:00.000Z",
    };
    const completedAt = "2026-03-15T09:30:00.000Z";

    assert.throws(
      () => validateCompleteBreakdown(mockBreakdown, completedAt, 2),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Kerusakan sudah selesai/);
        return true;
      }
    );
  });
});

