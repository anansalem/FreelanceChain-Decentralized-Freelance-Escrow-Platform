const express = require("express");
const router  = express.Router();
const Job     = require("../models/Job");

router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:jobId", async (req, res) => {
  try {
    const job = await Job.findOne({ jobId: req.params.jobId });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { jobId, title, description, skills, clientWallet, paymentEth, txHash } = req.body;
    const job   = new Job({ jobId, title, description, skills, clientWallet, paymentEth, txHash });
    const saved = await job.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:jobId/accept", async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { jobId: req.params.jobId },
      { freelancerWallet: req.body.freelancerWallet },
      { new: true }
    );
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
