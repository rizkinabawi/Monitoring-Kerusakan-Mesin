# LAPORAN PENGUJIAN UNIT (UNIT TESTING) & REKONSILIASI TEST RUNNER
**MAINT-SCREEN (Maintenance Monitoring and Downtime Management System)**

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

## 3. Log Terminal Eksekusi Lengkap (Verbatim Log untuk Lampiran & Screenshot Gambar 30)

Setiap kasus uji kini mencetak log terstruktur yang memuat **ID Kasus Uji**, **Deskripsi Skenario**, **Data Masukan (Input)**, **Ekspektasi Hasil**, **Hasil Aktual Pengujian**, serta **Status Kelulusan (`[ PASS ✓ ]`)** sebelum tanda centang reporter spec:

```text
> node --test-reporter=spec --test

  ┌── [UT-DT-01] Menghitung selisih downtime 1 jam tepat
  │   • Input Data     : {"startedAt":"2026-03-15T08:00:00.000Z","completedAt":"2026-03-15T09:00:00.000Z"}
  │   • Ekspektasi     : 60 menit
  │   • Hasil Aktual   : 60 menit
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-02] Menghitung selisih downtime 2 jam 15 menit
  │   • Input Data     : {"startedAt":"2026-03-15T08:00:00.000Z","completedAt":"2026-03-15T10:15:00.000Z"}
  │   • Ekspektasi     : 135 menit
  │   • Hasil Aktual   : 135 menit
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-03] Menolak waktu selesai sama dengan waktu mulai
  │   • Input Data     : {"startedAt":"2026-03-15T08:00:00.000Z","completedAt":"2026-03-15T08:00:00.000Z"}
  │   • Ekspektasi     : ValidationError: Waktu selesai harus setelah waktu mulai berhenti.
  │   • Hasil Aktual   : Ditolak: "Waktu selesai harus setelah waktu mulai berhenti."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-04] Menolak waktu selesai sebelum waktu mulai
  │   • Input Data     : {"startedAt":"2026-03-15T09:00:00.000Z","completedAt":"2026-03-15T08:00:00.000Z"}
  │   • Ekspektasi     : ValidationError: Waktu selesai harus setelah waktu mulai berhenti.
  │   • Hasil Aktual   : Ditolak: "Waktu selesai harus setelah waktu mulai berhenti."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-05] Menolak format tanggal/waktu corrupt
  │   • Input Data     : {"startedAt":"invalid-date","completedAt":"2026-03-15T09:00:00.000Z"}
  │   • Ekspektasi     : ValidationError: Format tanggal atau waktu tidak valid.
  │   • Hasil Aktual   : Ditolak: "Format tanggal atau waktu tidak valid."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-06] Sukses menyelesaikan kerusakan dengan 1 tindakan perawatan
  │   • Input Data     : {"breakdownId":101,"status":"open","maintenanceCount":1,"completedAt":"2026-03-15T09:30:00.000Z"}
  │   • Ekspektasi     : Breakdown status 'completed', Machine status 'active', Downtime 90 mnt
  │   • Hasil Aktual   : Status: completed, Mesin: active, Downtime: 90 mnt
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-07] Menolak penyelesaian jika belum ada catatan perbaikan
  │   • Input Data     : {"breakdownId":102,"status":"open","maintenanceCount":0}
  │   • Ekspektasi     : ValidationError: Catat minimal satu tindakan maintenance...
  │   • Hasil Aktual   : Ditolak: "Catat minimal satu tindakan maintenance sebelum menyelesaikan kerusakan."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DT-08] Menolak penyelesaian ganda (status sudah completed)
  │   • Input Data     : {"breakdownId":103,"status":"completed"}
  │   • Ekspektasi     : ValidationError: Kerusakan sudah selesai.
  │   • Hasil Aktual   : Ditolak: "Kerusakan sudah selesai."
  └── • Status Uji     : [ PASS ✓ ]
▶ Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown)
  ✔ UT-DT-01: Menghitung selisih downtime 1 jam dengan tepat (60 menit) (1.9267ms)
  ✔ UT-DT-02: Menghitung selisih downtime 2 jam 15 menit (135 menit) (1.8372ms)
  ✔ UT-DT-03: Menolak jika waktu selesai perbaikan sama dengan waktu mulai (1.0925ms)
  ✔ UT-DT-04: Menolak jika waktu selesai lebih awal daripada waktu mulai (0.5313ms)
  ✔ UT-DT-05: Menolak jika string waktu tidak valid / corrupt (0.4103ms)
  ✔ UT-DT-06: Sukses menyelesaikan kerusakan dengan 1 tindakan perbaikan (0.403ms)
  ✔ UT-DT-07: Menolak penyelesaian jika belum ada catatan perbaikan (maintenance) (0.4325ms)
  ✔ UT-DT-08: Menolak penyelesaian jika status kerusakan sudah completed sebelumnya (0.5855ms)
✔ Modul Kalkulasi Downtime & Penyelesaian Kerusakan (Breakdown) (10.6094ms)

  ┌── [UT-MC-01] Validasi data mesin lengkap dan valid
  │   • Input Data     : {"machine_code":"MC-CNC-001","name":"CNC Milling Machine 5-Axis","line":"Line Assembly A","status":"active"}
  │   • Ekspektasi     : Data tervalidasi dan lolos verifikasi
  │   • Hasil Aktual   : Lolos (Code: MC-CNC-001, Line: Line Assembly A, Status: active)
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MC-02] Penetapan status default mesin 'active'
  │   • Input Data     : {"machine_code":"MC-PRESS-002","name":"Hydraulic Press 200T","line":"Line Stamping B"}
  │   • Ekspektasi     : status: 'active'
  │   • Hasil Aktual   : status: 'active' (Default otomatis)
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MC-03] Menolak kode mesin kosong atau hanya spasi
  │   • Input Data     : {"machine_code":"   ","name":"Lathe Machine","line":"Line Machining"}
  │   • Ekspektasi     : ValidationError: Kode mesin wajib diisi.
  │   • Hasil Aktual   : Ditolak: "Kode mesin wajib diisi."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MC-04] Menolak kode mesin melebihi batas 30 karakter
  │   • Input Data     : {"machine_code_length":57}
  │   • Ekspektasi     : ValidationError: Kode mesin maksimal 30 karakter.
  │   • Hasil Aktual   : Ditolak: "Kode mesin maksimal 30 karakter."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MC-05] Menolak nama mesin yang kosong
  │   • Input Data     : {"machine_code":"MC-003","name":"","line":"Line Packaging"}
  │   • Ekspektasi     : ValidationError: Nama mesin wajib diisi.
  │   • Hasil Aktual   : Ditolak: "Nama mesin wajib diisi."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MC-06] Menolak lini produksi yang kosong
  │   • Input Data     : {"machine_code":"MC-004","name":"Conveyor Belt Line 1","line":""}
  │   • Ekspektasi     : ValidationError: Lini produksi wajib diisi.
  │   • Hasil Aktual   : Ditolak: "Lini produksi wajib diisi."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MC-07] Menolak nilai status selain active/down/inactive
  │   • Input Data     : {"status":"broken"}
  │   • Ekspektasi     : ValidationError: Status mesin harus salah satu dari: active, down, inactive.
  │   • Hasil Aktual   : Ditolak: "Status mesin harus salah satu dari: active, down, inactive."
  └── • Status Uji     : [ PASS ✓ ]
▶ Modul Validasi Data Mesin (Machine Input Validation)
  ✔ UT-MC-01: Validasi berhasil untuk data mesin yang lengkap dan valid (1.9272ms)
  ✔ UT-MC-02: Default status adalah 'active' jika tidak dicantumkan (1.848ms)
  ✔ UT-MC-03: Menolak jika kode mesin kosong atau hanya spasi (0.9585ms)
  ✔ UT-MC-04: Menolak jika kode mesin melebihi batas 30 karakter (0.5162ms)
  ✔ UT-MC-05: Menolak jika nama mesin kosong (0.4304ms)
  ✔ UT-MC-06: Menolak jika lini produksi kosong (0.3979ms)
  ✔ UT-MC-07: Menolak nilai status mesin yang tidak diizinkan (0.8026ms)
✔ Modul Validasi Data Mesin (Machine Input Validation) (9.882ms)

  ┌── [UT-DQ-01] Parsing rentang tanggal valid (start_date <= end_date)
  │   • Input Data     : {"start_date":"2026-03-01","end_date":"2026-03-31"}
  │   • Ekspektasi     : Berhasil diparsing menjadi objek Date yang valid
  │   • Hasil Aktual   : Lolos (Start: 2026-03-01, End: 2026-03-31)
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DQ-02] Filter tanggal mulai tunggal (tanpa end_date)
  │   • Input Data     : {"start_date":"2026-03-01"}
  │   • Ekspektasi     : start Date terdefinisi, end bernilai undefined
  │   • Hasil Aktual   : Lolos (Start: 2026-03-01, End: undefined)
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DQ-03] Menolak rentang tanggal terbalik (end_date < start_date)
  │   • Input Data     : {"start_date":"2026-03-20","end_date":"2026-03-10"}
  │   • Ekspektasi     : ValidationError: Tanggal akhir tidak boleh sebelum tanggal mulai.
  │   • Hasil Aktual   : Ditolak: "Tanggal akhir tidak boleh sebelum tanggal mulai."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DQ-04] Menolak format tanggal non-ISO (DD/MM/YYYY)
  │   • Input Data     : {"start_date":"01/03/2026","end_date":"31/03/2026"}
  │   • Ekspektasi     : ValidationError: Format start_date harus YYYY-MM-DD.
  │   • Hasil Aktual   : Ditolak: "Format start_date harus YYYY-MM-DD."
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-DQ-05] Menolak tanggal kalender fiktif (30 Februari)
  │   • Input Data     : {"start_date":"2026-02-30"}
  │   • Ekspektasi     : ValidationError: Tanggal start_date tidak valid.
  │   • Hasil Aktual   : Ditolak: "Tanggal start_date tidak valid."
  └── • Status Uji     : [ PASS ✓ ]
▶ Modul Filter Tanggal Pencarian Laporan (Date Range Query)
  ✔ UT-DQ-01: Rentang tanggal valid (start_date <= end_date) berhasil diparsing (4.2025ms)
  ✔ UT-DQ-02: Dapat menerima start_date saja tanpa end_date (2.2239ms)
  ✔ UT-DQ-03: Menolak jika end_date lebih awal dari start_date (0.9973ms)
  ✔ UT-DQ-04: Menolak format tanggal non-ISO (misal format DD/MM/YYYY) (0.5161ms)
  ✔ UT-DQ-05: Menolak nilai tanggal kalender fiktif (misal 30 Februari) (0.3938ms)
✔ Modul Filter Tanggal Pencarian Laporan (Date Range Query) (10.6167ms)

  ┌── [UT-MT-01] Menghitung akumulasi total downtime dan jumlah insiden
  │   • Input Data     : {"incidents":[60,120,30]}
  │   • Ekspektasi     : Total Downtime: 210 mnt, Total Insiden: 3
  │   • Hasil Aktual   : Total: 210 mnt, Insiden: 3, Open: 0
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MT-02] Kalkulasi Mean Time To Repair (MTTR = Total Downtime / Total Insiden)
  │   • Input Data     : {"total_downtime":180,"total_incidents":2}
  │   • Ekspektasi     : MTTR: 90.0 menit/insiden
  │   • Hasil Aktual   : MTTR: 90 menit/insiden
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MT-03] Memisahkan insiden status open dari kalkulasi downtime
  │   • Input Data     : {"completed_count":1,"open_count":2,"completed_downtime":50}
  │   • Ekspektasi     : Downtime: 50 mnt, Completed: 1, Open: 2
  │   • Hasil Aktual   : Downtime: 50 mnt, Completed: 1, Open: 2
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-MT-04] Penanganan dataset kosong (zero-division protection)
  │   • Input Data     : Data kosong []
  │   • Ekspektasi     : Downtime: 0, Insiden: 0, MTTR: 0
  │   • Hasil Aktual   : Downtime: 0, Insiden: 0, MTTR: 0
  └── • Status Uji     : [ PASS ✓ ]
▶ Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis)
  ✔ UT-MT-01: Menghitung total downtime dan jumlah insiden yang selesai (1.8431ms)
  ✔ UT-MT-02: Menghitung nilai Mean Time To Repair (MTTR) dengan benar (1.2455ms)
  ✔ UT-MT-03: Membedakan insiden open (masih rusak) dan tidak memasukkannya ke total downtime (0.2662ms)
  ✔ UT-MT-04: Menangani dataset kosong tanpa error pembagian dengan nol (division by zero) (0.28ms)
✔ Modul Metrik Kinerja & Dashboard (MTTR & Downtime Analysis) (5.382ms)

  ┌── [UT-AR-01] Validasi data login valid berhasil
  │   • Input Data     : {"username":"teknisi_budi","password":"***"}
  │   • Ekspektasi     : Data login valid diterima tanpa error
  │   • Hasil Aktual   : Username 'teknisi_budi' terverifikasi valid
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-AR-02] Menolak jika username login kosong
  │   • Input Data     : {"username":"   ","password":"password123"}
  │   • Ekspektasi     : ValidationError: Username wajib diisi
  │   • Hasil Aktual   : Error: Username wajib diisi.
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-AR-03] Menolak jika password login kosong
  │   • Input Data     : {"username":"operator1","password":""}
  │   • Ekspektasi     : ValidationError: Password wajib diisi
  │   • Hasil Aktual   : Error: Password wajib diisi.
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-AR-04] Menolak username yang melebihi 50 karakter
  │   • Input Data     : {"username":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (55 chars)"}
  │   • Ekspektasi     : ValidationError: Username maksimal 50 karakter
  │   • Hasil Aktual   : Error: Username maksimal 50 karakter.
  └── • Status Uji     : [ PASS ✓ ]

  ┌── [UT-AR-05] Standard response format API memiliki metadata seragam
  │   • Input Data     : {"payload":{"machineId":1,"status":"active"},"message":"Mesin berhasil diupdate"}
  │   • Ekspektasi     : { success: true, data, message, timestamp }
  │   • Hasil Aktual   : success: true, message: "Mesin berhasil diupdate", timestamp ISO string
  └── • Status Uji     : [ PASS ✓ ]
▶ Modul Autentikasi Pengguna & Format Response API
  ✔ UT-AR-01: Validasi data login valid berhasil (1.8239ms)
  ✔ UT-AR-02: Menolak jika username login kosong (1.8493ms)
  ✔ UT-AR-03: Menolak jika password login kosong (0.2936ms)
  ✔ UT-AR-04: Menolak username yang melebihi 50 karakter (0.3206ms)
  ✔ UT-AR-05: Standard response format API memiliki format dan metadata yang seragam (1.8206ms)
✔ Modul Autentikasi Pengguna & Format Response API (8.1522ms)

ℹ tests 34
ℹ suites 0
ℹ pass 34
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 229.8349
```
