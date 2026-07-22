import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const DataLabeler = () => {
  const SESSION_DURATION_SECONDS = 120;
  const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("");
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_SECONDS);
  const [taskName, setTaskName] = useState("Đọc tài liệu đồ án");

  // Mốc thời gian bắt đầu và kết thúc phiên.
  const startTimeRef = useRef(null);
  const targetTimeRef = useRef(null);

  // Lưu cố định thông tin phiên tại thời điểm bắt đầu.
  const sessionLabelRef = useRef("");
  const sessionTaskRef = useRef("");

  const saveLabelToDatabase = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const payload = {
        taskName: sessionTaskRef.current,
        stimulusType: "Passive Session",

        // Backend hiện dùng trường này như thời lượng phiên.
        reactionTime: SESSION_DURATION_MS,

        isCorrect: true,
        label: sessionLabelRef.current,

        // Dùng đúng mốc kết thúc dự kiến,
        // tránh sai lệch khi trình duyệt chạy nền.
        timestamp: targetTimeRef.current,
      };

      const response = await axios.post(
        "http://localhost:5000/api/label-event",
        payload,
      );

      alert(
        `✅ Đã hoàn thành phiên 2 phút! ${
          response.data?.message || "Đã lưu nhãn."
        }`,
      );
    } catch (error) {
      console.error("Lỗi khi gửi nhãn:", error);

      alert("❌ Không thể lưu nhãn, kiểm tra lại Backend!");
    } finally {
      setIsSaving(false);
      setIsRecording(false);
      setCurrentLabel("");
      setTimeLeft(SESSION_DURATION_SECONDS);

      startTimeRef.current = null;
      targetTimeRef.current = null;
      sessionLabelRef.current = "";
      sessionTaskRef.current = "";
    }
  };

  useEffect(() => {
    if (!isRecording) return undefined;

    const timerId = setInterval(() => {
      const now = Date.now();

      const remaining = Math.ceil((targetTimeRef.current - now) / 1000);

      if (remaining <= 0) {
        clearInterval(timerId);
        setTimeLeft(0);
        saveLabelToDatabase();
        return;
      }

      setTimeLeft(remaining);
    }, 200);

    return () => {
      clearInterval(timerId);
    };
  }, [isRecording]);

  const handleStartSession = (labelType) => {
    const normalizedTaskName = taskName.trim();

    if (!normalizedTaskName) {
      alert("Vui lòng nhập tên hoạt động.");
      return;
    }

    const now = Date.now();

    startTimeRef.current = now;
    targetTimeRef.current = now + SESSION_DURATION_MS;

    sessionLabelRef.current = labelType;
    sessionTaskRef.current = normalizedTaskName;

    setCurrentLabel(labelType);
    setTimeLeft(SESSION_DURATION_SECONDS);
    setIsRecording(true);
  };

  const handleCancelSession = () => {
    const confirmed = window.confirm("Bạn muốn hủy phiên đo này?");

    if (!confirmed) return;

    setIsRecording(false);
    setCurrentLabel("");
    setTimeLeft(SESSION_DURATION_SECONDS);

    startTimeRef.current = null;
    targetTimeRef.current = null;
    sessionLabelRef.current = "";
    sessionTaskRef.current = "";
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);

    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "#1e293b",
        borderRadius: "8px",
        color: "#fff",
      }}
    >
      <h3
        style={{
          margin: "0 0 15px 0",
          color: "#e2e8f0",
        }}
      >
        🔴 TRẠM THU THẬP DATASET (2 PHÚT)
      </h3>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ color: "#94a3b8" }}>Hoạt động đang làm:</label>

        <input
          type="text"
          value={taskName}
          onChange={(event) => setTaskName(event.target.value)}
          disabled={isRecording || isSaving}
          style={{
            padding: "8px",
            marginLeft: "10px",
            width: "60%",
            background: "#334155",
            color: "#fff",
            border: "1px solid #475569",
            borderRadius: "4px",
          }}
        />
      </div>

      {!isRecording ? (
        <div
          style={{
            display: "flex",
            gap: "15px",
          }}
        >
          <button
            onClick={() => handleStartSession("Tập trung")}
            disabled={isSaving}
            style={{
              padding: "10px 20px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: isSaving ? "wait" : "pointer",
              fontWeight: "bold",
            }}
          >
            🔥 Đo 2p Tập Trung
          </button>

          <button
            onClick={() => handleStartSession("Sao nhãng")}
            disabled={isSaving}
            style={{
              padding: "10px 20px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: isSaving ? "wait" : "pointer",
              fontWeight: "bold",
            }}
          >
            💤 Đo 2p Sao Nhãng
          </button>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            background: "#334155",
            padding: "20px",
            borderRadius: "6px",
          }}
        >
          <h4
            style={{
              color: currentLabel === "Tập trung" ? "#10b981" : "#ef4444",
              margin: "0 0 10px 0",
            }}
          >
            ĐANG ĐO TRẠNG THÁI: {currentLabel.toUpperCase()}
          </h4>

          <div
            style={{
              fontSize: "40px",
              fontWeight: "bold",
              margin: "15px 0",
              fontFamily: "monospace",
              letterSpacing: "2px",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleCancelSession}
            disabled={isSaving}
            style={{
              padding: "8px 16px",
              background: "#64748b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            {isSaving ? "Đang lưu..." : "Hủy bỏ"}
          </button>
        </div>
      )}
    </div>
  );
};

export default DataLabeler;
// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";

// const DataLabeler = () => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [currentLabel, setCurrentLabel] = useState("");
//   const [timeLeft, setTimeLeft] = useState(120);
//   const [taskName, setTaskName] = useState("Đọc tài liệu đồ án");

//   // Dùng useRef để giữ nguyên mốc thời gian kết thúc mà không làm React bị render lại liên tục
//   const targetTimeRef = useRef(null);

//   useEffect(() => {
//     let timerId;

//     if (isRecording) {
//       // Mỗi vòng lặp, tính xem còn bao nhiêu giây so với mốc kết thúc (targetTime)
//       timerId = setInterval(() => {
//         const now = Date.now();
//         const remaining = Math.ceil((targetTimeRef.current - now) / 1000);

//         if (remaining <= 0) {
//           clearInterval(timerId);
//           setTimeLeft(0);
//           saveLabelToDatabase(); // Gọi hàm lưu khi hết giờ
//         } else {
//           setTimeLeft(remaining);
//         }
//       }, 200); // Kiểm tra liên tục mỗi 200ms để hiển thị cho mượt, nhưng vẫn dựa trên giờ thực
//     }

//     return () => clearInterval(timerId);
//   }, [isRecording]);

//   const saveLabelToDatabase = async (labelTarget = currentLabel) => {
//     try {
//       const payload = {
//         taskName: taskName,
//         stimulusType: "Passive Session",
//         reactionTime: 120000,
//         isCorrect: true,
//         label: labelTarget,
//         timestamp: targetTimeRef.current,
//       };

//       const response = await axios.post(
//         "http://localhost:5000/api/label-event",
//         payload,
//       );
//       alert(`✅ Đã hết 2 phút! ${response.data.message}`);
//     } catch (error) {
//       console.error("Lỗi khi gửi nhãn:", error);
//       alert("❌ Không thể lưu nhãn, kiểm tra lại Backend!");
//     } finally {
//       setIsRecording(false);
//       setCurrentLabel("");
//       setTimeLeft(120);
//     }
//   };

//   const handleStartSession = (labelType) => {
//     setIsRecording(true);
//     setCurrentLabel(labelType);
//     setTimeLeft(120);
//     // Chốt mốc thời gian kết thúc = Thời gian hiện tại + 120 giây (đổi ra ms)
//     targetTimeRef.current = Date.now() + 120 * 1000;
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
//   };

//   return (
//     <div
//       style={{
//         padding: "20px",
//         background: "#1e293b",
//         borderRadius: "8px",
//         color: "#fff",
//       }}
//     >
//       <h3 style={{ margin: "0 0 15px 0", color: "#e2e8f0" }}>
//         🔴 TRẠM THU THẬP DATASET (2 PHÚT)
//       </h3>

//       <div style={{ marginBottom: "20px" }}>
//         <label style={{ color: "#94a3b8" }}>Hoạt động đang làm: </label>
//         <input
//           type="text"
//           value={taskName}
//           onChange={(e) => setTaskName(e.target.value)}
//           disabled={isRecording}
//           style={{
//             padding: "8px",
//             marginLeft: "10px",
//             width: "60%",
//             background: "#334155",
//             color: "#fff",
//             border: "1px solid #475569",
//             borderRadius: "4px",
//           }}
//         />
//       </div>

//       {!isRecording ? (
//         <div style={{ display: "flex", gap: "15px" }}>
//           <button
//             onClick={() => handleStartSession("Tập trung")}
//             style={{
//               padding: "10px 20px",
//               background: "#10b981",
//               color: "#fff",
//               border: "none",
//               borderRadius: "5px",
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             🔥 Đo 2p Tập Trung
//           </button>
//           <button
//             onClick={() => handleStartSession("Sao nhãng")}
//             style={{
//               padding: "10px 20px",
//               background: "#ef4444",
//               color: "#fff",
//               border: "none",
//               borderRadius: "5px",
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             💤 Đo 2p Sao Nhãng
//           </button>
//         </div>
//       ) : (
//         <div
//           style={{
//             textAlign: "center",
//             background: "#334155",
//             padding: "20px",
//             borderRadius: "6px",
//           }}
//         >
//           <h4
//             style={{
//               color: currentLabel === "Tập trung" ? "#10b981" : "#ef4444",
//               margin: "0 0 10px 0",
//             }}
//           >
//             ĐANG ĐO TRẠNG THÁI: {currentLabel.toUpperCase()}
//           </h4>
//           <div
//             style={{
//               fontSize: "40px",
//               fontWeight: "bold",
//               margin: "15px 0",
//               fontFamily: "monospace",
//               letterSpacing: "2px",
//             }}
//           >
//             {formatTime(timeLeft)}
//           </div>
//           <button
//             onClick={() => {
//               if (window.confirm("Bạn muốn hủy phiên đo này?"))
//                 setIsRecording(false);
//             }}
//             style={{
//               padding: "8px 16px",
//               background: "#64748b",
//               color: "white",
//               border: "none",
//               borderRadius: "4px",
//               cursor: "pointer",
//             }}
//           >
//             Hủy bỏ
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DataLabeler;
