//to save all job data schema
class Job {
  constructor({ jobId, schedule, api, type, nextExecutionTime, alertWebhook }) {
    this.jobId = jobId;
    this.schedule = schedule;
    this.api = api;
    this.type = type;
    this.nextExecutionTime = nextExecutionTime;
    this.alertWebhook = alertWebhook || null;
  }
}

module.exports = Job;
