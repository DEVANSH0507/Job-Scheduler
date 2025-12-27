// global heap for all project to schedule job in o(logn)
const MinHeap = require("../utils/minHeap");

const jobHeap = new MinHeap();

module.exports = { jobHeap };
