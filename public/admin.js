Object.assign(IKON, { dash: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', resv: 'M9 3h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4', pel: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18', keluar: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  cari: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3', bel: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', kal: 'M3 6h18v15H3zM3 10h18M8 2v4M16 2v4', menu: 'M4 7h16M4 12h16M4 17h16', unduh: 'M12 3v12M7 10l5 5 5-5M4 21h16', kunci: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' });
const STATUS = ['Menunggu', 'Dikonfirmasi', 'Dikerjakan', 'Selesai', 'Dibatalkan'], WARNA = { Menunggu: '#f59e0b', Dikonfirmasi: '#3b82f6', Dikerjakan: '#a855f7', Selesai: '#16a34a', Dibatalkan: '#ef4444' };
const HAL = ['dashboard', 'reservasi', 'pelanggan', 'pendapatan'];
let data = [], pel = [], uang = null, modeUang = 'mingguan', cari = '', user;
const rpf = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID'), ringkas = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' jt' : n >= 1e3 ? Math.round(n / 1e3) + ' rb' : String(n);
const tglP = t => new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), nomorWA = h => h.replace(/\D/g, '').replace(/^0/, '62');
const ik = k => ikon(k), cocok = x => !cari || (x.kode + x.nama + x.plat + x.merk + x.layanan).toLowerCase().includes(cari);
const angka = v => Number(String(v).replace(/[^\d]/g, '')), jumlah = (a, f) => a.reduce((s, x) => s + f(x), 0);

(async () => {
  user = await api('/api/saya').catch(() => null);
  if (!user || user.role !== 'admin') return location.href = '/auth.html';
  const h = new Date().getHours();
  $('#salam').textContent = `${h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'}, ${user.nama.split(' ')[0]} 👋`;
  $('#avatar').textContent = user.nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  $('#menu').innerHTML = `<p class="grup">UTAMA</p><a href="#dashboard">${ik('dash')}Dashboard</a><p class="grup">OPERASIONAL</p><a href="#reservasi">${ik('resv')}Reservasi<span class="bdg" id="bdg"></span></a><a href="#pelanggan">${ik('pel')}Pelanggan</a>
    <p class="grup">KEUANGAN</p><a href="#pendapatan">${ik('harga')}Pendapatan</a><p class="grup">SISTEM</p><a href="/" target="_blank" rel="noopener">${ik('web')}Lihat Website</a>`;
  $('#bSandi').innerHTML = ik('kunci') + 'Ubah Kata Sandi';
  $('#bSandi').onclick = bukaUbahSandi;
  $('#keluar').innerHTML = ik('keluar') + 'Keluar'; $('#icari').innerHTML = ik('cari'); $('#iunduh').innerHTML = ik('unduh'); $('#ibel').innerHTML = ik('bel'); $('#burger').innerHTML = ik('menu');
  $('#fSt').innerHTML += STATUS.map(s => `<option>${s}</option>`).join('');
  $('#keluar').onclick = async () => { await api('/api/keluar', 'POST'); location.href = '/'; };
  const tutup = () => { $('#side').classList.remove('buka'); $('#scrim').classList.remove('buka'); };
  $('#burger').onclick = () => { $('#side').classList.add('buka'); $('#scrim').classList.add('buka'); }; $('#scrim').onclick = tutup; $('#menu').onclick = e => { if (e.target.closest('a')) tutup(); };
  $('#cari').oninput = e => { cari = e.target.value.toLowerCase(); render(); };
  ['fTgl', 'fSt'].forEach(id => $('#' + id).oninput = render);
  $('#reset').onclick = () => { $('#fTgl').value = $('#fSt').value = ''; render(); };
  $('#csv').onclick = unduh;
  $('#bel').onclick = () => { $('#fSt').value = 'Menunggu'; if (halIni() === 'reservasi') render(); else location.hash = '#reservasi'; };
  $('#uangTab').onclick = e => { const b = e.target.closest('button'); if (!b) return; modeUang = b.dataset.m; document.querySelectorAll('#uangTab button').forEach(x => x.classList.toggle('aktif', x === b)); renderUang(); };
  window.onhashchange = render; await muat(); render();
})();

const halIni = () => HAL.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
async function muat() { [data, uang, pel] = await Promise.all([api('/api/reservasi'), api('/api/pendapatan'), api('/api/pelanggan')]); }
function render() {
  const h = halIni();
  document.querySelectorAll('.hal').forEach(s => s.hidden = s.id !== 'p-' + h);
  document.querySelectorAll('#menu a').forEach(a => a.classList.toggle('aktif', a.getAttribute('href') === '#' + h));
  const m = data.filter(x => x.status === 'Menunggu').length; $('#bdg').textContent = m || ''; $('#belN').textContent = m || '';
  ({ dashboard: renderDash, reservasi: renderReservasi, pelanggan: renderPelanggan, pendapatan: renderUang })[h]();
}
/* ---------- Dashboard ---------- */
function area(v) {
  const W = 300, H = 130, P = 10, mx = Math.max(...v, 1), pt = v.map((y, i) => [P + i * (W - 2 * P) / (v.length - 1), H - P - (y / mx) * (H - 2 * P - 8)]);
  let d = `M${pt[0][0]},${pt[0][1]}`; for (let i = 1; i < pt.length; i++) { const c = (pt[i - 1][0] + pt[i][0]) / 2; d += ` C${c},${pt[i - 1][1]} ${c},${pt[i][1]} ${pt[i][0]},${pt[i][1]}`; }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik pendapatan mingguan"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f48d8" stop-opacity=".3"/><stop offset="1" stop-color="#8f48d8" stop-opacity="0"/></linearGradient></defs><path d="${d} L${pt.at(-1)[0]},${H} L${pt[0][0]},${H}Z" fill="url(#ga)"/><path d="${d}" fill="none" stroke="#7a37c4" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}
function renderDash() {
  const hari = hariIniISO(), sel = data.filter(x => x.status === 'Selesai'), n = s => data.filter(x => x.status === s).length;
  const pd = t => jumlah(sel.filter(x => x.tanggal === t), x => +x.biaya || 0), rev = pd(hari), rev0 = pd(hariIniISO(-1)), dl = rev0 ? Math.round((rev - rev0) / rev0 * 100) : null;
  const sen = new Date(); sen.setHours(0, 0, 0, 0); sen.setDate(sen.getDate() - ((sen.getDay() + 6) % 7)); const mgg = [...Array(7)].map((_, i) => { const d = new Date(sen); d.setDate(d.getDate() + i); return isoLokal(d); });
  const aktifHari = data.filter(x => x.tanggal === hari && x.status !== 'Dibatalkan').length, aktifMgg = data.filter(x => mgg.includes(x.tanggal) && x.status !== 'Dibatalkan').length;
  const K = [['Pendapatan Hari Ini', rpf(rev), dl === null ? 'Belum ada pembanding kemarin' : `${dl >= 0 ? '+' : ''}${dl}% vs kemarin`, dl !== null && dl < 0 ? 't2' : dl === null ? '' : 'n', 'harga', '#dcfce7', '#16a34a'],
    ['Mobil Dikerjakan', n('Dikerjakan'), `${n('Dikonfirmasi')} sudah dikonfirmasi`, '', 'gear', '#dbeafe', '#3b82f6'], ['Menunggu Konfirmasi', n('Menunggu'), `${data.filter(x => x.status === 'Menunggu' && x.tanggal === hari).length} jadwal hari ini`, n('Menunggu') ? 't2' : '', 'jam', '#fef3c7', '#f59e0b'],
    ['Jadwal Hari Ini', aktifHari, `${aktifMgg} reservasi minggu ini`, '', 'kal', '#f3e8ff', '#8f48d8']];
  $('#stat').innerHTML = K.map(([a, b, c, k, i, bg, wr]) => `<div class="sk"><div class="t"><span>${a}</span><span class="ic" style="background:${bg};color:${wr}">${ik(i)}</span></div><b>${b}</b><small class="${k}">${c}</small></div>`).join('');
  const batas = hariIniISO(-7), col = s => { let a = data.filter(x => x.status === s && cocok(x)); if (s === 'Selesai') a = a.filter(x => x.tanggal >= batas).sort((p, q) => (q.tanggal + q.jam).localeCompare(p.tanggal + p.jam)); else a.sort((p, q) => (p.tanggal + p.jam).localeCompare(q.tanggal + q.jam)); return a; };
  $('#board').innerHTML = ['Menunggu', 'Dikonfirmasi', 'Dikerjakan', 'Selesai'].map(s => { const a = col(s);
    return `<div class="kol"><div class="kol-h"><span class="dot" style="background:${WARNA[s]}"></span>${s === 'Selesai' ? 'Selesai (7 hari)' : s}<span class="cnt">${a.length}</span></div>${a.map(x => `<button class="jc" onclick="detail(${x.id})"><b>${esc(x.merk)}</b><code>${esc(x.plat)}</code><span class="ly">${esc(x.layanan)}</span><div class="meta"><span>${x.tanggal === hari ? 'Hari ini' : tglP(x.tanggal)}, jam ${x.jam}</span>${x.tanggal === hari && s !== 'Selesai' ? '<em class="tag">HARI INI</em>' : ''}</div><div class="cu">${esc(x.nama)}</div></button>`).join('') || '<div class="kosong">Tidak ada</div>'}</div>`; }).join('');
  const per = {}; data.filter(x => x.status !== 'Dibatalkan').forEach(x => per[x.userId] = (per[x.userId] || 0) + 1); const tp = Object.keys(per).length, ul = Object.values(per).filter(v => v > 1).length;
  const biaya = a => a.filter(x => +x.biaya > 0), avg = a => a.length ? Math.round(jumlah(a, x => +x.biaya) / a.length) : 0, ini = hari.slice(0, 7), lalu = isoLokal(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)).slice(0, 7);
  const a1 = avg(biaya(sel.filter(x => x.tanggal.startsWith(ini)))), a0 = avg(biaya(sel.filter(x => x.tanggal.startsWith(lalu))));
  const tot = data.length - n('Dibatalkan'), w = mgg.map(pd), jamH = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(j => data.filter(x => x.tanggal === hari && x.jam === j && x.status !== 'Dibatalkan').length);
  $('#insights').innerHTML = `<div class="kt"><span>Pelanggan Berulang</span><b>${tp ? Math.round(ul / tp * 100) : 0}%</b><small class="g">${ul} dari ${tp} pelanggan</small></div>
    <div class="kt"><span>Rata-rata Biaya Servis</span><b>${rpf(avg(biaya(sel)))}</b><small class="${a1 >= a0 ? '' : 'g'}">${a1 && a0 ? `${rpf(Math.abs(a1 - a0))} ${a1 >= a0 ? 'lebih tinggi' : 'lebih rendah'} dari bulan lalu` : 'Belum ada pembanding bulan lalu'}</small></div>
    <div class="kt"><span>Tingkat Penyelesaian</span><b>${tot ? Math.round(sel.length / tot * 100) : 0}%</b><small class="g">${sel.length} dari ${tot} reservasi aktif</small></div>
    <div class="kt"><h3>Pendapatan Minggu Ini</h3><div class="area">${area(w)}</div><div class="sb">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => `<span>${x}</span>`).join('')}</div></div>
    <div class="kt"><h3>Mobil Masuk per Jam Hari Ini</h3><div class="bars">${jamH.map((v, i) => `<div><i style="height:${v ? Math.max(v / 3 * 110, 8) : 3}px" title="${v} mobil"></i>${['08', '09', '10', '11', '13', '14', '15', '16'][i]}</div>`).join('')}</div></div>`;
}
/* ---------- Reservasi ---------- */
function daftarR() { const t = $('#fTgl').value, s = $('#fSt').value; return data.filter(x => cocok(x) && (!t || x.tanggal === t) && (!s || x.status === s)); }
function renderReservasi() {
  const a = daftarR();
  $('#isiR').innerHTML = a.length ? a.map(x => { const pesan = `Halo ${x.nama}, reservasi ${x.kode} (${x.layanan}) pada ${fmtTgl(x.tanggal)}, jam masuk mobil ${x.jam}, berstatus ${x.status}.`;
    return `<tr><td data-label="Kode"><b>${esc(x.kode)}</b></td><td data-label="Pelanggan">${esc(x.nama)}<br><a class="wa" target="_blank" rel="noopener" href="${linkWA(nomorWA(x.hp), pesan)}">Chat WhatsApp</a></td>
      <td data-label="Kendaraan">${esc(x.jenisKendaraan)}: ${esc(x.merk)}<br><small>${esc(x.plat)}</small></td><td data-label="Layanan dan keluhan">${esc(x.layanan).replace(/, /g, '<br>')}<br><small>${esc(x.keluhan) || '-'}</small></td>
      <td data-label="Jam masuk">${fmtTgl(x.tanggal)}<br><small>${x.jam}</small></td><td data-label="Status"><select onchange="ubah(${x.id}, this.value)">${STATUS.map(v => `<option ${v === x.status ? 'selected' : ''}>${v}</option>`).join('')}</select>${x.status === 'Selesai' ? `<br><small>Biaya: ${rpf(x.biaya)} <a href="#" class="wa" onclick="ubahBiaya(${x.id});return false">ubah</a></small>` : ''}</td></tr>`; }).join('')
    : '<tr><td colspan="6">Tidak ada reservasi yang cocok dengan pencarian atau filter.</td></tr>';
}
function renderPelanggan() {
  const a = pel.filter(p => !cari || (p.nama + p.email + p.hp).toLowerCase().includes(cari));
  $('#isiP').innerHTML = a.length ? a.map(p => `<tr><td data-label="Pelanggan"><b>${esc(p.nama)}</b><br><a class="wa" target="_blank" rel="noopener" href="${linkWA(nomorWA(p.hp), 'Halo ' + p.nama + ', ')}">${esc(p.hp)}</a></td><td data-label="Email">${esc(p.email)}</td><td data-label="Reservasi">${p.reservasi}</td><td data-label="Selesai">${p.selesai}</td><td data-label="Total biaya">${rpf(p.total)}</td><td data-label="Terakhir">${p.terakhir ? fmtTgl(p.terakhir) : '-'}</td></tr>`).join('') : '<tr><td colspan="6">Belum ada pelanggan yang cocok.</td></tr>';
}
/* ---------- Pendapatan ---------- */
function renderUang() {
  const r = uang.ringkas;
  $('#uangK').innerHTML = [['Minggu ini', r.minggu], ['Bulan ini', r.bulan], ['Tahun ini', r.tahun]].map(([l, v]) => `<div><span>${l}</span><b>${rpf(v.total)}</b><small>${v.jumlah} servis selesai</small></div>`).join('');
  const s = uang[modeUang], mx = Math.max(...s.map(x => x.total), 0);
  $('#grafik').innerHTML = mx ? s.map(x => `<div class="k" title="${esc(x.rentang)}: ${rpf(x.total)} (${x.jumlah} servis)"><i>${x.total ? ringkas(x.total) : ''}</i><div class="bar" style="height:${x.total ? Math.max(Math.round(x.total / mx * 140), 4) : 0}px"></div><span>${esc(x.label)}</span></div>`).join('') : '<div class="kosong">Belum ada pendapatan pada periode ini. Isi biaya akhir saat menandai reservasi sebagai Selesai.</div>';
  $('#daftarU').innerHTML = [...s].reverse().map(x => `<div class="bu"><span>${esc(x.rentang)}</span><span>${x.jumlah} servis</span><b>${rpf(x.total)}</b></div>`).join('');
}
/* ---------- Aksi ---------- */
function detail(id) {
  const x = data.find(v => v.id === id);
  $('#dlg').innerHTML = `<div class="dlg-h"><div><h3>${esc(x.merk)}</h3><code>${esc(x.plat)} · ${esc(x.kode)}</code></div><button class="x" onclick="$('#dlg').close()" aria-label="Tutup">×</button></div>
    <dl><dt>Pelanggan</dt><dd>${esc(x.nama)}</dd><dt>Layanan</dt><dd>${esc(x.layanan).replace(/, /g, '<br>')}</dd><dt>Jam masuk</dt><dd>${fmtTgl(x.tanggal)}, ${x.jam}</dd><dt>Keluhan</dt><dd>${esc(x.keluhan) || '-'}</dd>${x.status === 'Selesai' ? `<dt>Biaya akhir</dt><dd>${rpf(x.biaya)} <a href="#" class="wa" onclick="ubahBiaya(${x.id});return false">ubah</a></dd>` : ''}</dl>
    <b>Ubah status</b><div class="cs-wrap">${STATUS.map(s => `<button class="cs ${s === x.status ? 'on' : ''}" style="--w:${WARNA[s]}" onclick="ubah(${x.id}, '${s}')">${s}</button>`).join('')}</div>
    <a class="btn-v kecil" target="_blank" rel="noopener" href="${linkWA(nomorWA(x.hp), `Halo ${x.nama}, reservasi ${x.kode} (${x.layanan}) pada ${fmtTgl(x.tanggal)}, jam masuk mobil ${x.jam}, berstatus ${x.status}.`)}">Chat WhatsApp</a>`;
  $('#dlg').showModal();
}
function mintaBiaya(judul, nilaiAwal, onSimpan, onBatal) {
  const dlg = $('#dlg');
  dlg.innerHTML = `<div class="dlg-h"><div><h3>${esc(judul)}</h3></div><button class="x" type="button" id="bTutupB" aria-label="Tutup">×</button></div>
    <form class="dlg-form" id="fBiaya">
      <label>Biaya akhir servis (Rp)<input class="dlg-in" id="inBiaya" type="number" min="0" max="1000000000" step="1000" required value="${Number(nilaiAwal || 0)}"></label>
      <div class="dlg-aksi"><button class="btn-v kecil garis" type="button" id="bBatalB">Batal</button><button class="btn-v kecil" type="submit">Simpan</button></div>
    </form>`;
  const tutup = () => { dlg.close(); if (onBatal) onBatal(); };
  $('#bTutupB').onclick = tutup;
  $('#bBatalB').onclick = tutup;
  $('#fBiaya').onsubmit = async e => {
    e.preventDefault();
    await onSimpan(angka($('#inBiaya').value));
  };
  dlg.showModal();
  $('#inBiaya').focus();
}
function bukaUbahSandi() {
  const dlg = $('#dlg');
  dlg.innerHTML = `<div class="dlg-h"><div><h3>Ubah Kata Sandi</h3></div><button class="x" type="button" onclick="$('#dlg').close()" aria-label="Tutup">×</button></div>
    <form class="dlg-form" id="fSandi">
      <label>Kata sandi lama<input class="dlg-in" id="sLama" type="password" required autocomplete="current-password"></label>
      <label>Kata sandi baru (minimal 6 karakter)<input class="dlg-in" id="sBaru" type="password" minlength="6" required autocomplete="new-password"></label>
      <div class="dlg-aksi"><button class="btn-v kecil garis" type="button" onclick="$('#dlg').close()">Batal</button><button class="btn-v kecil" type="submit">Simpan</button></div>
    </form>`;
  $('#fSandi').onsubmit = async e => {
    e.preventDefault();
    try {
      const r = await api('/api/akun/password', 'PATCH', { passwordLama: $('#sLama').value, passwordBaru: $('#sBaru').value });
      dlg.close(); toast(r.pesan || 'Kata sandi diperbarui.');
    } catch (err) { toast(err.message, true); }
  };
  dlg.showModal();
  $('#sLama').focus();
}
async function ubah(id, status) {
  const x = data.find(v => v.id === id);
  if (status === x.status) return;
  const kirim = async biaya => {
    try { await api(`/api/reservasi/${id}/status`, 'PATCH', { status, biaya }); await muat(); $('#dlg').open && $('#dlg').close(); render(); toast('Status diubah menjadi ' + status + '.'); }
    catch (e) { toast(e.message, true); render(); }
  };
  if (status === 'Selesai') {
    const nama = x.daftarLayanan || String(x.layanan).split(', '), est = jumlah(nama, n => (LAYANAN.find(l => l.n === n) || {}).h || 0);
    return mintaBiaya(`Selesaikan ${x.kode}`, x.biaya ?? est, kirim, render);
  }
  await kirim();
}
async function ubahBiaya(id) {
  const x = data.find(v => v.id === id);
  mintaBiaya(`Ubah Biaya ${x.kode}`, x.biaya ?? 0, async biaya => {
    try { await api(`/api/reservasi/${id}/biaya`, 'PATCH', { biaya }); await muat(); $('#dlg').open && $('#dlg').close(); render(); toast('Biaya diperbarui.'); }
    catch (e) { toast(e.message, true); }
  });
}
function unduh() {
  const k = ['kode', 'nama', 'hp', 'jenisKendaraan', 'merk', 'plat', 'layanan', 'tanggal', 'jam', 'status', 'biaya', 'keluhan'], a = halIni() === 'reservasi' ? daftarR() : data.filter(cocok);
  const baris = [k.join(',')].concat(a.map(x => k.map(f => '"' + String(x[f] ?? '').replace(/"/g, '""') + '"').join(',')));
  const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob(['\ufeff' + baris.join('\n')], { type: 'text/csv' })); l.download = 'reservasi-bengawan-motor.csv'; l.click();
}
