import { Queue } from "bullmq";
import { connection } from "../lib/redis";

export const taskQueue = new Queue("tasks", { connection });
