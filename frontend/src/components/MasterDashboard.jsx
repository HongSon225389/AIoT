import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const socket = io("http://localhost:5000");

const MasterDashboard = () => {
  const [systemData, setSystemData] = useState({
    eeg: {
      attention: 0,
      meditation: 0,
      tbr: 0,
      signal: 200,
      delta: 0,
      theta: 0,
      low_alpha: 0,
      high_alpha: 0,
      low_beta: 0,
      high_beta: 0,
      low_gamma: 0,
      mid_gamma: 0,
    },
    vision: {
      emotion: "WAITING...",
      gaze: "Connecting...",
      head_pose_state: "WAITING...",
      gaze_state: "WAITING...",
    },
    final_state: "System Offline",
    frame: null,
  });

  // STATE CHỨA 4 CHỈ SỐ AI TỔNG HỢP
  const [aiMetrics, setAiMetrics] = useState({
    focus: 0,
    relaxation: 0,
    stress: 0,
    fatigue: 0,
  });

  const [waveData, setWaveData] = useState([]);
  const [spectrumData, setSpectrumData] = useState([]);
  const [logMessages, setLogMessages] = useState([
    "> System initialized...",
    "> Waiting for device handshake...",
  ]);

  useEffect(() => {
    const handleSensorData = (data) => {
      const sanitizedData = {
        ...data,
        eeg: data.eeg || {},
        vision: data.vision || {
          emotion: "N/A",
          gaze: "N/A",
          head_pose_state: "N/A",
          gaze_state: "N/A",
        },
        final_state: data.final_state || "Unknown",
      };

      // Chỉ thay ảnh khi nhận được Base64 hợp lệ.
      // Nếu Edge gửi chuỗi rỗng hoặc "SKIP", giữ lại ảnh cũ để tránh nhấp nháy.
      setSystemData((prev) => ({
        ...prev,
        ...sanitizedData,
        eeg: { ...prev.eeg, ...sanitizedData.eeg },
        vision: { ...prev.vision, ...sanitizedData.vision },
        frame:
          sanitizedData.frame && sanitizedData.frame !== "SKIP"
            ? sanitizedData.frame
            : prev.frame,
      }));

      const eeg = sanitizedData.eeg;
      const vis = sanitizedData.vision;

      const att = eeg.attention || 0;
      const med = eeg.meditation || 0;
      const head = (vis.head_pose_state || "").toUpperCase();
      const gaze = (vis.gaze_state || "").toUpperCase();
      const emo = (vis.emotion || "").toUpperCase();

      // 1. Chấm điểm Head Pose với đủ 5 trạng thái chuyển động.
      let scoreHead = 30;

      if (head.includes("NHÌN THẲNG") || head.includes("NHIN THANG")) {
        scoreHead = 100;
      } else if (
        head.includes("KHÔNG") ||
        head.includes("KHONG") ||
        head.includes("NO")
      ) {
        scoreHead = 0;
      } else if (head.includes("NGẨNG LÊN") || head.includes("NGANG LEN")) {
        scoreHead = 60;
      } else if (head.includes("CÚI XUỐNG") || head.includes("CUI XUONG")) {
        scoreHead = 20;
      } else if (
        head.includes("QUAY TRÁI") ||
        head.includes("QUAY TRAI") ||
        head.includes("QUAY PHẢI") ||
        head.includes("QUAY PHAI")
      ) {
        scoreHead = 35;
      }

      // 2. Chấm điểm Gaze với đủ 5 trạng thái chuyển động.
      let scoreGaze = 40;

      if (gaze.includes("NHÌN THẲNG") || gaze.includes("NHIN THANG")) {
        scoreGaze = 100;
      } else if (
        gaze.includes("KHÔNG") ||
        gaze.includes("KHONG") ||
        gaze.includes("NO")
      ) {
        scoreGaze = 0;
      } else if (gaze.includes("LIẾC LÊN") || gaze.includes("LIEC LEN")) {
        scoreGaze = 50;
      } else if (gaze.includes("LIẾC XUỐNG") || gaze.includes("LIEC XUONG")) {
        scoreGaze = 20;
      } else if (
        gaze.includes("LIẾC TRÁI") ||
        gaze.includes("LIEC TRAI") ||
        gaze.includes("LIẾC PHẢI") ||
        gaze.includes("LIEC PHAI")
      ) {
        scoreGaze = 40;
      }
      // 1. MỨC ĐỘ TẬP TRUNG
      // Attention là tín hiệu chính; Head Pose và Gaze là tín hiệu hỗ trợ.
      const focusPercent = att * 0.7 + scoreHead * 0.15 + scoreGaze * 0.15;

      // 2. ĐỘ THƯ GIÃN
      // Meditation là tín hiệu chính, Emotion hỗ trợ đánh giá trạng thái bình tĩnh.
      let emotionRelaxScore = 50;

      if (
        emo.includes("BÌNH THƯỜNG") ||
        emo.includes("BINH THUONG") ||
        emo.includes("NEUTRAL")
      ) {
        emotionRelaxScore = 80;
      } else if (emo.includes("VUI") || emo.includes("HAPPY")) {
        emotionRelaxScore = 70;
      } else if (
        emo.includes("NGẠC NHIÊN") ||
        emo.includes("NGAC NHIEN") ||
        emo.includes("SURPRISE")
      ) {
        emotionRelaxScore = 45;
      } else if (
        emo.includes("BUỒN") ||
        emo.includes("BUON") ||
        emo.includes("SAD")
      ) {
        emotionRelaxScore = 35;
      } else if (
        emo.includes("TỨC") ||
        emo.includes("TUC") ||
        emo.includes("SỢ") ||
        emo.includes("SO") ||
        emo.includes("KHÓ CHỊU") ||
        emo.includes("KHO CHIU") ||
        emo.includes("ANGRY") ||
        emo.includes("FEAR") ||
        emo.includes("DISGUST")
      ) {
        emotionRelaxScore = 15;
      }

      const relaxPercent = med * 0.85 + emotionRelaxScore * 0.15;

      // 3. ÁP LỰC / CĂNG THẲNG
      // Meditation thấp làm tăng áp lực; cảm xúc tiêu cực làm tăng thêm điểm stress.
      let emotionStressScore = 10;

      if (emo.includes("VUI") || emo.includes("HAPPY")) {
        emotionStressScore = 5;
      } else if (
        emo.includes("BÌNH THƯỜNG") ||
        emo.includes("BINH THUONG") ||
        emo.includes("NEUTRAL")
      ) {
        emotionStressScore = 10;
      } else if (
        emo.includes("NGẠC NHIÊN") ||
        emo.includes("NGAC NHIEN") ||
        emo.includes("SURPRISE")
      ) {
        emotionStressScore = 40;
      } else if (
        emo.includes("BUỒN") ||
        emo.includes("BUON") ||
        emo.includes("SAD")
      ) {
        emotionStressScore = 55;
      } else if (
        emo.includes("KHÓ CHỊU") ||
        emo.includes("KHO CHIU") ||
        emo.includes("DISGUST")
      ) {
        emotionStressScore = 80;
      } else if (
        emo.includes("SỢ") ||
        emo.includes("SO") ||
        emo.includes("FEAR")
      ) {
        emotionStressScore = 90;
      } else if (
        emo.includes("TỨC") ||
        emo.includes("TUC") ||
        emo.includes("ANGRY")
      ) {
        emotionStressScore = 100;
      }

      const stressPercent = (100 - med) * 0.7 + emotionStressScore * 0.3;

      // 4. NGUY CƠ MỆT MỎI
      // Attention thấp là tín hiệu chính; cúi đầu và nhìn xuống là tín hiệu hỗ trợ.
      let headFatigueScore = 10;

      if (
        head.includes("KHÔNG") ||
        head.includes("KHONG") ||
        head.includes("NO")
      ) {
        headFatigueScore = 0;
      } else if (head.includes("NHÌN THẲNG") || head.includes("NHIN THANG")) {
        headFatigueScore = 10;
      } else if (head.includes("NGẨNG LÊN") || head.includes("NGANG LEN")) {
        headFatigueScore = 20;
      } else if (
        head.includes("QUAY TRÁI") ||
        head.includes("QUAY TRAI") ||
        head.includes("QUAY PHẢI") ||
        head.includes("QUAY PHAI")
      ) {
        headFatigueScore = 40;
      } else if (head.includes("CÚI XUỐNG") || head.includes("CUI XUONG")) {
        headFatigueScore = 100;
      }

      let gazeFatigueScore = 10;

      if (
        gaze.includes("KHÔNG") ||
        gaze.includes("KHONG") ||
        gaze.includes("NO")
      ) {
        gazeFatigueScore = 0;
      } else if (gaze.includes("NHÌN THẲNG") || gaze.includes("NHIN THANG")) {
        gazeFatigueScore = 10;
      } else if (gaze.includes("LIẾC LÊN") || gaze.includes("LIEC LEN")) {
        gazeFatigueScore = 20;
      } else if (
        gaze.includes("LIẾC TRÁI") ||
        gaze.includes("LIEC TRAI") ||
        gaze.includes("LIẾC PHẢI") ||
        gaze.includes("LIEC PHAI")
      ) {
        gazeFatigueScore = 40;
      } else if (gaze.includes("LIẾC XUỐNG") || gaze.includes("LIEC XUONG")) {
        gazeFatigueScore = 100;
      }

      const fatiguePercent =
        (100 - att) * 0.6 + headFatigueScore * 0.2 + gazeFatigueScore * 0.2;

      // Giới hạn các kết quả trong khoảng 0 - 100.
      const clamp = (num) => Math.max(0, Math.min(100, Math.round(num)));

      setAiMetrics({
        focus: clamp(focusPercent),
        relaxation: clamp(relaxPercent),
        stress: clamp(stressPercent),
        fatigue: clamp(fatiguePercent),
      });

      // VẼ BIỂU ĐỒ
      // 1. Raw Waveform: dữ liệu raw_values lấy từ TGAM code 0x80.
      if (
        Array.isArray(sanitizedData.raw_values) &&
        sanitizedData.raw_values.length > 0
      ) {
        const realWave = sanitizedData.raw_values.map((val, index) => ({
          ms: Math.round(index * (1000 / 512)),
          // Ghim phần hiển thị trong khoảng -500 đến 500 để đồ thị không bị văng.
          uv: val > 500 ? 500 : val < -500 ? -500 : val,
        }));

        setWaveData(realWave);
      }

      // 2. ASIC EEG Power: 8 dải băng tần thật từ TGAM code 0x83.
      const spectrumBands = [
        { hz: "Delta", power: eeg.delta || 0 },
        { hz: "Theta", power: eeg.theta || 0 },
        { hz: "L-Alpha", power: eeg.low_alpha || 0 },
        { hz: "H-Alpha", power: eeg.high_alpha || 0 },
        { hz: "L-Beta", power: eeg.low_beta || 0 },
        { hz: "H-Beta", power: eeg.high_beta || 0 },
        { hz: "L-Gamma", power: eeg.low_gamma || 0 },
        { hz: "M-Gamma", power: eeg.mid_gamma || 0 },
      ];

      setSpectrumData(spectrumBands);

      // Log hệ thống
      if (Math.random() > 0.7) {
        setLogMessages((prev) =>
          [
            `> Sync | Head: ${sanitizedData.vision.head_pose_state} | Att: ${eeg.attention}`,
            ...prev,
          ].slice(0, 10),
        );
      }
    };

    socket.on("sensor_data", handleSensorData);

    return () => {
      socket.off("sensor_data", handleSensorData);
    };
  }, []);

  const calculateBands = () => {
    const e = systemData.eeg;
    const alpha = (e.low_alpha || 0) + (e.high_alpha || 0);
    const beta = (e.low_beta || 0) + (e.high_beta || 0);
    const gamma = (e.low_gamma || 0) + (e.mid_gamma || 0);
    const total = (e.delta || 0) + (e.theta || 0) + alpha + beta + gamma || 1;
    return {
      delta: Math.round((e.delta / total) * 100) || 0,
      theta: Math.round((e.theta / total) * 100) || 0,
      alpha: Math.round((alpha / total) * 100) || 0,
      beta: Math.round((beta / total) * 100) || 0,
      gamma: Math.round((gamma / total) * 100) || 0,
    };
  };

  const bands = calculateBands();
  const isConnected = systemData.eeg.signal !== 200;

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "1.5rem",
    padding: "24px",
    transition: "all 0.4s ease",
  };

  const cognitiveStateConfig = [
    {
      name: "MỨC ĐỘ TẬP TRUNG",
      val: aiMetrics.focus,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      name: "ĐỘ THƯ GIÃN (TĨNH TÂM)",
      val: aiMetrics.relaxation,
      color: "#06b6d4",
      bg: "rgba(6, 182, 212, 0.1)",
    },
    {
      name: "ÁP LỰC (CĂNG THẲNG)",
      val: aiMetrics.stress,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    },
    {
      name: "NGUY CƠ MỆT MỎI",
      val: aiMetrics.fatigue,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.1)",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
        minHeight: "100vh",
        color: "white",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "900",
              margin: 0,
              color: "transparent",
              WebkitBackgroundClip: "text",
              backgroundImage: "linear-gradient(to right, #34d399, #06b6d4)",
              textShadow: "0 0 15px rgba(16, 185, 129, 0.4)",
              fontStyle: "italic",
              textTransform: "uppercase",
            }}
          >
            OptiMind Analyzer
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "10px",
              letterSpacing: "3px",
              fontWeight: "bold",
              margin: "5px 0 0 0",
              textTransform: "uppercase",
            }}
          >
            Real-time Sensor Fusion • AI Vision + EEG
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(15, 23, 42, 0.5)",
            border: "1px solid #1e293b",
            padding: "10px 20px",
            borderRadius: "16px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isConnected ? "#10b981" : "#ef4444",
              boxShadow: isConnected ? "0 0 12px #10b981" : "0 0 12px #ef4444",
            }}
          ></span>
          <span
            style={{
              fontSize: "9px",
              fontWeight: "900",
              letterSpacing: "2px",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            {isConnected ? "System Active" : "System Offline"}
          </span>
        </div>
      </header>

      {/* ROW 1: TOP SECTION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* COL 1: ATTENTION, MEDITATION & AI METRICS */}
        <div
          style={{
            gridColumn: "span 3",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* RAW EEG */}
          <div style={{ display: "flex", gap: "15px" }}>
            {/* RAW ATTENTION */}
            <div
              style={{
                ...cardStyle,
                flex: 1,
                padding: "15px",
                borderBottom: "4px solid rgba(59, 130, 246, 0.5)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: `${systemData.eeg.attention}%`,
                  background: "rgba(59, 130, 246, 0.1)",
                  transition: "height 0.7s ease",
                }}
              ></div>
              <h4
                style={{
                  color: "#60a5fa",
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                  margin: "0 0 5px 0",
                }}
              >
                ATTENTION
              </h4>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  lineHeight: "1",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {systemData.eeg.attention}
              </div>
            </div>

            {/* RAW MEDITATION */}
            <div
              style={{
                ...cardStyle,
                flex: 1,
                padding: "15px",
                borderBottom: "4px solid rgba(6, 182, 212, 0.5)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: `${systemData.eeg.meditation}%`,
                  background: "rgba(6, 182, 212, 0.1)",
                  transition: "height 0.7s ease",
                }}
              ></div>
              <h4
                style={{
                  color: "#22d3ee",
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                  margin: "0 0 5px 0",
                }}
              >
                MEDITATION
              </h4>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  lineHeight: "1",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {systemData.eeg.meditation}
              </div>
            </div>
          </div>

          {/* KHỐI 4 CHỈ SỐ AI */}
          <div
            style={{
              ...cardStyle,
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                color: "#64748b",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "2px",
                margin: "0 0 20px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#8b5cf6",
                  borderRadius: "50%",
                }}
              ></span>
              AI COGNITIVE STATES
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                flex: 1,
                justifyContent: "center",
              }}
            >
              {cognitiveStateConfig.map((item, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#94a3b8",
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "900",
                        color: item.color,
                      }}
                    >
                      {item.val}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "12px",
                      background: "rgba(0,0,0,0.4)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.val}%`,
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`,
                        transition: "width 0.3s ease-out",
                        borderRadius: "6px",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIGNAL QUALITY */}
          <div
            style={{
              ...cardStyle,
              borderLeft: `4px solid ${systemData.eeg.signal === 0 ? "#10b981" : systemData.eeg.signal === 200 ? "#ef4444" : "#eab308"}`,
              padding: "20px",
            }}
          >
            <h4
              style={{
                color: "#64748b",
                fontSize: "9px",
                fontWeight: "900",
                letterSpacing: "2px",
                margin: "0 0 5px 0",
              }}
            >
              SIGNAL QUALITY
            </h4>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  color:
                    systemData.eeg.signal === 0
                      ? "#34d399"
                      : systemData.eeg.signal === 200
                        ? "#f87171"
                        : "#facc15",
                }}
              >
                {systemData.eeg.signal === 0
                  ? "EXCELLENT"
                  : systemData.eeg.signal === 200
                    ? "NO DATA"
                    : "NOISY"}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.5,
                  fontFamily: "monospace",
                }}
              >
                CODE: {systemData.eeg.signal}
              </div>
            </div>
          </div>
        </div>

        {/* COL 2: CAMERA */}
        <div
          style={{
            gridColumn: "span 6",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              ...cardStyle,
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3
                style={{
                  color: "#fcd34d",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: 0,
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#f59e0b",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px #f59e0b",
                  }}
                ></span>
                AI VISION STREAM
              </h3>
              <div
                style={{
                  fontSize: "9px",
                  color: "#94a3b8",
                  background: "rgba(0,0,0,0.5)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  fontFamily: "monospace",
                }}
              >
                DEEPFACE ENGINE
              </div>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                background: "#000",
                borderRadius: "1rem",
                overflow: "hidden",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {systemData.frame ? (
                <img
                  src={`data:image/jpeg;base64,${systemData.frame}`}
                  alt="AI Stream"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    color: "#475569",
                    letterSpacing: "2px",
                    fontSize: "12px",
                  }}
                >
                  AWAITING CAMERA FEED...
                </div>
              )}

              {/* HEAD / GAZE / EMOTION */}
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  left: "15px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "8px",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    background: "rgba(0,0,0,0.82)",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    borderLeft: "3px solid #facc15",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                  }}
                >
                  <span
                    style={{
                      color: "#fde047",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    HEAD:{" "}
                    {systemData.vision?.head_pose_state || "Không xác định"}
                  </span>
                </div>

                <div
                  style={{
                    background: "rgba(0,0,0,0.82)",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    borderLeft: "3px solid #10b981",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                  }}
                >
                  <span
                    style={{
                      color: "#34d399",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    GAZE: {systemData.vision?.gaze_state || "Không xác định"}
                  </span>
                </div>

                <div
                  style={{
                    background: "rgba(0,0,0,0.82)",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    borderLeft: "3px solid #06b6d4",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                  }}
                >
                  <span
                    style={{
                      color: "#22d3ee",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    EMOTION: {systemData.vision?.emotion || "Không xác định"}
                  </span>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "rgba(0,0,0,0.8)",
                  padding: "8px 15px",
                  borderRadius: "8px",
                  borderRight: "3px solid #10b981",
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    color: "#34d399",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  {(systemData.final_state || "OFFLINE").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: RATIOS & LOG */}
        <div
          style={{
            gridColumn: "span 3",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ ...cardStyle, padding: "24px" }}>
            <h3
              style={{
                color: "#64748b",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "2px",
                margin: "0 0 15px 0",
              }}
            >
              BRAINWAVE RATIOS
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {[
                { name: "DELTA (0.5-4Hz)", val: bands.delta, color: "#ef4444" },
                { name: "THETA (4-8Hz)", val: bands.theta, color: "#f97316" },
                { name: "ALPHA (8-13Hz)", val: bands.alpha, color: "#10b981" },
                { name: "BETA (13-30Hz)", val: bands.beta, color: "#3b82f6" },
                { name: "GAMMA (30-40Hz)", val: bands.gamma, color: "#a855f7" },
              ].map((band) => (
                <div key={band.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "9px",
                      marginBottom: "4px",
                      fontWeight: "900",
                    }}
                  >
                    <span style={{ color: band.color }}>{band.name}</span>
                    <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>
                      {band.val}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "3px",
                      overflow: "hidden",
                      padding: "1px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${band.val}%`,
                        background: band.color,
                        transition: "width 0.5s ease",
                        boxShadow: `0 0 8px ${band.color}80`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1, padding: "20px" }}>
            <h3
              style={{
                color: "#64748b",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "2px",
                margin: "0 0 10px 0",
              }}
            >
              SYSTEM LOG
            </h3>
            <div
              style={{
                height: "100px",
                overflowY: "auto",
                fontSize: "9px",
                color: "#475569",
                fontFamily: "monospace",
                fontStyle: "italic",
                lineHeight: "1.6",
              }}
            >
              {logMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{ color: idx === 0 ? "#10b981" : "#475569" }}
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: BOTTOM SECTION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "24px",
        }}
      >
        {/* WAVEFORM */}
        <div style={{ gridColumn: "span 7" }}>
          <div style={{ ...cardStyle, height: "300px", padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3
                style={{
                  color: "#10b981",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#10b981",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px #10b981",
                  }}
                ></span>
                RAW WAVEFORM
              </h3>
              {/* <div
                style={{
                  fontSize: "9px",
                  color: "#94a3b8",
                  background: "rgba(0,0,0,0.5)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  fontFamily: "monospace",
                }}
              >
                RANGE: ±500μV | WINDOW: 1000ms
              </div> */}
            </div>
            <div
              style={{
                width: "100%",
                height: "220px",
                background: "#000",
                borderRadius: "1rem",
                border: "1px solid rgba(16, 185, 129, 0.1)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={waveData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <XAxis
                    dataKey="ms"
                    tick={{ fontSize: 9, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => (val % 250 === 0 ? `${val}ms` : "")}
                  />
                  <YAxis
                    domain={[-500, 500]}
                    tick={{ fontSize: 9, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val > 0 ? "+" : ""}${val}μV`}
                  />
                  <Tooltip
                    labelFormatter={(label) => `Time: ${label}ms`}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="uv"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SPECTRUM */}
        <div style={{ gridColumn: "span 5" }}>
          <div style={{ ...cardStyle, height: "300px", padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3
                style={{
                  color: "#22d3ee",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#06b6d4",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px #06b6d4",
                  }}
                ></span>
                FREQUENCY SPECTRUM ANALYZER
              </h3>
            </div>
            <div
              style={{
                width: "100%",
                height: "220px",
                background: "#000",
                borderRadius: "1rem",
                border: "1px solid rgba(6, 182, 212, 0.1)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={spectrumData}
                  margin={{ top: 15, right: 10, left: -20, bottom: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.02)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hz"
                    tick={{ fontSize: 8, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis hide />
                  <Tooltip
                    labelFormatter={(label) => `Dải sóng: ${label}`}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar
                    dataKey="power"
                    fill="rgba(6, 182, 212, 0.4)"
                    stroke="#06b6d4"
                    strokeWidth={1}
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;
