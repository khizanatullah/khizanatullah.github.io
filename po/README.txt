TB. KHIZANATULLAH - APLIKASI WEB

Paket ini dibuat untuk dijalankan sebagai Google Apps Script Web App.

CARA MEMASANG:
1. Buat/buka Google Sheet.
2. Extensions > Apps Script.
3. Buat file Code.gs, Index.html, Style.html, Script.html.
4. Salin isi file dari paket ini sesuai namanya.
5. Pastikan SHEET_NAME di Code.gs adalah Sheet1, atau sesuaikan.
6. Deploy > New deployment > Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Buka URL Web App.

SHEET:
A1 Nama
B1 Alamat
C1 Tanggal Kirim
D1 Barang

FUNGSI:
- Input pelanggan
- Pilih tanggal
- Tambah banyak barang
- Simpan ke Google Sheet
- Lihat daftar nama
- Klik nama untuk detail
- Semua barang tetap dalam satu kolom Barang, dipisahkan '; '

Tidak perlu URL API manual di HTML karena aplikasi memakai google.script.run.
