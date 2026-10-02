/*
 * =============================================================
 *  DATA CV — EDIT FILE INI DENGAN DATA ASLIMU
 * =============================================================
 *  Semua isi game (bangunan, permata skill, dialog warga, CV klasik)
 *  diambil dari objek di bawah ini. Kamu cukup mengganti teksnya,
 *  tidak perlu menyentuh js/game.js.
 *
 *  Catatan:
 *  - Setiap item di `skills` otomatis menjadi 1 permata di peta.
 *  - `level` skill: 1 (pemula) sampai 5 (ahli).
 *  - Kosongkan ("") link kontak yang tidak ingin ditampilkan.
 */
(function () {
  const NAME = "Dinulimann";

  window.CV = {
    name: NAME,
    role: "Software Developer",
    location: "Indonesia",
    tagline: "Suka membangun hal-hal yang menyenangkan untuk dipakai.",

    about: [
      "Halo! Saya seorang developer yang senang mengubah ide menjadi produk nyata. " +
        "Saya menikmati proses dari merancang, menulis kode, sampai melihat orang lain memakai hasilnya.",
      "Saya terbiasa bekerja dalam tim, cepat belajar teknologi baru, dan selalu penasaran " +
        "bagaimana sesuatu bekerja di balik layar. (Ganti paragraf ini dengan ceritamu sendiri.)",
    ],

    facts: [
      "☕ Bahan bakar utama: kopi",
      "🎮 Hobi: main & bikin game",
      "📚 Sedang belajar: hal baru setiap minggu",
      "🌏 Bahasa: Indonesia, Inggris",
    ],

    experience: [
      {
        title: "Software Developer",
        company: "Nama Perusahaan",
        period: "2023 — Sekarang",
        points: [
          "Membangun dan merawat fitur utama aplikasi web.",
          "Berkolaborasi dengan desainer dan product manager.",
          "Meningkatkan performa halaman hingga 40%.",
        ],
      },
      {
        title: "Junior Developer",
        company: "Startup Contoh",
        period: "2021 — 2023",
        points: [
          "Mengembangkan REST API dan dashboard admin.",
          "Menulis unit test dan dokumentasi teknis.",
        ],
      },
      {
        title: "Magang Web Developer",
        company: "Agensi Digital",
        period: "2020 — 2021",
        points: ["Membuat landing page untuk klien.", "Belajar alur kerja Git dan code review."],
      },
    ],

    education: [
      {
        school: "Universitas Contoh",
        degree: "S1 Teknik Informatika",
        period: "2017 — 2021",
        detail: "IPK 3.6 · Aktif di komunitas programming kampus.",
      },
      {
        school: "SMA Contoh",
        degree: "Jurusan IPA",
        period: "2014 — 2017",
        detail: "Juara lomba karya ilmiah tingkat kota.",
      },
    ],

    // category bebas, tapi warna permata sudah disiapkan untuk:
    // Frontend, Backend, Tools, Soft Skill
    skills: [
      { name: "JavaScript", level: 5, category: "Frontend", note: "Bahasa favorit untuk web & game." },
      { name: "HTML & CSS", level: 5, category: "Frontend" },
      { name: "React", level: 4, category: "Frontend" },
      { name: "Node.js", level: 4, category: "Backend" },
      { name: "Python", level: 3, category: "Backend" },
      { name: "SQL", level: 3, category: "Backend" },
      { name: "Git & GitHub", level: 4, category: "Tools" },
      { name: "Figma", level: 3, category: "Tools" },
      { name: "Komunikasi", level: 4, category: "Soft Skill" },
      { name: "Kerja Tim", level: 5, category: "Soft Skill" },
    ],

    projects: [
      {
        name: "CV Quest",
        desc: "Game RPG di browser yang berisi CV interaktif — ya, game yang sedang kamu mainkan ini!",
        tech: ["JavaScript", "Canvas", "HTML/CSS"],
        link: "https://github.com/dinulimann/gamee",
      },
      {
        name: "Aplikasi Kasir",
        desc: "Aplikasi point-of-sale sederhana untuk UMKM dengan laporan penjualan harian.",
        tech: ["React", "Node.js", "PostgreSQL"],
        link: "",
      },
      {
        name: "Bot Pengingat",
        desc: "Bot chat yang mengingatkan jadwal dan tugas setiap pagi.",
        tech: ["Python", "API"],
        link: "",
      },
    ],

    contact: {
      email: "email@contoh.com",
      github: "https://github.com/dinulimann",
      linkedin: "",
      website: "",
    },

    // Warga desa. `home` = posisi tile [x, y] (peta 44 x 32).
    npcs: [
      {
        name: "Pak Kades",
        shirt: "#3d5a80",
        hair: "#d9d9d9",
        home: [16, 14],
        lines: [
          "Selamat datang di Desa CV! 👋",
          `Di sini kamu bisa mengenal ${NAME} lebih dekat.`,
          "Setiap bangunan berisi satu bagian CV. Masuk saja, pintunya selalu terbuka!",
        ],
      },
      {
        name: "Mbak Rara",
        shirt: "#c44569",
        hair: "#3b2416",
        home: [29, 16],
        lines: [
          "Psst... ada permata berkilau tersebar di seluruh desa ✨",
          "Setiap permata adalah satu skill. Kumpulkan semuanya untuk membuka Bengkel Skill sepenuhnya!",
        ],
      },
      {
        name: "Kang Ujang",
        shirt: "#2a9d8f",
        hair: "#1b1b1b",
        home: [5, 15],
        lines: [
          "Konon, kalau melempar koin ke air mancur, harapanmu bisa terkabul ⛲",
          "Kalau buru-buru, tekan tombol 📄 di pojok kanan atas untuk CV versi biasa.",
        ],
      },
    ],
  };
})();
