export async function postNewsSearch(searchTerm) {
  const response = await fetch(
    "http://192.168.1.100:8008/search-and-scrape-news-deep",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchTerm }),
    }
  );
  const data = response.json();
  return data;
}
