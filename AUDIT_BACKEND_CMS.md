# Audit backend POS dan CMS admin

Tanggal: 4 November 2026 (Asia/Jakarta).

**Kesimpulan: belum bebas bug, dan belum semua fungsi API tersedia melalui CMS.** Build yang berhasil tidak menjamin kebenaran alur transaksi, pembukuan, atau otorisasi. Beberapa bug diperbaiki dalam audit ini; temuan yang masih terbuka dicatat terpisah di bawah.

## Batas pemeriksaan dan hasil verifikasi

Pemeriksaan mencakup source backend Hono/Drizzle, seluruh halaman CMS, kontrak request/response, daftar route Hono yang benar-benar terdaftar, build produksi, typecheck, lint, dan tes terisolasi. Terdaftar **79 kombinasi method/path API**, termasuk alias; di luar itu ada `/`, `/health`, dan `/debug-env`.

| Pemeriksaan | Hasil |
| --- | --- |
| Build produksi frontend dengan Node 22.23.1 | Lolos; 14 halaman statis dihasilkan, termasuk halaman internal Next |
| Typecheck backend | Lolos setelah perbaikan |
| Tes regresi backend melalui Node test runner | 31 tes lolos |
| Tes regresi frontend/API client melalui Node test runner | 4 tes lolos |
| Request tanpa token ke seluruh route API terlindungi | Ditolak HTTP 401 sebelum akses database; ini hanya menguji pagar autentikasi |
| ESLint frontend | **Gagal: 125 error, 50 warning**, sama dengan baseline audit |
| `npm test` bawaan backend/Vitest | Tidak dapat mulai: dependensi `vite` tidak ditemukan |
| Database, transaksi nyata, migrasi, deployment | Tidak dijalankan |
| UI browser dan integrasi produksi menyeluruh | Belum diuji |

Rincian lint: 111 penggunaan `any`, 10 masalah setState dalam effect, 2 masalah purity, 2 karakter JSX yang belum di-escape; warning mencakup 43 variabel tidak terpakai, 6 dependency hook, dan 1 navigasi window.location. Tidak ada aturan lint yang dinonaktifkan untuk meloloskan audit.

Node default di shell folder admin menunjuk Node 16 yang gagal memuat library ICU. Pengecekan dilanjutkan menggunakan Node 22 yang sudah terpasang, tanpa mengubah konfigurasi proyek. Peringatan build tentang lockfile di luar repository masih ada, tetapi tidak menggagalkan build.

Database tidak disentuh. Aturan [backend](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/.agents/rules/pos-backend.md>) menyatakan: “Jangan menjalankan wrangler deploy, db:migrate, seed, atau perintah lain yang menyentuh database tanpa persetujuan user.” Skrip lama `scripts/test-products.js` juga tidak dijalankan karena mengarah ke server eksternal dan membuat produk. Status migrasi/data produksi belum bisa disimpulkan dari audit ini.

## Cakupan API terhadap CMS

“Tersedia” berarti ada pemanggilan dari alur UI, bukan sertifikasi bahwa fungsi bisnisnya sudah benar di database. API khusus aplikasi kasir/offline tidak selalu perlu mempunyai halaman CMS, tetapi tetap dicatat sebagai belum terwakili.

| Modul | Sudah dipakai CMS | Belum tersedia atau bermasalah |
| --- | --- | --- |
| Auth | Register, login, profil | Refresh token tidak dipakai; logout hanya menghapus token lokal; tautan lupa password belum memiliki alur |
| Lokasi/cabang | Daftar dan tambah | Ubah/hapus lokasi serta endpoint unit per lokasi dalam API_REQUIREMENTS.md belum dibuat di backend maupun CMS |
| Outlet/unit | Daftar, tambah, pengaturan, tombol hapus | Penghapusan terhambat relasi database/audit log; provisioning COA untuk outlet baru belum ada |
| Produk | Daftar, tambah, ubah, hapus | Validasi relasi kategori per outlet dan alur stok masih perlu diperketat |
| Kategori | Daftar, tambah, hapus | API ubah tersedia, helper ada, tetapi belum ada alur edit kategori di UI |
| Stock opname | POST penyesuaian stok | Helper GET opname ada di frontend, tetapi backend tidak mendaftarkan GET `/opname`; belum ada riwayat opname di CMS |
| Pelanggan | Daftar, tambah, ubah, hapus, riwayat | Belanja dan poin tidak dipulihkan ketika transaksi di-void |
| Transaksi | Checkout, riwayat lewat reports/export, void | Pajak/service tidak mengikuti pengaturan; void dari tampilan ALL salah target; daftar hanya mengambil halaman pertama |
| Pengeluaran | Daftar dan tambah | Error pembacaan bisa disamarkan menjadi daftar kosong; jalur offline tidak membuat jurnal yang setara |
| Pembelian | Daftar dan tambah stok | Tidak ada pengelolaan supplier; validasi nilai, relasi outlet, dan moving average perlu diperbaiki |
| COA | Daftar, tambah, ubah, hapus | Kode COA otomatis masih bergantung pada dua jenis outlet awal |
| Laporan akuntansi | Buku besar, neraca saldo, laba rugi, neraca | Jurnal manual hanya memiliki state/helper yang belum terhubung UI; penguncian periode dan cash-flow belum ada di CMS |
| Laporan/dashboard | Ringkasan bulanan dan grafik harian | Sebagian kartu/grafik masih contoh/estimasi; ekspor XLSX/PDF belum benar |
| Pengguna | Daftar, tambah, approve, reset password, hapus | API PUT pengguna belum punya alur edit role/outlet/permissions di CMS; user yang ditambah langsung tidak memperoleh izin default berdasarkan role |
| Diskon | Tidak ada | Empat endpoint CRUD tersedia di backend, belum ada helper/alur CMS |
| Supplier | Tidak ada | Empat endpoint CRUD tersedia di backend, belum ada helper/alur CMS |
| Shift | Tidak ada | API open/close tersedia, belum ada alur CMS untuk buka/tutup shift |
| Device | Tidak ada | Register, pindah outlet, dan profil device tersedia di backend; belum ada alur CMS |
| Sync offline | Tidak ada | API khusus kasir/offline; izin per operasi, pencatatan jurnal, dan pagination belum konsisten |

API_REQUIREMENTS.md masih menggambarkan `locations` sebagai rencana, padahal tabel dan GET/POST sudah ada. Dokumen tersebut belum mencerminkan implementasi saat ini.

## Bug yang diperbaiki

1. **Update produk parsial mengisi ulang default create.** Sebelum perbaikan, payload `{ price: '15000' }` juga menghasilkan SKU baru, stock 0, cost_price 0, unit pcs, serta flag aktif/track_stock true. Schema update kini terpisah dan tidak mengisi field yang tidak dikirim. Update nama kategori juga tidak lagi mereset sort_order.
2. **Mutasi dari ALL melewati batas outlet.** PUT/DELETE produk dan kategori, serta opname melalui ALL, kini mengambil outlet pemilik record lalu memeriksa akses pengguna sebelum mutasi. Superadmin tetap dapat bekerja lintas outlet.
3. **Body kategori dapat menimpa outlet path.** Pembuatan kategori memakai outlet yang sudah diotorisasi; update kategori/produk tidak bisa memindahkan outlet melalui payload. CMS juga berhenti mengirim outlet pertama untuk kategori yang dibuat di outlet lain.
4. **Error registrasi berbentuk objek dapat merusak render React.** Pesan error dinormalisasi menjadi string. Helper API menggunakan normalisasi yang sama; login helper menolak respons HTTP gagal dan tidak lagi menyimpan default username/password.
5. **Nama field pelanggan dan pembelian tidak cocok.** `total_spending` dipetakan ke `total_spent`, dan `receipt_number` ke `invoice_number`, sehingga nilai yang tersedia dari backend bisa tampil di CMS.
6. **Filter kategori inventory tidak bekerja.** API produk belum memproses parameter kategori; client kini memfilter hasil yang dinormalisasi berdasarkan nama/ID kategori.
7. **Global error handler mengirim stack internal di produksi.** Stack dan pesan internal kini hanya ditampilkan pada environment development. Beberapa handler route masih mengembalikan pesan error sendiri dan belum tercakup perbaikan ini.
8. Penanganan verifikasi JWT dipisahkan dari eksekusi handler berikutnya agar batas error autentikasi jelas.

Perubahan masih lokal, tanpa commit atau deployment. Tes database menggunakan stub, dan tes client menggunakan mock fetch.

## Temuan terbuka dengan prioritas tinggi

### P1 — Validasi transaksi dan pembelian belum menjaga konsistensi data

[Schema transaksi](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/transaction/schema.ts:78>) menerima grand_total yang tidak sesuai item. Probe lokal berhasil menerima item seharga 10000 dengan grand_total 1. [Schema pembelian](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/purchase/schema.ts:23>) juga menerima total_amount negatif. Backend mempercayai banyak nilai harga/HPP/total dari client.

[Transaksi](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/transaction/service.ts:123>) dan [pembelian](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/purchase/service.ts:41>) membaca/mengubah produk berdasarkan ID tanpa syarat outlet yang sama. Customer/shift/supplier yang dirujuk juga belum semuanya divalidasi terhadap outlet. Ini masih memungkinkan perubahan data lintas outlet melalui jalur selain bug ALL yang sudah diperbaiki. Pembelian dan schema transaksi memakai Number/parseFloat untuk uang, bertentangan dengan aturan Decimal proyek.

Perbaikan berikutnya: hitung dan validasi nominal di server dengan Decimal, validasi seluruh foreign key terhadap outlet, tetapkan aturan stok habis/produk nonaktif/track_stock, dan uji rollback transaksi.

### P1 — Sync dapat melewati izin operasi dan berbeda dari alur online

[Router sync](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/sync/routes.ts:17>) hanya memakai autentikasi dan outlet middleware; tidak ada pemeriksaan `transaction:void`, `expense:write`, atau izin shift per item. Pengguna dengan akses outlet dapat mencoba operasi yang ditolak endpoint online. [Service sync](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/sync/service.ts:43>) memasukkan expense langsung tanpa jurnal; shift_close tidak menghitung expected_cash/selisih dan jurnal seperti service online. Sync transaksi memakai base schema dan belum menjalankan normalisasi total yang sama dengan endpoint online.

### P1 — Dashboard memuat angka contoh seolah data operasional

[Dashboard](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/app/(dashboard)/page.tsx:82>) mengarang jumlah item lewat Math.random, membagi QRIS/tunai dengan persentase tetap 58%/42%, menampilkan persentase pertumbuhan tetap, dan memanggil RevenueBarChart/CategoryDonutChart tanpa data. Komponen grafik memakai data demo saat kosong. Ini dapat menghasilkan informasi yang menyesatkan ketika API kosong atau gagal.

### P1 — Ekspor Excel/PDF belum berfungsi sebagai unduhan yang dijanjikan

[Tombol ekspor](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/app/(dashboard)/expenses/page.tsx:424>) membuka URL langsung tanpa header Bearer. [Helper](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/lib/api.ts:178>) mengirim format/month/year, sedangkan [backend](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/report/routes.ts:59>) menerima from/to/page/limit dan mengembalikan JSON. Slug default ALL juga tidak cocok dengan route agregat lowercase all. Belum ada generator XLSX/PDF di jalur ini.

### P1 — Akun baru dari form tambah pegawai dapat kehilangan fungsi

[CMS](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/app/(dashboard)/users/page.tsx:84>) mengirim role dan outlet tanpa permissions. [createUser](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/user/service.ts:25>) hanya memasukkan permissions bila disuplai; penetapan izin berdasarkan role ada di jalur approve. Akun cashier/manager yang dibuat langsung dapat berhasil login tetapi gagal memakai endpoint yang memerlukan izin.

### P1 — Outlet baru dan hapus outlet belum konsisten dengan akuntansi/relasi

[createOutlet](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/outlet/service.ts:63>) tidak menyiapkan COA. [getCoaCodes/resolveAccountId](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/lib/journal.ts:20>) memilih kode berdasarkan restoran/cafe dan lookup kode global, sehingga outlet baru tidak mempunyai pemetaan akuntansi tersendiri. [deleteOutlet](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/outlet/service.ts:80>) menghapus row lalu membuat audit log dengan foreign key ke outlet tersebut; audit log/data bisnis yang sudah ada juga menghalangi hard delete. Perlu menentukan penonaktifan outlet dan model COA sebelum memperluas cabang.

### P1 — Void serentak dan saldo CRM belum aman

[voidTransaction](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/transaction/service.ts:210>) membaca status lalu memperbarui tanpa row lock atau update bersyarat yang memastikan hanya satu void berhasil. Request bersamaan berpotensi menggandakan pemulihan stok/jurnal. Fungsi ini juga belum membalik total_spending dan points pelanggan. Risiko konkurensi diturunkan dari kode; belum diuji dengan database paralel.

## Temuan terbuka lainnya

- **Pajak dan service kasir:** [CMS](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/app/(dashboard)/transactions/page.tsx:144>) selalu memakai pajak 10% dan service 0, bukan tax_percent/service_percent outlet.
- **Void saat filter ALL:** [CMS](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/app/(dashboard)/transactions/page.tsx:220>) mengirim ALL sebagai outlet, sehingga backend mencoba mencocokkan outlet_id dengan ALL, bukan outlet pemilik transaksi. PostgreSQL dapat menolak nilai non-UUID tersebut. Backend juga membiarkan ALL ke sejumlah endpoint yang belum mendukung agregasi.
- **Riwayat transaksi terpotong:** [helper daftar](</Users/muhammadhadiselamet/Documents/mac_danz/POS/admin/src/lib/api.ts:348>) tidak mengirim page/limit dan CMS tidak punya pagination; export query default membatasi 50 transaksi.
- **Jurnal manual mengabaikan tanggal:** [schema](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/accounting/schema.ts:12>) meminta date, tetapi [service](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/accounting/service.ts:49>) tidak meneruskannya; journal helper memakai tanggal saat ini. Penguncian periode hanya menandai jurnal yang sudah ada sehingga periode kosong tidak benar-benar terkunci. Reversal juga tidak melewati pemeriksaan lock yang sama.
- **Batas waktu laporan:** [report service](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/report/service.ts:5>) memakai batas bulan UTC dan date(created_at), bukan Asia/Jakarta sebagaimana aturan proyek. Transaksi sekitar tengah malam atau pergantian bulan dapat masuk periode berbeda. Endpoint summary/chart agregat juga mengabaikan start_date/end_date dan memakai month.
- **Pagination sync:** [pullData](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/sync/service.ts:169>) tidak memakai cursor input; gte timestamp tanpa tie-breaker dapat mengulang halaman. [schema](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/sync/schema.ts:54>) menafsirkan string bootstrap=false menjadi true; sudah dibuktikan lewat probe lokal.
- **Device:** [service device](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/modules/device/service.ts:5>) belum memeriksa kepemilikan device/outlet pengguna saat register, pindah outlet, dan membaca device lewat x-device-id.
- **Sesi dan role:** JWT access berlaku satu jam; middleware belum memuat ulang status aktif/izin user untuk setiap request. CMS tidak menggunakan refresh token. Deaktivasi/perubahan role dapat menunggu token lama berakhir. Profil nonaktif masih dianggap lolos oleh ProtectedRoute selama responsnya ada.
- **Kegagalan API disembunyikan:** dashboard, transaksi, dan pengeluaran banyak memakai catch menjadi []/null; gangguan API dapat tampak sebagai data kosong atau angka nol.
- **Nomor nota bersamaan:** [generator](</Users/muhammadhadiselamet/Documents/mac_danz/POS/pos-backend/src/lib/receipt-number.ts:26>) memakai count + 1 tanpa mekanisme alokasi atomik; dua checkout serentak dapat mendapat nomor sama. Belum diuji beban database.
- **Kontrak COA:** UI/schema menerima normal_balance, tetapi kolom tersebut belum ada pada schema coa_accounts; nilai itu tidak tersimpan sebagaimana formulir mengesankan.

## Menjalankan ulang pemeriksaan

Gunakan Node 22 atau versi kompatibel yang sudah terpasang. Dari folder admin:

```sh
node node_modules/next/dist/bin/next build --webpack
node node_modules/eslint/bin/eslint.js
node --import ../pos-backend/node_modules/tsx/dist/loader.mjs --test tests/api-regressions.test.ts
```

Dari folder pos-backend:

```sh
node node_modules/typescript/bin/tsc --noEmit
node --import tsx --test tests/audit-regressions.test.ts
```

Tes Node di atas sengaja disebut terpisah dari script npm test berbasis Vitest yang dependensinya belum lengkap. Konfigurasi package.json/wrangler/tsconfig tidak diubah.

Urutan tindak lanjut: perketat validasi dan isolasi outlet untuk transaksi/pembelian/sync, benahi akuntansi dan konkurensi, hilangkan data demo serta perbaiki ekspor, lengkapi modul CMS yang diperlukan, lalu jalankan E2E terhadap database uji terpisah dengan otorisasi pengguna. Belum layak menyatakan seluruh fungsi aman untuk produksi.

## Inventaris endpoint terdaftar

Daftar ini berasal dari app.routes pada backend lokal; keberadaan route tidak sama dengan verifikasi fungsi bisnis. Status per modul dijelaskan pada tabel cakupan di atas.

| Method | Path |
| --- | --- |
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/refresh` |
| POST | `/api/v1/auth/logout` |
| GET | `/api/v1/auth/me` |
| GET | `/api/v1/users` |
| POST | `/api/v1/users` |
| POST | `/api/v1/users/:id/approve` |
| PUT | `/api/v1/users/:id` |
| PUT | `/api/v1/users/:id/reset-password` |
| DELETE | `/api/v1/users/:id` |
| GET | `/api/v1/locations` |
| POST | `/api/v1/locations` |
| GET | `/api/v1/outlets` |
| GET | `/api/v1/outlets/:outlet/settings` |
| PUT | `/api/v1/outlets/:outlet/settings` |
| POST | `/api/v1/outlets` |
| DELETE | `/api/v1/outlets/:outletId` |
| GET | `/api/v1/:outlet/settings` |
| PUT | `/api/v1/:outlet/settings` |
| POST | `/api/v1/devices/register` |
| PUT | `/api/v1/devices/:device_id/outlet` |
| GET | `/api/v1/devices/me` |
| GET | `/api/v1/:outlet/categories` |
| POST | `/api/v1/:outlet/categories` |
| PUT | `/api/v1/:outlet/categories/:id` |
| DELETE | `/api/v1/:outlet/categories/:id` |
| GET | `/api/v1/:outlet/products` |
| POST | `/api/v1/:outlet/products` |
| PUT | `/api/v1/:outlet/products/:id` |
| DELETE | `/api/v1/:outlet/products/:id` |
| POST | `/api/v1/:outlet/opname` |
| GET | `/api/v1/:outlet/discounts` |
| POST | `/api/v1/:outlet/discounts` |
| PUT | `/api/v1/:outlet/discounts/:id` |
| DELETE | `/api/v1/:outlet/discounts/:id` |
| POST | `/api/v1/:outlet/shifts/open` |
| POST | `/api/v1/:outlet/shifts/close` |
| GET | `/api/v1/:outlet/transactions` |
| POST | `/api/v1/:outlet/transactions` |
| POST | `/api/v1/:outlet/transactions/:id/void` |
| POST | `/api/v1/:outlet/sync` |
| GET | `/api/v1/:outlet/sync/pull` |
| GET | `/api/v1/:outlet/suppliers` |
| POST | `/api/v1/:outlet/suppliers` |
| PUT | `/api/v1/:outlet/suppliers/:id` |
| DELETE | `/api/v1/:outlet/suppliers/:id` |
| GET | `/api/v1/:outlet/expenses` |
| POST | `/api/v1/:outlet/expenses` |
| GET | `/api/v1/:outlet/purchases` |
| POST | `/api/v1/:outlet/purchases` |
| GET | `/api/v1/all/reports/monthly` |
| GET | `/api/v1/all/reports/summary` |
| GET | `/api/v1/all/reports/chart` |
| GET | `/api/v1/all/reports/export` |
| GET | `/api/v1/:outlet/reports/summary` |
| GET | `/api/v1/:outlet/reports/monthly` |
| GET | `/api/v1/:outlet/reports/chart` |
| GET | `/api/v1/:outlet/reports/export` |
| GET | `/api/v1/:outlet/accounting/coa` |
| POST | `/api/v1/:outlet/accounting/coa` |
| PUT | `/api/v1/:outlet/accounting/coa/:id` |
| DELETE | `/api/v1/:outlet/accounting/coa/:id` |
| POST | `/api/v1/:outlet/accounting/journals/manual` |
| POST | `/api/v1/:outlet/accounting/periods/lock` |
| GET | `/api/v1/:outlet/accounting/ledger` |
| GET | `/api/v1/:outlet/accounting/reports/general-ledger` |
| GET | `/api/v1/:outlet/accounting/trial-balance` |
| GET | `/api/v1/:outlet/accounting/reports/trial-balance` |
| GET | `/api/v1/:outlet/accounting/income-statement` |
| GET | `/api/v1/:outlet/accounting/reports/income-statement` |
| GET | `/api/v1/:outlet/accounting/balance-sheet` |
| GET | `/api/v1/:outlet/accounting/reports/balance-sheet` |
| GET | `/api/v1/:outlet/accounting/reports/cash-flow` |
| GET | `/api/v1/:outlet/customers` |
| POST | `/api/v1/:outlet/customers` |
| PUT | `/api/v1/:outlet/customers/:id` |
| DELETE | `/api/v1/:outlet/customers/:id` |
| GET | `/api/v1/:outlet/customers/:id/history` |
