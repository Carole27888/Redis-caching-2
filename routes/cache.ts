import express from "express";
import { clearCacheByPrefix } from "../utils/cache.js"; 

const router = express.Router();

router.delete("/clear", async (req, res, next) => {
  try {
    const deletedCount = await clearCacheByPrefix();
    res.json({
      success: true,
      message: `Cleared ${deletedCount} keys from Redis cache.`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
