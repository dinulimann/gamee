# 🗺️ CV Quest

CV interaktif dalam bentuk **game RPG di browser**. Pengunjung berjalan-jalan di sebuah desa, masuk ke bangunan untuk membaca setiap bagian CV, mengumpulkan permata skill, mengobrol dengan warga, dan membuka pencapaian.

## Fitur

- 🏠 **6 bangunan = 6 bagian CV**: Tentang Saya, Pengalaman, Pendidikan, Keahlian, Proyek, Kontak
- 💎 **Permata skill** tersebar di peta. Setiap skill di `data.js` otomatis menjadi satu permata
- 💬 **Warga (NPC)** yang berkeliling, bisa diajak ngobrol, dan memberi petunjuk
- ⛲ Air mancur untuk "melempar koin" (easter egg)
- 📜 Panel misi + 🏆 6 pencapaian + layar akhir dengan confetti
- 🗺️ Minimap yang bisa diklik untuk berjalan cepat
- 🖱️ Klik/ketuk untuk berjalan otomatis (pathfinding A*), atau pakai WASD/panah
- 📱 Bisa dimainkan di HP (kontrol sentuh + tombol aksi)
- 📄 **Mode CV klasik** untuk yang buru-buru, bisa dicetak atau disimpan sebagai PDF
- 🔊 Efek suara 8-bit (WebAudio), progres tersimpan otomatis di browser

## Mengisi CV kamu

Semua isi game ada di **`js/data.js`**: nama, peran, tentang, pengalaman, pendidikan, skill, proyek, kontak, dan dialog warga. Ganti saja isinya. `js/game.js` tidak perlu diubah.

## Gambar (sprite)

Semua gambar ada di folder **`assets/`** (PNG transparan): tile tanah, pohon, air mancur, 6 bangunan (`building-<id>.png`), karakter (`player.png`, `npc-*.png`), permata per kategori skill (`gem-*.png`), `avatar.png`, `logo.png`, dan `title-bg.png`.

- Sprite karakter berupa strip 4 frame berjajar: **bawah, kiri, kanan, atas**. Animasi jalan ditangani kode.
- Sprite warga dipilih lewat field `sprite` di `js/data.js`.
- Ganti gambar cukup dengan menimpa file bernama sama. Kalau sebuah file tidak ada, game otomatis memakai gambar bawaan (digambar kode).

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npx http-server .   # lalu buka http://localhost:8080
```

## Publikasi gratis (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → pilih branch dan folder `/ (root)`.
Game akan tersedia di `https://<username>.github.io/gamee/`.

## Kontrol

| Aksi | Keyboard | Mouse / sentuh |
| --- | --- | --- |
| Berjalan | WASD / panah | Klik atau ketuk peta / minimap |
| Interaksi | E / Spasi / Enter | Klik objek / tombol 💬 |
| Misi | Q | 📜 |
| CV klasik | C | 📄 |
| Suara | M | 🔊 |
| Tutup | Esc | ✕ |
