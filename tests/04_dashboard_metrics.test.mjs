import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDashboardMetrics,
} from "./utils/monitoring-logic.mjs";
import { logTest } from "./utils/logger.mjs";

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

    logTest({
      id: "UT-MT-01",
      scenario: "Menghitung akumulasi total downtime dan jumlah insiden",
      input: { incidents: [60, 120, 30] },
      expected: "Total Downtime: 210 mnt, Total Insiden: 3",
      actual: `Total: ${metrics.totalDowntimeMinutes} mnt, Insiden: ${metrics.totalIncidents}, Open: ${metrics.openIncidents}`,
    });
  });

  await t.test("UT-MT-02: Menghitung nilai Mean Time To Repair (MTTR) dengan benar", () => {
    const sampleData = [
      { id: 1, status: "completed", downtime_minutes: 100 },
      { id: 2, status: "completed", downtime_minutes: 80 },
    ];

    const metrics = calculateDashboardMetrics(sampleData);

    assert.strictEqual(metrics.mttrMinutes, 90);

    logTest({
      id: "UT-MT-02",
      scenario: "Kalkulasi Mean Time To Repair (MTTR = Total Downtime / Total Insiden)",
      input: { total_downtime: 180, total_incidents: 2 },
      expected: "MTTR: 90.0 menit/insiden",
      actual: `MTTR: ${metrics.mttrMinutes} menit/insiden`,
    });
  });

  await t.test("UT-MT-03: Membedakan insiden open (masih rusak) dan tidak memasukkannya ke total downtime", () => {
    const sampleData = [
      { id: 1, status: "completed", downtime_minutes: 50 },
      { id: 2, status: "open", downtime_minutes: null },
      { id: 3, status: "open", downtime_minutes: null },
    ];

    const metrics = calculateDashboardMetrics(sampleData);

    assert.strictEqual(metrics.totalDowntimeMinutes, 50);
    assert.strictEqual(metrics.totalIncidents, 1);
    assert.strictEqual(metrics.openIncidents, 2);
    assert.strictEqual(metrics.mttrMinutes, 50);

    logTest({
      id: "UT-MT-03",
      scenario: "Memisahkan insiden status open dari kalkulasi downtime",
      input: { completed_count: 1, open_count: 2, completed_downtime: 50 },
      expected: "Downtime: 50 mnt, Completed: 1, Open: 2",
      actual: `Downtime: ${metrics.totalDowntimeMinutes} mnt, Completed: ${metrics.totalIncidents}, Open: ${metrics.openIncidents}`,
    });
  });

  await t.test("UT-MT-04: Menangani dataset kosong tanpa error pembagian dengan nol (division by zero)", () => {
    const emptyData = [];

    const metrics = calculateDashboardMetrics(emptyData);

    assert.strictEqual(metrics.totalDowntimeMinutes, 0);
    assert.strictEqual(metrics.totalIncidents, 0);
    assert.strictEqual(metrics.openIncidents, 0);
    assert.strictEqual(metrics.mttrMinutes, 0);

    logTest({
      id: "UT-MT-04",
      scenario: "Penanganan dataset kosong (zero-division protection)",
      input: "Data kosong []",
      expected: "Downtime: 0, Insiden: 0, MTTR: 0",
      actual: `Downtime: ${metrics.totalDowntimeMinutes}, Insiden: ${metrics.totalIncidents}, MTTR: ${metrics.mttrMinutes}`,
    });
  });
});
