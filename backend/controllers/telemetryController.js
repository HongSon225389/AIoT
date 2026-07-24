const Telemetry = require("../models/telemetryModel");

let lastSaveTime = 0;
//  HỨNG LUỒNG SIÊU TỐC TỪ PYTHON
exports.handleSocketData = (socket) => (payload) => {
  try {
    // Bắn qua React Web ngay lập tức (Real-time 25 FPS)
    socket.broadcast.emit("sensor_data", payload);

    // Lọc bỏ hình ảnh Base64 và mảng raw_values nặng nề trước khi xét duyệt DB
    const { frame, raw_values, ...dataToSave } = payload;

    // Cơ chế Throttling: Chỉ lưu DB 1 lần mỗi giây (1 FPS)
    const currentTime = Date.now();
    if (currentTime - lastSaveTime >= 1000) {
      new Telemetry(dataToSave)
        .save()
        .catch((err) => console.error("⚠️ [DB Error]:", err.message));

      lastSaveTime = currentTime;
    }
  } catch (error) {
    console.error("Socket Error:", error);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Telemetry.find().sort({ timestamp: -1 }).limit(50);
    res.json(history.length === 0 ? { message: "DB rỗng" } : history.reverse());
  } catch (error) {
    res.status(500).json({ error: "Lỗi kết nối Database" });
  }
};
