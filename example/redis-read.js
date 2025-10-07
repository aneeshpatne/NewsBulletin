import { client } from "../lib/redis_old.js";

const data = await client.lRange("news_item_new", 0, -1);
console.log(typeof String(data));

process.exit(0);
