const LabelModel = require("../models/labelModel");
const Telemetry = require("../models/telemetryModel");

exports.postLabel = async (req, res) => {
  try {
    await new LabelModel(req.body).save();
    res.status(200).json({ message: "OK" });
  } catch (err) {
    res.status(500).send("Error");
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { task, start, end } = req.query;
    const labels = await LabelModel.find({
      taskName: task,
      timestamp: { $gte: parseInt(start), $lte: parseInt(end) },
    }).sort({ timestamp: 1 });

    const combinedReport = [];
    for (let label of labels) {
      const eegMatch = await Telemetry.findOne({
        timestamp: {
          $gte: new Date(label.timestamp - 1000),
          $lte: new Date(label.timestamp + 1000),
        },
      }).select("eeg vision");

      combinedReport.push({
        "Thành phần": label.taskName,
        "Thời gian thực": new Date(label.timestamp).toLocaleTimeString("en-GB"),
        "Cặp ký tự/Mũi tên": label.stimulusType,
        "Kết quả": label.isCorrect ? "ĐÚNG" : "SAI",
        "Phản xạ (ms)": label.reactionTime,
        "Attention (%)": eegMatch ? eegMatch.eeg.attention || 0 : 0,
        "Nhãn chẩn đoán": label.label,
      });
    }
    res.json(combinedReport);
  } catch (err) {
    res.status(500).json({ error: "Lỗi tổng hợp" });
  }
};

exports.exportMLDataset = async (req, res) => {
  try {
    // Lấy tất cả các phiên đã dán nhãn "Tập trung" hoặc "Sao nhãng"
    const labels = await LabelModel.find({
      label: { $in: ["Tập trung", "Sao nhãng"] },
    }).sort({ timestamp: 1 });

    const dataset = [];

    for (let event of labels) {
      // Vì event.timestamp là lúc kết thúc bấm nút, reactionTime là tổng thời gian đo (VD: 120000ms)
      const endTime = new Date(event.timestamp);
      const startTime = new Date(event.timestamp - event.reactionTime);

      // Lấy TOÀN BỘ các bản ghi sóng não trong khoảng 2 phút đó
      const eegRecords = await Telemetry.find({
        timestamp: { $gte: startTime, $lte: endTime },
      }).select("eeg vision local_time timestamp");

      // Trải phẳng dữ liệu ra, gán nhãn chung cho tất cả các giây trong phiên đó
      eegRecords.forEach((record) => {
        dataset.push({
          "Local Time": record.local_time,
          "Label (Target)": event.label, // Cái này AI sẽ dùng để học
          Attention: record.eeg?.attention || 0,
          Meditation: record.eeg?.meditation || 0,
          Alpha: record.eeg?.alpha || 0,
          Beta: record.eeg?.beta || 0,
          Theta: record.eeg?.theta || 0,
          Delta: record.eeg?.delta || 0,
          Gamma: record.eeg?.gamma || 0,
          "Head Pose": record.vision?.head_pose_state || "N/A",
          Gaze: record.vision?.gaze_state || "N/A",
          Emotion: record.vision?.emotion || "N/A",
        });
      });
    }

    // Trả về một mảng JSON rất lớn (hàng ngàn dòng)
    res.json(dataset);
  } catch (err) {
    res.status(500).json({ error: "Lỗi trích xuất Dataset ML" });
  }
};
