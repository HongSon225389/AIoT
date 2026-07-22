const Telemetry = require("../models/telemetryModel");

let lastSaveTime = 0;
// 🔥 HỨNG LUỒNG SIÊU TỐC TỪ PYTHON
exports.handleSocketData = (socket) => (payload) => {
  try {
    // 1. Bắn qua React Web ngay lập tức (Real-time 25 FPS)
    // Dùng io.emit thay vì broadcast để đảm bảo mọi Client đều nhận được
    socket.broadcast.emit("sensor_data", payload);

    // 2. Lọc bỏ hình ảnh Base64 và mảng raw_values nặng nề trước khi xét duyệt DB
    const { frame, raw_values, ...dataToSave } = payload;

    // 3. Cơ chế Throttling: Chỉ lưu DB 1 lần mỗi giây (1 FPS)
    const currentTime = Date.now();
    if (currentTime - lastSaveTime >= 1000) {
      new Telemetry(dataToSave)
        .save()
        .catch((err) => console.error("⚠️ [DB Error]:", err.message));

      lastSaveTime = currentTime; // Reset lại đồng hồ
    }
  } catch (error) {
    console.error("Socket Error:", error);
  }
};

exports.receiveEEGData = (io) => (req, res) => {
  try {
    const payload = processPayload(req.body);
    io.emit("sensor_data", payload);
    const { frame, raw_values, ...dataToSave } = payload;
    new Telemetry(dataToSave)
      .save()
      .catch((err) => console.error("⚠️ [DB Error]:", err.message));
    res.status(200).send("OK");
  } catch (error) {
    res.status(500).send("Error");
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

// const Telemetry = require("../models/telemetryModel");

// exports.receiveEEGData = (io) => (req, res) => {
//   try {
//     let payload = req.body;

//     if (payload.eeg) {
//       payload.eeg.alpha =
//         (payload.eeg.low_alpha || 0) + (payload.eeg.high_alpha || 0);
//       payload.eeg.beta =
//         (payload.eeg.low_beta || 0) + (payload.eeg.high_beta || 0);
//       payload.eeg.gamma =
//         (payload.eeg.low_gamma || 0) + (payload.eeg.mid_gamma || 0);
//     }

//     if (payload.vision) {
//       payload.vision.emotion = payload.vision.emotion || "N/A";
//       payload.vision.gaze = payload.vision.gaze_state || "N/A";
//     }

//     // Phát real-time qua Socket.io
//     io.emit("sensor_data", payload);

//     // Lưu DB
//     const { frame, raw_values, ...dataToSave } = payload;
//     new Telemetry(dataToSave)
//       .save()
//       .catch((err) => console.error("⚠️ [DB Error]:", err.message));

//     res.status(200).send("OK");
//   } catch (error) {
//     res.status(500).send("Error");
//   }
// };

// exports.getHistory = async (req, res) => {
//   try {
//     const history = await Telemetry.find().sort({ timestamp: -1 }).limit(50);
//     res.json(history.length === 0 ? { message: "DB rỗng" } : history.reverse());
//   } catch (error) {
//     res.status(500).json({ error: "Lỗi kết nối Database" });
//   }
// };
