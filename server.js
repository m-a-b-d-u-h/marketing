import "dotenv/config";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readdirSync, unlinkSync, statSync } from "fs";
import { startScheduler } from "./scheduler.js";
import { runPipeline } from "./pipeline.js";
import { getChannels } from "./services/buffer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve generated videos
app.use("/videos", express.static(join(__dirname, "output")));

const TYPES = ["stat", "steps", "compare", "mythfact", "quote", "QnA", "question", "story", "tips"];

function getVideos() {
  const dir = join(__dirname, "output");
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".mp4"))
      .map((f) => {
        const st = statSync(join(dir, f));
        const type = f.split("-")[0];
        return {
          file: f,
          type,
          size: (st.size / 1024).toFixed(0) + " KB",
          date: st.mtime.toISOString().slice(0, 10) + " " + st.mtime.toTimeString().slice(0, 5),
          mtime: st.mtimeMs,
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

app.get("/", (req, res) => {
  const videos = getVideos();
  const typesPublished = new Set(videos.map((v) => v.type)).size;
  res.render("index", { videos, types: TYPES, typesPublished });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/channels", async (req, res) => {
  try {
    const token = process.env.BUFFER_TOKEN;
    if (!token) return res.status(400).json({ error: "BUFFER_TOKEN not set" });
    const result = await getChannels(token);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate", async (req, res) => {
  const { type } = req.body;
  if (type && !TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${TYPES.join(", ")}` });
  }

  try {
    const result = await runPipeline({ postType: type });
    res.json({
      success: true,
      type: result.type,
      videoUrl: result.videoUrl,
      bufferResult: result.bufferResult,
    });
  } catch (err) {
    console.error("[server] /generate error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/delete", (req, res) => {
  const { file } = req.body;
  if (!file) return res.status(400).json({ error: "Missing file name" });
  const safe = file.replace(/[^a-zA-Z0-9._-]/g, "");
  const path = join(__dirname, "output", safe);
  try {
    unlinkSync(path);
    console.log(`[server] Deleted: ${safe}`);
    res.redirect("/");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Marketing backend on :${PORT}`);
  if (process.env.DISABLE_SCHEDULER !== "1") {
    startScheduler();
  }
});
