import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { news_item_tool } from "./tools/news_item.js";

export async function HeartBeat(dataDump, oldData) {
  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `HEARTBEAT SIGNAL: This is a periodic check for new news items.

Instructions:
- Compare the latest dataDump against the existing oldData.
- Identify and extract only genuinely new news items from dataDump that are not present in oldData.
- For each new item found, invoke the news_item_tool to normalize it, ensuring:
  - Title: Exactly 5 words.
  - Description: Exactly 15 words.
- If no new items are detected, do nothing and exit.
- Do not generate any summary or additional content.

Inputs:
- oldData: ${oldData}
- dataDump: ${dataDump}`,
    tools: [news_item_tool],
  });
}
