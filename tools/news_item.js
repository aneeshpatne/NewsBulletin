import { tool, zodSchema } from "ai";
import { z } from "zod";

export const news_item_tool = tool({
  description: "A tool to save short Title and description from the news",
  inputSchema: z.object({
    title: z.string().describe("Short Title of 5 words"),
    description: z.string().describe("Short Description of 15 words"),
  }),
  execute: async ({ title, description }) => {
    console.debug("[DEBUG] news_item_tool.execute called");
    console.debug("[DEBUG] Input received:", { title, description });

    if (!title || !description) {
      console.error("[ERROR] Missing title or description");
      return;
    }
    console.log("[LOG] Title:", title);
    console.log("[LOG] Description:", description);
    console.debug("[DEBUG] news_item_tool.execute completed");
  },
});
