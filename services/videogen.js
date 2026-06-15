import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";
import pLimit from "p-limit";

import { generateVideo as renderVideo } from "../video-builders/generateToVideo.mjs";
import { buildStatFilters } from "../video-builders/statPost.mjs";
import { buildStepsFilters } from "../video-builders/stepsPost.mjs";
import { buildCompareFilters } from "../video-builders/comparePost.mjs";
import { buildMythfactFilters } from "../video-builders/mythFactPost.mjs";
import { buildQuoteFilters } from "../video-builders/quotePost.mjs";
import { buildQnaFilters } from "../video-builders/qnaPost.mjs";
import { buildQuestionFilters } from "../video-builders/questionPost.mjs";
import { buildStoryFilters } from "../video-builders/storyPost.mjs";
import { buildTipsFilters } from "../video-builders/tipsPost.mjs";

const limit = pLimit(Number(process.env.RENDER_CONCURRENCY || 1));

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "output");
const SOFTSELL = join(__dirname, "..", "softselling", "selling.png");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const BUILDERS = {
  stat: buildStatFilters,
  steps: buildStepsFilters,
  compare: buildCompareFilters,
  mythfact: buildMythfactFilters,
  quote: buildQuoteFilters,
  QnA: buildQnaFilters,
  question: buildQuestionFilters,
  story: buildStoryFilters,
  tips: buildTipsFilters,
};

export async function generateVideo(postType, content) {
  const builder = BUILDERS[postType];
  if (!builder) throw new Error(`Unknown post type: ${postType}`);

  const { filters, width, height } = builder(content);

  const timestamp = Date.now();
  const outFile = `${postType}-${timestamp}.mp4`;
  const outPath = join(OUT_DIR, outFile);

  await limit(() => renderVideo({ width, height, filters, output: outPath, softsell: SOFTSELL }));

  return outPath;
}
