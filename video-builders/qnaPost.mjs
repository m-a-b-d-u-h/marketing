import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const MARGIN = 100;

const esc = (s) => s.replace(/%/g, "\\\\%").replace(/:/g, "\\\\\\:").replace(/&/g, "\\&").replace(/'/g, "\u2019");

function wrap(text, fs, maxW) {
  const mc = Math.floor((maxW ?? 720) / (fs * 0.54));
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

function buildQnaFilters(content) {
  const {
    title = "ASK BETTER",
    question = "What is the one question you avoid asking yourself?",
    answer = "The question you avoid is usually the one that can change everything. Discomfort is a compass — it points toward the growth you need most.",
    footer = "1section.com",
  } = content;

  const filters = [];
  const qMaxW = 800;
  const aMaxW = 820;

  const qLines = wrap(question, 50, qMaxW);
  const aLines = wrap(answer, 38, aMaxW);

  const titleH = 30;
  const titleGap = 40;
  const qWatermarkH = 300;
  const qWatermarkGap = 20;
  const qTextH = qLines.length * 56;
  const qTextGap = 50;
  const dividerH = 1;
  const dividerGap = 60;
  const aLabelH = 40;
  const aLabelGap = 15;
  const aTextH = aLines.length * 42;
  const aTextGap = 20;

  const totalH = titleH + titleGap + qWatermarkH + qWatermarkGap + qTextH + qTextGap + dividerH + dividerGap + aLabelH + aLabelGap + aTextH + aTextGap;
  const startY = (H - totalH) / 2;

  let y = startY;

  const titleY = y + 190;
  y += titleH + titleGap;

  const qY = y - 10;

  filters.push(`drawtext=text='Q':fontfile=${FONT_BOLD}:fontsize=350:  fontcolor=#030303:x=(w-text_w)/2:y=${qY}`);
  filters.push(`drawtext=text='${esc(title)}':fontfile=${FONT}:fontsize=26:fontcolor=#666666:x=(w-text_w)/2:y=${titleY}`);

  y += qWatermarkH + qWatermarkGap - 120;

  for (let i = 0; i < qLines.length; i++) {
    filters.push(`drawtext=text='${esc(qLines[i])}':fontfile=${FONT_BOLD}:fontsize=50:fontcolor=white:x=(w-text_w)/2:y=${y}`);
    y += 56;
  }

  y += qTextGap - 6;

  const dividerCenter = y;
  const dotSize = 8;
  const dividerLen = 160;
  filters.push(`drawbox=x=${(W - dividerLen) / 2}:y=${dividerCenter}:w=${dividerLen}:h=1:color=#333333`);
  filters.push(`drawbox=x=${W / 2 - dotSize / 2}:y=${dividerCenter - dotSize / 2}:w=${dotSize}:h=${dotSize}:color=#888888`);

  y += dividerGap + 5;

  const badgeR = 18;
  const badgeCX = MARGIN + badgeR + 10;
  filters.push(`drawbox=x=${MARGIN}:y=${y + 2 - badgeR}:w=${badgeR * 2}:h=${badgeR * 2}:color=#222222:t=fill`);
  filters.push(`drawtext=text='A':fontfile=${FONT_BOLD}:fontsize=20:fontcolor=#ffffff:x=${badgeCX - 7}:y=${y + 7}`);

  const aX = MARGIN + badgeR * 2 + 30;
  for (let i = 0; i < aLines.length; i++) {
    filters.push(`drawtext=text='${esc(aLines[i])}':fontfile=${FONT}:fontsize=38:fontcolor=#c0c0c0:x=${aX}:y=${y}`);
    y += 42;
  }

  filters.push(`drawtext=text='${esc(footer)}':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildQnaFilters };
