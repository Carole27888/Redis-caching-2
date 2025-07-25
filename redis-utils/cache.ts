import { initializeRedisClient } from "./client.js";
import { CACHE_TTL, CACHE_PREFIX } from "./config.js";

/**
 * Cache a hash with TTL
 */
export async function cacheHash(
  key: string,
  data: Record<string, string>,
  ttl: number = CACHE_TTL
) {
  const client = await initializeRedisClient();
  await client.hSet(key, data);
  await client.expire(key, ttl);
}



/**
 * Cache a set with TTL
 */
export async function cacheSet(
  key: string,
  values: string[],
  ttl: number = CACHE_TTL
) {
  const client = await initializeRedisClient();
  await client.sAdd(key, values);
  await client.expire(key, ttl);
}


/**
 * Delete all cache keys by prefix
 */
export async function clearCacheByPrefix(
  prefix: string = `${CACHE_PREFIX}:*`
): Promise<number> {
  const client = await initializeRedisClient();
  const keys = await client.keys(prefix);

   if (keys.length > 0) {
    await client.del(...(keys as [string, ...string[]]));
  }

  return keys.length;
}
