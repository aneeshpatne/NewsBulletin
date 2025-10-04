import { processNews } from "./processNews.js";
import { createClient } from "redis";

const client = await createClient()
  .on("error", (err) => console.error("Redis Connection Error", err))
  .connect();
await processNews(client, "India News", "india_news");
await processNews(client, "Mumbai News", "mumbai_news");

console.log("[GET] India News");
const value = await client.get("india_news");
console.log("[GET] Mumbai News");
const mumbaiValue = await client.get("mumbai_news");

console.log("[LOG] India News");
console.log(value);
console.log("[LOG] Mumbai News");
console.log(mumbaiValue);
client.destroy();
