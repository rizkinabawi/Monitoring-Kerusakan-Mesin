/**
 * Modul Logika Bisnis & Utilitas Monitoring Kerusakan Mesin
 * Digunakan untuk Unit Testing sistem monitoring kerusakan dan downtime mesin.
 */

export class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * 1. Menghitung durasi downtime mesin dalam menit
 * Sesuai aturan sistem: completed_at harus setelah started_at
 */
export function calculateDowntimeMinutes(startedAt, completedAt) {
  const start = new Date(startedAt);
  const end = new Date(completedAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError("Format tanggal atau waktu tidak valid.");
  }

  if (end.getTime() <= start.getTime()) {
    throw new ValidationError("Waktu selesai harus setelah waktu mulai berhenti.");
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / 60000);
}

/**
 * 2. Validasi kelayakan penyelesaian status kerusakan (Complete Breakdown)
 * Aturan bisnis:
 * - Status harus 'open'
 * - completed_at > started_at
 * - Harus ada minimal 1 catatan tindakan perbaikan (maintenance action)
 */
export function validateCompleteBreakdown(breakdown, completedAt, maintenanceCount) {
  if (!breakdown) {
    throw new ValidationError("Kerusakan tidak ditemukan.");
  }

  if (breakdown.status !== "open") {
    throw new ValidationError("Kerusakan sudah selesai.");
  }

  const downtime = calculateDowntimeMinutes(breakdown.startedAt, completedAt);

  if (!maintenanceCount || maintenanceCount < 1) {
    throw new ValidationError("Catat minimal satu tindakan maintenance sebelum menyelesaikan kerusakan.");
  }

  return {
    breakdownId: breakdown.id,
    newBreakdownStatus: "completed",
    newMachineStatus: "active",
    downtimeMinutes: downtime,
    completedAt: new Date(completedAt),
  };
}

/**
 * 3. Validasi Data Mesin Baru (Machine Input Validation)
 */
export function validateMachineInput(data) {
  const errors = {};

  if (!data.machine_code || typeof data.machine_code !== "string" || !data.machine_code.trim()) {
    errors.machine_code = "Kode mesin wajib diisi.";
  } else if (data.machine_code.trim().length > 30) {
    errors.machine_code = "Kode mesin maksimal 30 karakter.";
  }

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.name = "Nama mesin wajib diisi.";
  } else if (data.name.trim().length > 100) {
    errors.name = "Nama mesin maksimal 100 karakter.";
  }

  if (!data.line || typeof data.line !== "string" || !data.line.trim()) {
    errors.line = "Lini produksi wajib diisi.";
  } else if (data.line.trim().length > 50) {
    errors.line = "Lini produksi maksimal 50 karakter.";
  }

  if (data.status && !["active", "down", "inactive"].includes(data.status)) {
    errors.status = "Status mesin harus salah satu dari: active, down, inactive.";
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Periksa kembali data mesin yang dikirim.", errors);
  }

  return {
    machine_code: data.machine_code.trim(),
    name: data.name.trim(),
    line: data.line.trim(),
    status: data.status || "active",
  };
}

/**
 * 4. Validasi Filter Tanggal Pencarian Laporan / Histori (Date Range Query)
 */
export function validateDateRange(startDateStr, endDateStr) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  let start = undefined;
  let end = undefined;

  if (startDateStr) {
    if (!dateRegex.test(startDateStr)) {
      throw new ValidationError("Format start_date harus YYYY-MM-DD.");
    }
    start = new Date(`${startDateStr}T00:00:00.000Z`);
    if (isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== startDateStr) {
      throw new ValidationError("Tanggal start_date tidak valid.");
    }
  }

  if (endDateStr) {
    if (!dateRegex.test(endDateStr)) {
      throw new ValidationError("Format end_date harus YYYY-MM-DD.");
    }
    end = new Date(`${endDateStr}T00:00:00.000Z`);
    if (isNaN(end.getTime()) || end.toISOString().slice(0, 10) !== endDateStr) {
      throw new ValidationError("Tanggal end_date tidak valid.");
    }
  }

  if (start && end && end < start) {
    throw new ValidationError("Tanggal akhir tidak boleh sebelum tanggal mulai.");
  }

  return { start, end };
}

/**
 * 5. Kalkulasi Metrik Kinerja & Dashboard (MTTR, Total Downtime, Frekuensi)
 */
export function calculateDashboardMetrics(records = []) {
  const completed = records.filter((r) => r.status === "completed" && typeof r.downtime_minutes === "number");
  const totalDowntime = completed.reduce((acc, curr) => acc + curr.downtime_minutes, 0);
  const totalIncidents = completed.length;
  
  // MTTR (Mean Time To Repair): Rata-rata waktu perbaikan dalam menit
  const mttr = totalIncidents > 0 ? Math.round((totalDowntime / totalIncidents) * 10) / 10 : 0;

  const openIncidents = records.filter((r) => r.status === "open").length;

  return {
    totalDowntimeMinutes: totalDowntime,
    totalIncidents,
    openIncidents,
    mttrMinutes: mttr,
  };
}

/**
 * 6. Validasi Kredensial Login Pengguna
 */
export function validateLoginInput(username, password) {
  const errors = {};

  if (!username || typeof username !== "string" || !username.trim()) {
    errors.username = "Username wajib diisi.";
  } else if (username.length > 50) {
    errors.username = "Username maksimal 50 karakter.";
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    errors.password = "Password wajib diisi.";
  } else if (password.length > 200) {
    errors.password = "Password maksimal 200 karakter.";
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Validasi login gagal.", errors);
  }

  return {
    username: username.trim(),
    password: password.trim(),
  };
}

/**
 * 7. Pembentukan Standard Response API
 */
export function formatApiResponse(data, message = "Sukses", success = true) {
  return {
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

