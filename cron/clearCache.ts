import cron from "node-cron";
import { clearCacheByPrefix } from "../utils/cache.js";

cron.schedule("0 0 * * *", async () => { //every day
  const deleted = await clearCacheByPrefix();
  console.log(`[Cron] Cleared ${deleted} Redis keys at ${new Date().toLocaleString()}`);
});
