import test from "node:test";
import assert from "node:assert/strict";
import {
  validateLoginInput,
  formatApiResponse,
  ValidationError,
} from "./utils/monitoring-logic.mjs";
import { logTest } from "./utils/logger.mjs";

test("Modul Autentikasi Pengguna & Format Response API", async (t) => {
  await t.test("UT-AR-01: Validasi data login valid berhasil", () => {
    const input = validateLoginInput("teknisi_budi", "Rahasia123!");
    assert.strictEqual(input.username, "teknisi_budi");
    assert.strictEqual(input.password, "Rahasia123!");

    logTest({
      id: "UT-AR-01",
      scenario: "Validasi data login valid berhasil",
      input: { username: "teknisi_budi", password: "***" },
      expected: "Data login valid diterima tanpa error",
      actual: `Username '${input.username}' terverifikasi valid`,
    });
  });

  await t.test("UT-AR-02: Menolak jika username login kosong", () => {
    let capturedErr = "";
    assert.throws(
      () => validateLoginInput("   ", "password123"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.username);
        capturedErr = err.errors.username;
        return true;
      }
    );

    logTest({
      id: "UT-AR-02",
      scenario: "Menolak jika username login kosong",
      input: { username: "   ", password: "password123" },
      expected: "ValidationError: Username wajib diisi",
      actual: `Error: ${capturedErr}`,
    });
  });

  await t.test("UT-AR-03: Menolak jika password login kosong", () => {
    let capturedErr = "";
    assert.throws(
      () => validateLoginInput("operator1", ""),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.password);
        capturedErr = err.errors.password;
        return true;
      }
    );

    logTest({
      id: "UT-AR-03",
      scenario: "Menolak jika password login kosong",
      input: { username: "operator1", password: "" },
      expected: "ValidationError: Password wajib diisi",
      actual: `Error: ${capturedErr}`,
    });
  });

  await t.test("UT-AR-04: Menolak username yang melebihi 50 karakter", () => {
    const longUsername = "a".repeat(55);
    let capturedErr = "";
    assert.throws(
      () => validateLoginInput(longUsername, "password123"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.username);
        capturedErr = err.errors.username;
        return true;
      }
    );

    logTest({
      id: "UT-AR-04",
      scenario: "Menolak username yang melebihi 50 karakter",
      input: { username: `${longUsername} (55 chars)` },
      expected: "ValidationError: Username maksimal 50 karakter",
      actual: `Error: ${capturedErr}`,
    });
  });

  await t.test("UT-AR-05: Standard response format API memiliki format dan metadata yang seragam", () => {
    const payload = { machineId: 1, status: "active" };
    const res = formatApiResponse(payload, "Mesin berhasil diupdate");

    assert.strictEqual(res.success, true);
    assert.deepStrictEqual(res.data, payload);
    assert.strictEqual(res.message, "Mesin berhasil diupdate");
    assert.ok(typeof res.timestamp === "string");

    logTest({
      id: "UT-AR-05",
      scenario: "Standard response format API memiliki metadata seragam",
      input: { payload, message: "Mesin berhasil diupdate" },
      expected: "{ success: true, data, message, timestamp }",
      actual: `success: ${res.success}, message: "${res.message}", timestamp ISO string`,
    });
  });
});
