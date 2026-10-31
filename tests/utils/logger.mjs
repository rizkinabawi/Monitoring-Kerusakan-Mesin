/**
 * Helper Logger untuk Pengujian Unit (Unit Testing)
 * Menampilkan detail masukan (input), hasil yang diharapkan (expected),
 * hasil aktual (actual), dan status kelulusan (PASS/FAIL) untuk dokumentasi/laporan.
 */

export function logTest({ id, scenario, input, expected, actual, status = "PASS" }) {
  const inputStr = typeof input === "object" ? JSON.stringify(input) : String(input);
  const icon = status === "PASS" ? "PASS ✓" : "FAIL ✗";

  console.log(`\n  ┌── [${id}] ${scenario}`);
  console.log(`  │   • Input Data     : ${inputStr}`);
  console.log(`  │   • Ekspektasi     : ${expected}`);
  console.log(`  │   • Hasil Aktual   : ${actual}`);
  console.log(`  └── • Status Uji     : [ ${icon} ]`);
}
