// memory of project
                                  //mapping
const jobs = new Map();          //jobId-Job   to track all jobs 
const executions = new Map();    //jobId-Executions   to track exection history

module.exports = {
  jobs,
  executions
};
