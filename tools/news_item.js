import { tool, zodSchema } from "ai";
import { z } from "zod";
import { client } from "../lib/redis_old.js";

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
    try {
      const newLen = await client.rPush(
        "news_item_new",
        JSON.stringify({ title, description })
      );
      console.info("[INFO] Pushed news item to Redis, new length:", newLen);
    } catch (err) {
      console.error("[ERROR] Failed to push news item to Redis:", err);
      return;
    }
    console.debug("[DEBUG] news_item_tool.execute completed");
  },
});
