# High-Throughput Job Scheduler

A high-accuracy, fault-tolerant job scheduling system designed to execute a large number of scheduled HTTP jobs with minimal drift, at-least-once semantics, persistent execution tracking, and failure alerting.

Built as part of the Lenskart Backend Engineering Assignment (Round-1).

---
## Table of Contents

- [Key-High-Lights](#-problem-statement)             - To see imortant feature implemented
- [Problem Overview](#-problem-statement)            - problem understanding
- [System Architecture](#-system-architecture)       - Architecture
- [Architecture Principle](#-system-architecture)    -To understand what benifits of implementation and fullfill ments of requirements
- [Folder Structure](#-folder-structure)             - Folder structure of project
- [API Design](#-api-design)                         - Api data and response
- [Data Workflow](#-example-workflow)                - Data flow in Api and understanding of each api work anf functionality
- [Setup Instructions](#-setup-instructions)         - How to install and commands
- [Trade-offs & Design Decision](#-trade-offs--design-decisions)      - all trade offs possible and done
- [Future Improvements](#-future-improvements)                        - what can added next to improve
- [Tech Stack](#-tech-stack)                                          - tech stack 
- [Author](#-author)

---


 ## Key Highlights
- Second-level CRON scheduling
-  High accuracy with minimal schedule drift
-  High-throughput asynchronous execution
-  At-least-once execution guarantee
-  Failure alerting (UI + Webhook)
-  Durable persistence using SQLite
-  Observability via metrics & health APIs
-  Docker-ready deployment (optional)

---

## Problem Overview

The system is designed to schedule and execute HTTP POST jobs at precise times defined by CRON expressions (including seconds).
It must:
- Handle thousands of jobs
- maintain execution accuracy
- Track historical executions
- Alert users on failures
- Remain robust across restarts

---

## System Architecture

### Core Components
**Backend**
- Express.js REST APIs
- Scheduler engine with priority queue
- Worker pool for async job execution
- SQLite for persistence

**Frontend**
- Lightweight HTML/CSS/JS dashboard
- Job creation & modification
- Execution history & failure visibility
- Observability (metrics, health)

**High-Level Architecture**

```
+-------------+        +------------------+                            
|   Frontend  | -----> |  Express API     |
+-------------+        +------------------+
                               |
                               v
                    +----------------------+
                    | Scheduler Engine     |
                    | (Min-Heap + Sleep)   |
                    +----------------------+
                               |
                               v
                    +----------------------+
                    | Worker Pool          |
                    | (Async HTTP Calls)   |
                    +----------------------+
                               |
                               v
                    +----------------------+
                    | SQLite Database      |
                    | Jobs & Executions    |
                    +----------------------+

```

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/462335b4-da41-4e71-85d6-f99b6fd8fc15" />


---

## Architecture Principles (Why this is solid)

### 1.Clear Separation of Concerns

| Layer         | Responsibility                        |
| ------------- | ------------------------------------- |
| API           | Validation, routing, request handling |
| Scheduler     | Time accuracy, job ordering           |
| Worker Pool   | Execution & retries                   |
| Storage       | Persistence & recovery                |
| Observability | Metrics, health, logs                 |


### 2. Scheduling Accuracy (Minimal Drift)

- Scheduler uses a Min-Heap (Priority Queue) ordered by nextExecutionTime
- Scheduler sleeps dynamically until the next job is due
- Execution duration does not affect future scheduling
- Multiple jobs scheduled at the same time are dispatched together
- Ensures minimal drift even under heavy load

### 3. High Throughput

- O(log N) scheduling via heap
- Async job execution (non-blocking)
- Worker pool decoupled from scheduler
- Designed to scale to thousands of jobs/sec

### 4.Reliability & Fault Tolerance

- At-least-once execution guarantee
- Execution history persisted
- Job recovery on server restart
- Alerting on failure (Webhook)

---  

## Failure Handling & Alerts

- When a job fails:
- Failure is persisted in the database
- Failure appears in frontend execution history
- Optional webhook is triggered for external alerting
- System continues scheduling unaffected
- Failures are never silent.

---

## Persistence & Recovery Storage
- SQLite stores:
- Job metadata
- Execution history
- Restart Safety
- Jobs are loaded from DB on startup
- In-memory cache & heap are rebuilt
- Scheduler resumes automatically
- System survives crashes and restarts.

---

## FOLDER STRUCTURE

```
  JobScheduler/
│
├── public/
│   └── index.html   # Simple frontend dashboard(UI)
│
├── src/
│   ├── app.js         # Express app setup (middlewares, routes)
│   ├── server.js      # Application entry point (starts server + scheduler)
│
│   ├── routes/
│   │   └── jobs.js    # Routes Setup
│
│   ├── scheduler/
│   │   └── scheduler.js   # Core scheduler logic (priority queue + dynamic sleep)
│
│   ├── workers/
│   │   └── pool.js       # Worker pool to execute HTTP jobs asynchronously
│
│   ├── models/
│   │   ├── job.js          # Job domain model
│   │   └── execution.js    # Execution history model
│
│   ├── storage/
│   │   ├── db.js           # SQLite DB connection
│   │   ├── inMemory.js     # In-memory caches (jobs, executions)
│   │   ├── jobHeaps.js     # Central job priority queue
│   │   └── metrics.js      # Observability metrics
│
│   └── utils/
│       └── minHeap.js      # Custom Min-Heap implementation
│
├── scheduler.db            # SQLite database file (persistent storage)
│
├── Dockerfile              # Docker image definition (Bonus)
├── .dockerignore           # Docker ignore rules
├── .gitignore              # Git ignore rules
├── package.json            # Project config & scripts
├── package-lock.json       # Dependency lock file
└── README.md               # Documentation

```
---

## API DESIGN

| Step | Endpoint                  | Type   | Description                             |
| ---- | --------------------------| -------|---------------------------------------------------------------|
| 1️    | `/jobs`                   | POST   | Creates a new scheduled job and returns a unique jobId.       |
| 2️    | `/jobs/:jobId`            | POST   | Updates job configuration (schedule, API,type).               |
| 3️    | ` /jobs/:jobId/executions`| GET    | Fetches the last 5 executions for a given job.                |
| 3️    | `/health`                 | GET    | Verifies that the scheduler service is running                |
| 3️    | `/metrics`                | GET    | Provides basic execution metrics for monitoring and debugging.|


##  API RESPONSES VIA POSTMAN

POST http://localhost:3000/jobs

**INPUT**
```
{
  "schedule": "*/5 * * * * *",
  "api": "https://example.com/test",
  "type": "ATLEAST_ONCE",
  "alertWebhook": "https://webhook.site/a7de0880-979e-455d-a563-bc2c1400ad77"
}
```
**RESPONSE**
```
{
    "jobId": "691a6da4-d469-4f5e-9bba-bc0abf3736e3",
    "nextExecutionTime": "2025-12-28T19:39:40.000Z"
}
```

PUT http://localhost:3000/jobs/JobID

**INPUT**
```
{
  "schedule": "*/10 * * * * *",
  "api": "https://httpbin.org/post"
}
```
**RESPONSE**
```
{
    "message": "Job updated successfully",
    "job": {
        "jobId": "21715513-7b9e-4b43-90ff-7b5dcfdaf477",
        "schedule": "*/10 * * * * *",
        "api": "https://httpbin.org/post",
        "type": "ATLEAST_ONCE",
        "nextExecutionTime": "2025-12-28T19:43:00.000Z",
        "alertWebhook": "https://webhook.site/a7de0880-979e-455d-a563-bc2c1400ad77"
    }
}
```

GET  http://localhost:3000/health

**RESPONSE**
```
{
    "status": "OK",
    "uptimeSeconds": 37.0122751,
    "activeJobs": 2,
    "timestamp": "2025-12-28T19:40:03.868Z"
}
```
GET  http://localhost:3000/metrics

**RESPONSE**
```
  {
    "totalExecutions": 31,
    "successCount": 0,
    "failureCount": 31
}
```

GET  http://localhost:3000/jobs/JOBID/executions

**RESPONSE**
```
  [
    {
        "jobId": "21715513-7b9e-4b43-90ff-7b5dcfdaf477",
        "executionTime": "2025-12-28T19:42:15.070Z",
        "statusCode": 405,
        "durationMs": 70,
        "success": false
    },
    {
        "jobId": "21715513-7b9e-4b43-90ff-7b5dcfdaf477",
        "executionTime": "2025-12-28T19:42:10.081Z",
        "statusCode": 405,
        "durationMs": 77,
        "success": false
    },
    {
        "jobId": "21715513-7b9e-4b43-90ff-7b5dcfdaf477",
        "executionTime": "2025-12-28T19:42:05.077Z",
        "statusCode": 405,
        "durationMs": 65,
        "success": false
    },
    {
        "jobId": "21715513-7b9e-4b43-90ff-7b5dcfdaf477",
        "executionTime": "2025-12-28T19:42:00.084Z",
        "statusCode": 405,
        "durationMs": 69,
        "success": false
    },
    {
        "jobId": "21715513-7b9e-4b43-90ff-7b5dcfdaf477",
        "executionTime": "2025-12-28T19:41:55.089Z",
        "statusCode": 405,
        "durationMs": 79,
        "success": false
    }
]
```

GET http://localhost:3000/jobs/getAllJobs

**RESPONSE**
```
[
    {
        "jobId": "691a6da4-d469-4f5e-9bba-bc0abf3736e3",
        "schedule": "*/5 * * * * *",
        "api": "https://example.com/test",
        "type": "ATLEAST_ONCE",
        "nextExecutionTime": "2025-12-28T19:43:05.000Z",
        "alertWebhook": "https://webhook.site/a7de0880-979e-455d-a563-bc2c1400ad77"
    }
]
```
---

## Data Flow
This section describes how data flows through the system from job creation to execution, persistence, and alerting.

1. `Job Creation Flow`

```
Client (UI / Postman)
        ↓
POST /jobs API
        ↓
Validate Job Spec (cron, API, type)
        ↓
Persist Job in SQLite DB
        ↓
Store Job in In-Memory Cache
        ↓
Insert Job into Priority Queue (Min-Heap)

```
**Explanation**
- User submits a job specification.
- The job is validated and stored persistently.
- In-memory cache ensures fast access.
- Min-Heap ensures efficient scheduling.

 2. `Scheduler Execution Flow`
```
Scheduler (Dynamic Sleep)
        ↓
Peek Min-Heap (nextExecutionTime)
        ↓
Sleep until job is due
        ↓
Pop due job(s)
        ↓
Validate stale entries
        ↓
Send job to Worker Pool
```
***Key Points***

- Scheduler does not poll continuously
- Sleeps until the nearest execution time
- Executes multiple jobs scheduled at the same time together
- Prevents schedule drift

3. `Job Execution Flow`
```
Worker Pool
        ↓
HTTP POST to External API
        ↓
Measure execution duration
        ↓
Capture response status
```


**Execution Semantics**
- At-least-once execution
- Failures are allowed but recorded
- Worker execution is asynchronous

4️. `Execution Persistence Flow`
```
Worker Result
        ↓
Create Execution Record
        ↓
Persist to SQLite DB
        ↓
Update In-Memory Execution Cache
        ↓
Update Metrics
```

**Stored Execution Data**
- Execution timestamp
- HTTP status code
- Execution duration
- Success / failure flag

5️ `Failure Alert Flow`
```
Execution Failure
        ↓
Persist failure in DB
        ↓
Update metrics
        ↓
Trigger Alert Webhook (if configured)
```

- Ensures failures are recorded and user alerted
- Alerts do not block job execution
- Reliable failure visibility

6️.`Observability Flow`
```
Monitoring Client
        ↓
GET /health
GET /metrics
        ↓
Scheduler & Worker Stats
```

**Exposed Observability**
- Total executions
- Success / failure counts
- Service uptime


7️. `Recovery Flow (Server Restart)`
```
Server Restart
        ↓
Load jobs from SQLite DB
        ↓
Rebuild In-Memory Cache
        ↓
Repopulate Min-Heap
        ↓
Resume Scheduler
```
---

## Installation

 ### Prerequisites
  - Node.js v18+
  - npm
  - Git
  - Docker (optional)

### **LOCAL SETUP**:

   ```bash
   git clone https://github.com/DEVANSH0507/Job-Scheduler.git
   cd Job-Scheduler
   npm install
   npm start
   ```

### **DOCKER DEPLOYMENT (BONUS 1)**:

 ```bash
   docker build -t job-scheduler .
   docker run -p 3000:3000 job-scheduler
   ```

   
### **Run the application**:

  ```bash
   npm run dev
   npm start
   ```
### The server will start on
```bash
   http://localhost:3000
```
---

## Trade-offs & Design Decisions

- **In-memory cache is used for faster scheduling and execution**
   - Trade-off: data must be reloaded on restart
- ** Therefore SQLite is used to store jobs and executions because it is simple and reliable**
   - Trade-off: not suitable for very large distributed systems
- **Priority Queue (Min-Heap) is used to pick the next job efficiently instead array for linear search**
   - Trade-off: extra logic is needed to ignore outdated heap entries
- **Dynamic sleep scheduler is used to reduce CPU usage and drift**
  - Trade-off: scheduler logic becomes slightly complex 
- **Webhook-based alerts are used for job failure notifications**
  - Trade-off: alert delivery depends on external services
- **Single-node scheduler is implemented to keep the system simple**
  - Trade-off: high availability is documented but not implemented as one scheduler can fail so need load balance+more scheduler
- **Simple frontend dashboard is built only for visibility**
  - Trade-off: UI is not production-level

  --- 

## Future Improvements
- we can use better databse for better scalability like redis,Postgre SQL etc
- we can use more than one scheduler and add load balancet to incerase throughput
- we can limit record history to save memory
- we can track average api running time and improve job scheduling
- we can add user login system
- Develop a seprate alerting system for job fail and use it
- Develop better retry mechanism to decrease job failure

---

## Tech Stacks

| Layer            | Technology                | Purpose                |
| ---------------- | ------------------------- | ---------------------- |
| Backend Runtime  | Node.js (v18)             | Server-side execution  |
| Web Framework    | Express.js                | REST API development   |
| Scheduling       | Custom Scheduler          | Job scheduling logic   |
| Data Structures  | Min-Heap (Priority Queue) | Efficient job ordering |
| Database         | SQLite                    | Persistent storage     |
| HTTP Client      | Axios                     | External API calls     |
| Observability    | Custom Metrics            | Monitoring & debugging |
| Alerts           | Webhook-based             | Failure notifications  |
| Frontend         | HTML, CSS, JavaScript     | Dashboard UI           |
| Containerization | Docker                    | Deployment (Bonus)     |
| Version Control  | Git & GitHub              | Source code management |

---

## Author

**DEVANSH GUPTA**



 




















