import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
export async function generateReport(dataDump) {
  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt:
      "Make a in depth news article from the following seed data: " + dataDump,
  });
  return text;
}
