import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { generateContent, generateCaption } from "./services/openrouter.js";
import { generateVideo } from "./services/videogen.js";
import { getChannels, createPost } from "./services/buffer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = join(__dirname, "rotation-state.json");

const TYPES = ["stat", "steps", "compare", "mythfact", "quote", "QnA", "question", "story", "tips"];

function getRotation() {
  if (!existsSync(STATE_PATH)) return 0;
  return JSON.parse(readFileSync(STATE_PATH, "utf-8")).index ?? 0;
}

function advanceRotation() {
  const next = (getRotation() + 1) % TYPES.length;
  writeFileSync(STATE_PATH, JSON.stringify({ index: next }));
  return next;
}

export async function runPipeline({ postType } = {}) {
  const type = postType ?? TYPES[getRotation()];
  if (!postType) advanceRotation();

  console.log(`[pipeline] Starting: ${type}`);

  const content = await generateContent(type);
  console.log(`[pipeline] Content generated for: ${type}`);

  const caption = await generateCaption(content);
  console.log(`[pipeline] Caption generated`);

  const videoPath = await generateVideo(type, content);
  console.log(`[pipeline] Video rendered: ${videoPath}`);

  // Publish to Buffer (only if public URL is configured for video hosting)
  const token = process.env.BUFFER_TOKEN;
  const publicUrl = process.env.PUBLIC_URL;
  let bufferResult = null;

  if (token && publicUrl) {
    const { channels } = await getChannels(token);
    console.log(`[pipeline] Found ${channels.length} Buffer channels`);

    const videoFile = basename(videoPath);
    const videoUrl = `${publicUrl}/videos/${videoFile}`;

    const results = [];
    for (const ch of channels) {
      try {
        const videoTitle = content.title || content.label || "1section";
        await createPost(token, ch.id, caption, videoUrl, ch.service, videoTitle);
        results.push({ channel: ch.name, ok: true });
        console.log(`[pipeline] Posted to ${ch.name} (${ch.service})`);
      } catch (err) {
        results.push({ channel: ch.name, ok: false, error: err.message });
        console.error(`[pipeline] Failed to post to ${ch.name}: ${err.message}`);
      }
    }
    bufferResult = results;
  } else {
    console.log(`[pipeline] Skipping Buffer publish (PUBLIC_URL${token ? " not set" : " & BUFFER_TOKEN not set"})`);
  }

  return { type, content, caption, videoPath, videoUrl: publicUrl ? `${publicUrl}/videos/${basename(videoPath)}` : null, bufferResult };
}
