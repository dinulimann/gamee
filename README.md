# 🗺️ CV Quest

CV interaktif dalam bentuk **game RPG di browser**. Pengunjung berjalan-jalan di sebuah desa, masuk ke bangunan untuk membaca setiap bagian CV, mengumpulkan permata skill, mengobrol dengan warga, bertanya ke asisten AI, dan membuka pencapaian.

## Fitur

- 🏠 **6 bangunan = 6 bagian CV**: Tentang Saya, Pengalaman, Pendidikan, Keahlian, Proyek, Kontak
- 💎 **Permata skill** tersebar di peta. Setiap skill di `data.js` otomatis menjadi satu permata
- 💬 **Warga (NPC)** yang berkeliling, bisa diajak ngobrol, dan memberi petunjuk
- 🤖 **Robot Claude**: asisten AI di alun-alun yang menjawab pertanyaan bebas tentang CV (memakai Claude API)
- 🌗 **Siklus siang–malam**: satu hari di desa = 5 menit. Saat malam, lampu jalan, jendela, permata, dan kunang-kunang menyala
- 🎵 **Musik latar 8-bit** (versi lebih lembut saat malam), bisa dimatikan
- 🌐 **Dua bahasa**: Indonesia & English, termasuk isi CV-nya. Bahasa awal mengikuti bahasa browser pengunjung
- 🎮 **Simulasi optimasi payroll** di Kantor Karier: pilih langkah optimasi dan bawa proses dari >12 menit ke <1 menit
- 🔄 **Animasi pipeline data** Oracle → PostgreSQL → Payroll → Jurnal Oracle di Lab Proyek
- 💻 **Terminal rahasia** (tombol `` ` ``): jalankan SQL mini seperti `SELECT * FROM skills WHERE level >= 4;`
- 📋 **Papan tamu**: pengunjung bisa menempel pesan singkat (dengan filter tautan, spam judi, dan kata kasar)
- 🌧️ **Cuaca**: hujan turun sesekali, lengkap dengan suara rintik
- 🐱 **Kucing desa** bernama Kopi yang mengikutimu setelah diberi makan
- ⬇️ **Unduh CV (PDF)** dalam bahasa Indonesia atau Inggris
- 🔗 **Preview link** (gambar + deskripsi) saat dibagikan di WhatsApp, LinkedIn, dll.
- 📊 **Vercel Web Analytics** untuk melihat jumlah pengunjung
- ⛲ Air mancur untuk "melempar koin" (easter egg)
- 📜 Panel misi + 🏆 11 pencapaian + layar akhir dengan confetti
- 🗺️ Minimap yang bisa diklik untuk berjalan cepat
- 🖱️ Klik/ketuk untuk berjalan otomatis (pathfinding A*), atau pakai WASD/panah
- 📱 Bisa dimainkan di HP (kontrol sentuh + tombol aksi)
- 📄 **Mode CV klasik** untuk yang buru-buru, bisa dicetak atau disimpan sebagai PDF
- 🔊 Efek suara 8-bit (WebAudio), progres tersimpan otomatis di browser

## Mengisi CV kamu

Semua isi game ada di **`js/data.js`**: nama, peran, tentang, pengalaman, pendidikan, skill, proyek, kontak, dan dialog warga. Ganti saja isinya. `js/game.js` tidak perlu diubah.

- **Versi Inggris** ada di bagian bawah file yang sama (`window.CV_EN`). Isinya hanya teks yang perlu diterjemahkan, dengan urutan item yang sama seperti versi Indonesia.
- **Teks antarmuka** (tombol, petunjuk, pertanyaan contoh untuk Robot Claude) ada di `js/i18n.js`.
- Asisten AI membaca `js/data.js` yang sama, jadi jawabannya otomatis ikut berubah saat CV diperbarui.

## Asisten AI (Robot Claude)

Robot Claude memanggil Claude lewat Vercel Function di `api/ask.js`. Supaya aktif:

1. Buat API key di [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys).
2. Di Vercel: **Project → Settings → Environment Variables**, tambahkan `ANTHROPIC_API_KEY` dengan nilai API key tadi.
3. Deploy ulang (Deployments → ⋯ → Redeploy).

Tanpa API key, game tetap berjalan normal. Robot Claude hanya akan memberi tahu bahwa asisten AI belum aktif.

**Biaya:** setiap pertanyaan dibayar ke Anthropic sesuai pemakaian token. Model default-nya `claude-opus-5-5` dengan effort `low`, dan isi CV di-cache supaya pertanyaan berikutnya lebih murah. Untuk berjaga-jaga:

- Pasang **batas pengeluaran bulanan** di Anthropic Console (Settings → Limits).
- Function ini sudah membatasi tiap pengunjung (8 pertanyaan/menit, 60/jam per server), panjang pertanyaan (500 karakter), dan riwayat (10 pesan terakhir).
- Kalau ingin model lain, tambahkan environment variable `ANTHROPIC_MODEL` (misalnya `claude-sonnet-5-5`).

## Papan tamu

Pesan disimpan di Redis (Upstash, ada paket gratis). Supaya aktif:

1. Di Vercel: **Project → Storage → Create Database → Upstash for Redis** (atau lewat Marketplace), lalu hubungkan ke project ini.
2. Integrasi itu otomatis menambahkan `KV_REST_API_URL` dan `KV_REST_API_TOKEN`. Deploy ulang.

Tanpa database, papan tamu tetap tampil dengan keterangan "belum aktif". Pesan bisa dihapus lewat Upstash Console (key `cvquest:guestbook`). Setiap pengunjung dibatasi 1 pesan per menit dan 5 per hari; IP tidak disimpan (hanya hash harian).

## Analitik pengunjung

Aktifkan di Vercel: **Project → Analytics → Enable**. Jumlah pengunjung langsung tercatat. Event kustom (bangunan dibuka, pertanyaan ke Robot Claude, unduh PDF, dll.) hanya tercatat di paket Vercel yang mendukung custom events.

Pertanyaan yang diajukan ke Robot Claude dicatat tanpa identitas di **Vercel → Logs** (cari `[pertanyaan]`), sehingga kamu bisa melihat apa yang paling sering ditanyakan recruiter.

## PDF & gambar preview

`assets/cv-dinul-iman-id.pdf`, `assets/cv-dinul-iman-en.pdf`, dan `assets/og.png` dibuat otomatis dari `js/data.js`. Setelah mengubah CV, buat ulang dengan:

```bash
npm install --no-save playwright && npx playwright install chromium
node tools/build-assets.mjs
```

Catatan: beberapa aplikasi (mis. Facebook/LinkedIn) butuh alamat gambar preview yang lengkap. Kalau preview tidak muncul, ganti `assets/og.png` di `index.html` menjadi alamat penuh, misalnya `https://namadomain.vercel.app/assets/og.png`.

Tips: bagikan `…/?lang=en` untuk langsung membuka versi bahasa Inggris.

## Gambar (sprite)

Semua gambar ada di folder **`assets/`** (PNG transparan): tile tanah, pohon, air mancur, 6 bangunan (`building-<id>.png`), karakter (`player.png`, `npc-*.png`), permata per kategori skill (`gem-*.png`), `avatar.png`, `logo.png`, dan `title-bg.png`.

- Sprite karakter berupa strip 4 frame berjajar: **bawah, kiri, kanan, atas**. Animasi jalan ditangani kode.
- Sprite warga dipilih lewat field `sprite` di `js/data.js`.
- Ganti gambar cukup dengan menimpa file bernama sama. Kalau sebuah file tidak ada, game otomatis memakai gambar bawaan (digambar kode).
- Robot Claude dan lampu jalan digambar oleh kode.

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npx http-server .   # lalu buka http://localhost:8080
```

Untuk mencoba asisten AI secara lokal, pakai Vercel CLI: `npm install`, lalu `ANTHROPIC_API_KEY=... npx vercel dev`.

## Publikasi

- **Vercel** (disarankan, mendukung asisten AI): import repo di [vercel.com/new](https://vercel.com/new), biarkan pengaturan default, lalu Deploy.
- **GitHub Pages**: Settings → Pages → Source: *Deploy from a branch* → pilih branch dan folder `/ (root)`. Asisten AI tidak aktif di sini karena GitHub Pages tidak menjalankan kode server.

## Kontrol

| Aksi | Keyboard | Mouse / sentuh |
| --- | --- | --- |
| Berjalan | WASD / panah | Klik atau ketuk peta / minimap |
| Interaksi | E / Spasi / Enter | Klik objek / tombol 💬 |
| Misi | Q | 📜 |
| CV klasik | C | 📄 |
| Ganti bahasa | L | ID / EN |
| Efek suara | M | ⚙️ |
| Musik | N | ⚙️ |
| Siang / malam / otomatis | T | ⚙️ |
| Cuaca | R | ⚙️ |
| Terminal rahasia | `` ` `` | ⚙️ → Terminal |
| Bantuan | H | ❔ |
| Tutup | Esc | ✕ |
