/*
 * =============================================================
 *  DATA CV — EDIT FILE INI UNTUK MENGUBAH ISI GAME
 * =============================================================
 *  Semua isi game (bangunan, permata skill, dialog warga, CV klasik)
 *  diambil dari objek di bawah ini. Tidak perlu menyentuh js/game.js.
 *
 *  Catatan:
 *  - Setiap item di `skills` otomatis menjadi 1 permata di peta.
 *  - `level` skill: 1 (pemula) sampai 5 (ahli).
 *  - `period` boleh dikosongkan ("") kalau tidak ingin ditampilkan.
 *  - Kosongkan ("") link kontak yang tidak ingin ditampilkan.
 */
(function () {
  const NAME = "Dinul Iman";

  window.CV = {
    name: NAME,
    role: "Backend & Full-stack Developer",
    location: "Jakarta, Indonesia",
    tagline: "Membangun sistem backend yang cepat, rapi, dan bisa diandalkan — dari payroll sampai pipeline data.",

    about: [
      "Halo! Saya Dinul Iman, lulusan S1 Teknologi Informasi Universitas Sumatera Utara yang berfokus pada " +
        "backend dan full-stack development. Sehari-hari saya bekerja dengan PHP, TypeScript, Node.js, dan " +
        "database relasional seperti PostgreSQL dan Oracle.",
      "Pengalaman paling menonjol saya adalah membangun Payroll Management System PT PELNI yang melayani " +
        "sekitar 4.800–5.000 karyawan — mulai dari perhitungan PPh 21, BPJS, pensiun, koperasi, hingga " +
        "integrasi jurnal ke Oracle. Salah satu pencapaian favorit saya: memangkas proses payroll dari lebih " +
        "dari 10 menit menjadi kurang dari 1 menit lewat optimasi stored procedure.",
      "Saya senang dengan pekerjaan yang dekat dengan data: ETL/ELT, data warehouse, dan otomasi. " +
        "Belakangan saya juga aktif mengeksplorasi AI coding agents seperti Claude Code, Codex, dan MCP.",
    ],

    facts: [
      "⚡ Proses payroll: >10 menit → <1 menit",
      "👥 Sistem payroll untuk ±5.000 karyawan",
      "🎓 S1 Teknologi Informasi USU · IPK 3,50",
      "🧪 Mantan asisten lab Basis Data & Struktur Data",
      "🤖 Antusias dengan AI coding agents & otomasi",
      "📍 Berdomisili di Jakarta",
    ],

    lookingFor: [
      "Backend Developer / Engineer",
      "Full-stack Developer",
      "Software Engineer",
      "Data Engineer",
      "HRIS / Payroll Technology",
    ],

    interests: ["AI & Data", "ETL/ELT & Data Warehouse", "TypeScript", "AI Coding Agents", "Claude Code · Codex · MCP", "Automation"],

    experience: [
      {
        title: "Software Developer — Payroll Management System",
        company: "PT PELNI",
        period: "",
        points: [
          "Mengembangkan sistem payroll berbasis PHP/CodeIgniter untuk ±4.800–5.000 karyawan.",
          "Membangun perhitungan & pemrosesan payroll: PPh 21, BPJS, pensiun, koperasi, piutang, dan proration gaji.",
          "Merancang integrasi data Oracle → PostgreSQL → payroll → jurnal Oracle.",
          "Mengoptimasi stored procedure payroll sehingga proses yang sebelumnya >10 menit menjadi <1 menit.",
          "Membuat slip gaji dan laporan payroll menggunakan JasperReports/JasperServer.",
          "Mengelola environment aplikasi dengan Docker / Rancher Desktop.",
        ],
      },
      {
        title: "Backend Developer — Aplikasi Ticketing",
        company: "PT PELNI",
        period: "",
        points: [
          "Mengembangkan backend aplikasi ticketing menggunakan NestJS dan PostgreSQL.",
          "Membangun modul asuransi pengiriman (shipping insurance).",
        ],
      },
      {
        title: "Asisten Laboratorium Struktur Data & Algoritma",
        company: "Universitas Sumatera Utara",
        period: "Jan 2021 — Jun 2021",
        points: [
          "Membimbing praktikum struktur data dan algoritma.",
          "Membantu mahasiswa memahami implementasi dan kompleksitas algoritma.",
        ],
      },
      {
        title: "Asisten Laboratorium Basis Data",
        company: "Universitas Sumatera Utara",
        period: "Jun 2020 — Jan 2021",
        points: [
          "Membimbing praktikum perancangan basis data dan SQL.",
          "Menyiapkan materi dan memeriksa tugas praktikum.",
        ],
      },
    ],

    education: [
      {
        school: "Universitas Sumatera Utara (USU)",
        degree: "S1 Teknologi Informasi",
        period: "",
        detail: "IPK 3,50 · Asisten Laboratorium Basis Data serta Struktur Data & Algoritma.",
      },
    ],

    // Kategori yang sudah punya warna permata:
    // Backend, Frontend, Database, Data, DevOps, Domain
    skills: [
      { name: "PHP & CodeIgniter", level: 5, category: "Backend", note: "Fondasi Payroll Management System PELNI." },
      { name: "Laravel", level: 4, category: "Backend" },
      { name: "Yii2", level: 3, category: "Backend" },
      { name: "Node.js & NestJS", level: 4, category: "Backend", note: "Backend aplikasi ticketing PELNI." },
      { name: "TypeScript", level: 4, category: "Backend" },
      { name: "Python & Django", level: 3, category: "Backend" },
      { name: "Go & Gin", level: 3, category: "Backend" },
      { name: "JavaScript", level: 4, category: "Frontend" },
      { name: "React & Next.js", level: 3, category: "Frontend" },
      { name: "PostgreSQL", level: 5, category: "Database", note: "Stored procedure & optimasi query payroll." },
      { name: "Oracle", level: 4, category: "Database", note: "Integrasi data dan jurnal keuangan." },
      { name: "MySQL", level: 4, category: "Database" },
      { name: "MongoDB", level: 3, category: "Database" },
      { name: "ETL & Integrasi Data", level: 4, category: "Data", note: "Oracle → PostgreSQL → payroll → jurnal Oracle." },
      { name: "JasperReports / JasperServer", level: 4, category: "Data", note: "Slip gaji dan laporan payroll." },
      { name: "Tableau", level: 3, category: "Data" },
      { name: "BigQuery", level: 3, category: "Data" },
      { name: "Docker / Rancher", level: 3, category: "DevOps" },
      { name: "Payroll & HRIS", level: 5, category: "Domain", note: "PPh 21, BPJS, pensiun, koperasi, piutang, proration." },
    ],

    projects: [
      {
        name: "Payroll Management System — PT PELNI",
        desc:
          "Sistem payroll untuk ±4.800–5.000 karyawan: perhitungan PPh 21, BPJS, pensiun, koperasi, piutang, " +
          "dan proration; integrasi Oracle ↔ PostgreSQL; slip & laporan via JasperServer. " +
          "Optimasi stored procedure memangkas proses dari >10 menit menjadi <1 menit.",
        tech: ["PHP", "CodeIgniter", "PostgreSQL", "Oracle", "JasperServer", "Docker"],
        link: "",
      },
      {
        name: "Pipeline Integrasi Payroll ↔ Oracle",
        desc: "Alur data Oracle → PostgreSQL → proses payroll → jurnal kembali ke Oracle, sehingga data HR dan keuangan tetap sinkron.",
        tech: ["Oracle", "PostgreSQL", "Stored Procedure", "ETL"],
        link: "",
      },
      {
        name: "Aplikasi Ticketing — PT PELNI",
        desc: "Backend aplikasi ticketing, termasuk modul asuransi pengiriman (shipping insurance).",
        tech: ["NestJS", "TypeScript", "PostgreSQL"],
        link: "",
      },
      {
        name: "CV Quest",
        desc: "CV interaktif berbentuk game RPG di browser — ya, game yang sedang kamu mainkan ini!",
        tech: ["JavaScript", "Canvas", "HTML/CSS"],
        link: "https://github.com/dinulimann/gamee",
      },
    ],

    contact: {
      email: "",
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
          `Di sini kamu bisa mengenal ${NAME}, developer backend & full-stack dari Jakarta.`,
          "Setiap bangunan berisi satu bagian CV. Masuk saja, pintunya selalu terbuka!",
        ],
      },
      {
        name: "Bu Bendahara",
        shirt: "#c44569",
        hair: "#3b2416",
        home: [29, 16],
        lines: [
          "Dulu hitung gaji di desa ini lamaaa sekali, lebih dari 10 menit! ⏳",
          `Setelah ${NAME} mengoptimasi stored procedure-nya, sekarang kurang dari 1 menit. Gaji ±5.000 orang beres! 💸`,
          "Mampir ke Kantor Karier kalau mau tahu ceritanya.",
        ],
      },
      {
        name: "Kang Data",
        shirt: "#2a9d8f",
        hair: "#1b1b1b",
        home: [5, 15],
        lines: [
          "Ada permata berkilau tersebar di desa ✨ Setiap permata adalah satu skill.",
          "Ada PostgreSQL, Oracle, NestJS, Go... kumpulkan semuanya di Bengkel Skill!",
          "Kalau buru-buru, tekan tombol 📄 di pojok kanan atas untuk CV versi biasa.",
        ],
      },
    ],
  };
})();
