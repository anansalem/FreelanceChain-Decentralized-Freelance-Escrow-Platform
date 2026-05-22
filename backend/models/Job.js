const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    jobId:            { type: Number, required: true, unique: true },
    title:            { type: String, required: true, trim: true, maxLength: 100 },
    description:      { type: String, required: true },
    skills:           [String],
    clientWallet:     { type: String, required: true },
    freelancerWallet: { type: String, default: null },
    paymentEth:       { type: Number, required: true },
    txHash:           { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
