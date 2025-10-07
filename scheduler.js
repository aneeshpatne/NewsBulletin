import { taskQueue } from "./queues/taskqueue.js";

const hoursGap = 3;

await taskQueue.add("tasks", { seed: true }, { removeOnComplete: true });
