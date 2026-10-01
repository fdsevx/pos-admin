# Kebutuhan API untuk Hierarki Outlet -> Unit Usaha

Saat ini, backend POS hanya memiliki tabel `outlets` yang berfungsi sebagai "Unit Usaha" di frontend (contoh: Restoran, Cafe). Untuk mendukung hierarki yang benar (Outlet/Cabang -> Unit Usaha), backend perlu disesuaikan dengan struktur berikut di masa depan.

## 1. Perubahan Struktur Database (Skema)

**Tabel Baru: `locations` (Outlet Utama/Cabang)**
Menyimpan data cabang fisik.
- `id` (UUID, Primary Key)
- `name` (String, misal: "WKB", "Cabang Sudirman")
- `code` (String, unik, misal: "WKB-01")
- `address` (Text)
- `phone` (String)
- `timezone` (String, misal: "Asia/Jakarta")
- `is_active` (Boolean)

**Penyesuaian Tabel: `outlets` (Ubah nama konsep menjadi `business_units` / Unit Usaha)**
Unit operasional di dalam sebuah cabang fisik.
- `id` (UUID, Primary Key)
- `location_id` (UUID, Foreign Key ke `locations(id)`) -> **[KOLOM BARU]**
- `name` (String, misal: "Cafe", "Restoran")
- `type` (String, Enum: "CAFE", "RESTORAN", dll)
- `slug` (String, unik, misal: "wkb-cafe")
- `is_active` (Boolean)

## 2. Endpoint API Baru

**Manajemen Lokasi (Outlet Utama)**
- `GET /v1/locations` -> Mendapatkan daftar seluruh lokasi cabang.
- `POST /v1/locations` -> Membuat lokasi baru.
- `PUT /v1/locations/:id` -> Mengubah data lokasi.
- `DELETE /v1/locations/:id` -> Menghapus lokasi.

**Manajemen Unit Usaha (Berdasarkan Lokasi)**
- `GET /v1/locations/:location_id/units` -> Mendapatkan daftar unit usaha di lokasi tertentu.
- `POST /v1/locations/:location_id/units` -> Membuat unit usaha baru di dalam lokasi.

## 3. Penyesuaian Endpoint Operasional

Semua operasional (produk, transaksi, inventaris) tetap terikat pada `business_unit_id` (yang sebelumnya disebut `outlet_id`). Namun, API harus mendukung pemfilteran agregat pada level lokasi.
- `GET /v1/products?location_id=xxx` -> (Opsional) Mengambil seluruh produk dari semua unit usaha di cabang tersebut.
- `GET /v1/reports/summary?location_id=xxx` -> Mendapatkan agregasi laporan untuk satu cabang fisik secara utuh (gabungan Restoran + Cafe).

## 4. Otorisasi dan Role (Tabel `user_outlets`)
Saat ini, akses user dikendalikan melalui daftar `outlet_id`.
Ke depan, akses dapat diatur di dua level:
- Akses penuh ke satu **Location (Outlet Cabang)**, yang otomatis memberikan akses ke seluruh **Unit Usaha** di dalamnya.
- Atau, akses spesifik hanya pada **Unit Usaha** tertentu saja (misal, hanya Manajer Cafe di WKB).
