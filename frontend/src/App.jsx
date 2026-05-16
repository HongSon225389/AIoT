import React, { useState } from "react";
import MasterDashboard from "./components/MasterDashboard";
import CalibrationLab from "./components/CalibrationLab"; // Đổi đường dẫn import

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "20px",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
        }}
      >
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: activeTab === "dashboard" ? "#0ea5e9" : "#334155",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          📊 MAIN DASHBOARD
        </button>
        <button
          onClick={() => setActiveTab("calibration")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor:
              activeTab === "calibration" ? "#f43f5e" : "#334155",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          🎯 CALIBRATION LAB
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Render Dashboard hoặc Calibration Lab */}
        {activeTab === "dashboard" ? <MasterDashboard /> : <CalibrationLab />}
      </div>
    </div>
  );
}

export default App;
