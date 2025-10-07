import { client } from "../lib/redis_old.js";

await client.rPush(
  "news_item_new",
  JSON.stringify({
    Title: "Maha Issues Custodial Death Guidelines",
    description:
      "Maharashtra issues investigation guidelines in Somnath Suryawanshi custodial death case to probe custodial deaths rigorously.",
  })
);

const items = await client.lRange("news_item_new", 0, -1);

const parsed = items.map((it) => {
  try {
    return JSON.parse(it);
  } catch (e) {
    return it;
  }
});

console.log(parsed);

process.exit(0);
