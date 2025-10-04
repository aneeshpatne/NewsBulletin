import { postNewsSearch } from "./getNews.js";
import { generateReport } from "./newsAgent.js";
const news = await postNewsSearch("India News");
const article = await generateReport(news);
console.log(article);
