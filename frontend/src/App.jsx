import React, { useState } from "react";
import MasterDashboard from "./components/MasterDashboard";
import CalibrationLab from "./components/CalibrationLab";
import DataLabeler from "./components/DataLabeler";
import DatasetExporter from "./components/DatasetExporter";

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
      {/* --- THANH ĐIỀU HƯỚNG (NAVBAR) --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "20px",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
          gap: "15px",
        }}
      >
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: activeTab === "dashboard" ? "#0ea5e9" : "#334155",
            color: "white",
            border: "none",
            borderRadius: "5px",
            transition: "background-color 0.3s",
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
            transition: "background-color 0.3s",
          }}
        >
          🎯 CALIBRATION LAB
        </button>

        {/* Nút chuyển sang Tab Thu thập Dataset */}
        <button
          onClick={() => setActiveTab("dataset")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: activeTab === "dataset" ? "#10b981" : "#334155",
            color: "white",
            border: "none",
            borderRadius: "5px",
            transition: "background-color 0.3s",
          }}
        >
          🧪 DATASET LAB
        </button>
      </div>

      {/* --- KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH --- */}
      <div style={{ padding: "20px" }}>
        {/* Render Tab 1: Dashboard chính */}
        {activeTab === "dashboard" && <MasterDashboard />}

        {/* Render Tab 2: Calibration */}
        {activeTab === "calibration" && <CalibrationLab />}

        {/* Render Tab 3: Dataset Lab (Chứa cả trạm đo và nút xuất file) */}
        {activeTab === "dataset" && (
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              backgroundColor: "#1e293b",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                borderBottom: "1px solid #334155",
                paddingBottom: "15px",
                margin: "0 0 10px 0",
                color: "#38bdf8",
              }}
            >
              ⚙️ QUẢN LÝ DỮ LIỆU HUẤN LUYỆN AI
            </h2>

            {/* Gọi Component đếm ngược 2 phút */}
            <DataLabeler />

            <div
              style={{
                height: "1px",
                backgroundColor: "#334155",
                margin: "10px 0",
              }}
            ></div>

            {/* Gọi Component tải file Excel */}
            <DatasetExporter />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
