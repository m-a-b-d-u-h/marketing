import { FONT, FONT_BOLD } from "./fonts.mjs";

const W = 1080, H = 1920;
const MARGIN = 160;

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

function buildQuestionFilters(content) {
  const {
    label = "RENUNGKAN",
    title = "Apakah hidupmu sekarang berantakan?",
    options = [
      "Iya, saya merasa berantakan",
      "Saya merasa lebih hebat",
      "Saya sedang merasa sedih",
      "Mungkin berbeda, coba jawab di komentar",
    ],
    description = "Pertanyaan ini membantu kita merefleksikan keadaan diri sendiri.",
  } = content;

  const filters = [];
  const qMaxW = W - MARGIN * 2;

  const qLines = wrap(title, 46, qMaxW);
  const descLines = wrap(description, 30, qMaxW);

  const badgeR = 20;
  const optMaxW = W - MARGIN - MARGIN / 3 - badgeR * 2 - 16;
  const labelH = 30;
  const labelGap = 50;
  const qTextH = qLines.length * 60;
  const qTextGap = 60;
  const optLineH = 42;
  const optGap = 28;
  const optLines = options.map(o => wrap(o, 34, optMaxW));
  const optsH = optLines.reduce((sum, lines) => sum + lines.length * optLineH + optGap, 0) - optGap;
  const optsDescGap = 50;
  const descH = descLines.length * 34;

  const totalH = labelH + labelGap + qTextH + qTextGap + optsH + optsDescGap + descH;
  const startY = Math.max(300, (H - totalH) / 2);

  let y = startY;

  filters.push(`drawtext=text='${esc(label)}':fontfile=${FONT}:fontsize=26:fontcolor=#666666:x=(w-text_w)/2:y=${y}`);

  y += labelH + labelGap;

  for (let i = 0; i < qLines.length; i++) {
    filters.push(`drawtext=text='${esc(qLines[i])}':fontfile=${FONT_BOLD}:fontsize=46:fontcolor=white:x=(w-text_w)/2:y=${y}`);
    y += 60;
  }

  y += qTextGap;

  const letters = ["A", "B", "C", "D"];
  const badgeUp = 5;
  const letterYOff = 5;
  for (let i = 0; i < options.length; i++) {
    const lines = optLines[i];
    const bgColor = "#333333";
    const letterColor = "#ffffff";

    const badgeY = y + (optLineH - badgeR * 2) / 2 - badgeUp;
    filters.push(`drawbox=x=${MARGIN}:y=${badgeY}:w=${badgeR * 2}:h=${badgeR * 2}:color=${bgColor}:t=fill`);
    filters.push(`drawtext=text='${letters[i]}':fontfile=${FONT_BOLD}:fontsize=24:fontcolor=${letterColor}:x=${MARGIN + badgeR - 9}:y=${badgeY + 6 + letterYOff}`);

    const optX = MARGIN + badgeR * 2 + 16;
    for (let j = 0; j < lines.length; j++) {
      filters.push(`drawtext=text='${esc(lines[j])}':fontfile=${FONT}:fontsize=34:fontcolor=white:x=${optX}:y=${y}`);
      y += optLineH;
    }

    y += optGap;
  }

  y += optsDescGap - optGap;

  for (let i = 0; i < descLines.length; i++) {
    filters.push(`drawtext=text='${esc(descLines[i])}':fontfile=${FONT}:fontsize=30:fontcolor=#777777:x=(w-text_w)/2:y=${y}`);
    y += 34;
  }

  filters.push(`drawtext=text='1section.com':fontfile=${FONT}:fontsize=28:fontcolor=#555555:x=(w-text_w)/2:y=1860`);

  return { filters, width: W, height: H };
}

export { buildQuestionFilters };
