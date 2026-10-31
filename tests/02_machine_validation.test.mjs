import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMachineInput,
  ValidationError,
} from "./utils/monitoring-logic.mjs";

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
  });

  await t.test("UT-MC-02: Default status adalah 'active' jika tidak dicantumkan", () => {
    const dataWithoutStatus = {
      machine_code: "MC-PRESS-002",
      name: "Hydraulic Press 200T",
      line: "Line Stamping B",
    };

    const result = validateMachineInput(dataWithoutStatus);
    assert.strictEqual(result.status, "active");
  });

  await t.test("UT-MC-03: Menolak jika kode mesin kosong atau hanya spasi", () => {
    const invalidData = {
      machine_code: "   ",
      name: "Lathe Machine",
      line: "Line Machining",
    };

    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.machine_code);
        return true;
      }
    );
  });

  await t.test("UT-MC-04: Menolak jika kode mesin melebihi batas 30 karakter", () => {
    const invalidData = {
      machine_code: "KODE-MESIN-YANG-SANGAT-PANJANG-MELEBIHI-BATAS-30-KARAKTER",
      name: "Lathe Machine",
      line: "Line Machining",
    };

    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.machine_code);
        return true;
      }
    );
  });

  await t.test("UT-MC-05: Menolak jika nama mesin kosong", () => {
    const invalidData = {
      machine_code: "MC-003",
      name: "",
      line: "Line Packaging",
    };

    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.name);
        return true;
      }
    );
  });

  await t.test("UT-MC-06: Menolak jika lini produksi kosong", () => {
    const invalidData = {
      machine_code: "MC-004",
      name: "Conveyor Belt Line 1",
      line: "",
    };

    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.line);
        return true;
      }
    );
  });

  await t.test("UT-MC-07: Menolak nilai status mesin yang tidak diizinkan", () => {
    const invalidData = {
      machine_code: "MC-005",
      name: "Welding Robot",
      line: "Line Robotik",
      status: "broken", // Nilai tidak sah, harus active/down/inactive
    };

    assert.throws(
      () => validateMachineInput(invalidData),
      (err) => {
        assert(err instanceof ValidationError);
        assert.ok(err.errors.status);
        return true;
      }
    );
  });
});

