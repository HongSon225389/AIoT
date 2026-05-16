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
