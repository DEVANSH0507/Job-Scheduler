const app = require("./app");
const express = require("express");
const { startScheduler } = require("./scheduler/scheduler");
const { sendToWorker } = require("./workers/pool.js")
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));
const db = require("./storage/db");
const { jobs } = require("./storage/inMemory");
const { jobHeap } = require("./storage/jobHeaps.js");

//server setup when start first check database file to load all job entries which is to perform

const PORT = 3000;
const rows = db.prepare(`SELECT * FROM jobs`).all();

rows.forEach(row => {
  const job = {
    ...row,
    nextExecutionTime: new Date(row.nextExecutionTime),
  };

  jobs.set(row.jobId, job);

  jobHeap.push({
    jobId: row.jobId,
    nextExecutionTime: job.nextExecutionTime,
  });
});


app.listen(PORT, () => {
  console.log(`Working at port ${PORT}`);

  // start scheduler
  startScheduler(sendToWorker);
});


