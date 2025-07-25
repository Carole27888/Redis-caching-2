import { createClient } from "redis";
import { initializeRedisClient } from "../redis-utils/client.js";
import { indexKey, getKeyName } from "../redis-utils/keys.js";

async function createIndex() {
  const client = await initializeRedisClient();

  try {
    await client.ft.dropIndex(indexKey);
    console.log("Existing index dropped");
  } catch (err) {
    console.log("No existing index to delete");
  }

  await client.ft.create(
    indexKey,
    {
      id: {
        type: "TEXT", 
        AS: "id",
      },
      name: {
        type: "TEXT", 
        AS: "name",
      },
      avgStars: {
        type: "NUMERIC", 
        SORTABLE: true,
      },
    },
    {
      ON: "HASH",
      PREFIX: getKeyName("restaurants"),
    }
  );

  console.log("Index created successfully");
  process.exit();
}

await createIndex();
