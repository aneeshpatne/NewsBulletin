# News Bulletin

Opinionated, production-minded README for the News Bulletin project — a small Node.js system that scrapes/searches news, processes it with an LLM pipeline, persists normalized items and articles in Redis, and exposes a lightweight HTTP endpoint for clients.

This README covers: what the project does, how it is organized, required environment variables, how to install and run the components, common workflows, troubleshooting tips, and contribution notes.

## Quick summary

- Language: Node.js (ES modules)
- Queuing: BullMQ + ioredis
- Data store: Redis (used as list + key/value store)
- LLM: OpenAI via `@ai-sdk/openai` + `ai` helper utilities
- Purpose: Periodically fetch, extract and normalize Indian news items, store them in Redis and provide a simple HTTP API to fetch a random news item.

## Project layout (important files)

- `main.js` — orchestrator used by scheduled jobs; calls `processNews` and `generateReport`, then saves articles to Redis.
- `worker/worker.js` — BullMQ worker that schedules recurring jobs (runs `main` or `heartbeat` child processes), handles time-window logic (IST), and performs morning rituals like wiping the list key.
- `getNews.js` — calls an external search-and-scrape API to retrieve raw scraped content.
- `processNews.js` — thin wrapper around `getNews` that returns a big text dump for LLM processing.
- `newsAgent.js` — uses `@ai-sdk/openai` + `ai.generateText` to extract/normalize news items via `tools/news_item.js`.
- `server/server.js` — lightweight Express server exposing `/news_items` and `/health` endpoints.
- `lib/redis.js` — ioredis connection used by BullMQ and queueing code (reads `REDIS_URL`).
- `lib/redis_old.js` — legacy `redis` client used to store lists/keys (keeps existing code working).
- `queues/taskqueue.js` — bullmq Queue wrapper for the recurring `tasks` queue.

## Environment variables

Create a `.env` file in the project root or set these variables in your environment.

- `REDIS_URL` — (recommended) URL for Redis used by BullMQ and ioredis (e.g. `redis://localhost:6379`). If not set, ioredis will use its defaults.
- `OPENAI_API_KEY` — API key for the OpenAI-compatible SDK used by `newsAgent.js`.
- `PORT` — port used by the HTTP server (defaults to `3000`).

Example `.env`:

```
REDIS_URL=redis://127.0.0.1:6379
OPENAI_API_KEY=sk-xxx
PORT=3000
```

Notes:

- Some files (e.g. `lib/redis_old.js`) use the native `redis` client and call `createClient()` without arguments. If your Redis requires auth/host, either set `REDIS_URL` or edit `lib/redis_old.js` to pass options.

## Install

Make sure you have Node.js (v18+) and Redis installed and running.

Install dependencies:

```bash
npm install
```

Start Redis locally (if you don't already have one):

```bash
# On Linux with systemd
sudo systemctl start redis

# Or run via Docker
docker run --rm -p 6379:6379 redis:7
```

## Running the system

There are multiple components you can run independently during development.

1. Run the HTTP server (for apps that want a random news item)

```bash
node server/server.js
```

Server endpoints:

- `GET /news_items` — returns a random normalized news item (reads Redis list `news_item_new`). Returns JSON shaped like { key, value: { title, summary }, type }.
- `GET /health` — returns basic health + Redis connection state.

2. Run the main processing script (one-off article generation)

```bash
node main.js
```

This will:

- connect to Redis
- call `processNews` for configured topics (e.g. "India News", "Mumbai News")
- call the LLM `generateReport` for each topic and save results to Redis keys `india_news` and `mumbai_news` (see `main.js` for exact keys)

3. Run the worker (scheduling + recurring jobs)

```bash
node worker/worker.js
```

The worker:

- schedules and runs recurring jobs using BullMQ, honoring an active window between 07:00 and 23:00 IST.
- performs the "morning ritual" of wiping `news_item_new` on startup and between 07:00–07:15 IST.
- spawns `node ./main.js` (or `heartbeat.js`) as child processes when jobs execute.

4. Run heartbeat (lightweight job used outside main window)

```bash
node heartBeat.js
```

5. Useful dev commands

- Run a quick demo to process once and exit:

```bash
node main.js
```

## Data model and Redis keys

- `news_item_new` — Redis LIST that stores JSON-encoded normalized news items; the Express server reads random items from this list.
- `india_news` / `mumbai_news` — simple string keys holding the generated article/report text (saved by `main.js`).

Queue names:

- `tasks` — BullMQ queue used by `worker/worker.js` and `queues/taskqueue.js`.

If you change key names, update `worker/worker.js`, `server/server.js`, and any code that references those keys.

## LLM pipeline details

- `newsAgent.js` uses `@ai-sdk/openai` and `ai.generateText` to extract 10–20 normalized items from a large dump produced by `getNews.js`.
- `tools/news_item.js` (under `tools/`) is used as a tool by the LLM to produce normalized news item JSON. The LLM prompt instructs extraction-only behavior and calls the tool repeatedly.

IMPORTANT: Using an LLM will consume API credits. When developing locally, prefer mocking `generateReport` or use small, test inputs.

## Example workflow (developer)

1. Start Redis locally.
2. Create `.env` with `REDIS_URL` and `OPENAI_API_KEY` (or leave `OPENAI_API_KEY` empty to skip LLM-based steps).
3. Run `node server/server.js` to have the HTTP API serving whatever is in Redis.
4. In another terminal run `node main.js` to populate `india_news`, `mumbai_news` and (depending on code) push normalized items into `news_item_new`.
5. Visit `http://localhost:3000/news_items` to see a random item.

## Troubleshooting

- Redis connection errors:

  - Ensure Redis is reachable at the configured host/port. If you used `REDIS_URL`, set it to a valid URL.
  - Check `lib/redis_old.js` for a client created without options; if Redis requires a URL or auth, edit it accordingly.

- LLM/API errors:

  - Ensure `OPENAI_API_KEY` is present and valid for the `@ai-sdk/openai` SDK.
  - Be mindful of rate limits / cost—test with small inputs.

- Worker spawn/child process failures:

  - Worker spawns child processes like `node ../main.js`. Ensure working directory and relative paths are valid when running from `worker/`.

- Server returns 404 on `/news_items`:
  - Confirm `news_item_new` list exists in Redis and contains JSON items. Use `redis-cli LRANGE news_item_new 0 -1` to inspect.
