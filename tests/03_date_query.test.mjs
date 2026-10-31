import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDateRange,
  ValidationError,
} from "./utils/monitoring-logic.mjs";

test("Modul Filter Tanggal Pencarian Laporan (Date Range Query)", async (t) => {
  await t.test("UT-DQ-01: Rentang tanggal valid (start_date <= end_date) berhasil diparsing", () => {
    const { start, end } = validateDateRange("2026-03-01", "2026-03-31");
    assert.ok(start instanceof Date);
    assert.ok(end instanceof Date);
    assert.ok(start.getTime() <= end.getTime());
  });

  await t.test("UT-DQ-02: Dapat menerima start_date saja tanpa end_date", () => {
    const { start, end } = validateDateRange("2026-03-01", undefined);
    assert.ok(start instanceof Date);
    assert.strictEqual(end, undefined);
  });

  await t.test("UT-DQ-03: Menolak jika end_date lebih awal dari start_date", () => {
    assert.throws(
      () => validateDateRange("2026-03-20", "2026-03-10"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Tanggal akhir tidak boleh sebelum tanggal mulai/);
        return true;
      }
    );
  });

  await t.test("UT-DQ-04: Menolak format tanggal non-ISO (misal format DD/MM/YYYY)", () => {
    assert.throws(
      () => validateDateRange("01/03/2026", "31/03/2026"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Format start_date harus YYYY-MM-DD/);
        return true;
      }
    );
  });

  await t.test("UT-DQ-05: Menolak nilai tanggal kalender fiktif (misal 30 Februari)", () => {
    assert.throws(
      () => validateDateRange("2026-02-30", "2026-03-05"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.match(err.message, /Tanggal start_date tidak valid/);
        return true;
      }
    );
  });
});

