import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDashboardMetrics,
} from "./utils/monitoring-logic.mjs";

test("Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis)", async (t) => {
  await t.test("UT-MT-01: Menghitung total downtime dan jumlah insiden yang selesai", () => {
    const sampleData = [
      { id: 1, status: "completed", downtime_minutes: 60 },
      { id: 2, status: "completed", downtime_minutes: 120 },
      { id: 3, status: "completed", downtime_minutes: 30 },
    ];

    const metrics = calculateDashboardMetrics(sampleData);

    assert.strictEqual(metrics.totalDowntimeMinutes, 210);
    assert.strictEqual(metrics.totalIncidents, 3);
    assert.strictEqual(metrics.openIncidents, 0);
  });

  await t.test("UT-MT-02: Menghitung nilai Mean Time To Repair (MTTR) dengan benar", () => {
    // Total downtime = 180 menit, Total insiden = 2 -> MTTR = 90 menit/insiden
    const sampleData = [
      { id: 1, status: "completed", downtime_minutes: 100 },
      { id: 2, status: "completed", downtime_minutes: 80 },
    ];

    const metrics = calculateDashboardMetrics(sampleData);

    assert.strictEqual(metrics.mttrMinutes, 90);
  });

  await t.test("UT-MT-03: Membedakan insiden open (masih rusak) dan tidak memasukkannya ke total downtime", () => {
    const sampleData = [
      { id: 1, status: "completed", downtime_minutes: 50 },
      { id: 2, status: "open", downtime_minutes: null }, // Masih open
      { id: 3, status: "open", downtime_minutes: null }, // Masih open
    ];

    const metrics = calculateDashboardMetrics(sampleData);

    assert.strictEqual(metrics.totalDowntimeMinutes, 50);
    assert.strictEqual(metrics.totalIncidents, 1);
    assert.strictEqual(metrics.openIncidents, 2);
    assert.strictEqual(metrics.mttrMinutes, 50);
  });

  await t.test("UT-MT-04: Menangani dataset kosong tanpa error pembagian dengan nol (division by zero)", () => {
    const emptyData = [];

    const metrics = calculateDashboardMetrics(emptyData);

    assert.strictEqual(metrics.totalDowntimeMinutes, 0);
    assert.strictEqual(metrics.totalIncidents, 0);
    assert.strictEqual(metrics.openIncidents, 0);
    assert.strictEqual(metrics.mttrMinutes, 0);
  });
});

