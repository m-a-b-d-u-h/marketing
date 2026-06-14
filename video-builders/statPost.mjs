import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

const MAX_W = W - 240;

function wrap(text, fs) {
  const maxChars = Math.floor(MAX_W / (fs * 0.6));
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function addLines(lines, fontFile, fontSize, fontColor, startY, opts) {
  const box = opts?.box || false;
  const boxColor = opts?.boxColor || "white@0.12";
  const boxW = opts?.boxW || 20;
  const lineGap = opts?.lineGap || 0;
  const step = fontSize + lineGap;
  let y = startY;
  const result = [];
  for (const line of lines) {
    let f = `drawtext=text='${esc(line)}':fontfile=${fontFile}:fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${y}`;
    if (box) f += `:box=1:boxcolor=${boxColor}:boxborderw=${boxW}`;
    result.push(f);
    y += step;
  }
  return { filters: result, nextY: y };
}

function buildStatFilters(content) {
  const {
    label = "THE ATTENTION ECONOMY",
    stat = "47%",
    desc = "of our waking hours are spent on autopilot — consuming content we never chose to seek",
    sub = "Attention is the only resource you cannot earn back. The modern economy is engineered to extract it. Reclaiming focus is the most radical act of intentionality.",
    footer = "1section.com",
  } = content;

  const BASE_LABEL_Y = 560;
  const BASE_STAT_Y = 700;
  const BASE_DESC_Y = 1000;

  const DESC_LINE_GAP = 10;
  const SUB_LINE_GAP = 8;

  const descLines = wrap(desc, 40);
  const subLines = wrap(sub, 34);

  const descH = descLines.length * (40 + DESC_LINE_GAP);
  const subH = subLines.length * (34 + SUB_LINE_GAP);

  const LINE_GAP = 50;
  const LINE_H = 2;
  const LINE_W = 200;
  const LINE_X = (W - LINE_W) / 2;
  const GAP_AFTER_LINE = 65;

  const baseSubY = BASE_DESC_Y + descH + LINE_GAP + LINE_H + GAP_AFTER_LINE;

  const contentTop = BASE_LABEL_Y - 36;
  const contentBottom = baseSubY + subH;
  const contentH = contentBottom - contentTop;
  const off = (H - contentH) / 2 - contentTop;

  const filters = [];

  const ACCENT = "#888888";

  filters.push(`drawtext=text='${esc(label)}':fontfile=${FONT_BOLD}:fontsize=36:fontcolor=#333333:x=(w-text_w)/2+4:y=${BASE_LABEL_Y + off + 4}`);
  filters.push(`drawtext=text='${esc(label)}':fontfile=${FONT_BOLD}:fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=${BASE_LABEL_Y + off}`);
  filters.push(`drawtext=text='${esc(stat)}':fontfile=${FONT_BOLD}:fontsize=260:fontcolor=#333333:x=(w-text_w)/2+8:y=${BASE_STAT_Y + off + 8}`);
  filters.push(`drawtext=text='${esc(stat)}':fontfile=${FONT_BOLD}:fontsize=260:fontcolor=white@0.9:x=(w-text_w)/2:y=${BASE_STAT_Y + off}`);

  const descAdd = addLines(descLines, FONT, 40, "white", BASE_DESC_Y + off, { lineGap: DESC_LINE_GAP });
  filters.push(...descAdd.filters);

  const descEndY = descAdd.nextY;
  const lineY = descEndY + LINE_GAP;
  filters.push(`drawbox=x=${LINE_X}:y=${lineY}:w=${LINE_W}:h=${LINE_H}:color=${ACCENT}`);

  const subAdd = addLines(subLines, FONT, 34, "#999999", lineY + LINE_H + GAP_AFTER_LINE, { lineGap: SUB_LINE_GAP });
  filters.push(...subAdd.filters);

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildStatFilters };
