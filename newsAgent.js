import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReport(dataDump) {
  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt: `The provided data dump is a raw, unstructured collection of news snippets and headlines scraped from various Indian news sources. It may contain duplicates, irrelevant content, or fragmented text. Your task is to analyze and extract the most relevant, recent, and significant news stories related to India from this data dump.

Generate a professional news bulletin article based on the extracted information. Structure the article as follows:

1. **Main Headline**: Create a compelling, concise headline that captures the overarching theme of the bulletin.
2. **Byline**: Include a fictional byline like "By Staff Reporter".
3. **Lead Paragraph**: Write an engaging lead that summarizes the key themes or top stories in 1-2 sentences.
4. **Body**: Organize into multiple sections, each with its own sub-heading and 1-2 paragraphs of content. Identify 3-5 distinct major stories or topics from the data, and dedicate a section to each. Ensure each section is self-contained but cohesive overall.
5. **Conclusion**: End with any broader implications or trends if evident.

Guidelines:
- Extract and prioritize factual, verifiable information; ignore ads, menus, or non-news content.
- Identify and consolidate duplicate or similar stories into single sections.
- Focus on recent events (e.g., from the past few days/weeks) based on dates mentioned.
- Use journalistic style: objective, neutral tone, avoid sensationalism.
- Do not add external information or fabricate details; base strictly on the data dump.
- Aim for 400-600 words total.
- If data is sparse or unclear, note that and summarize what's available.

Data Dump: ${dataDump}`,
  });
  return text;
}
