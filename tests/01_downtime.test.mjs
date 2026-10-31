import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDowntimeMinutes,
  validateCompleteBreakdown,
  ValidationError,
} from "./utils/monitoring-logic.mjs";
import { logTest } from "./utils/logger.mjs";

test("Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)", async (t) => {
  await t.test("UT-DT-01: Menghitung selisih downtime 1 jam dengan tepat (60 menit)", () => {
    const startedAt = "2026-03-15T08:00:00.000Z";
    const completedAt = "2026-03-15T09:00:00.000Z";

    const minutes = calculateDowntimeMinutes(startedAt, completedAt);
    assert.strictEqual(minutes, 60);

    logTest({
      id: "UT-DT-01",
      scenario: "Menghitung selisih downtime 1 jam tepat",
      input: { startedAt, completedAt },
      expected: "60 menit",
      actual: `${minutes} menit`,
    });
  });

  await t.test("UT-DT-02: Menghitung selisih downtime 2 jam 15 menit (135 menit)", () => {
    const startedAt = "2026-03-15T08:00:00.000Z";
    const completedAt = "2026-03-15T10:15:00.000Z";

    const minutes = calculateDowntimeMinutes(startedAt, completedAt);
    assert.strictEqual(minutes, 135);

    logTest({
      id: "UT-DT-02",
      scenario: "Menghitung selisih downtime 2 jam 15 menit",
      input: { startedAt, completedAt },
      expected: "135 menit",
      actual: `${minutes} menit`,
    });
  });

  await t.test("UT-DT-03: Menolak jika waktu selesai perbaikan sama dengan waktu mulai", () => {
    const startedAt = "2026-03-15T08:00:00.000Z";
    const completedAt = "2026-03-15T08:00:00.000Z";

    let capturedError = "";
    assert.throws(
      () => calculateDowntimeMinutes(startedAt, completedAt),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Waktu selesai harus setelah waktu mulai/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DT-03",
      scenario: "Menolak waktu selesai sama dengan waktu mulai",
      input: { startedAt, completedAt },
      expected: "ValidationError: Waktu selesai harus setelah waktu mulai berhenti.",
      actual: `Ditolak: "${capturedError}"`,
    });
  });

  await t.test("UT-DT-04: Menolak jika waktu selesai lebih awal daripada waktu mulai", () => {
    const startedAt = "2026-03-15T09:00:00.000Z";
    const completedAt = "2026-03-15T08:00:00.000Z";

    let capturedError = "";
    assert.throws(
      () => calculateDowntimeMinutes(startedAt, completedAt),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Waktu selesai harus setelah waktu mulai/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DT-04",
      scenario: "Menolak waktu selesai sebelum waktu mulai",
      input: { startedAt, completedAt },
      expected: "ValidationError: Waktu selesai harus setelah waktu mulai berhenti.",
      actual: `Ditolak: "${capturedError}"`,
    });
  });

  await t.test("UT-DT-05: Menolak jika string waktu tidak valid / corrupt", () => {
    const startedAt = "invalid-date";
    const completedAt = "2026-03-15T09:00:00.000Z";

    let capturedError = "";
    assert.throws(
      () => calculateDowntimeMinutes(startedAt, completedAt),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Format tanggal atau waktu tidak valid/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DT-05",
      scenario: "Menolak format tanggal/waktu corrupt",
      input: { startedAt, completedAt },
      expected: "ValidationError: Format tanggal atau waktu tidak valid.",
      actual: `Ditolak: "${capturedError}"`,
    });
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

    logTest({
      id: "UT-DT-06",
      scenario: "Sukses menyelesaikan kerusakan dengan 1 tindakan perawatan",
      input: { breakdownId: 101, status: "open", maintenanceCount: 1, completedAt },
      expected: "Breakdown status 'completed', Machine status 'active', Downtime 90 mnt",
      actual: `Status: ${result.newBreakdownStatus}, Mesin: ${result.newMachineStatus}, Downtime: ${result.downtimeMinutes} mnt`,
    });
  });

  await t.test("UT-DT-07: Menolak penyelesaian jika belum ada catatan perbaikan (maintenance)", () => {
    const mockBreakdown = {
      id: 102,
      machineId: 5,
      status: "open",
      startedAt: "2026-03-15T08:00:00.000Z",
    };
    const completedAt = "2026-03-15T09:30:00.000Z";
    const maintenanceCount = 0;

    let capturedError = "";
    assert.throws(
      () => validateCompleteBreakdown(mockBreakdown, completedAt, maintenanceCount),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Catat minimal satu tindakan maintenance/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DT-07",
      scenario: "Menolak penyelesaian jika belum ada catatan perbaikan",
      input: { breakdownId: 102, status: "open", maintenanceCount: 0 },
      expected: "ValidationError: Catat minimal satu tindakan maintenance...",
      actual: `Ditolak: "${capturedError}"`,
    });
  });

  await t.test("UT-DT-08: Menolak penyelesaian jika status kerusakan sudah completed sebelumnya", () => {
    const mockBreakdown = {
      id: 103,
      machineId: 5,
      status: "completed",
      startedAt: "2026-03-15T08:00:00.000Z",
    };
    const completedAt = "2026-03-15T09:30:00.000Z";

    let capturedError = "";
    assert.throws(
      () => validateCompleteBreakdown(mockBreakdown, completedAt, 2),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Kerusakan sudah selesai/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DT-08",
      scenario: "Menolak penyelesaian ganda (status sudah completed)",
      input: { breakdownId: 103, status: "completed" },
      expected: "ValidationError: Kerusakan sudah selesai.",
      actual: `Ditolak: "${capturedError}"`,
    });
  });
});
