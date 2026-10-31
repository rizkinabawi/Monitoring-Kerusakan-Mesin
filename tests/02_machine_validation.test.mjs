import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMachineInput,
  ValidationError,
} from "./utils/monitoring-logic.mjs";
import { logTest } from "./utils/logger.mjs";

test("Modul Validasi Data Mesin (Machine Input Validation)", async (t) => {
  await t.test("UT-MC-01: Validasi berhasil untuk data mesin yang lengkap dan valid", () => {
    const validData = {
      machine_code: "MC-CNC-001",
      name: "CNC Milling Machine 5-Axis",
      line: "Line Assembly A",
      status: "active",
    };

    const result = validateMachineInput(validData);
    assert.strictEqual(result.machine_code, "MC-CNC-001");
    assert.strictEqual(result.name, "CNC Milling Machine 5-Axis");
    assert.strictEqual(result.line, "Line Assembly A");
    assert.strictEqual(result.status, "active");

    logTest({
      id: "UT-MC-01",
      scenario: "Validasi data mesin lengkap dan valid",
      input: validData,
      expected: "Data tervalidasi dan lolos verifikasi",
      actual: `Lolos (Code: ${result.machine_code}, Line: ${result.line}, Status: ${result.status})`,
    });
  });

  await t.test("UT-MC-02: Default status adalah 'active' jika tidak dicantumkan", () => {
    const dataWithoutStatus = {
      machine_code: "MC-PRESS-002",
      name: "Hydraulic Press 200T",
      line: "Line Stamping B",
    };

    const result = validateMachineInput(dataWithoutStatus);
    assert.strictEqual(result.status, "active");

    logTest({
      id: "UT-MC-02",
      scenario: "Penetapan status default mesin 'active'",
      input: dataWithoutStatus,
      expected: "status: 'active'",
      actual: `status: '${result.status}' (Default otomatis)`,
    });
  });

  await t.test("UT-MC-03: Menolak jika kode mesin kosong atau hanya spasi", () => {
    const invalidData = {
      machine_code: "   ",
      name: "Lathe Machine",
      line: "Line Machining",
    };

    let errorDetail = "";
    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.machine_code);
        errorDetail = err.errors.machine_code;
        return true;
      }
    );

    logTest({
      id: "UT-MC-03",
      scenario: "Menolak kode mesin kosong atau hanya spasi",
      input: invalidData,
      expected: "ValidationError: Kode mesin wajib diisi.",
      actual: `Ditolak: "${errorDetail}"`,
    });
  });

  await t.test("UT-MC-04: Menolak jika kode mesin melebihi batas 30 karakter", () => {
    const invalidData = {
      machine_code: "KODE-MESIN-YANG-SANGAT-PANJANG-MELEBIHI-BATAS-30-KARAKTER",
      name: "Lathe Machine",
      line: "Line Machining",
    };

    let errorDetail = "";
    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.machine_code);
        errorDetail = err.errors.machine_code;
        return true;
      }
    );

    logTest({
      id: "UT-MC-04",
      scenario: "Menolak kode mesin melebihi batas 30 karakter",
      input: { machine_code_length: invalidData.machine_code.length },
      expected: "ValidationError: Kode mesin maksimal 30 karakter.",
      actual: `Ditolak: "${errorDetail}"`,
    });
  });

  await t.test("UT-MC-05: Menolak jika nama mesin kosong", () => {
    const invalidData = {
      machine_code: "MC-003",
      name: "",
      line: "Line Packaging",
    };

    let errorDetail = "";
    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.name);
        errorDetail = err.errors.name;
        return true;
      }
    );

    logTest({
      id: "UT-MC-05",
      scenario: "Menolak nama mesin yang kosong",
      input: invalidData,
      expected: "ValidationError: Nama mesin wajib diisi.",
      actual: `Ditolak: "${errorDetail}"`,
    });
  });

  await t.test("UT-MC-06: Menolak jika lini produksi kosong", () => {
    const invalidData = {
      machine_code: "MC-004",
      name: "Conveyor Belt Line 1",
      line: "",
    };

    let errorDetail = "";
    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.line);
        errorDetail = err.errors.line;
        return true;
      }
    );

    logTest({
      id: "UT-MC-06",
      scenario: "Menolak lini produksi yang kosong",
      input: invalidData,
      expected: "ValidationError: Lini produksi wajib diisi.",
      actual: `Ditolak: "${errorDetail}"`,
    });
  });

  await t.test("UT-MC-07: Menolak nilai status mesin yang tidak diizinkan", () => {
    const invalidData = {
      machine_code: "MC-005",
      name: "Welding Robot",
      line: "Line Robotik",
      status: "broken",
    };

    let errorDetail = "";
    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.status);
        errorDetail = err.errors.status;
        return true;
      }
    );

    logTest({
      id: "UT-MC-07",
      scenario: "Menolak nilai status selain active/down/inactive",
      input: { status: invalidData.status },
      expected: "ValidationError: Status mesin harus salah satu dari: active, down, inactive.",
      actual: `Ditolak: "${errorDetail}"`,
    });
  });
});
