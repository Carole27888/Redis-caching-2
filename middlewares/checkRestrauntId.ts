import type { Request, Response, NextFunction } from "express";
import { initializeRedisClient } from "../redis-utils/client.js";
import { restaurantKeyById } from "../redis-utils/keys.js";
import { errorResponse } from "../redis-utils/responses.js";

export const checkRestaurantExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId } = req.params;
  if (!restaurantId) {
    return errorResponse(res, 400, "Restaurant ID not found");
  }
  const client = await initializeRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId);
  const exists = await client.exists(restaurantKey);
  if (!exists) {
    return errorResponse(res, 404, "Restaurant Not Found");
  }
  next();
};