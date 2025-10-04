import RedisClient from "@redis/client/dist/lib/client";
import { createClient } from "redis";
import { processNews } from "./processNews";

const client = await createClient()
  .on("error", (err) => console.error("Redis Connection Error", err))
  .connect();
const india_news = await client.get("india_news");
const mumbai_news = await client.get("mumbai_news");

await processNews(client, "India News", "india_news", true);
await processNews(client, "Mumbai News", "mumbai_news", true);

const newNews = client.destroy();
