import { createClient } from "redis";

export const client = createClient();

client.on("error", (err) => console.error("Redis Connection Error", err));

try {
  await client.connect();
} catch (err) {
  console.error("Redis connect error:", err);
}
