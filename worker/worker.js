import { Worker } from "bullmq";
import { connection } from "../lib/redis.js";
import { taskQueue } from "../queues/taskqueue.js";
let delayHours = 3;

export function setDelayHours(newVal) {
  delayHours = newVal;
  console.log("[SCHEDULER] New Delay Value set as: ", newVal);
}
new Worker(
  "tasks",
  async (job) => {
    console.log("Job Started");
    await taskQueue.add(
      "tasks",
      { prev: job.id },
      { delay: nextDelay, removeOnComplete: true }
    );
    return { done: true };
  },
  { connection }
);
