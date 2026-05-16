const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  taskName: String,
  stimulusType: String,
  reactionTime: Number,
  isCorrect: Boolean,
  label: String,
  timestamp: { type: Number, default: () => Date.now() },
});

module.exports = mongoose.model("LabelEvent", labelSchema);
