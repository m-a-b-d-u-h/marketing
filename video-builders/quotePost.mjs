import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const MARGIN = 80;
const CENTER = W / 2;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

function wrap(text, fs, maxW) {
  const maxChars = Math.floor((maxW ?? 800) / (fs * 0.54));
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? cur + " " + word : word;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildQuoteFilters(content) {
  const {
    quote = "The only way to do great work is to love what you do.",
    source = "Steve Jobs",
    description = "This quote reminds us that passion is the foundation of meaningful work.",
    footer = "1section.com",
  } = content;

  const filters = [];
  const rows = [];

  rows.push({ h: 80, gap: 30, items: [
    { text: "\u201E", file: FONT_BOLD, fs: 300, color: "#0a0a0a", cx: true, yOff: -135, borderColor: "#444444", borderW: 6 },
  ]});

  const quoteLines = wrap(quote, 48, 800);
  for (let i = 0; i < quoteLines.length; i++) {
    const last = i === quoteLines.length - 1;
    rows.push({ h: 52, gap: last ? 20 : 8, items: [
      { text: quoteLines[i], file: FONT_BOLD, fs: 48, color: "#FFFFFF", cx: true, yOff: -50 },
    ]});
  }

  rows.push({ h: 36, gap: 75, items: [
    { text: source, file: FONT, fs: 32, color: "#AAAAAA", cx: true },
  ]});

  const lineRow = rows.length;
  rows.push({ h: 1, gap: 40, isLine: true, items: [
    { text: "", file: FONT, fs: 1, color: "white", cx: true },
  ]});

  const descLines = wrap(description, 32, 800);
  for (let i = 0; i < descLines.length; i++) {
    const last = i === descLines.length - 1;
    rows.push({ h: 34, gap: last ? 0 : 8, items: [
      { text: descLines[i], file: FONT, fs: 32, color: "#666666", cx: true },
    ]});
  }

  let y = 0;
  for (const row of rows) {
    row.y = y;
    const rowCenter = y + row.h / 2;
    for (const item of row.items) {
      const baseY = item.vc ? (rowCenter + item.fs / 2) : (y + row.h);
      item.renderedY = baseY;
      let xp;
      if (item.cx) {
        xp = "(w-text_w)/2";
      } else if (item.rightAlign) {
        xp = `${item.x} - text_w`;
      } else {
        xp = String(item.x ?? 0);
      }
      item.xp = xp;
    }
    y += row.h + row.gap;
  }

  const rowsWithItems = rows.filter(r => r.items.length > 0);
  const firstItem = rowsWithItems[0].items[0];
  const firstTop = firstItem.renderedY - firstItem.fs;
  const lastBottom = rowsWithItems[rowsWithItems.length - 1].items[0].renderedY;
  const contentH = lastBottom - firstTop;
  let off = (H - contentH) / 2 - firstTop;

  if (firstTop + off < MARGIN) off = MARGIN - firstTop;
  if (lastBottom + off > H - MARGIN) off = H - MARGIN - lastBottom;

  off -= 100;

  const lineY = rows[lineRow].y + off + 10;
  const vsLineW = 300;
  if (lineY > 0 && lineY < H) {
    filters.push(`drawbox=x=${CENTER - vsLineW / 2}:y=${lineY}:w=${vsLineW}:h=1:color=0x444444`);
    filters.push(`drawbox=x=${CENTER - 6}:y=${lineY - 6}:w=12:h=13:color=0xCCCCCC`);
  }

  for (const row of rows) {
    for (const item of row.items) {
      if (!item.text) continue;
      let border = "";
      if (item.borderColor) border += `:bordercolor=${item.borderColor}:borderw=${item.borderW ?? 3}`;
      filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.color}:x=${item.xp}:y=${item.renderedY + off + (item.yOff ?? 0)}${item.align ?? ""}${border}`);
    }
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildQuoteFilters };
