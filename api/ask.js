// Vercel Function: menjawab pertanyaan pengunjung tentang CV memakai Claude.
// Butuh environment variable ANTHROPIC_API_KEY di Vercel (Settings → Environment Variables).
// Opsional: ANTHROPIC_MODEL untuk mengganti model.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
// effort & fallback server-side hanya dikirim ke model generasi baru yang mendukungnya
const MODERN_MODEL = /^claude-(opus-5|fable-5|sonnet-5-5)/.test(MODEL);

const MAX_QUESTION = 500;
const MAX_ANSWER_IN_HISTORY = 4000;
const MAX_HISTORY = 10;

// ---------------------------------------------------------------- data CV
// js/data.js ditulis untuk browser (mengisi window.CV), jadi dijalankan di sandbox.
function loadCV() {
  const code = fs.readFileSync(path.join(process.cwd(), "js", "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { timeout: 1000 });
  const { CV, CV_EN } = sandbox.window;
  const strip = (cv) => {
    if (!cv) return cv;
    const { npcs, ...rest } = cv; // dialog warga tidak relevan untuk asisten
    return rest;
  };
  return { cv: strip(CV), cvEn: strip(CV_EN) };
}

let SYSTEM = null;
function systemPrompt() {
  if (SYSTEM) return SYSTEM;
  const { cv, cvEn } = loadCV();
  const name = cv?.name || "the CV owner";
  SYSTEM = `You are Robot Claude, a friendly little robot who lives in the plaza of "CV Quest", an interactive, game-style CV website belonging to ${name}. Visitors, often recruiters or hiring managers, ask you questions about ${name}.

How to answer:
- Use only the CV data below. If the answer isn't in it, say you don't know and suggest contacting ${name} through the Post Office (the Contact section). Never invent employers, dates, numbers, skills or opinions that aren't in the data.
- Reply in the same language as the visitor's latest message (Indonesian or English).
- Keep answers short and easy to scan: two to five sentences, or a few "- " bullet points. You may use **bold** for key facts. No headings, tables or code blocks.
- Be warm and professional, with a light touch of robot charm.
- Refer to ${name} by name rather than with gendered pronouns.
- If someone asks for something unrelated to ${name}'s CV (general trivia, writing code, other people), politely say you can only help with questions about this CV and suggest a relevant question instead.
- Skill levels are on a 1–5 scale (5 = expert). When you mention them, describe them in words (e.g. "advanced") rather than as raw numbers.
- When useful, point visitors to the matching building in the village: My House (about), Career Office (experience), Academy (education), Skill Workshop (skills), Project Lab (projects), Post Office (contact).

<cv lang="id">
${JSON.stringify(cv, null, 1)}
</cv>

English translations of the text fields above (same order; fields not listed are unchanged):
<cv_en>
${JSON.stringify(cvEn ?? {}, null, 1)}
</cv_en>`;
  return SYSTEM;
}

// ---------------------------------------------------------------- pembatas sederhana
// Per instance server saja (best effort). Batas biaya yang sebenarnya diatur di Anthropic Console.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  const lastMinute = recent.filter((t) => now - t < 60 * 1000).length;
  if (lastMinute >= 8 || recent.length >= 60) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

// ---------------------------------------------------------------- validasi input
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .slice(-MAX_HISTORY)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, m.role === "user" ? MAX_QUESTION : MAX_ANSWER_IN_HISTORY),
    }))
    .filter((m) => m.content.length > 0);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

let client = null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "not_configured" });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: "rate_limited" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const messages = cleanMessages(body?.messages);
  if (!messages) return res.status(400).json({ error: "bad_request" });

  // dicatat tanpa identitas (tanpa IP) supaya pemilik CV tahu apa yang sering ditanyakan (Vercel → Logs)
  console.log("[pertanyaan]", JSON.stringify(messages[messages.length - 1].content.slice(0, 200)));

  client ??= new Anthropic();

  try {
    const params = {
      model: MODEL,
      max_tokens: 4000,
      system: [{ type: "text", text: systemPrompt(), cache_control: { type: "ephemeral" } }],
      messages,
    };
    let response;
    if (MODERN_MODEL) {
      response = await client.beta.messages.create({
        ...params,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } else {
      response = await client.messages.create(params);
    }

    if (response.stop_reason === "refusal") {
      return res.status(200).json({ error: "refusal" });
    }
    const answer = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!answer) return res.status(502).json({ error: "empty" });
    return res.status(200).json({ answer });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "rate_limited" });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key ditolak:", error.message);
      return res.status(503).json({ error: "not_configured" });
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Permintaan ke Claude ditolak:", error.message);
      return res.status(502).json({ error: "upstream" });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}:`, error.message);
      return res.status(502).json({ error: "upstream" });
    }
    console.error("Gagal menghubungi Claude:", error);
    return res.status(502).json({ error: "upstream" });
  }
}
