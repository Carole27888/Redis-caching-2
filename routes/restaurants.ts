import express, {type Request} from "express"
import { RestaurantsSchema } from "../schemas/restaurant.js"
import { validate } from "../middlewares/validate.js"
import { successResponse, errorResponse } from "../redis-utils/responses.js"
import { initializeRedisClient } from "../redis-utils/client.js";
import { nanoid } from "nanoid";
import { restaurantKeyById } from "../redis-utils/keys.js";
import type { Restaurants } from "../schemas/restaurant.ts";
import { checkRestaurantExists } from "../middlewares/checkRestrauntId.js";
import { ReviewSchema } from "../schemas/review.js";
import type { Review } from "../schemas/review.ts"
import { reviewDetailsKeyById, reviewKeyById } from "../redis-utils";
import { cacheHash } from "../redis-utils/cache.js";
import { RestaurantModel } from "../models/Restaurant.ts";

const router = express.Router();

// POST /restaurants
router.post("/", validate(RestaurantsSchema), async (req, res, next) => {
  const data = req.body as Restaurants;

  try {
    //save to db
    const mongoDoc = new RestaurantModel(data);
    const saved = await mongoDoc.save();

    const id = saved._id.toString();
    const restaurantKey = restaurantKeyById(id);

    const hashData = {
      id,
      name: saved.name,
      location: saved.location,
      viewCount: "0",
    };

    await cacheHash(restaurantKey, hashData); 

    return successResponse(res, hashData, "Added new restaurant");
  } catch (error) {
    next(error);
  }
});
// POST /restaurants/:restaurantId/reviews
router.post(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;

    try {
      const client = await initializeRedisClient();
      const reviewId = nanoid();

      const reviewKey = reviewKeyById(restaurantId); // List of review IDs
      const reviewDetailsKey = reviewDetailsKeyById(reviewId); // Hash for this review

      const reviewData = {
        id: reviewId,
        ...data,
        timestamp: Date.now().toString(),
        restaurantId,
      };

      // Convert all values to strings for Redis hash
      const stringifiedData: Record<string, string> = Object.entries(reviewData).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      );

      await Promise.all([
        client.lPush(reviewKey, reviewId),
        cacheHash(reviewDetailsKey, stringifiedData), 
      ]);

      return successResponse(res, reviewData, "Added new review");
    } catch (error) {
      next(error);
    }
  }
);

// GET /restaurants/search?query=yourText
router.get("/search", async (req, res, next) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  try {
    console.log("Search query:", query);

    const client = await initializeRedisClient();

    let cursor = "0";
    const results: any[] = [];
    do {
      const reply = await client.scan(cursor, {
        MATCH: "bites:restaurants:*",
        COUNT: 1000,
      });
      cursor = reply.cursor;
      const keys = reply.keys;

      for (const key of keys) {
        const name = await client.hGet(key, "name");
        if (name?.toLowerCase().includes(query.toLowerCase())) {
          const data = await client.hGetAll(key);
          results.push(data);
        }
      }
    } while (cursor !== "0");

    if (results.length > 0) {
      console.log("Found in Redis");
      return successResponse(res, results, "Found from Redis cache");
    }

    console.log("Falling back to MongoDB");

    const fallback = await RestaurantModel.find({
      name: { $regex: query, $options: "i" },
    }).lean();

    for (const r of fallback) {
      const id = r._id.toString();
      const redisKey = restaurantKeyById(id);
      const hashData = {
        id,
        name: r.name,
        location: r.location,
        viewCount: "0",
      };

      await cacheHash(redisKey, hashData);
      results.push(hashData);
    }

    return successResponse(res, results, "Found from MongoDB and cached");
  } catch (error) {
    console.error("Error during search:", error);
    return res.status(500).json({ success: false, error });
  }
});

//Get /restaurants/:restaurantId
router.get(
  "/:restaurantId",
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const redisKey = restaurantKeyById(restaurantId);

    try {
      const client = await initializeRedisClient();

      let cached = await client.hGetAll(redisKey);
      if (cached && Object.keys(cached).length > 0) {
       
        await client.hIncrBy(redisKey, "viewCount", 1);
        
        cached.viewCount = (parseInt(cached.viewCount) + 1).toString();
        return successResponse(res, cached, "Fetched from Redis cache");
      }

      const restaurant = await RestaurantModel.findOne({
        _id: restaurantId,
        deleted: false,
      }).lean();

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: `Restaurant with ID ${restaurantId} not found`,
        });
      }

      const restaurantData = {
        id: restaurant._id.toString(),
        name: restaurant.name,
        location: restaurant.location,
        viewCount: "1", 
      };

      await cacheHash(redisKey, restaurantData);

      return successResponse(res, restaurantData, "Fetched from MongoDB and cached");
    } catch (error) {
      next(error);
    }
  }
);

//put
router.put(
  "/:restaurantId",
  validate(RestaurantsSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Restaurants;

    try {
     
      const updated = await RestaurantModel.findByIdAndUpdate(
        restaurantId,
        data,
        { new: true }
      );

      if (!updated) {
        return errorResponse(res, 404, "Restaurant not found");
      }

      const restaurantKey = restaurantKeyById(restaurantId);

      
      const hashData = {
        id: restaurantId,
        name: updated.name,
        location: updated.location,
        viewCount: "0",
      };

      await cacheHash(restaurantKey, hashData);

      return successResponse(res, hashData, "Restaurant updated");
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /restaurants/:restaurantId
router.delete(
  "/:restaurantId",
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;

    try {
      
      const deleted = await RestaurantModel.findByIdAndUpdate(
        restaurantId,
        { deleted: true },
        { new: true }
      );

      if (!deleted) {
        return errorResponse(res, 404, "Restaurant not found");
      }

      //  Invalidate Redis cache
      const client = await initializeRedisClient();
      const redisKey = restaurantKeyById(restaurantId);
      await client.del(redisKey);

      return successResponse(res, null, "Restaurant soft-deleted");
    } catch (error) {
      next(error);
    }
  }
);

export default router;
