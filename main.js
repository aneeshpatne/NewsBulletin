import { postNewsSearch } from "./getNews.js";
import { generateReport } from "./newsAgent.js";
import { createClient } from "redis";

const client = await createClient()
  .on("error", (err) => console.error("Redis Connection Error", err))
  .connect();
const news = await postNewsSearch("India News");
const article = await generateReport(news);
await client.set("india_news", article);
const value = await client.get("india_news");

console.log(value);
client.destroy();
