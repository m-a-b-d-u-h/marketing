import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "fonts");

export const FONT = join(DIR, "NotoSans-Regular-Complete.ttf");
export const FONT_BOLD = join(DIR, "NotoSans-Bold-Complete.ttf");
export const FONT_EMOJI = join(DIR, "NotoEmoji-Regular.ttf");
