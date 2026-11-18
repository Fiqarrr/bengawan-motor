const $ = (s, el = document) => el.querySelector(s);
const WA = (typeof BENGKEL !== 'undefined' && BENGKEL.wa) || '6285217570226';
// Harga adalah estimasi awal; sesuaikan dengan tarif Bengawan Motor.
const LAYANAN = [
  { n: 'Servis Berkala', h: 350000, i: 'cek', d: 'Pemeriksaan menyeluruh sesuai jarak tempuh' },
  { n: 'Ganti Oli', h: 250000, i: 'oli', d: 'Oli mesin dan filter oli' },
  { n: 'Tune Up', h: 450000, i: 'gauge', d: 'Penyetelan mesin, busi, dan sistem bahan bakar' },
  { n: 'Servis Rem', h: 300000, i: 'rem', d: 'Kampas, cakram, dan minyak rem' },
  { n: 'Servis AC', h: 350000, i: 'ac', d: 'Pembersihan, pengisian freon, dan pemeriksaan kompresor' },
  { n: 'Kelistrikan & Aki', h: 200000, i: 'bolt', d: 'Aki, alternator, kabel, dan lampu' },
  { n: 'Spooring dan Balancing', h: 250000, i: 'ban', d: 'Kelurusan roda dan keseimbangan ban' },
  { n: 'Servis Transmisi', h: 800000, i: 'gear', d: 'Transmisi manual dan otomatis, kopling' }
];
const IKON = {
  cek: 'M4 12l5 5L20 6', oli: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z', gauge: 'M4 17a8 8 0 1 1 16 0M12 13l4-4',
  rem: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z', ban: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 3v5M12 16v5M3 12h5M16 12h5',
  mesin: 'M5 9h14v8H5zM9 9V6h6v3M2 12v3M22 12v3', ac: 'M12 2v20M4.5 7l15 10M19.5 7l-15 10',
  jam: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', pantau: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  harga: 'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', wa: 'M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.3A8 8 0 1 1 21 12z',
  pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', telp: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  kamera: 'M3 8h4l2-3h6l2 3h4v11H3zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01',
  facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1z', tiktok: 'M16 3v10a4 4 0 1 1-4-4M16 3c.4 2.4 2 4 4.5 4.3',
  youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z'
};
const ikon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IKON[k]}"/></svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + n.toLocaleString('id-ID');

async function api(url, metode = 'GET', data) {
  const r = await fetch(url, { method: metode, headers: { 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.pesan || 'Terjadi kesalahan.');
  return j;
}
function toast(teks, galat = false) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = teks; t.className = galat ? 'err' : ''; t.style.display = 'block';
  clearTimeout(t._w); t._w = setTimeout(() => t.style.display = 'none', 3500);
}
async function pasangNav() {
  const u = await api('/api/saya').catch(() => null), B = BENGKEL;
  const hal = location.pathname.replace(/index\.html$/, ''), home = hal === '/', p = home ? '' : '/';
  const T = (href, label) => `<a href="${href}"${hal === href ? ' class="aktif" aria-current="page"' : ''}>${label}</a>`;
  const akun = !u ? T('/auth.html', 'Masuk / Daftar') : u.role === 'admin' ? `${T('/admin.html', 'Dashboard admin')}<a href="#" id="keluar">Keluar</a>`
    : `${T('/reservasi.html', 'Reservasi saya')}<a href="#" id="keluar">Keluar (${esc(u.nama.split(' ')[0])})</a>`;
  document.body.insertAdjacentHTML('afterbegin', `<header class="atas"><div class="dalam">
    <a class="merek" href="/" aria-label="Bengawan Motor, beranda"><img src="/logo-kiri.svg" alt="">BENGAWAN MOTOR</a>
    <button class="burger" aria-label="Buka menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <nav id="nav">${T('/', 'Beranda')}<a href="${p}#layanan">Layanan</a><a href="${p}#tentang">Tentang</a><a href="${p}#galeri">Galeri</a><a href="${p}#faq">FAQ</a><a href="${p}#lokasi">Lokasi</a>${akun}</nav></div></header>`);
  const sos = Object.entries(B.sosial).map(([k, v]) => `<a href="${v || '#'}" ${v ? 'target="_blank" rel="noopener"' : 'class="mati" title="Isi link di config.js"'} aria-label="${k}">${ikon(k)}</a>`).join('');
  document.body.insertAdjacentHTML('beforeend', `<footer class="bawah"><div class="dalam atas-f">
    <div><div class="m"><img src="/logo-kiri.svg" alt="">BENGAWAN MOTOR</div><p>Bengkel mobil untuk servis dan perawatan berkala. Reservasi mudah, jam masuk terjadwal, dan status pengerjaan yang bisa dipantau.</p>
      <a class="btn kecil" style="display:inline-block" href="https://wa.me/${B.wa}" target="_blank" rel="noopener">Chat WhatsApp</a></div>
    <div><h4>Navigasi</h4><a href="/">Beranda</a><a href="${p}#layanan">Layanan</a><a href="${p}#tentang">Tentang</a><a href="${p}#galeri">Galeri</a><a href="${p}#faq">FAQ</a><a href="${p}#lokasi">Lokasi</a></div>
    <div><h4>Jam Operasional</h4>${B.jam.map(([h, j]) => `<p style="margin:0 0 6px">${h}<br><b style="color:#fff">${j}</b></p>`).join('')}</div>
    <div><h4>Hubungi Kami</h4><p style="margin:0 0 6px">WhatsApp<br><a href="https://wa.me/${B.wa}" target="_blank" rel="noopener" style="display:inline;color:#fff;font-weight:600">${B.waTampil}</a></p>${B.alamat ? `<p style="margin:0 0 6px">${esc(B.alamat)}</p>` : ''}<div class="sos">${sos}</div></div></div>
    <div class="dalam hak"><span>© ${new Date().getFullYear()} Bengkel Bengawan Motor. Seluruh hak cipta dilindungi.</span><img src="/logo-kanan.svg" alt=""></div></footer>`);
  if (!$('link[rel=icon]')) document.head.insertAdjacentHTML('beforeend', '<link rel="icon" href="/logo-kiri.svg" type="image/svg+xml">');
  const bg = $('.burger'); bg.onclick = () => { const o = document.body.classList.toggle('nav-buka'); bg.setAttribute('aria-expanded', o); };
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('nav-buka')));
  const k = $('#keluar'); if (k) k.onclick = async e => { e.preventDefault(); await api('/api/keluar', 'POST'); location.href = '/'; };
  return u;
}
const fmtTgl = t => new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const isoLokal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hariIniISO = (tambah = 0) => { const d = new Date(); d.setDate(d.getDate() + tambah); return isoLokal(d); };
const LANGKAH = ['Menunggu', 'Dikonfirmasi', 'Dikerjakan', 'Selesai'];
const garisWaktu = s => s === 'Dibatalkan' ? '<span class="lencana batal">Dibatalkan</span>'
  : `<ol class="langkah">${LANGKAH.map((l, i) => `<li class="${i <= LANGKAH.indexOf(s) ? 'on' : ''}"><i></i>${l}</li>`).join('')}</ol>`;
const linkWA = (nomor, teks) => `https://wa.me/${nomor}?text=${encodeURIComponent(teks)}`;

async function isiSlot(tanggal, el) {
  const slot = await api('/api/slot?tanggal=' + tanggal);
  if (slot.length && slot.every(s => s.tutup)) {
    el.innerHTML = '<div class="slot penuh" style="grid-column:1/-1;text-decoration:none">Bengkel tutup pada hari Minggu</div>';
    return;
  }
  el.innerHTML = slot.map(s => `<div class="slot ${s.sisa ? '' : 'penuh'}"><b>${s.jam}</b>${s.sisa ? '' : '<span class="sisa">Penuh</span>'}</div>`).join('');
}
