import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const TEXT_X = 160;
const MAX_W = 760;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

function wrap(text, fs, maxW) {
  const mc = Math.floor((maxW ?? MAX_W) / (fs * 0.54));
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (next.length > mc && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildStoryFilters(content) {
  const {
    title = "MICRO STORY",
    hook = "Rahasia paling diabaikan.",
    opening = "Dia menghabiskan bertahun-tahun berusaha menjadi orang lain.\n\nSampai suatu hari dia sadar satu-satunya hal yang dia butuhkan hanyalah menjadi dirinya sendiri.",
    description = "Pelajaran dari cerita ini adalah menjadi diri sendiri adalah kunci kebahagiaan sejati.",
    footer = "1section.com",
  } = content;

  const filters = [];

  const paragraphs = opening.split("\n\n").filter(Boolean);

  const hookFs = 76;
  const hookLineH = 86;
  const bodyFs = 40;
  const bodyLineH = 50;
  const paraGap = 80;
  const maxW = MAX_W;

  const hookLines = wrap(hook, hookFs, maxW);
  const paraLines = paragraphs.map(p => wrap(p, bodyFs, maxW));
  const totalLineCount = paraLines.reduce((sum, pl) => sum + pl.length, 0);

  const totalHookH = hookLines.length * hookLineH;
  const totalBodyH = totalLineCount * bodyLineH + (paraLines.length - 1) * paraGap;
  const hookBodyGap = 130;

  const titleGap = 100;
  const descFs = 28;
  const descLineH = 36;
  const descLines = description ? wrap(description, descFs, maxW) : [];
  const totalDescH = descLines.length * descLineH;
  const descGap = 60;

  const totalH = 24 + titleGap + totalHookH + hookBodyGap + totalBodyH + (descLines.length > 0 ? descGap + totalDescH : 0);
  let y = (H - totalH) / 2;

  filters.push(`drawtext=text='${esc(title.toUpperCase())}':fontfile=${FONT}:fontsize=32:fontcolor=#777777:x=(w-text_w)/2:y=${y + 50}`);
  y += 24 + titleGap;

  for (const line of hookLines) {
    filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT_BOLD}:fontsize=${hookFs}:fontcolor=#333333:x=${TEXT_X + 4}:y=${y + 4}`);
    filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT_BOLD}:fontsize=${hookFs}:fontcolor=white@0.9:x=${TEXT_X}:y=${y}`);
    y += hookLineH;
  }

  filters.push(`drawbox=x=${TEXT_X}:y=${y + 15}:w=80:h=3:color=#666666`);
  y += 40 + hookBodyGap - hookLineH;

  for (let pi = 0; pi < paraLines.length; pi++) {
    for (const line of paraLines[pi]) {
      filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT}:fontsize=${bodyFs}:fontcolor=#bbbbbb:x=${TEXT_X}:y=${y}`);
      y += bodyLineH;
    }
    if (pi < paraLines.length - 1) {
      y += paraGap - bodyLineH;
    }
  }

  if (descLines.length > 0) {
    y += descGap;
    for (const line of descLines) {
      filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT}:fontsize=${descFs}:fontcolor=#999999:x=${TEXT_X}:y=${y}`);
      y += descLineH;
    }
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=26:fontcolor=#555555:x=${TEXT_X}:y=1850`);

  return { filters, width: W, height: H };
}

export { buildStoryFilters };
