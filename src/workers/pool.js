const axios = require("axios");
const Execution = require("../models/execution");
const { executions } = require("../storage/inMemory");
const metrics = require("../storage/metrics");
const db = require("../storage/db");

//it is a worker whose work is to call api and record response in Db as well as torage file
//it also save metrics
//i have also implemented alert webhook here for alert mechanism



async function sendToWorker(job) {
  const startTime = Date.now();

  try {

    const response = await axios.post(job.api);

    const durationMs = Date.now()-startTime;
   
    //save execution response
    const execution = new Execution({
      jobId: job.jobId,
      executionTime: new Date(),
      statusCode: response.status,
      durationMs,
      success: true,
    });

    
    //DB entry
    db.prepare(`
    INSERT INTO executions
    (jobId, executionTime, statusCode, durationMs, success)
    VALUES (?, ?, ?, ?, ?)
    `).run(
    job.jobId,
    execution.executionTime.toISOString(),
    execution.statusCode,
    execution.durationMs,
    1
);


    metrics.totalExecutions++;
    metrics.successCount++;

    if (!executions.has(job.jobId)) {
      executions.set(job.jobId, []);
    }
    executions.get(job.jobId).push(execution);

    console.log(
      `Job ${job.jobId} executed successfully in ${durationMs}ms`
    );
  } catch (err) {
    const durationMs = Date.now()-startTime;

    const execution = new Execution({
      jobId: job.jobId,
      executionTime: new Date(),
      statusCode: err.response?.status || 500,
      durationMs,
      success: false,
    });

    db.prepare(`
    INSERT INTO executions
    (jobId, executionTime, statusCode, durationMs, success)
    VALUES (?, ?, ?, ?, ?)
    `).run(
     job.jobId,
     execution.executionTime.toISOString(),
     execution.statusCode,
     execution.durationMs,
     0
);


    metrics.totalExecutions++;
    metrics.failureCount++;

    if (!executions.has(job.jobId)) {
      executions.set(job.jobId, []);
    }
    executions.get(job.jobId).push(execution);

    console.log(`Job ${job.jobId} failed after ${durationMs}ms`);

    if (job.alertWebhook) {
      try {
        await axios.post(job.alertWebhook, {
          event: "JOB_FAILED",
          jobId: job.jobId,
          api: job.api,
          executionTime: new Date().toISOString(),
          statusCode: execution.statusCode,
          durationMs,
        });
      } catch (alertErr) {
        //console.error("Alert webhook failed");
      }
    }
  }
}

module.exports = { sendToWorker };
