const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    walletAddress:  { type: String, required: true, unique: true, lowercase: true },
    username:       String,
    bio:            String,
    skills:         [String],
    portfolio:      String,
    cachedRepScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
