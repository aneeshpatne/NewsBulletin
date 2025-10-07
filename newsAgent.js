import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import dotenv from "dotenv";
import { news_item_tool } from "./tools/news_item.js";

dotenv.config();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReport(dataDump) {
  console.log("[LLM] Started Processing");
  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `The provided data dump is a raw, unstructured collection of news snippets and headlines scraped from various Indian news sources. It may contain duplicates, irrelevant content, or fragmented text. Your task is to analyze and extract the most relevant, recent, and significant news stories related to India from this data dump.

Primary extraction goal:
- Extract between 10 and 20 distinct news items from the data dump.
- For each extracted item, invoke the provided tool news_item_tool to parse and normalize that single item. Aim to call the tool once per extracted item.
- Prefer extracting items that are factual, recent, and non-duplicative. If duplicates appear, consolidate but still ensure you return 10–20 unique normalized items where possible.

Important: Do NOT produce a final news article. Your sole job is extraction and normalization:
- Actively call the news_item_tool for each candidate item you extract. Stop extracting once you have invoked the tool for 20 items. Prefer producing between 10 and 20 items depending on data availability.
- After each tool call, collect the normalized output returned by the tool. At the end of extraction, return a concise JSON array (or newline-separated JSON objects) containing the normalized items as provided by the tool calls.
- Avoid adding editorial content or composing an article; only return the extracted/normalized item outputs and a short summary line with the total count.

Guidelines for extraction-only mode:
- Extract and prioritize factual, verifiable information; ignore ads, menus, or non-news content.
- Focus on recent events (e.g., from the past few days/weeks) based on dates mentioned.
- Do not add external information or fabricate details; base strictly on the data dump.
- If data is sparse or unclear, the tool call may return partial/blank fields—include them but note uncertainty in a dedicated field if present.

Data Dump: ${dataDump}`,

    tools: [news_item_tool],
    stopWhen: stepCountIs(20),
  });
  return text;
}
