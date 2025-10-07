import { processNews } from "./processNews.js";
import { generateReport } from "./newsAgent.js";
import { createClient } from "redis";

console.log("[CONNECT] Redis Client");
const client = await createClient()
  .on("error", (err) => console.error("Redis Connection Error", err))
  .connect();

console.log("[PROCESS] Fetching India News...");
const indiaNewsRaw = await processNews("India News");
console.log("[PROCESS] Generating India News Report...");
const indiaArticle = await generateReport(indiaNewsRaw);
console.log("[PROCESS] Saving India News Article to Redis...");
await client.set("india_news", indiaArticle);
console.log("[PROCESS] India News Article Saved.");

console.log("[PROCESS] Fetching Mumbai News...");
const mumbaiNewsRaw = await processNews("Mumbai News");
console.log("[PROCESS] Generating Mumbai News Report...");
const mumbaiArticle = await generateReport(mumbaiNewsRaw);
console.log("[PROCESS] Saving Mumbai News Article to Redis...");
await client.set("mumbai_news", mumbaiArticle);
console.log("[PROCESS] Mumbai News Article Saved.");

console.log("[GET] India News from Redis...");
const value = await client.get("india_news");
console.log("[GET] Mumbai News from Redis...");
const mumbaiValue = await client.get("mumbai_news");

console.log("[LOG] India News Article:");
console.log(value);
console.log("[LOG] Mumbai News Article:");
console.log(mumbaiValue);

console.log("[COMPLETE] All operations finished. Destroying Redis client.");
client.destroy();
process.exit(0);
