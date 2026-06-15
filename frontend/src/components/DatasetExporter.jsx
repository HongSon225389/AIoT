import React, { useState } from "react";
import axios from "axios";

const DatasetExporter = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadDataset = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/export-ml-dataset",
      );
      const dataset = response.data;

      if (dataset.length === 0) {
        alert("⚠️ Chưa có dữ liệu! Sơn cần đo thử vài phiên 2 phút trước nhé.");
        setIsDownloading(false);
        return;
      }

      const headers = Object.keys(dataset[0]).join(",");
      const rows = dataset.map((obj) =>
        Object.values(obj)
          .map((val) => {
            const safeVal =
              val === null || val === undefined ? "" : val.toString();
            return `"${safeVal}"`;
          })
          .join(","),
      );
      const csvContent = [headers, ...rows].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const dateStr = new Date()
        .toLocaleDateString("vi-VN")
        .replace(/\//g, "-");
      link.setAttribute("download", `OptiMind_Dataset_${dateStr}.csv`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi tải dataset:", error);
      alert("❌ Có lỗi xảy ra khi trích xuất dữ liệu!");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        background: "#2d3748",
        borderRadius: "8px",
      }}
    >
      <h4 style={{ color: "#fff", marginTop: 0 }}>Kho Dữ Liệu AI</h4>
      <p style={{ color: "#a0aec0", fontSize: "14px" }}>
        Trích xuất toàn bộ lịch sử các phiên đo thành file Excel để đưa vào
        Python huấn luyện thuật toán.
      </p>
      <button
        onClick={handleDownloadDataset}
        disabled={isDownloading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#3182ce",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: isDownloading ? "wait" : "pointer",
          fontWeight: "bold",
          width: "100%",
        }}
      >
        {isDownloading
          ? "⏳ Đang trích xuất và nén file..."
          : "📥 Tải Dataset Huấn Luyện (CSV)"}
      </button>
    </div>
  );
};

export default DatasetExporter;
