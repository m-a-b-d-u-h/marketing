import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const MARGIN = 80;
const CARD_MARGIN = 160;
const CARD_W = W - CARD_MARGIN * 2;
const CARD_X = CARD_MARGIN;
const CENTER = W / 2;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

function wrap(text, fs, maxW) {
  const w = maxW ?? CARD_W - 80;
  const maxChars = Math.floor(w / (fs * 0.54));
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

function buildMythfactFilters(content) {
  const {
    title = "THE PARADOX OF CHOICE",
    mythLabel = "THE ILLUSION",
    factLabel = "THE TRUTH",
    myth = "More options mean more freedom, and more freedom means happier, better decisions. You can never have too many choices.",
    fact = "Beyond a certain threshold, abundance overwhelms. More options increase anxiety, lower satisfaction, and paralyze decision-making entirely.",
    description = "When you understand this paradox, you start making better decisions with fewer options.",
    footer = "1section.com",
  } = content;

  const filters = [];
  const rows = [];

  const titleLines = wrap(title, 48, 750);
  for (let i = 0; i < titleLines.length; i++) {
    const last = i === titleLines.length - 1;
    rows.push({ h: 50, gap: last ? 100 : 10, items: [
      { text: titleLines[i], file: FONT_BOLD, fs: 48, color: "white@0.9", cx: true, yOff: -50, shadowX: 4, shadowY: 4, shadowColor: "#333333" },
    ]});
  }

  const cardPadInner = 120;
  const mythHeaderRow = rows.length;
  rows.push({ h: 40, gap: 24, items: [
    { text: `${mythLabel}`, file: FONT_BOLD, fs: 36, color: "#888888", cx: true },
  ]});

  const mythBody = wrap(myth, 28);
  for (let i = 0; i < mythBody.length; i++) {
    const last = i === mythBody.length - 1;
    rows.push({ h: 30, gap: last ? cardPadInner : 12, items: [
      { text: mythBody[i], file: FONT, fs: 28, color: "#999999", cx: true },
    ]});
  }
  const mythEndRow = rows.length - 1;

  const vsRow = rows.length;
  rows.push({ h: 40, gap: 130, items: [
    { text: "VS", file: FONT_BOLD, fs: 36, color: "#555555", cx: true, yOff: 10 },
  ]});

  const factHeaderRow = rows.length;
  rows.push({ h: 48, gap: 30, items: [
    { text: `${factLabel}`, file: FONT_BOLD, fs: 36, color: "#CCCCCC", cx: true },
  ]});

  const factBody = wrap(fact, 28);
  for (let i = 0; i < factBody.length; i++) {
    const last = i === factBody.length - 1;
    rows.push({ h: 30, gap: last ? cardPadInner : 12, items: [
      { text: factBody[i], file: FONT, fs: 28, color: "white", cx: true },
    ]});
  }
  const factEndRow = rows.length - 1;

  const descLines = wrap(description, 26, CARD_W - 120);
  for (let i = 0; i < descLines.length; i++) {
    const last = i === descLines.length - 1;
    rows.push({ h: 28, gap: last ? 60 : 8, items: [
      { text: descLines[i], file: FONT, fs: 26, color: "#666666", cx: true, yOff: 30 },
    ]});
  }

  let y = 0;
  for (const row of rows) {
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

  const cardFill = "0x0d0d0d";
  const cardPadOuter = 80;

  function drawCard(boxY1, boxY2, border) {
    const h = boxY2 - boxY1;
    if (h <= 0) return;
    filters.push(`drawbox=x=${CARD_X}:y=${boxY1}:w=${CARD_W}:h=${h}:color=${cardFill}:t=fill`);
    const t = 2;
    filters.push(`drawbox=x=${CARD_X}:y=${boxY1}:w=${CARD_W}:h=${t}:color=${border}:t=fill`);
    filters.push(`drawbox=x=${CARD_X}:y=${boxY2-t}:w=${CARD_W}:h=${t}:color=${border}:t=fill`);
  }

  const mythBoxY1 = rowsWithItems[mythHeaderRow].items[0].renderedY + off - cardPadOuter;
  const mythBoxY2 = mythEndRow >= 0 && rowsWithItems[mythEndRow].items[0]
    ? rowsWithItems[mythEndRow].items[0].renderedY + off + 38 + cardPadOuter
    : mythBoxY1 + 80;
  drawCard(mythBoxY1, mythBoxY2, "0x333333");

  const factBoxY1 = rowsWithItems[factHeaderRow].items[0].renderedY + off - cardPadOuter;
  const factBoxY2 = rowsWithItems[factEndRow].items[0].renderedY + off + 38 + cardPadOuter;
  drawCard(factBoxY1, factBoxY2, "0x333333");

  if (vsRow >= 0 && vsRow < rowsWithItems.length) {
    const vsItem = rowsWithItems[vsRow].items[0];
    const vsY = vsItem.renderedY + off + vsItem.fs / 2 + 5;
    const vsLineW = 200;
    if (vsY > 0 && vsY < H) {
      filters.push(`drawbox=x=${CENTER - 60 - vsLineW}:y=${vsY}:w=${vsLineW}:h=1:color=0x333333`);
      filters.push(`drawbox=x=${CENTER + 60}:y=${vsY}:w=${vsLineW}:h=1:color=0x333333`);
    }
  }

  for (const row of rows) {
    for (const item of row.items) {
      if (!item.text) continue;
      if (item.shadowColor) {
        filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.shadowColor}:x=${item.xp}+${item.shadowX ?? 4}:y=${item.renderedY + off + (item.yOff ?? 0) + (item.shadowY ?? 4)}${item.align ?? ""}`);
      }
      filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.color}:x=${item.xp}:y=${item.renderedY + off + (item.yOff ?? 0)}${item.align ?? ""}`);
    }
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildMythfactFilters };
