🕒 High-Throughput Job Scheduler

A scalable and reliable Job Scheduler capable of executing a large number of scheduled HTTP jobs with high accuracy, at-least-once semantics, failure alerting, and observability.

This project was built as part of the Lenskart Backend Hiring Assignment (Round 1).

📌 Problem Statement

Design and implement a high-throughput job scheduler that:

Executes scheduled HTTP POST jobs

Supports second-level CRON scheduling

Minimizes scheduling drift

Tracks execution history

Alerts users on failures

Is modular, maintainable, and extensible

🧠 Key Features
✅ Functional

Create, modify, and schedule jobs using CRON (with seconds)

Execute jobs with at-least-once semantics

Track all executions (success & failure)

View last executions per job

Alert users on job failure

Observability APIs (health & metrics)

⚙️ Non-Functional

High accuracy (minimal drift)

High throughput (concurrent execution)

Fault tolerant design

Persistent storage

Clean separation of concerns

🏗️ Architecture Overview
Components
Client / Frontend
        |
        v
     API Layer (Express)
        |
        v
 Scheduler (Priority Queue + Dynamic Sleep)
        |
        v
     Worker Pool (Async HTTP Execution)
        |
        v
 Persistence Layer (SQLite)

Key Design Choices

Priority Queue (Min-Heap) for accurate scheduling

Dynamic sleep (setTimeout) instead of polling

At-least-once execution semantics

In-memory cache + SQLite persistence

Worker-based execution (non-blocking)

⏱️ Scheduling Accuracy (No Drift)

Jobs are scheduled using CRON-based nextExecutionTime

Next run is computed from CRON, not from execution completion

Scheduler sleeps until the exact next execution time

Execution latency does not accumulate drift

🔁 Execution Semantics
At-Least-Once

Jobs are guaranteed to execute at least once

Failures are recorded and visible

Duplicate execution is acceptable by design

🚨 Failure Alerting

Failures are surfaced in two ways:

Frontend

Failed executions are listed separately

User does not need to scan logs

Webhook (Optional)

On failure, a POST request is sent to the provided webhook URL

Useful for Slack / monitoring / email services

📊 Observability
Metrics

Total executions

Success count

Failure count

APIs

/health → service health

/metrics → execution metrics

💾 Persistence (SQLite)
Why SQLite?

Lightweight

No server setup

Perfect for local dev and take-home assignments

Stored Data

Jobs → job metadata & next execution time

Executions → execution history (success/failure)

Restart Safety

Jobs are loaded from DB on startup

Heap is rebuilt in memory

Scheduler resumes automatically

🔄 Server Startup Flow

Load jobs from SQLite

Restore in-memory job map

Rebuild priority queue (heap)

Start scheduler

🧪 APIs
Create Job
POST /jobs

{
  "schedule": "*/5 * * * * *",
  "api": "http://localhost:9999/test",
  "type": "ATLEAST_ONCE",
  "alertWebhook": "https://webhook.site/xxxx"
}

Modify Job
PUT /jobs/:jobId

Get Job Executions
GET /jobs/:jobId/executions


Returns last 5 executions.

Observability
GET /health
GET /metrics

🖥️ Frontend

A minimal dashboard is provided to:

Create jobs

Modify jobs

View executions

View failed executions separately

View health & metrics

Accessible at:

http://localhost:3000

🚀 How to Run
1️⃣ Install dependencies
npm install

2️⃣ Start server
node src/server.js

3️⃣ Open dashboard
http://localhost:3000

🧹 Reset Database (Optional)

Delete the file:

scheduler.db


On next start, a fresh database is created automatically.

📈 Scalability Considerations

Current design supports:

Thousands of scheduled jobs

Concurrent execution via async workers

Efficient scheduling via heap

Future Extensions (Design-Only)

Worker pool concurrency limits

Distributed scheduler with leader election

Persistent queues (Redis/Kafka)

Retry with exponential backoff

Horizontal scaling

♻️ High Availability (Design)

DB is the source of truth

Heap is rebuilt on restart

Scheduler can be run in active-passive mode

Jobs resume after crashes

🧠 Key Design Takeaways

Accuracy → CRON-based deterministic scheduling

Reliability → At-least-once semantics + persistence

Performance → Priority queue + async execution

Observability → Metrics + execution history

Simplicity → Minimal but extensible architecture

📌 Tech Stack

Node.js

Express.js

SQLite (better-sqlite3)

Axios

Vanilla HTML/CSS/JS

✅ Status

✔ Functional requirements complete
✔ Non-functional requirements addressed
✔ Bonus: persistence, accuracy, HA design

👤 Author

Devansh Gupta