# Monitoring Kerusakan Mesin

Aplikasi Next.js untuk mencatat kondisi mesin, laporan kerusakan, tindakan maintenance, downtime, riwayat, dan ringkasan dashboard. Backend berjalan melalui Route Handler Next.js sehingga bisa dipasang sebagai aplikasi serverless di Vercel.

## Teknologi

- Next.js App Router dan React
- PostgreSQL, Neon Serverless, dan Drizzle ORM
- Sesi petugas berbentuk JWT pada cookie `HttpOnly`
- Kontrak OpenAPI bersama di `lib/api-spec/openapi.yaml`

## Menjalankan secara lokal

1. Buat database PostgreSQL, misalnya di Neon.
2. Salin `.env.example` menjadi `.env` di folder ini, lalu isi `DATABASE_URL`, `SESSION_SECRET`, dan `SEED_ADMIN_PASSWORD`. Password seed harus minimal 12 karakter.
3. Jalankan migrasi dan data awal:

   ```sh
   pnpm --filter @workspace/machine-monitoring run db:migrate
   pnpm --filter @workspace/machine-monitoring run db:seed
   ```

4. Jalankan aplikasi dari root workspace:

   ```sh
   pnpm --filter @workspace/machine-monitoring run dev
   ```

Seed membuat mesin contoh dan satu akun petugas. Nilai username serta password berasal dari `SEED_ADMIN_USERNAME` dan `SEED_ADMIN_PASSWORD`. Jalankan seed pada database development saja; seed tidak mengganti password akun yang sudah ada.

Jika skema Drizzle berubah, buat file migrasi baru dengan:

```sh
pnpm --filter @workspace/machine-monitoring run db:generate
```

Jangan mengandalkan migrasi otomatis saat cold start serverless. Jalankan `db:migrate` secara eksplisit sebelum aplikasi baru melayani trafik.

## Vercel

1. Impor repository ke Vercel sebagai proyek Next.js.
2. Atur **Root Directory** ke `artifacts/machine-monitoring`. Aktifkan opsi untuk menyertakan file di luar root directory saat build karena package ini menggunakan workspace monorepo.
3. Gunakan perintah build Next.js standar (`pnpm --filter @workspace/machine-monitoring run build`) dan pastikan Vercel memasang dependensi workspace dari `pnpm-lock.yaml` di root repository.
4. Tambahkan environment variable `DATABASE_URL` dan `SESSION_SECRET` pada environment Vercel yang digunakan. `SESSION_SECRET` harus minimal 32 karakter.
5. Terapkan migrasi ke database production sebelum publish. Jangan menjalankan seed demo pada database production.
6. Jangan set `BASE_PATH` pada Vercel. Prefix `/machine-monitoring/` hanya dipakai oleh preview Replit dan sudah disediakan workflow artifact.

`DATABASE_URL` harus menunjuk ke database PostgreSQL yang sama dengan database tempat migrasi diterapkan. Aplikasi tidak membuat tabel otomatis; jika URL atau skema belum siap, endpoint database akan mengembalikan error yang jelas.