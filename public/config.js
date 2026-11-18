// ============================================================
//  PENGATURAN KONTEN WEBSITE BENGAWAN MOTOR
//  Ubah isi di bawah ini, simpan, lalu refresh browser (Ctrl+F5).
// ============================================================
const BENGKEL = {
  nama: 'Bengawan Motor',
  wa: '6285217570226',            // nomor WhatsApp (awali 62, tanpa +)
  waTampil: '0852 1757 0226',
  alamat: '',                     // ISI: alamat lengkap bengkel, contoh: 'Jl. Contoh No. 10, Jakarta'
  maps: '',                       // OPSIONAL: tempel link "Embed a map" dari Google Maps. Kosong = pakai pencarian dari alamat
  jam: [['Senin - Sabtu', '08.00 - 17.00'], ['Minggu', 'Tutup']],
  sosial: { instagram: '', facebook: '', tiktok: '', youtube: '' },   // ISI dengan link akun (https://...)
  tahunBerdiri: '',               // OPSIONAL: contoh '2010' (tampil di bagian Tentang jika diisi)

  tentang: [
    'Bengawan Motor adalah bengkel mobil yang melayani servis dan perawatan berkala kendaraan roda empat. Kami ingin pemilik mobil dapat merawat kendaraannya dengan tenang, tanpa harus menghabiskan waktu menunggu giliran.',
    'Untuk itu, Bengawan Motor menyediakan sistem reservasi daring. Pelanggan dapat memilih layanan, menentukan jam masuk mobil, lalu memantau perkembangan pengerjaan dari mana saja.'
  ],

  // Foto galeri: letakkan file di folder public/img/galeri/ lalu sesuaikan nama file di sini.
  galeri: [
    { foto: 'img/galeri/1.jpg', judul: 'Area Servis' },
    { foto: 'img/galeri/2.jpg', judul: 'Teknisi Bekerja' },
    { foto: 'img/galeri/3.jpg', judul: 'Pemeriksaan Mesin' },
    { foto: 'img/galeri/4.jpg', judul: 'Ruang Tunggu' },
    { foto: 'img/galeri/5.jpg', judul: 'Peralatan Bengkel' },
    { foto: 'img/galeri/6.jpg', judul: 'Hasil Pengerjaan' }
  ],

  alasan: [
    ['cek', 'Reservasi Tanpa Antre', 'Pilih layanan, tanggal, dan jam masuk mobil dari rumah, lalu datang sesuai jadwal.'],
    ['jam', 'Jam Masuk Terjadwal', 'Setiap jam dibatasi tiga mobil agar pengerjaan tidak menumpuk dan mobil Anda lebih cepat ditangani.'],
    ['pantau', 'Pantau Status Servis', 'Kode reservasi dapat dipakai untuk melihat tahap pengerjaan, dari menunggu sampai selesai.'],
    ['harga', 'Estimasi Biaya di Awal', 'Perkiraan biaya setiap layanan ditampilkan sebelum Anda memesan, sehingga tidak ada kejutan.'],
    ['mesin', 'Layanan Lengkap', 'Servis berkala, ganti oli, tune up, rem, AC, kelistrikan, spooring, hingga transmisi.'],
    ['wa', 'Komunikasi via WhatsApp', 'Konfirmasi jadwal dan kabar pengerjaan dapat disampaikan langsung lewat WhatsApp.']
  ],

  testimoniContoh: true,          // ubah ke false setelah diganti dengan ulasan asli
  testimoni: [
    { nama: 'Andi Pratama', mobil: 'Toyota Avanza', bintang: 5, teks: 'Booking lewat web mudah sekali. Datang sesuai jam yang dipilih, mobil langsung dikerjakan tanpa menunggu lama.' },
    { nama: 'Siti Rahma', mobil: 'Honda Brio', bintang: 5, teks: 'Saya bisa cek status servis dari HP, jadi tidak perlu bolak-balik menelepon bengkel.' },
    { nama: 'Budi Hartono', mobil: 'Daihatsu Xenia', bintang: 4, teks: 'Estimasi biayanya jelas dari awal dan pelayanannya rapi. Layanan AC-nya juga memuaskan.' }
  ],

  faq: [
    ['Bagaimana cara melakukan reservasi?', 'Daftar atau masuk ke akun Anda, buka halaman Booking Servis, pilih layanan, tanggal, dan jam masuk mobil, lalu tekan Kirim reservasi. Anda akan menerima kode reservasi.'],
    ['Apakah saya bisa memilih lebih dari satu layanan?', 'Bisa. Pada formulir reservasi, centang semua layanan yang dibutuhkan. Estimasi biaya akan dijumlahkan otomatis.'],
    ['Berapa lama sebelumnya saya harus reservasi?', 'Reservasi dapat dibuat mulai hari ini untuk jam yang masih tersedia sampai tanggal yang Anda inginkan, kecuali hari Minggu karena bengkel tutup.'],
    ['Mengapa ada jam yang tidak bisa dipilih?', 'Setiap jam dibatasi tiga mobil. Jam yang sudah penuh ditandai dan tidak dapat dipilih, silakan pilih jam lain.'],
    ['Bagaimana cara mengecek status servis?', 'Masukkan kode reservasi pada kolom Cek Status di beranda. Anda juga dapat melihat riwayat di halaman Reservasi saya setelah masuk.'],
    ['Apakah reservasi bisa dibatalkan?', 'Bisa, selama statusnya masih Menunggu. Buka Reservasi saya, lalu tekan Batalkan pada reservasi yang dimaksud.'],
    ['Apakah estimasi biaya sudah final?', 'Estimasi adalah perkiraan awal. Biaya akhir ditentukan setelah pemeriksaan kendaraan di bengkel.']
  ]
};
