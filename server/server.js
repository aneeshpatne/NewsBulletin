import express from "express";
import { createClient } from "redis";

const app = express();
const PORT = process.env.PORT || 3000;

// Create Redis client
const redisClient = createClient({
  host: "localhost",
  port: 6379,
});

// Connect to Redis
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis successfully");
});

await redisClient.connect();

// Middleware
app.use(express.json());

// GET endpoint to fetch a random news item
app.get("/news_items", async (req, res) => {
  try {
    // Fetch all news items from Redis list
    const newsItems = await redisClient.lRange("news_item_new", 0, -1);

    if (!newsItems || newsItems.length === 0) {
      return res.status(404).json({
        error: "No news items found",
      });
    }

    // Select a random item
    const randomIndex = Math.floor(Math.random() * newsItems.length);
    const randomNewsItem = JSON.parse(newsItems[randomIndex]);

    // Return in the specified format
    res.json({
      key: "news_items",
      value: {
        title: randomNewsItem.title,
        summary: randomNewsItem.description,
      },
      type: "json",
    });
  } catch (error) {
    console.error("Error fetching news items:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    redis: redisClient.isOpen ? "connected" : "disconnected",
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`News items endpoint: http://localhost:${PORT}/news_items`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await redisClient.quit();
  process.exit(0);
});
