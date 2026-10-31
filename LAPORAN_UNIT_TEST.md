# LAPORAN PENGUJIAN UNIT (UNIT TESTING)
**SISTEM MONITORING KERUSAKAN DAN DOWNTIME MESIN**

---

## 1. Pendahuluan
Pengujian unit (*Unit Testing*) ini bertujuan untuk memverifikasi kebenaran fungsional dari modul-modul logika bisnis inti (*core business logic*) pada sistem Monitoring Kerusakan Mesin secara terisolasi tanpa bergantung pada koneksi database eksternal.

- **Framework / Test Runner**: Native Node.js Test Runner (`node:test`) & Assertion Library (`node:assert/strict`)
- **Metode Pengujian**: *Black-Box* & *White-Box Testing* pada level fungsi dan validasi data.
- **Waktu Eksekusi**: ~0.38 detik (Sangat cepat dan konsisten)

---

## 2. Tabel Kasus Uji dan Hasil Pengujian (Test Case Matrix)

| ID Uji | Modul / Komponen | Skenario Uji | Data Masukan (Input) | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|:---:|
| **UT-DT-01** | Kalkulasi Downtime | Menghitung downtime 1 jam tepat | Mulai: 08:00, Selesai: 09:00 | Menghasilkan nilai 60 menit | 60 menit | **PASS** |
| **UT-DT-02** | Kalkulasi Downtime | Menghitung downtime 2 jam 15 menit | Mulai: 08:00, Selesai: 10:15 | Menghasilkan nilai 135 menit | 135 menit | **PASS** |
| **UT-DT-03** | Kalkulasi Downtime | Menolak waktu selesai sama dengan waktu mulai | Mulai: 08:00, Selesai: 08:00 | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-DT-04** | Kalkulasi Downtime | Menolak waktu selesai lebih awal dari mulai | Mulai: 09:00, Selesai: 08:00 | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-DT-05** | Kalkulasi Downtime | Menolak format waktu tidak valid / korup | String tanggal tidak valid | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-DT-06** | Penyelesaian Kerusakan | Menyelesaikan kerusakan dengan 1 tindakan perbaikan | Status: open, Maintenance: 1 | Status berubah jadi 'completed' & mesin 'active' | Sesuai | **PASS** |
| **UT-DT-07** | Penyelesaian Kerusakan | Menolak selesai jika belum ada tindakan maintenance | Status: open, Maintenance: 0 | Ditolak: Wajib ada tindakan maintenance | Melempar ValidationError | **PASS** |
| **UT-DT-08** | Penyelesaian Kerusakan | Menolak penyelesaian ganda (sudah completed) | Status: completed | Ditolak: Kerusakan sudah selesai | Melempar ValidationError | **PASS** |
| **UT-MC-01** | Validasi Mesin | Menerima data mesin baru yang lengkap dan valid | Kode: MC-CNC-001, Line: A | Data tervalidasi dan lolos | Lolos validasi | **PASS** |
| **UT-MC-02** | Validasi Mesin | Menetapkan default status 'active' jika kosong | Data mesin tanpa status | Status otomatis 'active' | Status: active | **PASS** |
| **UT-MC-03** | Validasi Mesin | Menolak kode mesin yang kosong/spasi | machine_code: "" | Validasi gagal pada machine_code | Melempar ValidationError | **PASS** |
| **UT-MC-04** | Validasi Mesin | Menolak kode mesin > 30 karakter | Kode > 30 karakter | Validasi gagal pada machine_code | Melempar ValidationError | **PASS** |
| **UT-MC-05** | Validasi Mesin | Menolak nama mesin yang kosong | name: "" | Validasi gagal pada nama mesin | Melempar ValidationError | **PASS** |
| **UT-MC-06** | Validasi Mesin | Menolak lini produksi yang kosong | line: "" | Validasi gagal pada lini produksi | Melempar ValidationError | **PASS** |
| **UT-MC-07** | Validasi Mesin | Menolak nilai status mesin selain active/down/inactive | status: "broken" | Validasi gagal pada status | Melempar ValidationError | **PASS** |
| **UT-DQ-01** | Filter Tanggal | Menerima rentang tanggal ISO YYYY-MM-DD valid | start: 2026-03-01, end: 2026-03-31 | Berhasil diparsing menjadi Date object | Sesuai | **PASS** |
| **UT-DQ-02** | Filter Tanggal | Menerima filter hanya tanggal mulai | start: 2026-03-01, end: undefined | Start terdefinisi, end undefined | Sesuai | **PASS** |
| **UT-DQ-03** | Filter Tanggal | Menolak rentang jika end_date < start_date | start: 2026-03-20, end: 2026-03-10 | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-DQ-04** | Filter Tanggal | Menolak format tanggal non-ISO (misal DD/MM/YYYY) | format: "01/03/2026" | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-DQ-05** | Filter Tanggal | Menolak tanggal kalender tidak valid (misal 30 Feb) | tanggal: "2026-02-30" | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-MT-01** | Metrik Dashboard | Menghitung akumulasi total downtime & insiden selesai | 3 data (60m, 120m, 30m) | Total: 210 menit, 3 insiden | Total: 210m, 3 insiden | **PASS** |
| **UT-MT-02** | Metrik Dashboard | Menghitung Mean Time To Repair (MTTR) | 2 insiden (100m, 80m) | MTTR: 90.0 menit/insiden | MTTR: 90.0 | **PASS** |
| **UT-MT-03** | Metrik Dashboard | Memisahkan insiden status open dari kalkulasi downtime | 1 completed (50m), 2 open | Total: 50m, 1 selesai, 2 open | Sesuai | **PASS** |
| **UT-MT-04** | Metrik Dashboard | Menangani dataset kosong tanpa division by zero | Data array kosong [] | Total: 0m, Insiden: 0, MTTR: 0 | MTTR: 0 | **PASS** |
| **UT-AR-01** | Autentikasi Pengguna | Menerima kredensial login valid | username: "teknisi_budi", pass: "123" | Kredensial tervalidasi | Sesuai | **PASS** |
| **UT-AR-02** | Autentikasi Pengguna | Menolak login jika username kosong | username: "" | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-AR-03** | Autentikasi Pengguna | Menolak login jika password kosong | password: "" | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-AR-04** | Autentikasi Pengguna | Menolak username > 50 karakter | username 55 karakter | Melempar ValidationError | Melempar ValidationError | **PASS** |
| **UT-AR-05** | Response API | Standarisasi payload response API berhasil | data: {...}, message: "Sukses" | Format seragam (success, data, msg) | Sesuai | **PASS** |

---

## 3. Ringkasan Eksekusi Pengujian

```text
▶ Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)
  ✔ UT-DT-01: Menghitung selisih downtime 1 jam dengan tepat (60 menit)
  ✔ UT-DT-02: Menghitung selisih downtime 2 jam 15 menit (135 menit)
  ✔ UT-DT-03: Menolak jika waktu selesai perbaikan sama dengan waktu mulai
  ✔ UT-DT-04: Menolak jika waktu selesai lebih awal daripada waktu mulai
  ✔ UT-DT-05: Menolak jika string waktu tidak valid / corrupt
  ✔ UT-DT-06: Sukses menyelesaikan kerusakan dengan 1 tindakan perbaikan
  ✔ UT-DT-07: Menolak penyelesaian jika belum ada catatan perbaikan (maintenance)
  ✔ UT-DT-08: Menolak penyelesaian jika status kerusakan sudah completed sebelumnya
✔ Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)

▶ Modul Validasi Data Mesin (Machine Input Validation)
  ✔ UT-MC-01: Validasi berhasil untuk data mesin yang lengkap dan valid
  ✔ UT-MC-02: Default status adalah 'active' jika tidak dicantumkan
  ✔ UT-MC-03: Menolak jika kode mesin kosong atau hanya spasi
  ✔ UT-MC-04: Menolak jika kode mesin melebihi batas 30 karakter
  ✔ UT-MC-05: Menolak jika nama mesin kosong
  ✔ UT-MC-06: Menolak jika lini produksi kosong
  ✔ UT-MC-07: Menolak nilai status mesin yang tidak diizinkan
✔ Modul Validasi Data Mesin (Machine Input Validation)

▶ Modul Filter Tanggal Pencarian Laporan (Date Range Query)
  ✔ UT-DQ-01: Rentang tanggal valid (start_date <= end_date) berhasil diparsing
  ✔ UT-DQ-02: Dapat menerima start_date saja tanpa end_date
  ✔ UT-DQ-03: Menolak jika end_date lebih awal dari start_date
  ✔ UT-DQ-04: Menolak format tanggal non-ISO (misal format DD/MM/YYYY)
  ✔ UT-DQ-05: Menolak nilai tanggal kalender fiktif (misal 30 Februari)
✔ Modul Filter Tanggal Pencarian Laporan (Date Range Query)

▶ Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis)
  ✔ UT-MT-01: Menghitung total downtime dan jumlah insiden yang selesai
  ✔ UT-MT-02: Menghitung nilai Mean Time To Repair (MTTR) dengan benar
  ✔ UT-MT-03: Membedakan insiden open (masih rusak) dan tidak memasukkannya ke total downtime
  ✔ UT-MT-04: Menangani dataset kosong tanpa error pembagian dengan nol (division by zero)
✔ Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis)

▶ Modul Autentikasi Pengguna & Format Response API
  ✔ UT-AR-01: Validasi data login valid berhasil
  ✔ UT-AR-02: Menolak jika username login kosong
  ✔ UT-AR-03: Menolak jika password login kosong
  ✔ UT-AR-04: Menolak username yang melebihi 50 karakter
  ✔ UT-AR-05: Standard response format API memiliki format dan metadata yang seragam
✔ Modul Autentikasi Pengguna & Format Response API

---------------------------------------------------------
Statistik Hasil Pengujian:
- Total Uji: 34
- Berhasil (Pass): 34 (100%)
- Gagal (Fail): 0 (0%)
- Waktu Eksekusi: ~0.38 detik
---------------------------------------------------------
```

---

## 4. Cara Menjalankan Pengujian

Jalankan perintah berikut di terminal pada direktori `Monitoring-Kerusakan-Mesin`:

```bash
pnpm test
```
atau secara langsung menggunakan Node.js:
```bash
node --test-reporter=spec --test
```

