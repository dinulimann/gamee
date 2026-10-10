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
 *  - `sprite` warga = nama file gambar di assets/ (tanpa .png).
 *  - `window.CV_EN` di bagian bawah berisi terjemahan Inggris. Isinya hanya
 *    teks yang perlu diterjemahkan; sisanya otomatis diambil dari `CV`.
 *    Urutan item di setiap daftar harus sama dengan versi Indonesia.
 */
(function () {
  const NAME = "Dinul Iman";

  window.CV = {
    name: NAME,
    role: "Full-stack Developer",
    location: "Jakarta, Indonesia",
    tagline: "Full-stack developer yang fokus di backend dan senang bekerja dengan data — dari sistem payroll sampai pipeline ETL.",

    about: [
      "Halo! Saya Dinul Iman, lulusan S1 Teknologi Informasi Universitas Sumatera Utara yang berfokus pada " +
        "full-stack development, dengan pengalaman terkuat di backend dan database. Sehari-hari saya bekerja dengan PHP, TypeScript, Node.js, dan " +
        "database relasional seperti PostgreSQL dan Oracle.",
      "Pengalaman paling menonjol saya adalah mengerjakan Payroll Management System untuk PT PELNI sebagai " +
        "programmer di PT Solusi Integrasi Utama (vendor PELNI). Sistem ini melayani " +
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
        title: "Programmer",
        company: "PT Solusi Integrasi Utama (vendor PT PELNI)",
        period: "Agu 2025 — Sekarang",
        points: [
          "Payroll Management System PT PELNI (±4.800–5.000 karyawan): pengembangan dengan PHP/CodeIgniter dan PostgreSQL.",
          "Perhitungan & pemrosesan payroll: PPh 21, BPJS, pensiun, koperasi, piutang, dan proration gaji.",
          "Mengerjakan integrasi data Oracle → PostgreSQL → payroll → jurnal Oracle.",
          "Mengoptimasi stored procedure payroll sehingga proses yang sebelumnya >10 menit menjadi <1 menit.",
          "Membuat slip gaji dan laporan payroll menggunakan JasperReports/JasperServer.",
          "Aplikasi ticketing PT PELNI: pengembangan backend dengan NestJS dan PostgreSQL, termasuk modul shipping insurance.",
          "Menggunakan Docker / Rancher Desktop untuk environment aplikasi.",
        ],
      },
      {
        title: "Asisten Laboratorium Struktur Data & Algoritma",
        company: "Universitas Sumatera Utara",
        period: "Jan 2021 — Jun 2021",
        points: ["Asisten praktikum mata kuliah Struktur Data & Algoritma."],
      },
      {
        title: "Asisten Laboratorium Basis Data",
        company: "Universitas Sumatera Utara",
        period: "Jun 2020 — Jan 2021",
        points: ["Asisten praktikum mata kuliah Basis Data."],
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
      { name: "PHP & CodeIgniter", level: 5, category: "Backend", note: "Dipakai untuk Payroll Management System klien PT PELNI." },
      { name: "Laravel", level: 4, category: "Backend" },
      { name: "Yii2", level: 3, category: "Backend" },
      { name: "Node.js & NestJS", level: 4, category: "Backend", note: "Backend aplikasi ticketing klien PT PELNI." },
      { name: "TypeScript", level: 4, category: "Backend" },
      { name: "Python & Django", level: 3, category: "Backend" },
      { name: "Go & Gin", level: 3, category: "Backend", note: "Backend e-commerce GoBack (GORM, JWT, Midtrans)." },
      { name: "JavaScript", level: 4, category: "Frontend" },
      { name: "React & Next.js", level: 3, category: "Frontend", note: "Botto, Toko Syuhada, dan frontend GoBack." },
      { name: "PostgreSQL", level: 5, category: "Database", note: "Stored procedure & optimasi query payroll." },
      { name: "Oracle", level: 4, category: "Database", note: "Integrasi data dan jurnal keuangan." },
      { name: "MySQL", level: 4, category: "Database" },
      { name: "MongoDB", level: 3, category: "Database" },
      { name: "ETL & Integrasi Data", level: 4, category: "Data", note: "Oracle → PostgreSQL → payroll → jurnal Oracle." },
      { name: "JasperReports / JasperServer", level: 4, category: "Data", note: "Slip gaji dan laporan payroll." },
      { name: "Tableau", level: 3, category: "Data" },
      { name: "BigQuery", level: 3, category: "Data" },
      { name: "Airflow & dbt", level: 3, category: "Data", note: "Orkestrasi & transformasi di proyek batch ELT." },
      { name: "Spark & Kafka", level: 3, category: "Data", note: "Streaming real-time & lakehouse Delta Lake." },
      { name: "Docker / Rancher", level: 3, category: "DevOps" },
      { name: "Payroll & HRIS", level: 5, category: "Domain", note: "PPh 21, BPJS, pensiun, koperasi, piutang, proration." },
    ],

    projects: [
      {
        name: "Payroll Management System untuk PT PELNI",
        desc:
          "Sistem payroll untuk ±4.800–5.000 karyawan: perhitungan PPh 21, BPJS, pensiun, koperasi, piutang, " +
          "dan proration; integrasi Oracle ↔ PostgreSQL; slip & laporan via JasperServer. " +
          "Optimasi stored procedure memangkas proses dari >10 menit menjadi <1 menit. " +
          "Dikerjakan sebagai programmer di PT Solusi Integrasi Utama.",
        tech: ["PHP", "CodeIgniter", "PostgreSQL", "Oracle", "JasperServer", "Docker"],
        link: "",
      },
      {
        name: "Aplikasi Ticketing untuk PT PELNI",
        desc: "Backend aplikasi ticketing, termasuk modul shipping insurance. Dikerjakan di PT Solusi Integrasi Utama.",
        tech: ["NestJS", "TypeScript", "PostgreSQL"],
        link: "",
      },
      {
        name: "Portofolio Data Engineering",
        desc:
          "Tiga pipeline data end-to-end yang dibuat seperti sistem produksi skala kecil, lengkap dengan CI: " +
          "batch ELT data cuaca 10 kota Indonesia (Airflow, MinIO, PostgreSQL, dbt, Metabase), " +
          "streaming pesanan e-commerce real-time (Kafka, Spark Structured Streaming dengan watermark, dead-letter queue, Grafana), " +
          "dan lakehouse NYC Taxi bronze → silver → gold (PySpark, Delta Lake, quality gate, time travel).",
        tech: ["Python", "Airflow", "dbt", "Spark", "Kafka", "Delta Lake", "PostgreSQL", "Docker"],
        link: "",
      },
      {
        name: "Naver SmartStore Scraper API",
        desc:
          "REST API yang mengambil data produk dari halaman Naver SmartStore memakai headless browser yang disamarkan, " +
          "rotasi proxy & fingerprint, throttling, dan cache. Backend scraping bisa diganti lewat env var tanpa ubah kode.",
        tech: ["TypeScript", "Node.js", "Playwright"],
        link: "https://github.com/dinulimann/naver-smartstore-scraper",
      },
      {
        name: "GoBack — Platform E-Commerce",
        desc:
          "Aplikasi e-commerce fullstack: backend Go dengan autentikasi JWT, manajemen produk & stok, alamat, " +
          "pembayaran Midtrans, dan dashboard admin; frontend React.",
        tech: ["Go", "Gin", "GORM", "PostgreSQL", "React", "JWT"],
        link: "",
      },
      {
        name: "Job Market Analytics",
        desc:
          "Platform analisis pasar kerja: scraping lowongan, ekstraksi skill otomatis, analisis skill paling dicari, " +
          "statistik gaji per lokasi & level, serta rekomendasi jalur karier.",
        tech: ["Python", "Flask", "Vue.js"],
        link: "",
      },
      {
        name: "Botto — Chatbot RAG",
        desc:
          "Chatbot untuk tanya-jawab dengan dokumen sendiri (PDF, Word, TXT) memakai Retrieval-Augmented Generation " +
          "dan respons streaming. Seluruh stack gratis.",
        tech: ["Next.js", "TypeScript", "LangChain.js", "ChromaDB", "Groq (Llama 3.1)"],
        link: "",
      },
      {
        name: "Toko Syuhada — Website Toko Sepeda",
        desc: "Website katalog & penjualan sepeda dengan filter kategori, pencarian produk, detail spesifikasi, dan artikel.",
        tech: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS"],
        link: "",
      },
      {
        name: "Eksperimen Machine Learning",
        desc:
          "Kumpulan notebook: analisis sentimen teks, prediksi harga ETH dengan LSTM, chatbot seq2seq, " +
          "klasifikasi gambar apel/tomat real-time lewat kamera, serta analisis data (harga mobil, kampanye iklan, diabetes).",
        tech: ["Python", "TensorFlow/Keras", "Pandas", "OpenCV"],
        link: "https://github.com/dinulimann?tab=repositories",
      },
      {
        name: "CV Quest",
        desc: "CV interaktif berbentuk game RPG di browser — ya, game yang sedang kamu mainkan ini!",
        tech: ["JavaScript", "Canvas", "HTML/CSS"],
        link: "https://github.com/dinulimann/gamee",
      },
    ],

    contact: {
      email: "dinulimankappa@proton.me",
      github: "https://github.com/dinulimann",
      linkedin: "https://www.linkedin.com/in/dinul-iman-818034178/",
      website: "",
    },

    // Warga desa. `home` = posisi tile [x, y] (peta 44 x 32).
    npcs: [
      {
        name: "Pak Kades",
        sprite: "npc-kades",
        shirt: "#3d5a80",
        hair: "#d9d9d9",
        home: [16, 14],
        lines: [
          "Selamat datang di Desa CV! 👋",
          `Di sini kamu bisa mengenal ${NAME}, full-stack developer dari Jakarta.`,
          "Setiap bangunan berisi satu bagian CV. Masuk saja, pintunya selalu terbuka!",
        ],
      },
      {
        name: "Bu Bendahara",
        sprite: "npc-bendahara",
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
        sprite: "npc-data",
        shirt: "#2a9d8f",
        hair: "#1b1b1b",
        home: [5, 15],
        lines: [
          "Ada permata berkilau tersebar di desa ✨ Setiap permata adalah satu skill.",
          "Ada PostgreSQL, Oracle, NestJS, Go... kumpulkan semuanya di Bengkel Skill!",
          "Kalau buru-buru, tekan tombol 📄 di pojok kanan atas untuk CV versi biasa.",
          "Psst… ada terminal rahasia. Tekan tombol ` di keyboard, atau buka lewat menu ⚙️ 💻",
        ],
      },
      {
        name: "Pak Nelayan",
        sprite: "npc-nelayan",
        shirt: "#4a6fa5",
        hair: "#3b2416",
        home: [4, 14],
        lines: [
          "Mau mancing? Dermaga ada di pantai barat, tepat di belakangku 🎣",
          "Lempar kail, tunggu pelampung bergoyang, lalu tekan secepatnya saat ikan menyambar!",
          "Kata orang, Ikan Kerapu Emas lebih sering muncul saat malam 🌙",
          "Kucing Kopi itu doyan ikan. Bawakan satu, dia pasti jadi temanmu.",
        ],
      },
    ],
  };

  // ===========================================================
  //  VERSI INGGRIS (dipakai saat pengunjung memilih English)
  // ===========================================================
  window.CV_EN = {
    role: "Full-stack Developer",
    location: "Jakarta, Indonesia",
    tagline: "Full-stack developer focused on the backend, with a love for working with data — from payroll systems to ETL pipelines.",

    about: [
      "Hi! I'm Dinul Iman, an Information Technology graduate from Universitas Sumatera Utara focused on " +
        "full-stack development, with my strongest experience in backend and databases. Day to day I work with PHP, TypeScript, Node.js and relational " +
        "databases such as PostgreSQL and Oracle.",
      "My most notable work is the Payroll Management System I worked on for PT PELNI as a programmer at " +
        "PT Solusi Integrasi Utama, a PELNI vendor. It serves around 4,800–5,000 " +
        "employees — from PPh 21 income tax, BPJS, pension and cooperative deductions to journal integration " +
        "with Oracle. A favourite achievement: cutting the payroll run from more than 10 minutes to under " +
        "1 minute by optimizing stored procedures.",
      "I enjoy work that sits close to data: ETL/ELT, data warehousing and automation. Lately I've also " +
        "been actively exploring AI coding agents such as Claude Code, Codex and MCP.",
    ],

    facts: [
      "⚡ Payroll run: >10 minutes → <1 minute",
      "👥 Payroll system for ±5,000 employees",
      "🎓 B.Sc. Information Technology, USU · GPA 3.50",
      "🧪 Former Database & Data Structures lab assistant",
      "🤖 Excited about AI coding agents & automation",
      "📍 Based in Jakarta",
    ],

    lookingFor: [
      "Backend Developer / Engineer",
      "Full-stack Developer",
      "Software Engineer",
      "Data Engineer",
      "HRIS / Payroll Technology",
    ],

    interests: ["AI & Data", "ETL/ELT & Data Warehousing", "TypeScript", "AI Coding Agents", "Claude Code · Codex · MCP", "Automation"],

    experience: [
      {
        title: "Programmer",
        company: "PT Solusi Integrasi Utama (PT PELNI vendor)",
        period: "Aug 2025 — Present",
        points: [
          "PT PELNI Payroll Management System (±4,800–5,000 employees): development with PHP/CodeIgniter and PostgreSQL.",
          "Payroll calculation and processing: PPh 21 income tax, BPJS, pension, cooperative, receivables and salary proration.",
          "Worked on the data integration Oracle → PostgreSQL → payroll → Oracle journal.",
          "Optimized payroll stored procedures, cutting a run that took >10 minutes to <1 minute.",
          "Built payslips and payroll reports with JasperReports/JasperServer.",
          "PT PELNI ticketing application: backend development with NestJS and PostgreSQL, including the shipping insurance module.",
          "Used Docker / Rancher Desktop for application environments.",
        ],
      },
      {
        title: "Data Structures & Algorithms Lab Assistant",
        period: "Jan 2021 — Jun 2021",
        points: ["Teaching assistant for the Data Structures & Algorithms lab course."],
      },
      {
        title: "Database Lab Assistant",
        period: "Jun 2020 — Jan 2021",
        points: ["Teaching assistant for the Database lab course."],
      },
    ],

    education: [
      {
        degree: "B.Sc. Information Technology",
        detail: "GPA 3.50 · Lab assistant for Databases and for Data Structures & Algorithms.",
      },
    ],

    // hanya `note` yang diterjemahkan; urutan sama dengan daftar skill di atas
    skills: [
      { note: "Used for the Payroll Management System (client: PT PELNI)." },
      {}, {},
      { note: "Backend of the ticketing application (client: PT PELNI)." },
      {}, {},
      { note: "GoBack e-commerce backend (GORM, JWT, Midtrans)." },
      {},
      { note: "Botto, Toko Syuhada and the GoBack frontend." },
      { note: "Payroll stored procedures & query optimization." },
      { note: "Data and financial journal integration." },
      {}, {},
      { name: "ETL & Data Integration", note: "Oracle → PostgreSQL → payroll → Oracle journal." },
      { note: "Payslips and payroll reports." },
      {}, {},
      { note: "Orchestration & transformation in the batch ELT project." },
      { note: "Real-time streaming & Delta Lake lakehouse." },
      {},
      { note: "PPh 21 income tax, BPJS, pension, cooperative, receivables, proration." },
    ],

    projects: [
      {
        name: "Payroll Management System for PT PELNI",
        desc:
          "Payroll system for ±4,800–5,000 employees: PPh 21 income tax, BPJS, pension, cooperative, receivables " +
          "and proration; Oracle ↔ PostgreSQL integration; payslips & reports via JasperServer. " +
          "Stored procedure optimization cut the run from >10 minutes to <1 minute. " +
          "Built as a programmer at PT Solusi Integrasi Utama.",
      },
      {
        name: "Ticketing Application for PT PELNI",
        desc: "Backend for a ticketing application, including a shipping insurance module. Built at PT Solusi Integrasi Utama.",
      },
      {
        name: "Data Engineering Portfolio",
        desc:
          "Three end-to-end data pipelines built like small production systems, with CI: " +
          "batch ELT of weather data for 10 Indonesian cities (Airflow, MinIO, PostgreSQL, dbt, Metabase), " +
          "real-time e-commerce order streaming (Kafka, Spark Structured Streaming with watermarks, dead-letter queue, Grafana), " +
          "and an NYC Taxi bronze → silver → gold lakehouse (PySpark, Delta Lake, quality gates, time travel).",
      },
      {
        desc:
          "REST API that extracts product data from Naver SmartStore pages using a stealth headless browser, " +
          "rotating proxies & fingerprints, throttling and caching. The scraping backend can be swapped via an env var with no code changes.",
      },
      {
        name: "GoBack — E-Commerce Platform",
        desc:
          "Full-stack e-commerce app: Go backend with JWT auth, product & stock management, addresses, " +
          "Midtrans payments and an admin dashboard; React frontend.",
      },
      {
        desc:
          "Job market analysis platform: job-posting scraping, automatic skill extraction, in-demand skills, " +
          "salary statistics by location & level, and career path recommendations.",
      },
      {
        name: "Botto — RAG Chatbot",
        desc:
          "Chatbot for asking questions about your own documents (PDF, Word, TXT) using Retrieval-Augmented Generation " +
          "with streaming responses. The whole stack is free.",
      },
      {
        name: "Toko Syuhada — Bicycle Shop Website",
        desc: "Bicycle catalog & sales website with category filters, product search, detailed specs and articles.",
      },
      {
        name: "Machine Learning Experiments",
        desc:
          "A collection of notebooks: text sentiment analysis, ETH price forecasting with LSTM, a seq2seq chatbot, " +
          "real-time apple/tomato image classification via webcam, and data analysis (car prices, ad campaigns, diabetes).",
      },
      {
        desc: "An interactive CV as a browser RPG — yes, the game you're playing right now!",
      },
    ],

    npcs: [
      {
        name: "Village Chief",
        lines: [
          "Welcome to CV Village! 👋",
          `Here you can get to know ${NAME}, a full-stack developer from Jakarta.`,
          "Each building holds one part of the CV. Come on in, the doors are always open!",
        ],
      },
      {
        name: "Ms. Treasurer",
        lines: [
          "Paying salaries in this village used to take sooo long, more than 10 minutes! ⏳",
          `After ${NAME} optimized the stored procedures, it takes under 1 minute. Salaries for ±5,000 people, done! 💸`,
          "Drop by the Career Office if you want the full story.",
        ],
      },
      {
        name: "Data Guy",
        lines: [
          "There are sparkling gems scattered around the village ✨ Each gem is one skill.",
          "PostgreSQL, Oracle, NestJS, Go... collect them all for the Skill Workshop!",
          "In a hurry? Press the 📄 button in the top-right corner for the plain CV.",
          "Psst… there's a secret terminal. Press the ` key, or open it from the ⚙️ menu 💻",
        ],
      },
      {
        name: "Fisherman",
        lines: [
          "Fancy some fishing? The pier is on the west coast, right behind me 🎣",
          "Cast your line, wait for the bobber to wiggle, then press quickly when a fish bites!",
          "They say the Golden Grouper shows up more often at night 🌙",
          "Kopi the cat loves fish. Bring one and you'll have a friend for life.",
        ],
      },
    ],
  };
})();
