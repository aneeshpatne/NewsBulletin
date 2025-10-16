import { client } from "./lib/redis_old.js";
import { HeartBeat } from "./heartBeatAgent.js";
import { processNews } from "./processNews.js";
import dotenv from "dotenv";

dotenv.config();

const oldData = await client.lRange("news_item_new", 0, -1);
const oldDataString = oldData.join("\n");

console.log("[PROCESS] Fetching India News...");
const indiaNewsRaw = await processNews("India News");

console.log("[PROCESS] Fetching Mumbai News...");
const mumbaiNewsRaw = await processNews("Mumbai News");

console.log("[PROCESS] Merge India News and Mumbai News");

await HeartBeat(indiaNewsRaw + mumbaiNewsRaw, oldDataString);

process.exit(0);
