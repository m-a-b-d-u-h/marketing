import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const MARGIN = 150;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

const MAX_W = W - MARGIN * 2;

function wrap(text, fs, maxW = MAX_W) {
  const maxChars = Math.floor(maxW / (fs * 0.52));
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

const BADGE_R = 36;
const BADGE_D = BADGE_R * 2;
const BADGE_X = 130;
const BADGE_Y_SHIFT = 48;
const NUM_FS = 32;
const TITLE_X = 225;
const STEP_W = W - TITLE_X - MARGIN;

function buildStepsFilters(content) {
  const {
    title = "FRAMEWORKS FOR BETTER THINKING",
    steps = [
      { title: "Think from First Principles", desc: "Strip away assumptions and reason from what is undeniably true" },
      { title: "Apply Inversion", desc: "Ask what guarantees failure — then avoid those paths" },
      { title: "Distinguish Map from Territory", desc: "Models of reality are never reality itself. Stay humble" },
      { title: "Trace Second-Order Effects", desc: "Every action sets off a chain. Follow it to the end" },
      { title: "Stress-Test Your Beliefs", desc: "Argue against your own position. Stronger ideas survive" },
    ],
    footer = "1section.com",
  } = content;

  const filters = [];
  const rows = [];

  const titleLines = wrap(title, 55, 700);
  for (let i = 0; i < titleLines.length; i++) {
    const last = i === titleLines.length - 1;
    rows.push({ h: 50, gap: last ? 50 : 5, items: [{ text: titleLines[i], file: FONT_BOLD, fs: 46, color: "white@0.9", cx: true, yOff: -10, shadow: true }] });
  }

  const badgeYPositions = [];

  for (let i = 0; i < steps.length; i++) {
    const st = steps[i];
    const badgeCD = String(i + 1);
    const stl = wrap(st.title, 36, STEP_W);

    for (let j = 0; j < stl.length; j++) {
      const lastTitleLine = j === stl.length - 1;
      if (j === 0) {
        rows.push({ h: BADGE_D, gap: lastTitleLine ? 10 : 0, items: [
          { text: badgeCD, file: FONT_BOLD, fs: NUM_FS, color: "white", x: BADGE_X, cx2: true, vc: true, yOff: -24 + BADGE_Y_SHIFT, isBadge: true },
          { text: stl[j], file: FONT_BOLD, fs: 36, color: "white", x: TITLE_X, vc: true },
        ]});
      } else {
        rows.push({ h: 36, gap: lastTitleLine ? 10 : 0, items: [
          { text: stl[j], file: FONT_BOLD, fs: 36, color: "white", x: TITLE_X, vc: true, yOff: -18 },
        ]});
      }
    }

    const dl = wrap(st.desc, 30, STEP_W);
    for (let j = 0; j < dl.length; j++) {
      const last = j === dl.length - 1;
      rows.push({ h: 30, gap: last ? 40 : 5, items: [
        { text: dl[j], file: FONT, fs: 30, color: "#999999", x: TITLE_X, yOff: -5 },
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
      } else if (item.cx2) {
        xp = `${item.x} - text_w/2`;
      } else {
        xp = String(item.x ?? 0);
      }
      item.renderedY = yPos;
      item.xp = xp;
    }
    if (row.items.length === 2 && row.items[0].isBadge) {
      badgeYPositions.push(rowCenter + BADGE_Y_SHIFT);
    }
    y += row.h + row.gap;
  }

  const rowsWithItems = rows.filter(r => r.items.length > 0);
  const firstTop = rowsWithItems[0].items[0].renderedY - rowsWithItems[0].items[0].fs - (rowsWithItems[0].items[0].yOff ?? 0);
  const lastBottom = rowsWithItems[rowsWithItems.length - 1].items[0].renderedY;
  const contentH = lastBottom - firstTop;
  let off = (H - contentH) / 2 - firstTop;

  if (firstTop + off < MARGIN) off = MARGIN - firstTop;
  if (lastBottom + off > H - MARGIN) off = H - MARGIN - lastBottom;

  const badgeOff = off + 5;

  const lineRx = 2;
  if (badgeYPositions.length >= 2) {
    const lineY1 = Math.max(badgeYPositions[0] - BADGE_R - 10 + badgeOff, MARGIN);
    const lineY2 = Math.min(badgeYPositions[badgeYPositions.length - 1] - BADGE_R + badgeOff, H - MARGIN - 1);
    const lineH = lineY2 - lineY1;
    if (lineH > 0) {
      filters.push(`drawbox=x=${BADGE_X - lineRx}:y=${lineY1 + 2}:w=${lineRx * 2}:h=${lineH}:color=0x666666:t=fill`);
    }
  }

  for (const row of rows) {
    for (const item of row.items) {
      if (item.isBadge) {
        const cy = item.renderedY + badgeOff;
        filters.push(`drawbox=x=${BADGE_X - BADGE_R}:y=${cy - BADGE_R}:w=${BADGE_D}:h=${BADGE_D}:color=0x202020:t=fill`);
        filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.color}:x=${item.xp}:y=${cy - 8}${item.align ?? ""}`);
      } else {
        const baseFilter = `drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.color}:x=${item.xp}:y=${item.renderedY + off}${item.align ?? ""}`;
        if (item.shadow) {
          filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=#333333:x=${item.xp}:y=${item.renderedY + off + 4}${item.align ?? ""}`);
          filters.push(`drawtext=text='${esc(item.text)}':fontfile=${item.file}:fontsize=${item.fs}:fontcolor=${item.color}:x=${item.xp}:y=${item.renderedY + off}${item.align ?? ""}`);
        } else {
          filters.push(baseFilter);
        }
      }
    }
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildStepsFilters };
