const express = require("express");
const { v4: uuidv4 } = require("uuid");  //to assign unique number
const parser = require("cron-parser");  //cron parser

const Job = require("../models/job"); //need job schema to create job
const { jobs, executions } = require("../storage/inMemory"); //need execution map to store job execution data
const { jobHeap } = require("../storage/jobHeaps"); //centrslized heaps
const db = require("../storage/db");

const router = express.Router();

// Here implementer routes for 4 API


//to push job in job scheduler it give unique id assign to job as jobid and save in file + DB 
    //this api will fetch data parse it and create job id for it also load that job in heap and 
    //job map after cal next execution time
router.post("/", (req, res) => {
  try {
    
    //1. GET all DATA
    const { schedule, api, type, alertWebhook } = req.body;

    //2. VALIDATE all data
    if (!schedule || !api || !type) {

      return res.status(400).json({ error: "Missing fields" });
    }

     //3.using uuid generate unique id
    const jobId = uuidv4();

    // 4.calculate first execution time 
    const interval = parser.parseExpression(schedule);
     
    //5.convert it in string format
    const nextExecutionTime = interval.next().toDate();

     //6.create job acc to data
    const job = new Job({
      jobId,
      schedule,
      api,
      type,
      nextExecutionTime,
      alertWebhook,
    });

     //7.store in job array map
    jobs.set(jobId, job); 
    //8.assign execution list for that jobId
    executions.set(jobId, []); 
    
    //9. Push in Heap for exection
    jobHeap.push({
    jobId,
    nextExecutionTime: job.nextExecutionTime
    });

    // 10.store in database same job for protecting data
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
  //1.get job ID
  const {jobId} = req.params;

   //2. VALIDATE
  if (!executions.has(jobId))
  {
    return res.status(404).json({ error: "Job Not Found" });
  }
 
  //3. get all job instance using execution map as it give res acc to job id 
  const history = executions.get(jobId);

  //return last 5
  const lastFive = history.slice(-5).reverse();

  return res.json(lastFive);
});

// to update data call /jobId and give data 
//on update it put data in heap for further execution 
router.put("/:jobId", (req, res) => {
  //1.Get Job id and data to change
  const { jobId } = req.params;
  const { schedule, api, type } = req.body;

  //2.validate
  if (!jobs.has(jobId)) 
    {
    return res.status(404).json({ error: "Job not found" });
    }

  try {
    //1.fetch that job in map
    const job = jobs.get(jobId);

     //2.update data and push in heap new job 
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
