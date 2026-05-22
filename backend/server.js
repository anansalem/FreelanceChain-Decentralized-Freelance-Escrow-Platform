require("dotenv").config();
const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");
const jobRoutes = require("./routes/jobs");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/jobs", jobRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
