// import React, { useState, useEffect, useRef, useCallback } from "react";
// import axios from "axios";

// const AxCptTask = () => {
//   const MAX_TRIALS = 25;
//   const taskStartTime = useRef(null); // Mốc bắt đầu thực tế của phiên này

//   const [displayLetter, setDisplayLetter] = useState("");
//   const [isRunning, setIsRunning] = useState(false);
//   const [isFinished, setIsFinished] = useState(false);
//   const [message, setMessage] = useState("Bấm SPACE khi X đi ngay sau A.");

//   const [stats, setStats] = useState({
//     hits: 0,
//     misses: 0,
//     falseAlarms: 0,
//     totalTargets: 0,
//     rts: [],
//   });

//   const trialCount = useRef(0);
//   const prevLetter = useRef("");
//   const currentLetter = useRef("");
//   const hasResponded = useRef(false);
//   const showTime = useRef(0);
//   const timeoutRef = useRef(null);

//   const getRandomLetter = () => {
//     if (currentLetter.current === "A") return Math.random() < 0.7 ? "X" : "Y";
//     return Math.random() < 0.4
//       ? "A"
//       : ["B", "C", "F", "H", "Z"][Math.floor(Math.random() * 5)];
//   };

//   const sendLabel = async (label, status, rt = 0, timestamp) => {
//     try {
//       await axios.post("http://localhost:5000/api/label-event", {
//         taskName: "AX-CPT",
//         stimulusType: `${prevLetter.current}-${currentLetter.current}`,
//         reactionTime: rt,
//         isCorrect: status === "Correct",
//         label: label,
//         timestamp: timestamp,
//       });
//     } catch (err) {
//       console.error("Lỗi gửi label:", err);
//     }
//   };

//   const showNextLetter = useCallback(() => {
//     const now = Date.now();

//     // Ghi nhận kết quả của câu vừa kết thúc trước khi sang câu mới
//     if (trialCount.current > 0) {
//       const isTarget =
//         prevLetter.current === "A" && currentLetter.current === "X";
//       const pairStr = `${prevLetter.current}-${currentLetter.current}`;

//       if (isTarget && !hasResponded.current) {
//         // Trường hợp 1: Mục tiêu A-X nhưng người dùng KHÔNG bấm (Bỏ lỡ)
//         sendLabel("Inattention_Miss", "Wrong", 0, now);
//       } else if (!isTarget && !hasResponded.current) {
//         // Trường hợp 2: KHÔNG phải A-X và người dùng KHÔNG bấm (Đúng)
//         // Đây là phần bị thiếu trong file Excel của bạn
//         sendLabel("Normal_State", "Correct", 0, now);
//       }
//       // Các trường hợp người dùng CÓ BẤM (Dúng/Sai) đã được handle ở handleKeyDown
//     }

//     if (trialCount.current >= MAX_TRIALS) {
//       setIsRunning(false);
//       setIsFinished(true);
//       return;
//     }

//     prevLetter.current = currentLetter.current;
//     currentLetter.current = getRandomLetter();
//     hasResponded.current = false;
//     showTime.current = Date.now();
//     setDisplayLetter(currentLetter.current);
//     trialCount.current += 1;

//     // Xóa timeout cũ nếu có và thiết lập cái mới
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     timeoutRef.current = setTimeout(showNextLetter, 1200);
//   }, []);

//   const startGame = () => {
//     taskStartTime.current = Date.now(); // Ghi lại mốc bắt đầu
//     setIsRunning(true);
//     setIsFinished(false);
//     setStats({ hits: 0, misses: 0, falseAlarms: 0, totalTargets: 0, rts: [] });
//     trialCount.current = 0;
//     prevLetter.current = "";
//     currentLetter.current = "";
//     showNextLetter();
//   };

//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (!isRunning || e.code !== "Space" || hasResponded.current) return;
//       e.preventDefault();
//       hasResponded.current = true;
//       const now = Date.now();
//       const rt = now - showTime.current;
//       const isTarget =
//         prevLetter.current === "A" && currentLetter.current === "X";

//       if (isTarget) {
//         setStats((s) => ({ ...s, hits: s.hits + 1, rts: [...s.rts, rt] }));
//         setMessage(`🟢 ĐÁP ỨNG (+${rt}ms)`);
//         sendLabel("Sustained_Attention", "Correct", rt, now);
//       } else {
//         setStats((s) => ({
//           ...s,
//           falseAlarms: s.falseAlarms + 1,
//           rts: [...s.rts, rt],
//         }));
//         setMessage("🔴 LỖI BỐC ĐỒNG");
//         sendLabel("Impulsive_Distraction", "Wrong", rt, now);
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [isRunning]);

//   // HÀM TẢI BÁO CÁO TỪ BACKEND (CHỈ LẤY LẦN NÀY)
//   const exportToCSV = async () => {
//     const endTime = Date.now();
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/export-full-report?task=AX-CPT&start=${taskStartTime.current}&end=${endTime}`,
//       );
//       const data = response.data;

//       if (data.length === 0)
//         return alert("Không tìm thấy dữ liệu lần test này!");

//       let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Thêm BOM để hiển thị tiếng Việt
//       csvContent += Object.keys(data[0]).join(",") + "\n";
//       data.forEach((row) => {
//         csvContent +=
//           Object.values(row)
//             .map((v) => `"${v}"`)
//             .join(",") + "\n";
//       });

//       const link = document.createElement("a");
//       link.setAttribute("href", encodeURI(csvContent));
//       link.setAttribute("download", `AX-CPT_SessionReport_${Date.now()}.csv`);
//       link.click();
//     } catch (err) {
//       alert("Lỗi tải báo cáo từ server!");
//     }
//   };

//   const renderSummary = () => {
//     const validRts = stats.rts.filter((rt) => rt > 100);
//     const avgRT =
//       validRts.length > 0
//         ? Math.round(validRts.reduce((a, b) => a + b, 0) / validRts.length)
//         : 0;
//     const vigilanceScore = Math.max(0, 100 - stats.misses * 20);
//     const inhibitionScore = Math.max(0, 100 - stats.falseAlarms * 15);

//     let profileName = "CĂNG THẲNG / QUÁ TẢI (COGNITIVE FATIGUE)";
//     let profileColor = "#3b82f6";

//     if (vigilanceScore >= 80 && inhibitionScore >= 80) {
//       profileName = "TẬP TRUNG LÝ TƯỞNG (OPTIMAL FOCUS)";
//       profileColor = "#10b981";
//     } else if (inhibitionScore < 70) {
//       profileName = "THIẾU ỨC CHẾ / BỐC ĐỒNG (IMPULSIVE)";
//       profileColor = "#f43f5e";
//     } else if (vigilanceScore < 70) {
//       profileName = "SUY GIẢM CHÚ Ý (INATTENTIVE)";
//       profileColor = "#f59e0b";
//     }

//     return (
//       <div
//         style={{
//           backgroundColor: "#0f172a",
//           padding: "30px",
//           borderRadius: "1.5rem",
//           border: `1px solid ${profileColor}50`,
//           maxWidth: "700px",
//           margin: "0 auto",
//           textAlign: "left",
//           boxShadow: `0 0 30px ${profileColor}15`,
//         }}
//       >
//         <div
//           style={{
//             textAlign: "center",
//             borderBottom: "1px solid rgba(255,255,255,0.05)",
//             paddingBottom: "20px",
//             marginBottom: "20px",
//           }}
//         >
//           <div
//             style={{
//               color: "#64748b",
//               fontSize: "11px",
//               letterSpacing: "2px",
//               fontWeight: "bold",
//             }}
//           >
//             COGNITIVE PERFORMANCE REPORT
//           </div>
//           <h2
//             style={{
//               color: profileColor,
//               margin: "10px 0",
//               fontSize: "24px",
//               fontWeight: "900",
//             }}
//           >
//             {profileName}
//           </h2>
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: "30px",
//             marginBottom: "30px",
//           }}
//         >
//           <div>
//             <div
//               style={{
//                 color: "#94a3b8",
//                 fontSize: "12px",
//                 fontWeight: "bold",
//                 borderBottom: "1px dashed #334155",
//                 paddingBottom: "5px",
//                 marginBottom: "15px",
//               }}
//             >
//               THANG ĐO NĂNG LỰC
//             </div>
//             <div style={{ marginBottom: "15px" }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: "11px",
//                   color: "white",
//                   marginBottom: "5px",
//                 }}
//               >
//                 <span>Sức bền chú ý</span>
//                 <span>{vigilanceScore}%</span>
//               </div>
//               <div
//                 style={{
//                   width: "100%",
//                   height: "6px",
//                   background: "rgba(255,255,255,0.1)",
//                   borderRadius: "3px",
//                 }}
//               >
//                 <div
//                   style={{
//                     height: "100%",
//                     width: `${vigilanceScore}%`,
//                     background: "#34d399",
//                     borderRadius: "3px",
//                   }}
//                 ></div>
//               </div>
//             </div>
//             <div style={{ marginBottom: "15px" }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: "11px",
//                   color: "white",
//                   marginBottom: "5px",
//                 }}
//               >
//                 <span>Kiểm soát bốc đồng</span>
//                 <span>{inhibitionScore}%</span>
//               </div>
//               <div
//                 style={{
//                   width: "100%",
//                   height: "6px",
//                   background: "rgba(255,255,255,0.1)",
//                   borderRadius: "3px",
//                 }}
//               >
//                 <div
//                   style={{
//                     height: "100%",
//                     width: `${inhibitionScore}%`,
//                     background: "#f43f5e",
//                     borderRadius: "3px",
//                   }}
//                 ></div>
//               </div>
//             </div>
//           </div>

//           <div>
//             <div
//               style={{
//                 color: "#94a3b8",
//                 fontSize: "12px",
//                 fontWeight: "bold",
//                 borderBottom: "1px dashed #334155",
//                 paddingBottom: "5px",
//                 marginBottom: "15px",
//               }}
//             >
//               CHỈ SỐ THỜI GIAN THỰC
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 background: "rgba(255,255,255,0.02)",
//                 padding: "10px",
//                 borderRadius: "8px",
//                 marginBottom: "10px",
//               }}
//             >
//               <span style={{ color: "#94a3b8", fontSize: "12px" }}>
//                 Phản xạ TB (RT)
//               </span>
//               <span style={{ color: "#fcd34d", fontWeight: "bold" }}>
//                 {avgRT} ms
//               </span>
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 background: "rgba(255,255,255,0.02)",
//                 padding: "10px",
//                 borderRadius: "8px",
//               }}
//             >
//               <span style={{ color: "#94a3b8", fontSize: "12px" }}>
//                 Độ chính xác
//               </span>
//               <span style={{ color: "#10b981", fontWeight: "bold" }}>
//                 {Math.round((stats.hits / stats.totalTargets) * 100 || 0)}%
//               </span>
//             </div>
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: "15px" }}>
//           <button
//             onClick={exportToCSV}
//             style={{
//               flex: 1,
//               padding: "15px",
//               backgroundColor: "#10b981",
//               color: "white",
//               border: "none",
//               borderRadius: "10px",
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             📥 TẢI BÁO CÁO PHIÊN NÀY (.CSV)
//           </button>
//           <button
//             onClick={startGame}
//             style={{
//               flex: 1,
//               padding: "15px",
//               backgroundColor: "transparent",
//               color: profileColor,
//               border: `1px solid ${profileColor}`,
//               borderRadius: "10px",
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             🔄 THỬ LẠI
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{ textAlign: "center", marginTop: "30px", color: "white" }}>
//       {!isFinished && (
//         <h2
//           style={{ color: "#10b981", letterSpacing: "2px", fontWeight: "900" }}
//         >
//           AX-CPT TASK
//         </h2>
//       )}
//       {isFinished ? (
//         renderSummary()
//       ) : (
//         <>
//           <p style={{ fontSize: "14px", color: "#64748b" }}>
//             Mục tiêu: Bấm <b>SPACE</b> ngay khi thấy <b>X</b> sau <b>A</b>.
//           </p>
//           <div
//             style={{
//               height: "25px",
//               margin: "10px 0",
//               color: "#fcd34d",
//               fontWeight: "bold",
//             }}
//           >
//             {message}
//           </div>
//           {!isRunning ? (
//             <button
//               onClick={startGame}
//               style={{
//                 padding: "18px 50px",
//                 fontSize: "16px",
//                 backgroundColor: "#3b82f6",
//                 color: "white",
//                 borderRadius: "12px",
//                 border: "none",
//                 cursor: "pointer",
//                 fontWeight: "bold",
//               }}
//             >
//               BẮT ĐẦU
//             </button>
//           ) : (
//             <>
//               <div
//                 style={{
//                   fontSize: "160px",
//                   margin: "20px 0",
//                   minHeight: "180px",
//                   fontWeight: "900",
//                 }}
//               >
//                 {displayLetter}
//               </div>
//               <div
//                 style={{
//                   color: "#475569",
//                   fontSize: "11px",
//                   fontWeight: "bold",
//                   letterSpacing: "2px",
//                 }}
//               >
//                 TIẾN ĐỘ: {trialCount.current} / {MAX_TRIALS}
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default AxCptTask;
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const AxCptTask = () => {
  const MAX_TRIALS = 25;
  const taskStartTime = useRef(null);

  const [displayLetter, setDisplayLetter] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [message, setMessage] = useState("Bấm SPACE khi X đi ngay sau A.");

  const [stats, setStats] = useState({
    correctCount: 0, // Tổng số câu đúng (bao gồm cả việc không bấm đúng lúc)
    totalTrials: 0,
    rts: [],
  });

  const trialCount = useRef(0);
  const prevLetter = useRef("");
  const currentLetter = useRef("");
  const hasResponded = useRef(false);
  const showTime = useRef(0);
  const timeoutRef = useRef(null);

  const getRandomLetter = () => {
    if (currentLetter.current === "A") return Math.random() < 0.7 ? "X" : "Y";
    return Math.random() < 0.4
      ? "A"
      : ["B", "C", "F", "H", "Z"][Math.floor(Math.random() * 5)];
  };

  const sendLabel = async (label, status, rt = 0, timestamp) => {
    try {
      await axios.post("http://localhost:5000/api/label-event", {
        taskName: "AX-CPT",
        stimulusType: `${prevLetter.current}-${currentLetter.current}`,
        reactionTime: rt,
        isCorrect: status === "Correct",
        label: label,
        timestamp: timestamp,
      });
    } catch (err) {
      console.error("Lỗi gửi label:", err);
    }
  };

  const showNextLetter = useCallback(() => {
    const now = Date.now();

    // CHẤM ĐIỂM CÂU VỪA KẾT THÚC (Nếu người dùng không bấm phím)
    if (trialCount.current > 0) {
      const isTarget =
        prevLetter.current === "A" && currentLetter.current === "X";

      if (!hasResponded.current) {
        // Nếu không phải A-X mà không bấm -> ĐÚNG (Correct Rejection)
        // Nếu là A-X mà không bấm -> SAI (Miss)
        const isCorrect = !isTarget;
        if (isCorrect) {
          setStats((s) => ({ ...s, correctCount: s.correctCount + 1 }));
        }
        sendLabel(
          isCorrect ? "Focused_Pass" : "Inattention_Miss",
          isCorrect ? "Correct" : "Wrong",
          0,
          now,
        );
      }
    }

    if (trialCount.current >= MAX_TRIALS) {
      setIsRunning(false);
      setIsFinished(true);
      return;
    }

    prevLetter.current = currentLetter.current;
    const nextL = getRandomLetter();
    currentLetter.current = nextL;
    hasResponded.current = false;
    showTime.current = Date.now();
    setDisplayLetter(nextL);
    setMessage("");
    trialCount.current += 1;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(showNextLetter, 1200);
  }, [MAX_TRIALS]);

  const startGame = () => {
    taskStartTime.current = Date.now();
    setIsRunning(true);
    setIsFinished(false);
    setStats({ correctCount: 0, totalTrials: 0, rts: [] });
    trialCount.current = 0;
    prevLetter.current = "";
    currentLetter.current = "";
    showNextLetter();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRunning || e.code !== "Space" || hasResponded.current) return;
      e.preventDefault();
      hasResponded.current = true;
      const now = Date.now();
      const rt = now - showTime.current;
      const isTarget =
        prevLetter.current === "A" && currentLetter.current === "X";

      // Nếu là mục tiêu A-X mà bấm -> ĐÚNG (Hit)
      // Nếu không phải mục tiêu mà vẫn bấm -> SAI (False Alarm)
      if (isTarget) {
        setStats((s) => ({
          ...s,
          correctCount: s.correctCount + 1,
          rts: [...s.rts, rt],
        }));
        setMessage(`🟢 ĐÚNG (+${rt}ms)`);
        sendLabel("Focused_Hit", "Correct", rt, now);
      } else {
        setStats((s) => ({ ...s, rts: [...s.rts, rt] }));
        setMessage("🔴 SAI (BỐC ĐỒNG)");
        sendLabel("Impulsive_Error", "Wrong", rt, now);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning]);

  const exportToCSV = async () => {
    const endTime = Date.now();
    try {
      const response = await axios.get(
        `http://localhost:5000/api/export-full-report?task=AX-CPT&start=${taskStartTime.current}&end=${endTime}`,
      );
      const data = response.data;
      if (data.length === 0) return alert("Không tìm thấy dữ liệu!");

      let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
      csvContent += Object.keys(data[0]).join(",") + "\n";
      data.forEach((row) => {
        csvContent +=
          Object.values(row)
            .map((v) => `"${v}"`)
            .join(",") + "\n";
      });

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `AX-CPT_Report_${Date.now()}.csv`);
      link.click();
    } catch (err) {
      alert("Lỗi tải báo cáo!");
    }
  };

  const renderSummary = () => {
    const accuracy = Math.round((stats.correctCount / MAX_TRIALS) * 100);
    const avgRT =
      stats.rts.length > 0
        ? Math.round(stats.rts.reduce((a, b) => a + b, 0) / stats.rts.length)
        : 0;
    const isFocused = accuracy >= 75;

    return (
      <div
        style={{
          backgroundColor: "#0f172a",
          padding: "40px",
          borderRadius: "1.5rem",
          border: `1px solid ${isFocused ? "#10b981" : "#f43f5e"}`,
          maxWidth: "600px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: isFocused ? "#10b981" : "#f43f5e",
            fontWeight: "900",
            marginBottom: "20px",
          }}
        >
          {isFocused ? "TRẠNG THÁI: TẬP TRUNG" : "TRẠNG THÁI: SAO NHÃNG"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              ĐỘ CHÍNH XÁC
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: "white" }}
            >
              {accuracy}%
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              PHẢN XẠ TRUNG BÌNH
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: "#fcd34d" }}
            >
              {avgRT}ms
            </div>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          📥 XUẤT BÁO CÁO PHIÊN NÀY
        </button>
        <button
          onClick={startGame}
          style={{
            width: "100%",
            padding: "15px",
            background: "none",
            border: "1px solid #3b82f6",
            color: "#3b82f6",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔄 LÀM LẠI TEST
        </button>
      </div>
    );
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px", color: "white" }}>
      {!isFinished && (
        <h2
          style={{ color: "#10b981", letterSpacing: "2px", fontWeight: "900" }}
        >
          AX-CPT TASK
        </h2>
      )}
      {isFinished ? (
        renderSummary()
      ) : (
        <>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Mục tiêu: Bấm <b>SPACE</b> ngay khi thấy <b>X</b> sau <b>A</b>.
          </p>
          <div
            style={{
              height: "25px",
              margin: "10px 0",
              color: "#fcd34d",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
          {!isRunning ? (
            <button
              onClick={startGame}
              style={{
                padding: "18px 50px",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              BẮT ĐẦU
            </button>
          ) : (
            <>
              <div
                style={{
                  fontSize: "160px",
                  margin: "20px 0",
                  minHeight: "180px",
                  fontWeight: "900",
                }}
              >
                {displayLetter}
              </div>
              <div
                style={{
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                TIẾN ĐỘ: {trialCount.current} / {MAX_TRIALS}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AxCptTask;
