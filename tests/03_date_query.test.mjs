import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDateRange,
  ValidationError,
} from "./utils/monitoring-logic.mjs";
import { logTest } from "./utils/logger.mjs";

test("Modul Filter Tanggal Pencarian Laporan (Date Range Query)", async (t) => {
  await t.test("UT-DQ-01: Rentang tanggal valid (start_date <= end_date) berhasil diparsing", () => {
    const { start, end } = validateDateRange("2026-03-01", "2026-03-31");
    assert.ok(start instanceof Date);
    assert.ok(end instanceof Date);
    assert.ok(start.getTime() <= end.getTime());

    logTest({
      id: "UT-DQ-01",
      scenario: "Parsing rentang tanggal valid (start_date <= end_date)",
      input: { start_date: "2026-03-01", end_date: "2026-03-31" },
      expected: "Berhasil diparsing menjadi objek Date yang valid",
      actual: `Lolos (Start: ${start.toISOString().slice(0,10)}, End: ${end.toISOString().slice(0,10)})`,
    });
  });

  await t.test("UT-DQ-02: Dapat menerima start_date saja tanpa end_date", () => {
    const { start, end } = validateDateRange("2026-03-01", undefined);
    assert.ok(start instanceof Date);
    assert.strictEqual(end, undefined);

    logTest({
      id: "UT-DQ-02",
      scenario: "Filter tanggal mulai tunggal (tanpa end_date)",
      input: { start_date: "2026-03-01", end_date: undefined },
      expected: "start Date terdefinisi, end bernilai undefined",
      actual: `Lolos (Start: ${start.toISOString().slice(0,10)}, End: undefined)`,
    });
  });

  await t.test("UT-DQ-03: Menolak jika end_date lebih awal dari start_date", () => {
    let capturedError = "";
    assert.throws(
      () => validateDateRange("2026-03-20", "2026-03-10"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Tanggal akhir tidak boleh sebelum tanggal mulai/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DQ-03",
      scenario: "Menolak rentang tanggal terbalik (end_date < start_date)",
      input: { start_date: "2026-03-20", end_date: "2026-03-10" },
      expected: "ValidationError: Tanggal akhir tidak boleh sebelum tanggal mulai.",
      actual: `Ditolak: "${capturedError}"`,
    });
  });

  await t.test("UT-DQ-04: Menolak format tanggal non-ISO (misal format DD/MM/YYYY)", () => {
    let capturedError = "";
    assert.throws(
      () => validateDateRange("01/03/2026", "31/03/2026"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Format start_date harus YYYY-MM-DD/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DQ-04",
      scenario: "Menolak format tanggal non-ISO (DD/MM/YYYY)",
      input: { start_date: "01/03/2026", end_date: "31/03/2026" },
      expected: "ValidationError: Format start_date harus YYYY-MM-DD.",
      actual: `Ditolak: "${capturedError}"`,
    });
  });

  await t.test("UT-DQ-05: Menolak nilai tanggal kalender fiktif (misal 30 Februari)", () => {
    let capturedError = "";
    assert.throws(
      () => validateDateRange("2026-02-30", "2026-03-05"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Tanggal start_date tidak valid/);
        capturedError = err.message;
        return true;
      }
    );

    logTest({
      id: "UT-DQ-05",
      scenario: "Menolak tanggal kalender fiktif (30 Februari)",
      input: { start_date: "2026-02-30" },
      expected: "ValidationError: Tanggal start_date tidak valid.",
      actual: `Ditolak: "${capturedError}"`,
    });
  });
});
