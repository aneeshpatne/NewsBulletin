import { Worker } from "bullmq";
import { connection } from "../lib/redis.js";
import { taskQueue } from "../queues/taskqueue.js";
import { spawn } from "child_process";

let delay = 3 * 1000;

export function setDelayHours(newVal) {
  delay = newVal;
  console.log("[WORKER] New Delay Value set as: ", newVal);
}
console.log("[WORKER INITIALED");
function delayGenerator({
  nowTs = Date.now(),
  baseDelayMs,
  startHour = 7,
  endHour = 23,
}) {
  const now = new Date(nowTs);

  const inWindow = (d) => {
    const h = d.getHours();
    return h >= startHour && h < endHour;
  };

  const nextStartFrom = (d) => {
    const n = new Date(d);
    if (n.getHours() >= endHour) n.setDate(n.getDate() + 1);
    n.setHours(startHour, 0, 0, 0);
    return n;
  };

  if (!inWindow(now)) {
    const nextStart = nextStartFrom(now);
    return Math.max(0, nextStart.getTime() - nowTs);
  }
  const tentative = new Date(nowTs + baseDelayMs);
  if (inWindow(tentative)) return baseDelayMs;
  const nextStart = nextStartFrom(tentative);
  return Math.max(0, nextStart.getTime() - nowTs);
}

console.log("[WORKER] Initial Job Activated");

const initialDelay = delayGenerator({ baseDelayMs: 0 });
if (initialDelay > 0) {
  console.log(
    "[WORKER] Outside active window — scheduling initial job after",
    Math.round(initialDelay / 1000),
    "seconds"
  );
  await taskQueue.add(
    "tasks",
    { exec: "example" },
    { delay: initialDelay, removeOnComplete: true }
  );
} else {
  console.log(
    "[WORKER] Inside active window — scheduling initial job immediately"
  );
  await taskQueue.add("tasks", { exec: "example" }, { removeOnComplete: true });
}

const worker = new Worker(
  "tasks",
  async (job) => {
    console.log("[WORKER] Job Started Executing: ", job.data.exec);
    const child = spawn("node", [`../${job.data.exec}.js`], {
      stdio: "inherit",
    });
    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Child process exited with code ${code}`));
      });
      child.on("error", reject);
    });
    console.log("[WORKER] Job Executed");
    const nextDelay = delayGenerator({ baseDelayMs: delay });
    await taskQueue.add(
      "tasks",
      { exec: "example", prev: job.id },
      { delay: nextDelay, removeOnComplete: true }
    );
    const runAt = new Date(Date.now() + initialDelay);
    console.log(
      "[WORKER] Initial job scheduled in",
      Math.round(initialDelay / 1000),
      "s at",
      runAt.toLocaleTimeString()
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
