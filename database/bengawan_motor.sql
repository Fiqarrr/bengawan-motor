-- ============================================================================
-- Skema Database, Seed Data & Query Operasional - Bengkel Bengawan Motor
-- Kompatibel dengan MySQL 8.0+ / MariaDB 10.6+
-- Berkas ini juga berfungsi sebagai backup skema & referensi migrasi dari data/db.json
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bengawan_motor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bengawan_motor;

-- ----------------------------------------------------------------------------
-- 1. Tabel Pengguna (Pelanggan & Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(120) NOT NULL,
  hp VARCHAR(30) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'pelanggan') NOT NULL DEFAULT 'pelanggan',
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. Tabel Reservasi Servis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservasi (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kode VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  nama VARCHAR(120) NOT NULL,
  hp VARCHAR(30) NOT NULL,
  jenis_kendaraan VARCHAR(40) NOT NULL,
  merk VARCHAR(120) NOT NULL,
  plat VARCHAR(24) NOT NULL,
  tanggal DATE NOT NULL,
  jam CHAR(5) NOT NULL,
  layanan TEXT NOT NULL,
  keluhan TEXT NULL,
  status ENUM('Menunggu', 'Dikonfirmasi', 'Dikerjakan', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Menunggu',
  biaya INT UNSIGNED NULL,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservasi_kode (kode),
  KEY idx_slot (tanggal, jam, status),
  KEY idx_user (user_id),
  KEY idx_status_tanggal (status, tanggal),
  CONSTRAINT fk_reservasi_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. (Opsional) Tabel Detail Layanan per Reservasi (Normalisasi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservasi_layanan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservasi_id BIGINT UNSIGNED NOT NULL,
  nama_layanan VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_rl_reservasi (reservasi_id),
  CONSTRAINT fk_rl_reservasi FOREIGN KEY (reservasi_id) REFERENCES reservasi (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Seed Data Awal (Admin Default: admin@bengawan.test / admin123)
--    Segera ubah kata sandi setelah login pertama.
-- ----------------------------------------------------------------------------
INSERT INTO users (id, nama, hp, email, password, role)
VALUES (
  1,
  'Admin Bengawan',
  '-',
  'admin@bengawan.test',
  '$2a$10$F0.nHiVUGIWh8.UIYpqhP.vueJaQM3Cm7ToEH9ahKJRFLuaZt2MVO',
  'admin'
)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- ============================================================================
-- 5. Referensi Query Operasional (Ekuivalen Endpoint di server.js)
--    Catatan: Bagian ini sengaja dikomentari agar file ini dapat di-import
--    langsung di Laragon / HeidiSQL / phpMyAdmin tanpa error sintaks prepared statement (?).
-- ============================================================================

/*
-- [A] Cek sisa kuota slot per jam pada tanggal tertentu (KUOTA = 3)
-- Parameter: :tanggal (contoh '2026-11-20')
SELECT
  s.jam,
  GREATEST(0, 3 - COUNT(r.id)) AS sisa,
  3 AS kuota
FROM (
  SELECT '08:00' AS jam UNION ALL SELECT '09:00' UNION ALL
  SELECT '10:00' UNION ALL SELECT '11:00' UNION ALL
  SELECT '13:00' UNION ALL SELECT '14:00' UNION ALL
  SELECT '15:00' UNION ALL SELECT '16:00'
) s
LEFT JOIN reservasi r
  ON r.tanggal = '2026-11-20'
  AND r.jam = s.jam
  AND r.status <> 'Dibatalkan'
GROUP BY s.jam
ORDER BY s.jam;

-- [B] Lacak status servis publik berdasarkan kode (sensor 2 karakter terakhir plat)
SELECT
  kode,
  status,
  layanan,
  tanggal,
  jam,
  merk,
  CONCAT(LEFT(plat, GREATEST(0, CHAR_LENGTH(plat) - 2)), '**') AS plat
FROM reservasi
WHERE kode = UPPER(TRIM('BM-20261120-001'))
LIMIT 1;

-- [C] Riwayat reservasi pelanggan / semua reservasi (admin)
SELECT *
FROM reservasi
WHERE user_id = 1
ORDER BY tanggal DESC, jam DESC;

-- [D] Batalkan reservasi oleh pelanggan (hanya jika status 'Menunggu')
UPDATE reservasi
SET status = 'Dibatalkan'
WHERE id = 1 AND user_id = 1 AND status = 'Menunggu';

-- [E] Ubah status & biaya akhir oleh admin
UPDATE reservasi
SET status = 'Selesai', biaya = 350000
WHERE id = 1;

-- [F] Laporan pendapatan bulanan (12 bulan terakhir, hanya status 'Selesai')
SELECT
  DATE_FORMAT(tanggal, '%Y-%m') AS periode,
  COUNT(*) AS jumlah_servis,
  COALESCE(SUM(biaya), 0) AS total_pendapatan
FROM reservasi
WHERE status = 'Selesai'
  AND tanggal >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')
GROUP BY DATE_FORMAT(tanggal, '%Y-%m')
ORDER BY periode ASC;

-- [G] Laporan pendapatan mingguan (Senin-Minggu, 8 minggu terakhir)
SELECT
  DATE_SUB(tanggal, INTERVAL WEEKDAY(tanggal) DAY) AS awal_minggu,
  COUNT(*) AS jumlah_servis,
  COALESCE(SUM(biaya), 0) AS total_pendapatan
FROM reservasi
WHERE status = 'Selesai'
  AND tanggal >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 WEEK)
GROUP BY awal_minggu
ORDER BY awal_minggu ASC;

-- [H] Laporan pendapatan tahunan (5 tahun terakhir)
SELECT
  YEAR(tanggal) AS tahun,
  COUNT(*) AS jumlah_servis,
  COALESCE(SUM(biaya), 0) AS total_pendapatan
FROM reservasi
WHERE status = 'Selesai'
  AND YEAR(tanggal) >= YEAR(CURDATE()) - 4
GROUP BY YEAR(tanggal)
ORDER BY tahun ASC;

-- [I] Rekap daftar pelanggan & total transaksi (untuk halaman Pelanggan admin)
SELECT
  u.id,
  u.nama,
  u.hp,
  u.email,
  COUNT(r.id) AS reservasi,
  SUM(CASE WHEN r.status = 'Selesai' THEN 1 ELSE 0 END) AS selesai,
  COALESCE(SUM(CASE WHEN r.status = 'Selesai' THEN r.biaya ELSE 0 END), 0) AS total,
  MAX(r.tanggal) AS terakhir
FROM users u
LEFT JOIN reservasi r ON r.user_id = u.id
WHERE u.role = 'pelanggan'
GROUP BY u.id, u.nama, u.hp, u.email
ORDER BY u.id DESC;
*/

-- ============================================================================
-- 6. Perintah Backup & Restore CLI (MySQL)
-- Backup:  mysqldump -u root -p --single-transaction --routines bengawan_motor > backup_bengawan_motor.sql
-- Restore: mysql -u root -p bengawan_motor < backup_bengawan_motor.sql
-- ============================================================================
