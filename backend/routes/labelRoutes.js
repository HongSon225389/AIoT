const express = require("express");
const router = express.Router();
const labelController = require("../controllers/labelController");

// 1. Nhận nhãn sự kiện từ React Test
router.post("/label-event", labelController.postLabel);

// 2. Xuất báo cáo tổng hợp
router.get("/export-full-report", labelController.exportReport);

// 3. Xuất báo cáo tập trung
router.get("/export-ml-dataset", labelController.exportMLDataset);
module.exports = router;
