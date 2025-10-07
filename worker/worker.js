import { Worker } from "bullmq";
import { connection } from "../lib/redis.js";
import { taskQueue } from "../queues/taskqueue.js";
import { spawn } from "child_process";

let delay = 3 * 1000;

export function setDelayHours(newVal) {
  delay = newVal;
  console.log("[WORKER] New Delay Value set as: ", newVal);
}

console.log("[WORKER] Initial Job Activated");
await taskQueue.add("tasks", { seed: true }, { removeOnComplete: true });

const worker = new Worker(
  "tasks",
  async (job) => {
    console.log("[WORKER] Job Started");
    const child = spawn("node", ["../main.js"], { stdio: "inherit" });
    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Child process exited with code ${code}`));
      });
      child.on("error", reject);
    });
    console.log("[WORKER] Job Executed");
    await taskQueue.add(
      "tasks",
      { prev: job.id },
      { delay: delay, removeOnComplete: true }
    );
    console.log(
      "[WORKER] Next Job scheduled after a delay of:",
      (delay / 1000 / 60 / 60).toFixed(3),
      "hours"
    );
    return { done: true };
  },
  { connection }
);

worker.on("completed", (job) => console.log("[WORKER] Completed", job.id));
worker.on("failed", (job, err) =>
  console.error("[WORKER] Failed", job?.id, err?.message)
);
worker.on("error", (err) => console.error("[WORKER] Error", err));

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[SHUTDOWN] Gracefully Shutting Down");
  try {
    await worker.close({ timeout: 10000 });
    await taskQueue.close({ timeout: 5000 });
    await connection.quit();
    console.log("[SHUTDOWN] Graceful Shutdown Successful");
  } catch (err) {
    console.error("[SHUTDOWN] Error during shutdown:", err);
  } finally {
    process.exit(0);
  }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
