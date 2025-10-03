import { postNewsSearch } from "./getNews.js";

const news = await postNewsSearch("India News");
console.log(news);
