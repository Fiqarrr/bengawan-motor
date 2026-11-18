# Sistem Informasi Reservasi Servis - Bengkel Bengawan Motor

## Menjalankan
1. Pasang Node.js (v18+).
2. `npm install`
3. `npm start`
4. Buka http://localhost:3000 (admin awal: admin@bengawan.test / admin123, segera ganti)

## Mengubah isi website (tanpa coding)
Buka `public/config.js` lalu isi: alamat bengkel, link Google Maps, link media sosial,
cerita bengkel, testimoni asli (lalu ubah `testimoniContoh` jadi false), dan FAQ.
- Foto galeri: simpan di `public/img/galeri/` dengan nama 1.jpg sampai 6.jpg.
- Foto utama beranda: ganti `public/img/hero.jpg`.
- Harga dan daftar layanan: `public/app.js` bagian `LAYANAN`.
