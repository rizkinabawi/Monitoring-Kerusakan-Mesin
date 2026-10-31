# LAPORAN PENGUJIAN UNIT (UNIT TESTING) & REKONSILIASI TEST RUNNER
**SISTEM MONITORING KERUSAKAN DAN DOWNTIME MESIN**

---

## FORM D – PEMETAAN 29 KASUS UT TERHADAP 34 TES TEST RUNNER

Berdasarkan laporan Capstone, **Tabel 8** memuat **29 kasus uji ber-ID UT** dan seluruhnya tercatat **PASS**. Keluaran test runner Node.js pada **Gambar 30** melaporkan **34 tes lulus**. 

**Lampiran 4 Tabel L4.2** menjelaskan bahwa lima berkas uji masing-masing memiliki satu tes induk yang membungkus sub-tes ber-ID UT. Dengan demikian, secara struktur jumlahnya adalah:
$$\mathbf{29\text{ sub-tes UT}} + \mathbf{5\text{ tes induk}} = \mathbf{34\text{ tes pada test runner}}$$

Pemetaan berikut merupakan rekonsiliasi definitif berdasarkan kelompok, berkas, dan pencocokan satu per satu ID UT pada kode sumber pengujian.

---

### Tabel Pemetaan Berkas & Kasus Uji (Tabel L4.2)

| No. | Berkas / Modul Uji | Cakupan Pengujian | Rentang Kasus UT | Jumlah Kasus UT | Tes Induk | Total Tes Runner |
|:---:|---|---|:---:|:---:|:---:|:---:|
| **1** | `tests/01_downtime.test.mjs`<br>*(Kalkulasi downtime dan status kerusakan)* | Durasi downtime, validasi waktu, prasyarat tindakan perawatan, dan status penyelesaian insiden | UT-DT-01 s.d. UT-DT-08 | 8 | 1 | **9** |
| **2** | `tests/02_machine_validation.test.mjs`<br>*(Validasi data mesin)* | Validasi kode mesin, nama mesin, lini produksi, dan status operasional | UT-MC-01 s.d. UT-MC-07 | 7 | 1 | **8** |
| **3** | `tests/03_date_query.test.mjs`<br>*(Filter tanggal)* | Format ISO YYYY-MM-DD, urutan rentang start/end, dan penolakan tanggal tidak valid | UT-DQ-01 s.d. UT-DQ-05 | 5 | 1 | **6** |
| **4** | `tests/04_dashboard_metrics.test.mjs`<br>*(Metrik dashboard)* | Akumulasi total downtime, MTTR (Mean Time To Repair), insiden status open, dan penanganan dataset kosong | UT-MT-01 s.d. UT-MT-04 | 4 | 1 | **5** |
| **5** | `tests/05_auth_and_response.test.mjs`<br>*(Autentikasi dan response API)* | Validasi login staf/operator, batasan karakter, dan standarisasi payload response JSON | UT-AR-01 s.d. UT-AR-05 | 5 | 1 | **6** |
| | **TOTAL** | | | **29** | **5** | **34** |

---

### D1. Rekonsiliasi Ringkasan Eksekusi

| Item Keluaran Test Runner | Nilai pada Laporan / Target | Verifikasi Aktual / Bukti Eksekusi | Status |
|---|---|---|:---:|
| **Perintah Eksekusi** | `node --test-reporter=spec --test` | `node --test-reporter=spec --test` | **MATCH** |
| **Jumlah Tes** | 34 | 34 tes (29 sub-tes + 5 suite induk) | **MATCH** |
| **Tes Lulus (Pass)** | 34 | 34 (100%) | **MATCH** |
| **Tes Gagal (Fail)** | 0 | 0 | **MATCH** |
| **Dibatalkan (Cancelled)** | 0 | 0 | **MATCH** |
| **Dilewati (Skipped)** | 0 | 0 | **MATCH** |
| **Durasi Eksekusi** | ~246 – 384 ms | 246.41 ms (Rata-rata ~0.3 detik) | **MATCH** |
| **Lingkungan Eksekusi** | Node.js v22.x, Windows 64-bit | Node.js v22.18.0 (win32-x64), PowerShell | **MATCH** |
| **Versi Commit Kode** | Branch `main` | `4aaec182688290f816cb10200bf6c4d39cbd6ca5` | **MATCH** |

---

### D2. Checklist Bukti yang Disimpan

- [x] **Log terminal lengkap dari satu eksekusi yang sama** tersimpan di berkas [`tests/unit-test-execution.log`](file:///c:/Users/rizki/Documents/TUGAS%20KULIAH/capstone/Monitoring-Kerusakan-Mesin/tests/unit-test-execution.log).
- [x] **Salinan lima berkas uji** yang dieksekusi berada pada direktori [`tests/`](file:///c:/Users/rizki/Documents/TUGAS%20KULIAH/capstone/Monitoring-Kerusakan-Mesin/tests):
  1. `01_downtime.test.mjs`
  2. `02_machine_validation.test.mjs`
  3. `03_date_query.test.mjs`
  4. `04_dashboard_metrics.test.mjs`
  5. `05_auth_and_response.test.mjs`
- [x] **Tabel L4.2** yang memetakan kelompok modul, berkas, rentang ID, jumlah sub-tes UT, dan tes induk.
- [x] **Daftar 29 subtes lengkap** tercetak jelas pada reporter `spec` dan cocok 1:1 dengan kode sumber.
- [x] **Catatan versi commit git** (`4aaec18`) dan stempel waktu eksekusi telah didokumentasikan.

**Kesimpulan Rekonsiliasi:**  
☑ **29 kasus UT berhasil dipetakan dan 34 tes runner terverifikasi secara definitif.**  
☐ Pemetaan kelompok tersedia, tetapi pencocokan satu per satu belum dilakukan.  
☐ Terdapat selisih yang belum dapat dijelaskan.

---

## 2. Rincian 29 Kasus Uji UT (Tabel 8 Laporan Capstone)

### Kelompok 1: Kalkulasi Downtime & Status Kerusakan (`01_downtime.test.mjs`)
*Suite Induk*: `Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)` (1 tes)
- **UT-DT-01**: Menghitung selisih downtime 1 jam dengan tepat (60 menit) $\rightarrow$ **PASS**
- **UT-DT-02**: Menghitung selisih downtime 2 jam 15 menit (135 menit) $\rightarrow$ **PASS**
- **UT-DT-03**: Menolak jika waktu selesai perbaikan sama dengan waktu mulai $\rightarrow$ **PASS**
- **UT-DT-04**: Menolak jika waktu selesai lebih awal daripada waktu mulai $\rightarrow$ **PASS**
- **UT-DT-05**: Menolak jika string waktu tidak valid / corrupt $\rightarrow$ **PASS**
- **UT-DT-06**: Sukses menyelesaikan kerusakan dengan 1 tindakan perbaikan $\rightarrow$ **PASS**
- **UT-DT-07**: Menolak penyelesaian jika belum ada catatan perbaikan (maintenance) $\rightarrow$ **PASS**
- **UT-DT-08**: Menolak penyelesaian jika status kerusakan sudah completed sebelumnya $\rightarrow$ **PASS**
*(Subtotal: 8 Kasus UT + 1 Tes Induk = 9 Tes Runner)*

### Kelompok 2: Validasi Data Mesin (`02_machine_validation.test.mjs`)
*Suite Induk*: `Modul Validasi Data Mesin (Machine Input Validation)` (1 tes)
- **UT-MC-01**: Validasi berhasil untuk data mesin yang lengkap dan valid $\rightarrow$ **PASS**
- **UT-MC-02**: Default status adalah 'active' jika tidak dicantumkan $\rightarrow$ **PASS**
- **UT-MC-03**: Menolak jika kode mesin kosong atau hanya spasi $\rightarrow$ **PASS**
- **UT-MC-04**: Menolak jika kode mesin melebihi batas 30 karakter $\rightarrow$ **PASS**
- **UT-MC-05**: Menolak jika nama mesin kosong $\rightarrow$ **PASS**
- **UT-MC-06**: Menolak jika lini produksi kosong $\rightarrow$ **PASS**
- **UT-MC-07**: Menolak nilai status mesin yang tidak diizinkan $\rightarrow$ **PASS**
*(Subtotal: 7 Kasus UT + 1 Tes Induk = 8 Tes Runner)*

### Kelompok 3: Filter Tanggal Laporan (`03_date_query.test.mjs`)
*Suite Induk*: `Modul Filter Tanggal Pencarian Laporan (Date Range Query)` (1 tes)
- **UT-DQ-01**: Rentang tanggal valid (start_date <= end_date) berhasil diparsing $\rightarrow$ **PASS**
- **UT-DQ-02**: Dapat menerima start_date saja tanpa end_date $\rightarrow$ **PASS**
- **UT-DQ-03**: Menolak jika end_date lebih awal dari start_date $\rightarrow$ **PASS**
- **UT-DQ-04**: Menolak format tanggal non-ISO (misal format DD/MM/YYYY) $\rightarrow$ **PASS**
- **UT-DQ-05**: Menolak nilai tanggal kalender fiktif (misal 30 Februari) $\rightarrow$ **PASS**
*(Subtotal: 5 Kasus UT + 1 Tes Induk = 6 Tes Runner)*

### Kelompok 4: Metrik Kinerja & Dashboard (`04_dashboard_metrics.test.mjs`)
*Suite Induk*: `Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis)` (1 tes)
- **UT-MT-01**: Menghitung total downtime dan jumlah insiden yang selesai $\rightarrow$ **PASS**
- **UT-MT-02**: Menghitung nilai Mean Time To Repair (MTTR) dengan benar $\rightarrow$ **PASS**
- **UT-MT-03**: Membedakan insiden open (masih rusak) dan tidak memasukkannya ke total downtime $\rightarrow$ **PASS**
- **UT-MT-04**: Menangani dataset kosong tanpa error pembagian dengan nol (division by zero) $\rightarrow$ **PASS**
*(Subtotal: 4 Kasus UT + 1 Tes Induk = 5 Tes Runner)*

### Kelompok 5: Autentikasi Pengguna & Response API (`05_auth_and_response.test.mjs`)
*Suite Induk*: `Modul Autentikasi Pengguna & Format Response API` (1 tes)
- **UT-AR-01**: Validasi data login valid berhasil $\rightarrow$ **PASS**
- **UT-AR-02**: Menolak jika username login kosong $\rightarrow$ **PASS**
- **UT-AR-03**: Menolak jika password login kosong $\rightarrow$ **PASS**
- **UT-AR-04**: Menolak username yang melebihi 50 karakter $\rightarrow$ **PASS**
- **UT-AR-05**: Standard response format API memiliki format dan metadata yang seragam $\rightarrow$ **PASS**
*(Subtotal: 5 Kasus UT + 1 Tes Induk = 6 Tes Runner)*

---

## 3. Log Terminal Eksekusi Lengkap (Verbatim Log untuk Lampiran / Gambar 30)

```text
> node --test-reporter=spec --test

▶ Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)
  ✔ UT-DT-01: Menghitung selisih downtime 1 jam dengan tepat (60 menit) (2.4251ms)
  ✔ UT-DT-02: Menghitung selisih downtime 2 jam 15 menit (135 menit) (0.1495ms)
  ✔ UT-DT-03: Menolak jika waktu selesai perbaikan sama dengan waktu mulai (3.0597ms)
  ✔ UT-DT-04: Menolak jika waktu selesai lebih awal daripada waktu mulai (0.3881ms)
  ✔ UT-DT-05: Menolak jika string waktu tidak valid / corrupt (0.4602ms)
  ✔ UT-DT-06: Sukses menyelesaikan kerusakan dengan 1 tindakan perbaikan (0.3051ms)
  ✔ UT-DT-07: Menolak penyelesaian jika belum ada catatan perbaikan (maintenance) (0.2876ms)
  ✔ UT-DT-08: Menolak penyelesaian jika status kerusakan sudah completed sebelumnya (0.5063ms)
✔ Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown) (10.8288ms)

▶ Modul Validasi Data Mesin (Machine Input Validation)
  ✔ UT-MC-01: Validasi berhasil untuk data mesin yang lengkap dan valid (1.5541ms)
  ✔ UT-MC-02: Default status adalah 'active' jika tidak dicantumkan (0.2403ms)
  ✔ UT-MC-03: Menolak jika kode mesin kosong atau hanya spasi (1.7797ms)
  ✔ UT-MC-04: Menolak jika kode mesin melebihi batas 30 karakter (0.3037ms)
  ✔ UT-MC-05: Menolak jika nama mesin kosong (0.2886ms)
  ✔ UT-MC-06: Menolak jika lini produksi kosong (0.1752ms)
  ✔ UT-MC-07: Menolak nilai status mesin yang tidak diizinkan (0.1749ms)
✔ Modul Validasi Data Mesin (Machine Input Validation) (7.4302ms)

▶ Modul Filter Tanggal Pencarian Laporan (Date Range Query)
  ✔ UT-DQ-01: Rentang tanggal valid (start_date <= end_date) berhasil diparsing (16.0723ms)
  ✔ UT-DQ-02: Dapat menerima start_date saja tanpa end_date (0.3197ms)
  ✔ UT-DQ-03: Menolak jika end_date lebih awal dari start_date (1.4724ms)
  ✔ UT-DQ-04: Menolak format tanggal non-ISO (misal format DD/MM/YYYY) (0.1836ms)
  ✔ UT-DQ-05: Menolak nilai tanggal kalender fiktif (misal 30 Februari) (0.1923ms)
✔ Modul Filter Tanggal Pencarian Laporan (Date Range Query) (20.1734ms)

▶ Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis)
  ✔ UT-MT-01: Menghitung total downtime dan jumlah insiden yang selesai (1.4291ms)
  ✔ UT-MT-02: Menghitung nilai Mean Time To Repair (MTTR) dengan benar (0.2944ms)
  ✔ UT-MT-03: Membedakan insiden open (masih rusak) dan tidak memasukkannya ke total downtime (1.2342ms)
  ✔ UT-MT-04: Menangani dataset kosong tanpa error pembagian dengan nol (division by zero) (0.2761ms)
✔ Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis) (5.4994ms)

▶ Modul Autentikasi Pengguna & Format Response API
  ✔ UT-AR-01: Validasi data login valid berhasil (2.0432ms)
  ✔ UT-AR-02: Menolak jika username login kosong (0.8205ms)
  ✔ UT-AR-03: Menolak jika password login kosong (1.0146ms)
  ✔ UT-AR-04: Menolak username yang melebihi 50 karakter (0.1807ms)
  ✔ UT-AR-05: Standard response format API memiliki format dan metadata yang seragam (3.2142ms)
✔ Modul Autentikasi Pengguna & Format Response API (10.4202ms)

ℹ tests 34
ℹ suites 0
ℹ pass 34
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 246.4142
```
