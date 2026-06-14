import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const CENTER = W / 2;
const NUM_X = 160;
const TEXT_X = 230;
const RIGHT_MARGIN = 160;
const MAX_W = W - TEXT_X - RIGHT_MARGIN;

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

function buildTipsFilters(content) {
  const {
    title = "MICRO TIPS",
    subtitle = "Tips singkat buat kamu yang ingin mulai",
    tips = [
      { tip: "Start small", desc: "One small step daily builds momentum" },
      { tip: "Stay consistent", desc: "Regular beats intensity every time" },
      { tip: "Rest intentionally", desc: "Recovery is part of the progress" },
    ],
    footer = "1section.com",
  } = content;

  const filters = [];
  const ACCENT = "#ff8c42";

  const tipFs = 34;
  const descFs = 26;
  const tipLineH = 40;
  const descLineH = 32;
  const tipDescGap = 6;
  const itemGap = 12;
  const sepPad = 18;
  const maxW = MAX_W;

  const items = tips.map(t => {
    const tipLines = wrap(t.tip, tipFs, maxW);
    const descLines = t.desc ? wrap(t.desc, descFs, maxW) : [];
    const textH = tipLines.length * tipLineH + (descLines.length > 0 ? tipDescGap + descLines.length * descLineH : 0);
    const itemH = textH + sepPad * 2 + 1;
    return { tipLines, descLines, textH, itemH };
  });

  const totalItemsH = items.reduce((s, d) => s + d.itemH, 0) + (items.length - 1) * itemGap;

  const titleFs = 52;
  const titleMaxW = 700;
  const titleLines = wrap(title.toUpperCase(), titleFs, titleMaxW);
  const titleH = titleLines.length * titleFs + (titleLines.length - 1) * 10;
  const titleGap = 90;
  const totalH = titleH + titleGap + totalItemsH;
  let y = (H - totalH) / 2 - 60;

  for (const line of titleLines) {
    filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT_BOLD}:fontsize=${titleFs}:fontcolor=#333333:x=(w-text_w)/2+4:y=${y + 35 + 4}`);
    filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT_BOLD}:fontsize=${titleFs}:fontcolor=white@0.9:x=(w-text_w)/2:y=${y + 35}`);
    y += titleFs + 10;
  }
  y += titleGap;

  for (let ti = 0; ti < items.length; ti++) {
    const { tipLines, descLines, textH, itemH } = items[ti];
    const itemY = y;

    const numY = itemY;
    filters.push(`drawtext=text='${ti + 1}.':fontfile=${FONT_BOLD}:fontsize=40:fontcolor=#888888:x=${NUM_X}:y=${numY}`);

    let textY = itemY;
    for (const line of tipLines) {
      filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT_BOLD}:fontsize=${tipFs}:fontcolor=white:x=${TEXT_X}:y=${textY}`);
      textY += tipLineH;
    }

    if (descLines.length > 0) {
      textY += tipDescGap;
      for (const line of descLines) {
        filters.push(`drawtext=text='${esc(line)}':fontfile=${FONT}:fontsize=${descFs}:fontcolor=#aaaaaa:x=${TEXT_X}:y=${textY}`);
        textY += descLineH;
      }
    }

    y += itemH + itemGap;
  }

  const subGap = 10;
  const subY = y + subGap;
  const subLines = wrap(subtitle, 28, MAX_W);
  for (let i = 0; i < subLines.length; i++) {
    filters.push(`drawtext=text='${esc(subLines[i])}':fontfile=${FONT}:fontsize=28:fontcolor=#777777:x=${TEXT_X}:y=${subY + i * 34}`);
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=26:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildTipsFilters };
