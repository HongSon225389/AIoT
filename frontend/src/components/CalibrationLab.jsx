import React, { useState } from "react";
import FlankerTask from "./FlankerTask";
import AxCptTask from "./AxCptTask";

const CalibrationLab = () => {
  const [selectedTask, setSelectedTask] = useState(null);

  // Style dùng chung cho nút Quay lại
  const backButtonStyle = {
    padding: "10px 20px",
    marginBottom: "20px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  };

  if (selectedTask === "flanker")
    return (
      <div style={{ padding: "20px" }}>
        <button
          onClick={() => setSelectedTask(null)}
          style={backButtonStyle}
          onMouseOver={(e) => (e.target.style.color = "#38bdf8")}
          onMouseOut={(e) => (e.target.style.color = "#94a3b8")}
        >
          ⬅ QUAY LẠI MENU HIỆU CHUẨN
        </button>
        <FlankerTask />
      </div>
    );

  if (selectedTask === "axcpt")
    return (
      <div style={{ padding: "20px" }}>
        <button
          onClick={() => setSelectedTask(null)}
          style={backButtonStyle}
          onMouseOver={(e) => (e.target.style.color = "#10b981")}
          onMouseOut={(e) => (e.target.style.color = "#94a3b8")}
        >
          ⬅ QUAY LẠI MENU HIỆU CHUẨN
        </button>
        <AxCptTask />
      </div>
    );

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "50px",
        fontFamily: "sans-serif",
        color: "white",
      }}
    >
      <h2
        style={{
          color: "#0ea5e9",
          marginBottom: "10px",
          fontSize: "24px",
          fontWeight: "900",
          letterSpacing: "1px",
        }}
      >
        HỆ THỐNG HIỆU CHUẨN DỮ LIỆU (GROUND TRUTH)
      </h2>
      <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "40px" }}>
        Chọn bài test để bắt đầu quy trình gán nhãn dữ liệu sóng não & hành vi
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
        {/* Card chọn Flanker */}
        <div
          onClick={() => setSelectedTask("flanker")}
          style={cardStyle("#38bdf8")}
          onMouseOver={(e) => applyHover(e, "#38bdf8")}
          onMouseOut={(e) => applyNormal(e)}
        >
          <div style={iconBoxStyle("#38bdf8")}>🎯</div>
          <h3 style={{ color: "#38bdf8", margin: "10px 0" }}>
            Flanker Task (→)
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6" }}>
            Đo lường tải nhận thức, sự chú ý chọn lọc và khả năng chống nhiễu
            của não bộ.
          </p>
        </div>

        {/* Card chọn AX-CPT */}
        <div
          onClick={() => setSelectedTask("axcpt")}
          style={cardStyle("#10b981")}
          onMouseOver={(e) => applyHover(e, "#10b981")}
          onMouseOut={(e) => applyNormal(e)}
        >
          <div style={iconBoxStyle("#10b981")}>🧠</div>
          <h3 style={{ color: "#10b981", margin: "10px 0" }}>AX-CPT (A→X)</h3>
          <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6" }}>
            Đo lường sự chú ý duy trì trong thời gian dài và kiểm soát sự bốc
            đồng.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Helper Styles ---
const cardStyle = (color) => ({
  backgroundColor: "#0f172a",
  padding: "40px 30px",
  borderRadius: "20px",
  width: "320px",
  cursor: "pointer",
  border: "1px solid #1e293b",
  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

const iconBoxStyle = (color) => ({
  fontSize: "40px",
  marginBottom: "10px",
  background: `rgba(${color === "#38bdf8" ? "56, 189, 248" : "16, 185, 129"}, 0.1)`,
  width: "80px",
  height: "80px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  border: `1px solid ${color}33`,
});

const applyHover = (e, color) => {
  e.currentTarget.style.transform = "translateY(-10px)";
  e.currentTarget.style.borderColor = color;
  e.currentTarget.style.boxShadow = `0 10px 30px -10px ${color}66`;
};

const applyNormal = (e) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.borderColor = "#1e293b";
  e.currentTarget.style.boxShadow = "none";
};

export default CalibrationLab;
