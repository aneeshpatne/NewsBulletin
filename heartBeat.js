import { createClient } from "redis";
import { processNews } from "./processNews";

import dotenv from "dotenv";

dotenv.config();

const client = await createClient()
  .on("error", (err) => console.error("Redis Connection Error", err))
  .connect();

const india_news = await client.get("india_news");
const mumbai_news = await client.get("mumbai_news");

console.log("[HEARTBEAT] Fetching India News (heartbeat)...");
const indiaNewsRaw = await processNews("India News");
console.log("[HEARTBEAT] India News fetched. Length:", indiaNewsRaw.length);

console.log("[HEARTBEAT] Fetching Mumbai News (heartbeat)...");
const mumbaiNewsRaw = await processNews("Mumbai News");
console.log("[HEARTBEAT] Mumbai News fetched. Length:", mumbaiNewsRaw.length);

client.destroy();
