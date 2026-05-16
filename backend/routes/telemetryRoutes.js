const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");

module.exports = (io) => {
  router.post("/eeg-data", telemetryController.receiveEEGData(io));
  router.get("/history", telemetryController.getHistory);
  return router;
};
