import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Enzo } from "./enzo.js";
import { detectSafetyFlag } from "./safety.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const enzo = new Enzo({ apiKey });
const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(here, "..", "public")));

// Minimal in-memory rate limit: 20 requests per minute per IP.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

const SESSION_RE = /^[\w-]{8,64}$/;

app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body ?? {};
  if (typeof sessionId !== "string" || !SESSION_RE.test(sessionId)) {
    return res.status(400).json({ error: "Invalid sessionId." });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 2000) {
    return res.status(400).json({ error: "Message must be 1 to 2000 characters." });
  }
  if (limited(req.ip ?? "unknown")) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  // Lets the UI style emergency replies differently (same check Enzo runs before calling Gemini).
  const flag = detectSafetyFlag(message);
  if (flag) res.setHeader("X-Enzo-Safety", flag);
  res.flushHeaders();

  try {
    for await (const piece of enzo.chatStream(sessionId, message)) res.write(piece);
  } catch (err) {
    console.error(err);
    res.write("\n\n[Enzo hit a problem. Please try again.]");
  }
  res.end();
});

app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body ?? {};
  if (typeof sessionId === "string" && SESSION_RE.test(sessionId)) enzo.reset(sessionId);
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Enzo running at http://localhost:${port}`));
