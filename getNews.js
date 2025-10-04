import { debugData } from "./debugData.js";

export async function postNewsSearch(searchTerm) {
  console.log("[SEARCH] Invoke Search API for:" + searchTerm);
  const response = await fetch(
    "http://192.168.1.100:8000/search-and-scrape-news-deep",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchTerm }),
    }
  );
  const data = await response.json();

  const allContent = data.map((item) => item.content.join(" ")).join(" ");
  return allContent;
}
