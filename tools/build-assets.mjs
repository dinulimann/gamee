// Membuat ulang aset yang bergantung pada isi CV:
//   - assets/og.png                  → gambar preview saat link dibagikan
//   - assets/cv-<nama>-id.pdf / -en.pdf → CV versi PDF (dari tampilan "CV Klasik")
//
// Jalankan setelah mengubah js/data.js:
//   npm install --no-save playwright && npx playwright install chromium
//   node tools/build-assets.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".pdf": "application/pdf", ".json": "application/json" };

// server statis kecil supaya halaman dimuat seperti di situs aslinya
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(root, url === "/" ? "index.html" : url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  // 1) gambar preview 1200x630
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto(`${base}/tools/og.html`, { waitUntil: "networkidle" }).catch(() => {});
  await og.waitForTimeout(800);
  await og.screenshot({ path: path.join(root, "assets/og.png") });
  console.log("✓ assets/og.png");

  // 2) PDF CV per bahasa
  const cvName = await og.evaluate(() => window.CV.name);
  const slug = cvName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  for (const lang of ["id", "en"]) {
    const page = await browser.newPage();
    await page.goto(`${base}/index.html?lang=${lang}`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await page.evaluate(() => { document.getElementById("btnStartClassic").click(); });
    await page.waitForTimeout(600);
    const out = path.join(root, `assets/cv-${slug}-${lang}.pdf`);
    await page.pdf({ path: out, format: "A4", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
    console.log(`✓ assets/cv-${slug}-${lang}.pdf`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
