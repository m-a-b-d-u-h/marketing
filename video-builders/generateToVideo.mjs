import { spawn } from "child_process";
import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MUSIC_DIR = join(__dirname, "..", "music");

const DURATION = 30;
const FPS = 30;

export async function generateVideo({ width, height, filters, output, musicFile, fadeIn = 1, softsell }) {
  const musicPath = musicFile || findMusic();
  const args = ["-y"];

  if (softsell && existsSync(softsell)) {
    args.push("-f", "lavfi", "-i", `color=c=0x0a0a0a:s=${width}x${height}:d=25:r=${FPS}`);
    args.push("-loop", "1", "-r", String(FPS), "-t", "5", "-i", softsell);
    if (musicPath) args.push("-i", musicPath);

    const cf = filters.join(",");
    const fc = `[0:v]${cf},fade=out:720:30,setpts=PTS-STARTPTS[content];[1:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fade=in:0:30,setpts=PTS-STARTPTS,fade=out:120:30[img];[content][img]concat=n=2:v=1:a=0,format=yuv420p[out]`;
    args.push("-filter_complex", fc);
    args.push("-map", "[out]");
    if (musicPath) {
      args.push("-map", `${softsell ? "2:a" : "1:a"}`);
      args.push("-af", `afade=t=in:d=${fadeIn},afade=t=out:st=29:d=1`);
    }
  } else {
    args.push("-f", "lavfi", "-i", `color=c=0x0a0a0a:s=${width}x${height}:d=${DURATION}:r=${FPS}`);
    if (musicPath) args.push("-i", musicPath);

    const vf = filters.join(",");
    args.push("-vf", vf);

    if (musicPath) {
      args.push("-map", "0:v", "-map", "1:a");
      args.push("-af", `afade=t=in:d=${fadeIn},afade=t=out:st=29:d=1`);
    } else {
      args.push("-map", "0:v");
    }
  }

  args.push(
    "-threads", "1",
    "-filter_threads", "1",
    "-t", String(DURATION),
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
  );

  if (musicPath) {
    args.push("-c:a", "aac", "-b:a", "128k", "-shortest");
  }

  args.push(output);

  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args);
    const timer = setTimeout(() => {
      ff.kill("SIGKILL");
      reject(new Error(`ffmpeg timed out for ${output}`));
    }, 3_600_000);
    ff.stderr.on("data", (d) => process.stderr.write(d));
    ff.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        console.log(`Done: ${output}`);
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    ff.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function findMusic() {
  if (!existsSync(MUSIC_DIR)) return null;
  const files = readdirSync(MUSIC_DIR).filter(f => /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(f));
  return files.length > 0 ? join(MUSIC_DIR, files[Math.floor(Math.random() * files.length)]) : null;
}
