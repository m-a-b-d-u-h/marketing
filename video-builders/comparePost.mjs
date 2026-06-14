import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const MARGIN = 80;
const CENTER = W / 2;
const COL_W = CENTER - MARGIN - 15;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

function wrap(text, fs, maxW, charFactor) {
  const w = maxW ?? COL_W;
  const factor = charFactor ?? 0.52;
  const maxChars = Math.floor(w / (fs * factor));
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

function buildCompareFilters(content) {
  const {
    title = "REACTIVE VS REFLECTIVE THINKING",
    pairs = [
      { left: "Reacting emotionally before understanding the full picture of what is actually unfolding", right: "Pausing to observe the situation from multiple angles before forming a judgment" },
      { left: "Confusing urgency with importance and responding to every stimulus as though it matters equally", right: "Distinguishing signal from noise and investing energy only where it creates real leverage" },
      { left: "Accepting information that confirms existing beliefs while instinctively rejecting what challenges them", right: "Actively seeking disconfirming evidence and adjusting views when the facts shift" },
      { left: "Thinking in absolute binaries — something is either right or wrong, good or bad, with no middle ground", right: "Thinking in gradients and probabilities — most truths sit somewhere in the gray area" },
    ],
    footer = "1section.com",
  } = content;

  const filters = [];
  const rows = [];

  const titleGap = 10;
  const titleLines = wrap(title, 48, W - MARGIN * 2, 0.62);
  for (let i = 0; i < titleLines.length; i++) {
    const last = i === titleLines.length - 1;
    rows.push({ h: 48, gap: last ? 60 : titleGap, items: [
      { text: titleLines[i], file: FONT_BOLD, fs: 48, color: "white@0.9", cx: true, shadowX: 4, shadowY: 4, shadowColor: "#333333" },
    ]});
  }

  const headerRowIdx = rows.length;
  rows.push({ h: 48, gap: 35, items: [
    { text: "Without System", file: FONT_BOLD, fs: 35, color: "white", x: CENTER - 15, rightAlign: true },
    { text: "With System", file: FONT_BOLD, fs: 35, color: "white", x: CENTER + 15 },
  ]});

  for (const p of pairs) {
    const leftLines = wrap(p.left, 32);
    const rightLines = wrap(p.right, 32);
    const maxLines = Math.max(leftLines.length, rightLines.length);

    while (leftLines.length < maxLines) leftLines.push("");
    while (rightLines.length < maxLines) rightLines.push("");

    for (let i = 0; i < maxLines; i++) {
      const last = i === maxLines - 1;
      rows.push({ h: 34, gap: last ? 26 : 8, items: [
        { text: leftLines[i], file: FONT, fs: 32, color: "#777777", x: CENTER - 15, rightAlign: true },
        { text: rightLines[i], file: FONT, fs: 32, color: "white", x: CENTER + 15 },
      ]});
    }
  }

  let y = 0;
  for (const row of rows) {
    const rowCenter = y + row.h / 2;
    for (const item of row.items) {
      const baseY = item.vc ? (rowCenter + item.fs / 2) : (y + row.h);
      const yPos = baseY + (item.yOff ?? 0);
      let xp;
      if (item.cx) {
        xp = "(w-text_w)/2";
      } else if (item.rightAlign) {
        xp = `${item.x} - text_w`;
      } else {
        xp = String(item.x ?? 0);
      }
      item.renderedY = yPos;
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

  const TOP_ADJUST = 60;
  off -= TOP_ADJUST;

  if (firstTop + off < MARGIN) off = MARGIN - firstTop;
  if (lastBottom + off > H - MARGIN) off = H - MARGIN - lastBottom;

  const lineW = 3;
  const lineY1 = Math.max(rowsWithItems[headerRowIdx].items[0].renderedY + off, MARGIN);
  const lineY2 = Math.min(rowsWithItems[rowsWithItems.length - 1].items[0].renderedY + off + 6, H - MARGIN - 1);
  const lineH = lineY2 - lineY1;
  if (lineH > 0) {
    filters.push(`drawbox=x=${CENTER - lineW / 2}:y=${lineY1}:w=${lineW}:h=${lineH}:color=0x333333`);
  }

  for (const row of rows) {
    for (const item of row.items) {
      if (!item.text) continue;
      if (item.shadowColor) {
        filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.shadowColor}:x=${item.xp}+${item.shadowX ?? 4}:y=${item.renderedY + off + (item.shadowY ?? 4)}${item.align ?? ""}`);
      }
      filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.color}:x=${item.xp}:y=${item.renderedY + off}${item.align ?? ""}`);
    }
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildCompareFilters };
