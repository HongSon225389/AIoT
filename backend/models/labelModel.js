const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  taskName: String,
  stimulusType: String,
  reactionTime: Number,
  isCorrect: Boolean,
  label: String,
  timestamp: { type: Number, default: () => Date.now() },
  local_time: {
    type: String,
    default: () =>
      new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
  },
});

module.exports = mongoose.model("LabelEvent", labelSchema);
