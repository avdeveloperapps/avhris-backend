# AGENTS.md — avhris-backend

Dokumen ini untuk membantu agent memahami struktur proyek, paket yang dipakai, dan alur kerja aplikasi.

## Ringkas
- Stack: Node.js + Express + MongoDB (Mongoose)
- Entry point: `index.js`
- API prefix: `api/v1`
- Pola modul fitur: umumnya `model.js` + `controller.js` + `routes.js` per folder fitur

## Cara aplikasi berjalan
1. `index.js` menginisialisasi Express, CORS, dotenv, dan koneksi DB.
2. `database/index.js` membuat koneksi Mongoose memakai `config/index.js`.
3. `index.js` mendaftarkan route per modul (lihat daftar di bawah) dengan prefix `api/v1`.
4. Server listen di `process.env.PORT`.

## Konfigurasi lingkungan
- Contoh env ada di `example.env`.
- Variabel penting:
  - `PORT` (default 7000 di contoh)
  - `MONGODB_URL_PROD` (dipakai oleh `config/index.js`)
  - `SECRET_KEY` (dipakai untuk JWT)

## Paket utama (dependencies)
- `express`, `cors` — HTTP server + CORS.
- `mongoose` — ODM MongoDB.
- `jsonwebtoken`, `bcrypt` — auth (JWT + hashing).
- `multer` — upload file.
- `moment`, `moment-timezone` — waktu/tanggal.
- `exceljs`, `csv-writer`, `fast-csv`, `json2csv`, `html-pdf` — ekspor data.

## Struktur folder (gambaran)
- `index.js` — konfigurasi server + registrasi semua routes.
- `database/` — koneksi MongoDB.
- `config/` — pembacaan env (MONGODB_URL_PROD, PORT).
- `middleware/` — auth middleware JWT (`authentication.js`).
- `utils/` — helper (contoh: `generateToken.js`).
- Folder fitur (contoh):
  - `company/`, `admin/`, `employee/`, `attendance/`, dll.
  - Pola umum: `routes.js` → `controller.js` → `model.js`.
- `public/` — static files (dipetakan ke `/images`, `/files`, `/public`).
- `supercronic/` — job runner/logic untuk cron.
- `crontab` — jadwal supercronic.
- `Dockerfile`, `fly.toml`, `vercel.json` — deployment.

## Daftar route utama (dari `index.js`)
Prefix: `/api/v1`
- `/admin`
- `/company`
- `/departement`
- `/designation`
- `/employment`
- `/education`
- `/experience`
- `/bank`
- `/salary`
- `/allowance-deduction`
- `/allowance`
- `/deduction`
- `/shift`
- `/leave-holiday`
- `/leave-request`
- `/employment-status`
- `/employment-warning`
- `/overtime-request`
- `/outside-request`
- `/periodic`
- `/leaves`
- `/off-day`
- `/announcement`
- `/attendance`
- `/location`
- `/lately`
- `/need-approval`
- `/change-shift`
- `/tasks`
- `/payrun`
- `/payrun-type`
- `/bank-payrun`
- `/payrun-process`
- `/output-file`
- `/users-and-roles`
- `/statistic`

## Otentikasi
- Middleware JWT: `middleware/authentication.js`
- Token dibuat via `utils/generateToken.js` (expired 5 jam).
- Banyak route kemungkinan memakai middleware ini di masing-masing `routes.js`.

## Cron / Scheduled job
- `crontab` berisi jadwal supercronic:
  - `supercronic/lima_menit.js`
  - `supercronic/tengah_malam.js`
  - `supercronic/tiga_pagi.js`
- Dockerfile menginstall `supercronic` untuk menjalankan schedule.

## Menjalankan proyek (lokal)
- `npm run dev` (nodemon)
- `npm start` (node index.js)

## Catatan untuk agent
- Banyak modul fitur punya pola serupa (routes-controller-model). Cek folder fitur yang relevan sebelum mengubah logic.
- DB connection memakai `MONGODB_URL_PROD`, jadi pastikan env terisi.
- Static files diakses via `/images`, `/files`, `/public`.
