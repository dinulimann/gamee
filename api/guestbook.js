// Vercel Function: papan tamu (guestbook).
// Penyimpanan: Redis Upstash (Vercel Marketplace → Upstash for Redis). Integrasi itu
// otomatis mengisi KV_REST_API_URL & KV_REST_API_TOKEN (atau UPSTASH_REDIS_REST_URL/TOKEN).
import crypto from "node:crypto";

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "cvquest:guestbook";
const KEEP = 200; // jumlah pesan yang disimpan
const SHOW = 30; // jumlah pesan yang ditampilkan

// Filter sederhana: spam judi online, kata kasar umum (ID/EN), dan tautan.
const BLOCKED_WORDS = [
  "anjing", "bangsat", "babi", "kontol", "memek", "ngentot", "goblok", "tolol", "bajingan", "jancok", "jancuk", "asu",
  "fuck", "shit", "bitch", "cunt", "dick", "porn", "nigger", "slot", "gacor", "judi", "togel", "maxwin", "casino",
];
const BLOCKED_RE = new RegExp(`\\b(${BLOCKED_WORDS.join("|")})\\b`, "i");
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|id|io|xyz|ru|co|me|link|site|top)\b|@[a-z0-9-]+\.[a-z])/i;

async function redis(commands) {
  const r = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  const out = await r.json();
  for (const item of out) if (item.error) throw new Error(`redis: ${item.error}`);
  return out.map((item) => item.result);
}

const clean = (s, max) =>
  String(s ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u206f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function parseEntries(raw) {
  return (raw || [])
    .map((s) => { try { return JSON.parse(s); } catch { return null; } })
    .filter((e) => e && typeof e.m === "string")
    .map(({ n, m, t }) => ({ n: String(n || ""), m, t: Number(t) || 0 }));
}

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: "not_configured" });

  try {
    if (req.method === "GET") {
      const [raw] = await redis([["LRANGE", KEY, "0", String(SHOW - 1)]]);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ entries: parseEntries(raw) });
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
      const name = clean(body?.name, 24);
      const message = clean(body?.message, 140);
      if (message.length < 2) return res.status(400).json({ error: "too_short" });
      if (LINK_RE.test(message) || LINK_RE.test(name) || BLOCKED_RE.test(message) || BLOCKED_RE.test(name)) {
        return res.status(400).json({ error: "rejected" });
      }

      // batas per pengunjung: 1 pesan per menit, 5 pesan per hari (IP disimpan sebagai hash, bukan aslinya)
      const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
      const day = new Date().toISOString().slice(0, 10);
      const who = crypto.createHash("sha256").update(`${ip}|${day}|cvquest`).digest("hex").slice(0, 16);
      const [minuteOk, dayCount] = await redis([
        ["SET", `cvquest:gb:min:${who}`, "1", "EX", "60", "NX"],
        ["INCR", `cvquest:gb:day:${who}`],
        ["EXPIRE", `cvquest:gb:day:${who}`, "86400"],
      ]);
      if (minuteOk !== "OK" || Number(dayCount) > 5) return res.status(429).json({ error: "rate_limited" });

      const entry = { n: name, m: message, t: Date.now() };
      await redis([
        ["LPUSH", KEY, JSON.stringify(entry)],
        ["LTRIM", KEY, "0", String(KEEP - 1)],
      ]);
      return res.status(201).json({ entry });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("Guestbook error:", error.message);
    return res.status(502).json({ error: "storage" });
  }
}
