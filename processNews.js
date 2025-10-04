import { postNewsSearch } from "./getNews.js";
import { generateReport } from "./newsAgent.js";

export async function processNews(client, query, key) {
  console.log("[LOG] Started processing for" + query);
  const news = await postNewsSearch(query);
  const article = await generateReport(news);
  await client.set(key, article);
}
