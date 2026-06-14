import cron from "node-cron";
import { runPipeline } from "./pipeline.js";

// 06:00, 08:00, 10:00, 12:00, 14:00, 16:00 ET
const SCHEDULES = [
  "0 6 * * *",
  "0 8 * * *",
  "0 10 * * *",
  "0 12 * * *",
  "0 14 * * *",
  "0 16 * * *",
];

export function startScheduler() {
  const tz = process.env.TZ || "America/New_York";

  for (const expr of SCHEDULES) {
    cron.schedule(expr, () => {
      console.log(`[scheduler] Trigger at ${new Date().toISOString()} ET`);
      runPipeline().catch((err) => {
        console.error(`[scheduler] Error:`, err.message);
      });
    }, { timezone: tz });
  }

  console.log(`[scheduler] Started ${SCHEDULES.length} jobs (timezone: ${tz})`);
}
