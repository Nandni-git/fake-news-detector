import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { predict } from "./model.js";


const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Fake News Detector API is running!",
    status: "success",
    endpoints: [
      "/api/live",
      "/api/check",
      "/api/quiz"
    ]
  });
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---- Check by title / text ----
app.post("/api/check", (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "text is required" });
  res.json(predict(text));
});

// ---- Live news (Guardian API, cached 60s; no background thread / scraping) ----
const KEY = process.env.GUARDIAN_API_KEY;

if (!KEY) {
  throw new Error("GUARDIAN_API_KEY is missing. Check your .env file.");
}
let cache = { at: 0, items: [] };
async function getLive() {
  if (Date.now() - cache.at < 60_000 && cache.items.length) return cache.items;
  const r = await fetch(`https://content.guardianapis.com/search?api-key=${KEY}&page-size=30&show-fields=thumbnail`);
 if (!r.ok) {
  const errorText = await r.text();
  console.error("Guardian API error:", r.status, errorText);
  throw new Error(`Guardian API ${r.status}`);
}
  const j = await r.json();
  cache = {
    at: Date.now(),
    items: j.response.results.map((a) => ({
      id: a.id, title: a.webTitle, url: a.webUrl, date: a.webPublicationDate,
      category: a.pillarName || "Undefined", section: a.sectionName,
      image: a.fields?.thumbnail || null, ...predict(a.webTitle),
    })),
  };
  return cache.items;
}
app.get("/api/live", async (req, res) => {
  try {
    let items = await getLive();
    if (req.query.category) items = items.filter((i) => i.category === req.query.category);
    res.json(items.slice(0, 12));
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ---- Quiz (CSV in memory; answer is never sent to the client) ----
const rows = parse(fs.readFileSync(new URL("./data/game_data.csv", import.meta.url)), { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true })
  .map((r, id) => ({ id, title: r.title, text: (r.text || "").slice(0, 600), fake: r.label === "1" }));

app.get("/api/quiz", (_req, res) => {
  const q = rows[Math.floor(Math.random() * rows.length)];
  res.json({ id: q.id, title: q.title, text: q.text });
});
app.post("/api/quiz", (req, res) => {
  const q = rows[Number(req.body?.id)];
  if (!q || typeof req.body?.isFake !== "boolean") return res.status(400).json({ error: "id and isFake(boolean) required" });
  res.json({ correct: q.fake === req.body.isFake, answer: q.fake ? "fake" : "real" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
