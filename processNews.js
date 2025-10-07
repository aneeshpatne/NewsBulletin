import { postNewsSearch } from "./getNews.js";

export async function processNews(query) {
  console.log(`[PROCESS] Fetching news for query: ${query}`);
  const news = await postNewsSearch(query);
  console.log(
    `[PROCESS] News fetched for query: ${query}. Length: ${news.length}`
  );
  return news;
}
