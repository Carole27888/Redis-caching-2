import { initializeRedisClient } from "../redis-utils/client.js";
import { bloomKey } from "../redis-utils/keys.js";

async function createBloomFilter() {
  const client = await initializeRedisClient();
  await Promise.all([
    client.del(bloomKey),
    client.bf.reserve(bloomKey, 0.0001, 1000000),
  ]);
}

await createBloomFilter();
process.exit();