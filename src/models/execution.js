//basic model schema to save record of executed jobs
class Execution {
  constructor({ jobId, executionTime, statusCode, durationMs, success }) {
    this.jobId = jobId;
    this.executionTime = executionTime;
    this.statusCode = statusCode;
    this.durationMs = durationMs;
    this.success = success;
  }
}

module.exports = Execution;
