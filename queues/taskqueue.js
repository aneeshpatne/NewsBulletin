import { Queue } from "bullmq";
import { connection } from "../lib/redis.js";

export const taskQueue = new Queue("tasks", { connection });
