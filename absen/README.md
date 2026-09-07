# Absen Karyawan — Web Statis

Aplikasi absensi karyawan berbasis web statis (GitHub Pages). Tanpa server — semua data tersimpan di browser (localStorage).

## URL

- **Login / Register:** `https://khizanatullah.github.io/absen/index.html`
- **Dashboard Karyawan:** `https://khizanatullah.github.io/absen/dashboard.html`
- **Admin Panel:** `https://khizanatullah.github.io/absen/admin.html`

## Fitur

### Login / Register
- Halaman `index.html` → input email + password.
- Tombol **Daftar** untuk membuat akun karyawan baru.
- Email yang terdaftar sebagai admin (lihat `ADMIN_EMAILS` di `app.js`) otomatis dapat role **admin**.

### Dashboard Karyawan (`dashboard.html`)
- Halaman utama setelah login.
- Menampilkan absensi hari ini:
  - **Tombol DATANG** → absen masuk (catat waktu datang).
  - **Tombol PULANG** → absen keluar (catat waktu pulang).
- Logika gaji/absensi:
  - Datang ≤ 07:15 + pulang < 14:00 → **Setengah hari**.
  - Datang ≤ 07:15 + pulang ≥ 14:00 → **Hari penuh**.
  - Datang > 07:15 → **Terlambat** (notifikasi muncul, tidak dapat gaji).
- Menampilkan riwayat absensi.

### Admin Panel (`admin.html`)
- Hanya bisa diakses oleh akun berrole **admin**.
- Menampilkan daftar semua karyawan beserta gaji per hari.
- Tombol **Tambah Karyawan** → input nama, email, password, gaji penuh, gaji setengah.
- Tombol **✏️** → edit gaji per karyawan.
- Tombol **🗑️** → hapus karyawan (beserta data absensinya).
- Ringkasan gaji mingguan semua karyawan (Senin–Jumat).

## Penyiapan Admin

Edit variabel `ADMIN_EMAILS` di file `assets/js/app.js`:

```js
var ADMIN_EMAILS = "admin@khizanatullah.github.io";
```

Email yang dicantumkan di sana otomatis mendapat role **admin** saat mendaftar. Jika ingin admin bisa login tanpa mendaftar, tambahkan manual lewat Admin Panel (kamu bisa login dengan email admin yang sudah ada).

## Struktur File

```
absen/
├── index.html          # Login & register
├── dashboard.html      # Halaman karyawan
├── admin.html          # Halaman admin
├── assets/
│   ├── css/
│   │   └── style.css   # Styling
│   └── js/
│       └── app.js      # Logika utama (auth, absensi, gaji, admin)
└── README.md
```

## Catatan Teknis

- **Data disimpan di browser** (`localStorage`), bukan di server. Masing-masing browser punya datanya sendiri.
- **Password di-hash sederhana** (bukan enkripsi aman) — proyek ini untuk demonstrasi, bukan sistem produksi.
- **Jam batas** tertanam di `app.js` (`BATAS_DATANG`, `BATAS_PULANG_SETENGAH`).
- Timer WIB menggunakan waktu mesin klien — cocok untuk demonstrasi, untuk keamanan nyata butuh server.

## Deploy

Folder `absen/` sudah siap di-deploy ke **GitHub Pages** sebagai sub-path pada repo `khizanatullah.github.io`.

## License

Proyek ini dibuat untuk keperluan internal.

---

Dibuat oleh Mas We.
