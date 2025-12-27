const { jobs } = require("../storage/inMemory");
const { jobHeap } = require("../storage/jobHeaps");
const { parseExpression } = require("cron-parser");

// Here we implement a Dynamic Scheduler
//it will sleep for 1s if not entry and chk again and again
//but if heap has val then it will sleep for only time min(1s,heap.top)
//this way drift decrease


let schedulerTimer = null;

// schedule next wake-up
function scheduleNext(sendToWorker) {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
  }

  const next = jobHeap.peek();
  
  //check if there is next entry means heap has val or not
  if (!next) {
    schedulerTimer = setTimeout(
      () => scheduleNext(sendToWorker),
      1000
    );
    return;
  }

   //cal delay for how much time to sleep
  const delay = Math.max(
    next.nextExecutionTime.getTime() - Date.now(),
    0
  );

  schedulerTimer = setTimeout(
    () => runDueJobs(sendToWorker),
    delay
  );
}

// run all jobs that are due
function runDueJobs(sendToWorker) {
  const now = new Date();

  while (
    jobHeap.peek() &&
    jobHeap.peek().nextExecutionTime <= now
  ) {
    const heapEntry = jobHeap.pop();
    const job = jobs.get(heapEntry.jobId);

    // job removed
    if (!job) continue;

    // if val in heap but it got changed in heap so skip it
    if (
      job.nextExecutionTime.getTime() !==
      heapEntry.nextExecutionTime.getTime()
    ) 
    {
      continue;
    }

    //execute job
    sendToWorker(job);

    //compute next execution
    const interval = parseExpression(job.schedule, 
      {
      second: true, 
      });

    job.nextExecutionTime = interval.next().toDate();

    //push in heap for next instance of job
    jobHeap.push({
      jobId: job.jobId,
      nextExecutionTime: job.nextExecutionTime,
    });
  }

  // schedule again for next job
  scheduleNext(sendToWorker);
}

// start scheduler
function startScheduler(sendToWorker) {
  console.log("Scheduler started (dynamic sleep)");
  scheduleNext(sendToWorker);
}

module.exports = { startScheduler };
