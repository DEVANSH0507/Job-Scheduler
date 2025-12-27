const express = require("express");
const { v4: uuidv4 } = require("uuid");  //to assign unique number
const parser = require("cron-parser");  //cron parser

const Job = require("../models/job");
const { jobs, executions } = require("../storage/inMemory");
const { jobHeap } = require("../storage/jobHeaps");
const db = require("../storage/db");

const router = express.Router();

// Here implementer routes for 4 API


//to push job in job scheduler it give unique id assign to job as jobid and save in file + DB 
router.post("/", (req, res) => {
  try {
    
    const { schedule, api, type, alertWebhook } = req.body;

    if (!schedule || !api || !type) {

      return res.status(400).json({ error: "Missing fields" });
    }

    const jobId = uuidv4();

    // calculate first execution time
    const interval = parser.parseExpression(schedule);

    const nextExecutionTime = interval.next().toDate();

    const job = new Job({
      jobId,
      schedule,
      api,
      type,
      nextExecutionTime,
      alertWebhook,
    });

    jobs.set(jobId, job); //store in job array map
    executions.set(jobId, []); //assign execution list for that jobId
    
    //Push in Heap for exection
    jobHeap.push({
    jobId,
    nextExecutionTime: job.nextExecutionTime
    });

    // store in database same job for protecting data
    db.prepare(`
    INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?)
    `).run(
    jobId,
    schedule,
    api,
    type,
    nextExecutionTime.toISOString(),
    alertWebhook || null
    );


   
    return res.status(201).json({
      jobId,
      nextExecutionTime,
    });
  } catch (err) {
    return res.status(400).json({ error: "Invalid cron schedule" });
  }
});


// call /jobid/executions to fetch last 5 jobs
router.get("/:jobId/executions", (req, res) => {
  const {jobId} = req.params;

  if (!executions.has(jobId))
  {
    return res.status(404).json({ error: "Job Not Found" });
  }

  const history = executions.get(jobId);

  const lastFive = history.slice(-5).reverse();

  return res.json(lastFive);
});

// to update data call /jobId and give data 
//on update it put data in heap for further execution 
router.put("/:jobId", (req, res) => {
  const { jobId } = req.params;
  const { schedule, api, type } = req.body;

  if (!jobs.has(jobId)) 
    {
    return res.status(404).json({ error: "Job not found" });
    }

  try {
    const job = jobs.get(jobId);

    if (schedule)
     {
      const interval = parser.parseExpression(schedule);
      job.schedule = schedule;
      job.nextExecutionTime = interval.next().toDate();

      jobHeap.push({
        jobId: job.jobId,
        nextExecutionTime: job.nextExecutionTime,
      });
    }
    

    if (api) {
      job.api = api;
    }

    if (type) {
      job.type = type;
    }

    jobs.set(jobId, job);

    return res.json({
      message: "Job updated successfully",
      job,
    });
  } catch (err) {
    return res.status(400).json({ error: "Invalid cron schedule" });
  }
});


//to get all jobs api  call 
router.get("/getAllJobs", (req, res) => {
  res.json(Array.from(jobs.values()));
});



module.exports = router;
