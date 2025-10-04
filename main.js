import { postNewsSearch } from "./getNews.js";
import { generateReport } from "./newsAgent.js";
import { processNews } from "./processNews.js";
import { createClient } from "redis";

const client = await createClient()
  .on("error", (err) => console.error("Redis Connection Error", err))
  .connect();
await processNews(client, "India News", "india_news");
await processNews(client, "Mumbai News", "mumbai_news");

const value = await client.get("india_news");

console.log(value);
client.destroy();
