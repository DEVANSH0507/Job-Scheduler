const express = require("express");
const jobRoutes = require("./routes/jobs");
const {jobs} =require("./storage/inMemory");
const metrics =require("./storage/metrics");

const app = express();

app.use(express.json()); //middleware 

// Here check health and metrics implemented directly and route calling for job routes

//check health of server
app.get("/health", (req, res) => {
  res.json({ status: "OK" ,
    uptimeSeconds: process.uptime(),
    activeJobs: jobs.size,
    timestamp: new Date().toISOString()
   });
});

//api call for metrics 
app.get("/metrics", (req, res) => {
  res.json(metrics);
});

//add jobroutes to main
app.use("/jobs", jobRoutes);

module.exports = app;
