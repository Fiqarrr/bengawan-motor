const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const DB = path.join(__dirname, 'data', 'db.json');
const JAM = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
const KUOTA = 3; // maksimal kendaraan per jam
const biayaValid = v => { const n = Number(v); return v !== '' && v !== null && v !== undefined && Number.isInteger(n) && n >= 0 && n <= 1e9 ? n : null; };
const STATUS = ['Menunggu','Dikonfirmasi','Dikerjakan','Selesai','Dibatalkan'];
const hariIniWIB = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

let lastId = 0;
const buatId = () => {
  const now = Date.now();
  lastId = now > lastId ? now : lastId + 1;
  return lastId;
};

// ---------- Rate limiter sederhana di memori ----------
const rateMap = new Map();
function batasiLaju(nama, maks, jendelaMs) {
  return (q, r, n) => {
    const kunci = `${nama}:${q.ip || 'local'}`;
    const sekarang = Date.now();
    const entri = rateMap.get(kunci);
    if (!entri || sekarang > entri.reset) {
      rateMap.set(kunci, { hitung: 1, reset: sekarang + jendelaMs });
      return n();
    }
    if (entri.hitung >= maks) {
      return r.status(429).json({ pesan: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' });
    }
    entri.hitung++;
    n();
  };
}

// ---------- Penyimpanan data (berkas JSON; lihat database/bengawan_motor.sql untuk skema MySQL) ----------
function muat() {
  if (!fs.existsSync(DB)) {
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    fs.writeFileSync(DB, JSON.stringify({
      users: [{ id: 1, nama: 'Admin Bengawan', hp: '-', email: 'admin@bengawan.test',
                password: bcrypt.hashSync('admin123', 10), role: 'admin' }],
      reservasi: []
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}
function simpan(d) {
  const tmp = DB + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, DB);
}

// ---------- Middleware ----------
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'bengawan-motor-dev-secret-ganti-di-produksi',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 864e5, httpOnly: true, sameSite: 'lax' }
}));
app.use(express.static(path.join(__dirname, 'public')));
const wajibMasuk = (q, r, n) => q.session.uid ? n() : r.status(401).json({ pesan: 'Silakan masuk terlebih dahulu.' });
const wajibAdmin = (q, r, n) => q.session.role === 'admin' ? n() : r.status(403).json({ pesan: 'Halaman ini khusus admin.' });

// ---------- Autentikasi ----------
app.post('/api/daftar', batasiLaju('daftar', 10, 15 * 60 * 1000), (q, r) => {
  const { nama, hp, email, password } = q.body;
  if (!nama || !hp || !email || !password || password.length < 6)
    return r.status(400).json({ pesan: 'Lengkapi semua kolom. Kata sandi minimal 6 karakter.' });
  const d = muat();
  const emailNorm = String(email).trim().toLowerCase();
  if (d.users.some(u => u.email === emailNorm))
    return r.status(409).json({ pesan: 'Email sudah terdaftar. Silakan masuk.' });
  const u = { id: buatId(), nama: String(nama).trim(), hp: String(hp).trim(), email: emailNorm, password: bcrypt.hashSync(password, 10), role: 'pelanggan' };
  d.users.push(u); simpan(d);
  q.session.uid = u.id; q.session.role = u.role;
  r.json({ pesan: 'Akun berhasil dibuat.' });
});

app.post('/api/masuk', batasiLaju('masuk', 15, 15 * 60 * 1000), (q, r) => {
  const emailNorm = String(q.body.email || '').trim().toLowerCase();
  const u = muat().users.find(x => x.email === emailNorm);
  if (!u || !bcrypt.compareSync(q.body.password || '', u.password))
    return r.status(401).json({ pesan: 'Email atau kata sandi salah.' });
  q.session.uid = u.id; q.session.role = u.role;
  r.json({ role: u.role });
});

app.post('/api/keluar', (q, r) => q.session.destroy(() => r.json({ pesan: 'Anda sudah keluar.' })));

app.get('/api/saya', (q, r) => {
  if (!q.session.uid) return r.json(null);
  const u = muat().users.find(x => x.id === q.session.uid);
  r.json(u ? { id: u.id, nama: u.nama, hp: u.hp, email: u.email, role: u.role } : null);
});

app.patch('/api/akun/password', wajibMasuk, (q, r) => {
  const { passwordLama, passwordBaru } = q.body;
  if (!passwordLama || !passwordBaru || String(passwordBaru).length < 6)
    return r.status(400).json({ pesan: 'Kata sandi baru minimal 6 karakter.' });
  const d = muat();
  const u = d.users.find(x => x.id === q.session.uid);
  if (!u || !bcrypt.compareSync(String(passwordLama), u.password))
    return r.status(401).json({ pesan: 'Kata sandi lama tidak sesuai.' });
  u.password = bcrypt.hashSync(String(passwordBaru), 10);
  simpan(d);
  r.json({ pesan: 'Kata sandi berhasil diperbarui.' });
});

// ---------- Slot jam ----------
app.get('/api/slot', (q, r) => {
  const { tanggal } = q.query;
  const tgl = new Date(String(tanggal || '') + 'T00:00:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tanggal || '')) || isNaN(tgl))
    return r.status(400).json({ pesan: 'Format tanggal tidak valid.' });
  const tutup = tgl.getDay() === 0;
  const d = muat();
  r.json(JAM.map(jam => {
    if (tutup) return { jam, sisa: 0, kuota: KUOTA, tutup: true };
    const terisi = d.reservasi.filter(x => x.tanggal === tanggal && x.jam === jam && x.status !== 'Dibatalkan').length;
    return { jam, sisa: Math.max(0, KUOTA - terisi), kuota: KUOTA, tutup: false };
  }));
});

// ---------- Reservasi ----------
app.post('/api/reservasi', wajibMasuk, (q, r) => {
  const { jenisKendaraan, merk, plat, tanggal, jam, layanan, keluhan } = q.body;
  const lay = (Array.isArray(layanan) ? layanan : [layanan]).map(v => String(v || '').trim()).filter(Boolean);
  if (!jenisKendaraan || !merk || !plat || !tanggal || !jam || !lay.length)
    return r.status(400).json({ pesan: 'Lengkapi data kendaraan, layanan, tanggal, dan jam.' });
  const tgl = new Date(tanggal + 'T00:00:00');
  if (lay.length > 8 || lay.some(v => v.length > 60)) return r.status(400).json({ pesan: 'Pilihan layanan tidak valid.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(tgl) || tanggal < hariIniWIB())
    return r.status(400).json({ pesan: 'Tanggal tidak boleh sudah lewat.' });
  if (tgl.getDay() === 0) return r.status(400).json({ pesan: 'Bengkel tutup pada hari Minggu.' });
  if (!JAM.includes(jam)) return r.status(400).json({ pesan: 'Jam tidak tersedia.' });

  const d = muat();
  const terisi = d.reservasi.filter(x => x.tanggal === tanggal && x.jam === jam && x.status !== 'Dibatalkan').length;
  if (terisi >= KUOTA) return r.status(409).json({ pesan: 'Jam ini sudah penuh. Pilih jam lain.' });

  const maksUrut = d.reservasi
    .filter(x => x.tanggal === tanggal)
    .reduce((m, x) => Math.max(m, Number(String(x.kode).split('-').pop()) || 0), 0);
  const kode = `BM-${tanggal.replace(/-/g, '')}-${String(maksUrut + 1).padStart(3, '0')}`;
  const u = d.users.find(x => x.id === q.session.uid);
  const baru = { id: buatId(), kode, userId: u.id, nama: u.nama, hp: u.hp,
    jenisKendaraan, merk, plat: String(plat).trim().toUpperCase(), tanggal, jam, layanan: lay.join(', '), daftarLayanan: lay,
    keluhan: keluhan || '', status: 'Menunggu', dibuat: new Date().toISOString() };
  d.reservasi.push(baru); simpan(d);
  r.json(baru);
});

app.get('/api/reservasi', wajibMasuk, (q, r) => {
  let list = muat().reservasi;
  if (q.session.role !== 'admin') list = list.filter(x => x.userId === q.session.uid);
  r.json(list.sort((a, b) => (b.tanggal + b.jam).localeCompare(a.tanggal + a.jam)));
});

app.patch('/api/reservasi/:id/batal', wajibMasuk, (q, r) => {
  const d = muat();
  const x = d.reservasi.find(v => v.id == q.params.id && v.userId === q.session.uid);
  if (!x) return r.status(404).json({ pesan: 'Reservasi tidak ditemukan.' });
  if (x.status !== 'Menunggu') return r.status(400).json({ pesan: 'Hanya reservasi berstatus Menunggu yang bisa dibatalkan.' });
  x.status = 'Dibatalkan'; simpan(d);
  r.json(x);
});

app.patch('/api/reservasi/:id/status', wajibMasuk, wajibAdmin, (q, r) => {
  if (!STATUS.includes(q.body.status)) return r.status(400).json({ pesan: 'Status tidak valid.' });
  const d = muat();
  const x = d.reservasi.find(v => v.id == q.params.id);
  if (!x) return r.status(404).json({ pesan: 'Reservasi tidak ditemukan.' });
  if (q.body.status === 'Selesai') {
    const b = biayaValid(q.body.biaya);
    if (b === null && x.biaya === undefined) return r.status(400).json({ pesan: 'Isi biaya akhir (angka rupiah) saat menandai Selesai.' });
    if (b !== null) x.biaya = b;
  }
  x.status = q.body.status; simpan(d);
  r.json(x);
});

app.patch('/api/reservasi/:id/biaya', wajibMasuk, wajibAdmin, (q, r) => {
  const b = biayaValid(q.body.biaya);
  if (b === null) return r.status(400).json({ pesan: 'Biaya harus berupa angka rupiah yang valid.' });
  const d = muat();
  const x = d.reservasi.find(v => v.id == q.params.id);
  if (!x) return r.status(404).json({ pesan: 'Reservasi tidak ditemukan.' });
  x.biaya = b; simpan(d);
  r.json(x);
});

// ---------- Pendapatan (hanya reservasi berstatus Selesai, berdasarkan tanggal servis) ----------
const NAMA_BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const iso = t => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
const senin = t => { const x = new Date(t.getFullYear(), t.getMonth(), t.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
app.get('/api/pendapatan', wajibMasuk, wajibAdmin, (q, r) => {
  const selesai = muat().reservasi.filter(x => x.status === 'Selesai').map(x => ({ t: new Date(x.tanggal + 'T00:00:00'), b: Number(x.biaya) || 0 }));
  const sum = fn => { const a = selesai.filter(fn); return { jumlah: a.length, total: a.reduce((n, x) => n + x.b, 0) }; };
  const now = new Date(), s0 = senin(now), mingguan = [], bulanan = [], tahunan = [];
  for (let i = 7; i >= 0; i--) {
    const a = new Date(s0); a.setDate(a.getDate() - 7 * i); const z = new Date(a); z.setDate(z.getDate() + 6); const key = iso(a);
    mingguan.push({ label: `${a.getDate()} ${NAMA_BLN[a.getMonth()]}`, rentang: `${a.getDate()} ${NAMA_BLN[a.getMonth()]} - ${z.getDate()} ${NAMA_BLN[z.getMonth()]} ${z.getFullYear()}`, ...sum(x => iso(senin(x.t)) === key) });
  }
  for (let i = 11; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    bulanan.push({ label: `${NAMA_BLN[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`, rentang: `${NAMA_BLN[m.getMonth()]} ${m.getFullYear()}`, ...sum(x => x.t.getFullYear() === m.getFullYear() && x.t.getMonth() === m.getMonth()) });
  }
  for (let i = 4; i >= 0; i--) { const y = now.getFullYear() - i; tahunan.push({ label: String(y), rentang: String(y), ...sum(x => x.t.getFullYear() === y) }); }
  r.json({ ringkas: { minggu: mingguan[7], bulan: bulanan[11], tahun: tahunan[4] }, mingguan, bulanan, tahunan });
});

// ---------- Lacak status (publik, tanpa login) ----------
app.get('/api/cek/:kode', batasiLaju('cek', 30, 60 * 1000), (q, r) => {
  const x = muat().reservasi.find(v => v.kode === q.params.kode.toUpperCase().trim());
  if (!x) return r.status(404).json({ pesan: 'Kode tidak ditemukan. Periksa kembali penulisannya.' });
  r.json({ kode: x.kode, status: x.status, layanan: x.layanan, tanggal: x.tanggal, jam: x.jam, merk: x.merk, plat: x.plat.slice(0, -2) + '**' });
});

// ---------- Daftar pelanggan (admin) ----------
app.get('/api/pelanggan', wajibMasuk, wajibAdmin, (q, r) => {
  const d = muat();
  r.json(d.users.filter(u => u.role === 'pelanggan').map(u => {
    const rs = d.reservasi.filter(x => x.userId === u.id), sl = rs.filter(x => x.status === 'Selesai');
    return { id: u.id, nama: u.nama, hp: u.hp, email: u.email, reservasi: rs.length, selesai: sl.length, total: sl.reduce((a, x) => a + (Number(x.biaya) || 0), 0), terakhir: rs.map(x => x.tanggal).sort().pop() || null };
  }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bengawan Motor berjalan di http://localhost:${PORT}`));
