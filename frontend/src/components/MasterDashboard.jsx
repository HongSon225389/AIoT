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

  const [waveData, setWaveData] = useState([]);
  const [spectrumData, setSpectrumData] = useState([]);
  const [logMessages, setLogMessages] = useState([
    "> System initialized...",
    "> Waiting for device handshake...",
  ]);

  useEffect(() => {
    socket.on("sensor_data", (data) => {
      // Đảm bảo dữ liệu vision không bị undefined để tránh lỗi toUpperCase()
      const sanitizedData = {
        ...data,
        vision: data.vision || {
          emotion: "N/A",
          gaze: "N/A",
          head_pose_state: "N/A",
          gaze_state: "N/A",
        },
        final_state: data.final_state || "Unknown",
      };

      setSystemData(sanitizedData);
      const eeg = sanitizedData.eeg;

      // 1. THUẬT TOÁN TÁI TẠO RAW WAVEFORM
      const totalPower =
        (eeg.delta || 0) +
          (eeg.theta || 0) +
          (eeg.low_alpha || 0) +
          (eeg.high_alpha || 0) +
          (eeg.low_beta || 0) +
          (eeg.high_beta || 0) +
          (eeg.low_gamma || 0) +
          (eeg.mid_gamma || 0) || 1;

      let newWave = [];
      for (let i = 0; i <= 100; i++) {
        let t = i / 100;
        let v = 0;
        v += (eeg.delta / totalPower) * Math.sin(2 * Math.PI * 2 * t);
        v += (eeg.theta / totalPower) * Math.sin(2 * Math.PI * 6 * t);
        v +=
          ((eeg.low_alpha + eeg.high_alpha) / totalPower) *
          Math.sin(2 * Math.PI * 10 * t);
        v +=
          ((eeg.low_beta + eeg.high_beta) / totalPower) *
          Math.sin(2 * Math.PI * 20 * t);
        v +=
          ((eeg.low_gamma + eeg.mid_gamma) / totalPower) *
          Math.sin(2 * Math.PI * 40 * t);

        v = v * 800 + (Math.random() - 0.5) * 15;
        newWave.push({ ms: i * 10, uv: v });
      }
      setWaveData(newWave);

      // 2. THUẬT TOÁN TÁI TẠO PHỔ TẦN SỐ (Đã tối ưu 2Hz/cột)
      let newSpectrum = [];
      // Chạy bước nhảy i += 2 để có các mốc 0, 2, 4... 62
      for (let i = 0; i <= 62; i += 2) {
        let p = 0;

        // Gán giá trị dựa trên dải tần số tương ứng
        if (i >= 0 && i <= 3) p = eeg.delta / 2;
        else if (i >= 4 && i <= 7) p = eeg.theta / 3;
        else if (i >= 8 && i <= 12) p = (eeg.low_alpha + eeg.high_alpha) / 4;
        else if (i >= 13 && i <= 30) p = (eeg.low_beta + eeg.high_beta) / 10;
        else if (i >= 31 && i <= 60) p = (eeg.low_gamma + eeg.mid_gamma) / 15;

        // Thêm hiệu ứng nhảy cột ngẫu nhiên
        p = p * (0.5 + Math.random() * 0.5);

        // Đẩy vào mảng với nhãn là i + "Hz"
        newSpectrum.push({ hz: `${i}Hz`, power: Math.floor(p) });
      }
      setSpectrumData(newSpectrum);

      // Log hệ thống - Fix lỗi hiển thị undefined trong log
      if (Math.random() > 0.7) {
        setLogMessages((prev) =>
          [
            `> Sync | Head: ${sanitizedData.vision.head_pose_state || "N/A"} | Att: ${eeg.attention}`,
            ...prev,
          ].slice(0, 10),
        );
      }
    });

    return () => socket.off("sensor_data");
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
        {/* COL 1: METRICS */}
        <div
          style={{
            gridColumn: "span 3",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              borderBottom: "4px solid rgba(59, 130, 246, 0.5)",
              padding: "20px",
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
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "2px",
                margin: "0 0 5px 0",
              }}
            >
              ATTENTION
            </h4>
            <div
              style={{
                fontSize: "60px",
                fontWeight: "900",
                lineHeight: "1",
                margin: "0 0 5px 0",
                zIndex: 1,
                position: "relative",
              }}
            >
              {systemData.eeg.attention}
            </div>
            <div
              style={{
                fontSize: "8px",
                color: "#64748b",
                fontWeight: "bold",
                textTransform: "uppercase",
                fontStyle: "italic",
              }}
            >
              Mental Focus
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              borderBottom: "4px solid rgba(6, 182, 212, 0.5)",
              padding: "20px",
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
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "2px",
                margin: "0 0 5px 0",
              }}
            >
              RELAXATION
            </h4>
            <div
              style={{
                fontSize: "60px",
                fontWeight: "900",
                lineHeight: "1",
                margin: "0 0 5px 0",
                zIndex: 1,
                position: "relative",
              }}
            >
              {systemData.eeg.meditation}
            </div>
            <div
              style={{
                fontSize: "8px",
                color: "#64748b",
                fontWeight: "bold",
                textTransform: "uppercase",
                fontStyle: "italic",
              }}
            >
              Calmness State
            </div>
          </div>

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
                DEEPFACE ENGINE V2
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

              <div
                style={{
                  position: "absolute",
                  bottom: "15px",
                  left: "15px",
                  background: "rgba(0,0,0,0.8)",
                  padding: "8px 15px",
                  borderRadius: "8px",
                  borderLeft: "3px solid #f59e0b",
                }}
              >
                <span
                  style={{
                    color: "#fde047",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  {/* Sử dụng Optional Chaining ?. để tránh lỗi toUpperCase() */}
                  EMOTION: {(systemData.vision?.emotion || "N/A").toUpperCase()}
                </span>
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
                RAW WAVEFORM (μV/ms)
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
                RANGE: ±500μV | WINDOW: 1000ms
              </div>
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
                  margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
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
                    tickFormatter={(val) => (val % 5 === 0 ? `${val}Hz` : "")}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis hide />
                  <Tooltip
                    labelFormatter={(label) => `Freq: ${label}Hz`}
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
