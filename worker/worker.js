import { Worker } from "bullmq";
import { connection } from "../lib/redis.js";
import { client } from "../lib/redis_old.js";
import { taskQueue } from "../queues/taskqueue.js";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

let delay = 3 * 60 * 60 * 1000;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const toISTDate = (ts) => new Date(ts + IST_OFFSET_MS);
const fromISTDate = (date) => date.getTime() - IST_OFFSET_MS;
const formatIST = (ts) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ts);

const sleep = (ms) =>
  new Promise((resolve) => {
    if (ms <= 0) return resolve();
    setTimeout(resolve, ms);
  });

export function setDelayHours(newVal) {
  delay = newVal;
  console.log("[WORKER] New Delay Value set as:", newVal);
}

console.log("[WORKER] Initialised");

function delayGenerator({
  nowTs = Date.now(),
  baseDelayMs = 0,
  startHour = 7,
  endHour = 23,
}) {
  const nowIST = toISTDate(nowTs);

  const inWindow = (d) => {
    const h = d.getUTCHours();
    return h >= startHour && h < endHour;
  };

  const nextStartIST = (d) => {
    const n = new Date(d);
    if (n.getUTCHours() >= endHour) {
      n.setUTCDate(n.getUTCDate() + 1);
    }
    n.setUTCHours(startHour, 0, 0, 0);
    if (n <= d) {
      n.setUTCDate(n.getUTCDate() + 1);
      n.setUTCHours(startHour, 0, 0, 0);
    }
    return n;
  };

  if (!inWindow(nowIST)) {
    const nextStart = nextStartIST(nowIST);
    return Math.max(0, fromISTDate(nextStart) - nowTs);
  }

  const tentativeTs = nowTs + baseDelayMs;
  const tentativeIST = toISTDate(tentativeTs);
  if (inWindow(tentativeIST)) return baseDelayMs;

  const nextStart = nextStartIST(tentativeIST);
  return Math.max(0, fromISTDate(nextStart) - nowTs);
}

console.log("[WORKER] Initial Job Activated");

// Morning ritual: Wipe news_item_new key on first boot
console.log("[WORKER] Morning Ritual: Wiping news_item_new key");
try {
  await client.del("news_item_new");
  console.log("[WORKER] Successfully wiped news_item_new key");
} catch (err) {
  console.error("[WORKER] Error wiping news_item_new key:", err);
}

await taskQueue.obliterate({ force: true });

const initialDelay = delayGenerator({ baseDelayMs: 0 });
const initialScheduledTs = Date.now() + initialDelay;
if (initialDelay > 0) {
  console.log(
    "[WORKER] Outside active window — scheduling initial job after",
    Math.round(initialDelay / 1000),
    "seconds (IST)",
    "for",
    formatIST(initialScheduledTs)
  );
  await taskQueue.add(
    "tasks",
    { exec: "main", scheduledForTs: initialScheduledTs },
    {
      delay: initialDelay,
      removeOnComplete: true,
      jobId: "recurring-task",
    }
  );
} else {
  console.log(
    "[WORKER] Inside active window — scheduling initial job immediately for",
    formatIST(initialScheduledTs)
  );
  await taskQueue.add(
    "tasks",
    { exec: "main", scheduledForTs: initialScheduledTs },
    {
      removeOnComplete: true,
      jobId: "recurring-task",
    }
  );
}

const worker = new Worker(
  "tasks",
  async (job) => {
    console.log("[WORKER] Job Started Executing: ", job.data.exec);

    // Morning ritual: Check if IST time is between 7:00 and 7:15 and wipe news_item_new key
    const nowIST = toISTDate(Date.now());
    const hour = nowIST.getUTCHours();
    const minute = nowIST.getUTCMinutes();
    if (hour === 7 && minute >= 0 && minute < 15) {
      console.log(
        "[WORKER] Morning Ritual (7:00-7:15 IST): Wiping news_item_new key"
      );
      try {
        await client.del("news_item_new");
        console.log(
          "[WORKER] Successfully wiped news_item_new key between 7:00-7:15 IST"
        );
      } catch (err) {
        console.error("[WORKER] Error wiping news_item_new key:", err);
      }
    }

    const child = spawn("node", [`${job.data.exec}.js`], {
      cwd: projectRoot,
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
    const nextScheduledTs = Date.now() + nextDelay;

    // Determine next job: "main" if it will run between 7:00-7:15 IST, otherwise "heartbeat"
    const nextIST = toISTDate(nextScheduledTs);
    const nextHour = nextIST.getUTCHours();
    const nextMinute = nextIST.getUTCMinutes();
    const isMorningRitual =
      nextHour === 7 && nextMinute >= 0 && nextMinute < 15;
    const nextExec = isMorningRitual ? "main" : "heartbeat";

    console.log(
      "[WORKER] Next job scheduled in",
      Math.round(nextDelay / 1000),
      "s (IST) at",
      formatIST(nextScheduledTs),
      "- will execute:",
      nextExec
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    await taskQueue.add(
      "tasks",
      { exec: nextExec, prev: job.id, scheduledForTs: nextScheduledTs },
      {
        delay: nextDelay,
        removeOnComplete: true,
        jobId: "recurring-task",
      }
    );
    console.log(
      "[WORKER] Next job added to queue with delay of",
      Math.round(nextDelay / 1000),
      "seconds"
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
