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
        "Belakangan saya juga aktif mengeksplorasi AI coding agents seperti Claude Code, Codex, dan MCP. " +
        "Di luar pekerjaan, saya membangun proyek portofolio terbuka: ekstraksi dokumen dan Text-to-SQL dengan LLM lokal, " +
        "checkout Midtrans yang tahan webhook bermasalah, hingga pipeline data dengan Airflow, Kafka, dan Spark.",
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
      "Freelance: backend, data & otomasi AI",
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
      { name: "Laravel", level: 4, category: "Backend", note: "Leave Management API: hari kerja, saldo cuti, penguncian baris, CI." },
      { name: "Yii2", level: 3, category: "Backend" },
      { name: "Node.js & NestJS", level: 4, category: "Backend", note: "Backend aplikasi ticketing klien PT PELNI." },
      { name: "TypeScript", level: 4, category: "Backend" },
      { name: "Python (FastAPI, Django)", level: 3, category: "Backend", note: "FastAPI di AI Document Extractor & Text-to-SQL Agent." },
      { name: "Go & Gin", level: 3, category: "Backend", note: "GoBack (GORM, JWT) & Payment Webhooks (pgx, idempotensi, Midtrans)." },
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
      { name: "LLM & AI Integration", level: 3, category: "Data", note: "LLM lokal (Ollama): ekstraksi dokumen, Text-to-SQL, validasi hasil AI." },
      { name: "n8n & Workflow Automation", level: 3, category: "DevOps", note: "Webhook, LLM, PostgreSQL, alert Slack/Discord." },
      { name: "Web Scraping", level: 4, category: "Data", note: "httpx async & Playwright, retry, rate limit: Price Tracker & Naver Scraper." },
      { name: "Payment Gateway", level: 3, category: "Backend", note: "Midtrans Snap, verifikasi tanda tangan, idempotensi, rekonsiliasi." },
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
        link: "https://github.com/dinulimann/dataen",
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
        name: "AI Document Extractor",
        desc:
          "Invoice PDF diubah jadi data terstruktur di PostgreSQL memakai LLM lokal (Ollama), jadi dokumen tidak keluar dari server. " +
          "Model hanya membaca; tanggal dan mata uang dinormalisasi oleh kode, lalu angka dicek (qty × harga, subtotal, pajak, total). " +
          "Yang tidak cocok masuk antrean review. Akurasi 100% pada set uji (60/60 field, 20/20 baris item).",
        tech: ["Python", "FastAPI", "Ollama", "PostgreSQL", "Pydantic"],
        link: "https://github.com/dinulimann/ai-document-extractor",
      },
      {
        name: "Text-to-SQL Agent",
        desc:
          "Tanya database PostgreSQL dengan bahasa biasa (Indonesia/Inggris): LLM lokal menulis SQL, lalu pemeriksa SQL (sqlglot) " +
          "dan user database read-only memastikan query hanya bisa membaca data. Hasil berupa tabel dan grafik. " +
          "Akurasi 20/24 pada set uji, dan 6/6 permintaan berbahaya ditolak tanpa mengubah data.",
        tech: ["Python", "FastAPI", "Ollama", "sqlglot", "PostgreSQL"],
        link: "https://github.com/dinulimann/text-to-sql-agent",
      },
      {
        name: "AI Ticket Triage dengan n8n",
        desc:
          "Workflow n8n yang membaca pesan pelanggan (Indonesia/Inggris), mengklasifikasi kategori & prioritas dengan LLM lokal, " +
          "membuat draf balasan, menyimpan tiket ke PostgreSQL, dan mengirim alert Slack/Discord untuk yang urgent. Plus ringkasan harian.",
        tech: ["n8n", "Ollama", "PostgreSQL", "JavaScript", "Docker"],
        link: "https://github.com/dinulimann/n8n-ai-ticket-triage",
      },
      {
        name: "Price Tracker",
        desc:
          "Scraper async yang mengambil 1.000 produk dalam ±60 detik dengan retry & rate limit, menyimpan riwayat harga di PostgreSQL, " +
          "mendeteksi perubahan harga/stok, mengirim alert, dan menampilkan dashboard Streamlit.",
        tech: ["Python", "httpx", "PostgreSQL", "Streamlit", "pytest"],
        link: "https://github.com/dinulimann/price-tracker",
      },
      {
        name: "Studi Kasus Optimasi Payroll PostgreSQL",
        desc:
          "Rekonstruksi masalah payroll nyata dengan data sintetis 5.000 pegawai: dari loop per baris 28 detik menjadi 0,2 detik (140x) " +
          "lewat indeks, caching di luar loop, dan versi set-based, dengan hasil yang dicek identik baris per baris.",
        tech: ["PostgreSQL", "PL/pgSQL", "Docker"],
        link: "https://github.com/dinulimann/postgres-payroll-optimization",
      },
      {
        name: "Leave Management API",
        desc:
          "REST API cuti pegawai dengan Laravel: hitung hari kerja (tanpa akhir pekan & hari libur), saldo per jenis cuti, " +
          "pengajuan yang menunggu ikut memesan saldo, persetujuan atasan, dan penguncian baris supaya aman dari request bersamaan. " +
          "20 test berjalan di SQLite dan PostgreSQL lewat CI.",
        tech: ["PHP", "Laravel", "Sanctum", "PostgreSQL", "PHPUnit", "GitHub Actions"],
        link: "https://github.com/dinulimann/leave-management-api",
      },
      {
        name: "GoBack — Platform E-Commerce",
        desc:
          "Aplikasi e-commerce fullstack: backend Go dengan autentikasi JWT, manajemen produk & stok, alamat, " +
          "pembayaran Midtrans, dan dashboard admin; frontend React.",
        tech: ["Go", "Gin", "GORM", "PostgreSQL", "React", "JWT"],
        link: "https://github.com/dinulimann/goback",
      },
      {
        name: "Payment Webhooks (Midtrans) dengan Go",
        desc:
          "Checkout Midtrans yang tahan webhook palsu, dobel, tidak berurutan, dan hilang: verifikasi tanda tangan, cek nominal, " +
          "idempotensi di database, mesin status, dan rekonsiliasi lewat Status API. Dilengkapi simulator Midtrans lokal; " +
          "semua skenario dijalankan otomatis di CI.",
        tech: ["Go", "Gin", "PostgreSQL", "Midtrans", "Docker"],
        link: "https://github.com/dinulimann/payment-webhooks-go",
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
        link: "https://github.com/dinulimann/botto",
      },
      {
        name: "Toko Syuhada — Website Toko Sepeda",
        desc: "Website katalog & penjualan sepeda dengan filter kategori, pencarian produk, detail spesifikasi, dan artikel.",
        tech: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS"],
        link: "https://github.com/dinulimann/sepedasyuhada",
      },
      {
        name: "Eksperimen Machine Learning",
        desc:
          "Kumpulan notebook: chatbot Telegram kripto dengan LSTM (skripsi), prediksi harga kripto dengan LSTM, analisis sentimen, chatbot seq2seq, " +
          "serta analisis data dengan Pandas dan PySpark (harga mobil, kampanye iklan, diabetes).",
        tech: ["Python", "TensorFlow/Keras", "Pandas", "PySpark"],
        link: "https://github.com/dinulimann/ml-notebooks",
      },
      {
        name: "Apple or Tomato — Klasifikasi Gambar Real-time",
        desc:
          "Membedakan apel dan tomat langsung dari kamera: transfer learning MobileNetV2 dengan augmentasi data, " +
          "lalu aplikasi OpenCV yang menampilkan prediksi dan tingkat keyakinan secara real-time.",
        tech: ["Python", "TensorFlow/Keras", "MobileNetV2", "OpenCV"],
        link: "https://github.com/dinulimann/appleortomato",
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
          "Pembayaran online di desa ini juga aman: webhook palsu atau dobel tidak bisa bikin pesanan dibayar dua kali 🔒",
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
          "Mau lihat AI yang bisa ditanya pakai bahasa biasa, atau yang membaca invoice sendiri? Mampir ke Lab Proyek 🧪",
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
        "been actively exploring AI coding agents such as Claude Code, Codex and MCP. Outside work I build open " +
        "portfolio projects: document extraction and Text-to-SQL with local LLMs, a Midtrans checkout that survives " +
        "misbehaving webhooks, and data pipelines with Airflow, Kafka and Spark.",
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
      "Freelance: backend, data & AI automation",
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
      { note: "Leave Management API: working days, leave balances, row locking, CI." }, {},
      { note: "Backend of the ticketing application (client: PT PELNI)." },
      {}, { note: "FastAPI in the AI Document Extractor and Text-to-SQL Agent." },
      { note: "GoBack (GORM, JWT) and Payment Webhooks (pgx, idempotency, Midtrans)." },
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
      { note: "Local LLMs (Ollama): document extraction, Text-to-SQL, validating AI output." },
      { note: "Webhooks, LLMs, PostgreSQL, Slack/Discord alerts." },
      { note: "Async httpx & Playwright with retries and rate limits: Price Tracker & Naver Scraper." },
      { note: "Midtrans Snap, signature checks, idempotency, reconciliation." },
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
        desc:
          "Turns invoice PDFs into structured data in PostgreSQL with a local LLM (Ollama), so documents never leave the server. " +
          "The model only reads; dates and currency are normalised in code, then the numbers are checked (qty × price, subtotal, tax, total). " +
          "Anything that doesn't add up goes to a review queue. 100% accuracy on the test set (60/60 fields, 20/20 line items).",
      },
      {
        desc:
          "Ask a PostgreSQL database in plain language (English/Indonesian): a local LLM writes the SQL, then a sqlglot guard " +
          "and a read-only database role make sure it can only read. Results come back as a table and a chart. " +
          "20/24 correct on the test set, and 6/6 hostile requests refused without touching the data.",
      },
      {
        name: "AI Ticket Triage with n8n",
        desc:
          "n8n workflow that reads customer messages (Indonesian/English), classifies category & priority with a local LLM, " +
          "drafts a reply, stores the ticket in PostgreSQL and alerts Slack/Discord when it's urgent. Plus a daily digest.",
      },
      {
        desc:
          "Async scraper that collects 1,000 products in about 60 seconds with retries and rate limiting, keeps price history in PostgreSQL, " +
          "detects price/stock changes, sends alerts and shows a Streamlit dashboard.",
      },
      {
        name: "PostgreSQL Payroll Optimization Case Study",
        desc:
          "A real payroll problem rebuilt with synthetic data for 5,000 employees: from a 28-second row-by-row loop to 0.2 seconds (140x) " +
          "using indexes, caching outside the loop and a set-based version, with results verified identical row by row.",
      },
      {
        desc:
          "Employee leave REST API in Laravel: working-day calculation (weekends & holidays excluded), per-type balances, " +
          "pending requests that reserve balance, manager approval, and row locking so parallel requests stay safe. " +
          "20 tests run on SQLite and PostgreSQL in CI.",
      },
      {
        name: "GoBack — E-Commerce Platform",
        desc:
          "Full-stack e-commerce app: Go backend with JWT auth, product & stock management, addresses, " +
          "Midtrans payments and an admin dashboard; React frontend.",
      },
      {
        name: "Payment Webhooks (Midtrans) in Go",
        desc:
          "Midtrans checkout that survives forged, duplicate, out-of-order and lost webhooks: signature and amount checks, " +
          "database-level idempotency, a status machine and reconciliation via the status API. Ships with a local Midtrans " +
          "simulator; every scenario runs in CI.",
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
          "A collection of notebooks: an LSTM crypto Telegram chatbot (thesis), crypto price forecasting with LSTM, sentiment analysis, a seq2seq chatbot, " +
          "and data analysis with Pandas and PySpark (car prices, ad campaigns, diabetes).",
      },
      {
        name: "Apple or Tomato — Real-time Image Classifier",
        desc:
          "Tells apples from tomatoes straight from a webcam: MobileNetV2 transfer learning with data augmentation, " +
          "and an OpenCV app that shows the prediction and its confidence in real time.",
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
          "Online payments here are safe too: a forged or duplicate webhook can't get an order paid twice 🔒",
        ],
      },
      {
        name: "Data Guy",
        lines: [
          "There are sparkling gems scattered around the village ✨ Each gem is one skill.",
          "PostgreSQL, Oracle, NestJS, Go... collect them all for the Skill Workshop!",
          "In a hurry? Press the 📄 button in the top-right corner for the plain CV.",
          "Want an AI you can question in plain language, or one that reads invoices? Visit the Project Lab 🧪",
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
