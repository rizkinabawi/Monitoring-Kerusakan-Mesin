import test from "node:test";
import assert from "node:assert/strict";
import {
  validateLoginInput,
  formatApiResponse,
  ValidationError,
} from "./utils/monitoring-logic.mjs";

test("Modul Autentikasi Pengguna & Format Response API", async (t) => {
  await t.test("UT-AR-01: Validasi data login valid berhasil", () => {
    const input = validateLoginInput("teknisi_budi", "Rahasia123!");
    assert.strictEqual(input.username, "teknisi_budi");
    assert.strictEqual(input.password, "Rahasia123!");
  });

  await t.test("UT-AR-02: Menolak jika username login kosong", () => {
    assert.throws(
      () => validateLoginInput("   ", "password123"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.username);
        return true;
      }
    );
  });

  await t.test("UT-AR-03: Menolak jika password login kosong", () => {
    assert.throws(
      () => validateLoginInput("operator1", ""),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.password);
        return true;
      }
    );
  });

  await t.test("UT-AR-04: Menolak username yang melebihi 50 karakter", () => {
    const longUsername = "a".repeat(55);
    assert.throws(
      () => validateLoginInput(longUsername, "password123"),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.username);
        return true;
      }
    );
  });

  await t.test("UT-AR-05: Standard response format API memiliki format dan metadata yang seragam", () => {
    const payload = { machineId: 1, status: "active" };
    const res = formatApiResponse(payload, "Mesin berhasil diupdate");

    assert.strictEqual(res.success, true);
    assert.deepStrictEqual(res.data, payload);
    assert.strictEqual(res.message, "Mesin berhasil diupdate");
    assert.ok(typeof res.timestamp === "string");
  });
});

