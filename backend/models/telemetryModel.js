const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  eeg: {
    signal: Number,
    attention: Number,
    meditation: Number,
    delta: Number,
    theta: Number,
    alpha: Number,
    beta: Number,
    gamma: Number,
    low_alpha: Number,
    high_alpha: Number,
    low_beta: Number,
    high_beta: Number,
    low_gamma: Number,
    mid_gamma: Number,
  },
  vision: {
    gaze_state: String,
    head_pose_state: String,
    emotion: String,
    // person_id: String,
  },
  final_state: String,
  local_time: {
    type: String,
    default: () =>
      new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
  },
});

module.exports = mongoose.model("Telemetry", telemetrySchema);
