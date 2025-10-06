import { Worker } from "bullmq";
import { connection } from "../lib/redis";

new Worker(
  "tasks",
  async (job) => {
    console.log("Job Started");
    return { done: true };
  },
  { connection }
);
